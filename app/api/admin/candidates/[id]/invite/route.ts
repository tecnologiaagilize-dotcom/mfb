import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import {
  candidateInviteExpiration,
  generateCandidateInviteToken,
  hashCandidateInviteToken,
} from "@/lib/candidate-invites";

export const dynamic = "force-dynamic";

async function getAuthorizedStaff() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      authorized: false as const,
      supabase,
      user: null,
      role: null,
    };
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? null;

  if (role !== "admin" && role !== "editor") {
    return {
      authorized: false as const,
      supabase,
      user,
      role,
    };
  }

  return {
    authorized: true as const,
    supabase,
    user,
    role,
  };
}

/*
 * GET
 *
 * Retorna o estado atual do convite.
 * O token original nunca é armazenado,
 * portanto um link antigo não pode ser
 * reconstruído pelo servidor.
 */
export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  const auth = await getAuthorizedStaff();

  if (!auth.authorized) {
    return NextResponse.json(
      {
        error: "Acesso não autorizado.",
      },
      {
        status: 401,
      }
    );
  }

  const { id } = await context.params;

  const { data: candidate } = await auth.supabase
    .from("candidates")
    .select("id, name, ballot_name")
    .eq("id", id)
    .maybeSingle();

  if (!candidate) {
    return NextResponse.json(
      {
        error: "Candidato não encontrado.",
      },
      {
        status: 404,
      }
    );
  }

  const { data: invite, error } = await auth.supabase
    .from("candidate_edit_invites")
    .select(
      `
        id,
        candidate_id,
        expires_at,
        revoked_at,
        submitted_at,
        last_accessed_at,
        access_count,
        created_at
      `
    )
    .eq("candidate_id", id)
    .is("revoked_at", null)
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }

  if (!invite) {
    return NextResponse.json({
      active: false,
      invite: null,
    });
  }

  const expired =
    new Date(invite.expires_at).getTime() <= Date.now();

  return NextResponse.json({
    active:
      !expired &&
      !invite.revoked_at &&
      !invite.submitted_at,

    expired,

    invite,
  });
}

/*
 * POST
 *
 * Gera um novo convite.
 *
 * Todos os convites anteriores ainda
 * ativos para esse candidato são
 * revogados antes da criação do novo.
 */
export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  const auth = await getAuthorizedStaff();

  if (!auth.authorized || !auth.user) {
    return NextResponse.json(
      {
        error: "Acesso não autorizado.",
      },
      {
        status: 401,
      }
    );
  }

  const { id } = await context.params;

  const { data: candidate } = await auth.supabase
    .from("candidates")
    .select("id, name, ballot_name")
    .eq("id", id)
    .maybeSingle();

  if (!candidate) {
    return NextResponse.json(
      {
        error: "Candidato não encontrado.",
      },
      {
        status: 404,
      }
    );
  }

  const now =
    new Date().toISOString();

  /*
   * Revoga qualquer convite anterior.
   */
  const { error: revokeError } =
    await auth.supabase
      .from("candidate_edit_invites")
      .update({
        revoked_at: now,
      })
      .eq("candidate_id", id)
      .is("revoked_at", null)
      .is("submitted_at", null);

  if (revokeError) {
    return NextResponse.json(
      {
        error:
          "Não foi possível revogar os convites anteriores: " +
          revokeError.message,
      },
      {
        status: 500,
      }
    );
  }

  const token =
    generateCandidateInviteToken();

  const tokenHash =
    hashCandidateInviteToken(token);

  const expiresAt =
    candidateInviteExpiration();

  const { data: invite, error: inviteError } =
    await auth.supabase
      .from("candidate_edit_invites")
      .insert({
        candidate_id: id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        created_by: auth.user.id,
      })
      .select(
        `
          id,
          candidate_id,
          expires_at,
          created_at
        `
      )
      .single();

  if (inviteError) {
    return NextResponse.json(
      {
        error:
          "Não foi possível gerar o convite: " +
          inviteError.message,
      },
      {
        status: 500,
      }
    );
  }

  /*
   * O cadastro continua sem publicação.
   * Apenas muda o estágio administrativo.
   */
  const { error: candidateError } =
    await auth.supabase
      .from("candidates")
      .update({
        review_status: "awaiting_completion",
        updated_at: now,
      })
      .eq("id", id);

  if (candidateError) {
    /*
     * Se não conseguirmos atualizar o candidato,
     * revogamos imediatamente o convite criado.
     */
    await auth.supabase
      .from("candidate_edit_invites")
      .update({
        revoked_at:
          new Date().toISOString(),
      })
      .eq("id", invite.id);

    return NextResponse.json(
      {
        error:
          "O convite foi cancelado porque não foi possível atualizar o cadastro: " +
          candidateError.message,
      },
      {
        status: 500,
      }
    );
  }

  /*
   * Usa a origem real da requisição.
   * Assim funciona no domínio definitivo
   * e também em previews do Vercel.
   */
  const origin =
    new URL(request.url).origin;

  const inviteUrl =
    `${origin}/completar-cadastro/${token}`;

  return NextResponse.json({
    success: true,

    invite: {
      id: invite.id,
      expires_at: invite.expires_at,
      created_at: invite.created_at,
    },

    /*
     * O token puro só é devolvido agora.
     * O banco possui apenas o hash.
     */
    url: inviteUrl,
  });
}

/*
 * DELETE
 *
 * Revoga todos os convites ainda ativos
 * desse candidato.
 */
export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  const auth = await getAuthorizedStaff();

  if (!auth.authorized) {
    return NextResponse.json(
      {
        error: "Acesso não autorizado.",
      },
      {
        status: 401,
      }
    );
  }

  const { id } = await context.params;

  const now =
    new Date().toISOString();

  const { error } =
    await auth.supabase
      .from("candidate_edit_invites")
      .update({
        revoked_at: now,
      })
      .eq("candidate_id", id)
      .is("revoked_at", null)
      .is("submitted_at", null);

  if (error) {
    return NextResponse.json(
      {
        error:
          "Não foi possível revogar o convite: " +
          error.message,
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    success: true,
  });
}
