import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@/lib/supabase/server";

import {
  candidateInviteExpiration,
  generateCandidateInviteToken,
  hashCandidateInviteToken,
} from "@/lib/candidate-invites";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getAuthorizedStaff() {
  const supabase =
    await createClient();

  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    return {
      authorized:
        false as const,
      supabase,
      user: null,
      role: null,
    };
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      authorized:
        false as const,
      supabase,
      user,
      role: null,
    };
  }

  const role =
    profile?.role ?? null;

  if (
    role !== "admin" &&
    role !== "editor"
  ) {
    return {
      authorized:
        false as const,
      supabase,
      user,
      role,
    };
  }

  return {
    authorized:
      true as const,
    supabase,
    user,
    role,
  };
}

/* ============================================================
   GET — CONSULTAR CONVITE DO CANDIDATO
============================================================ */

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const auth =
      await getAuthorizedStaff();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          error:
            "Acesso não autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await context.params;

    const {
      data: candidate,
      error: candidateError,
    } = await auth.supabase
      .from("candidates")
      .select(
        "id, name, ballot_name"
      )
      .eq("id", id)
      .maybeSingle();

    if (
      candidateError ||
      !candidate
    ) {
      return NextResponse.json(
        {
          error:
            "Candidato não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      data: invite,
      error: inviteError,
    } = await auth.supabase
      .from(
        "candidate_edit_invites"
      )
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
      .eq(
        "candidate_id",
        id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (inviteError) {
      return NextResponse.json(
        {
          error:
            inviteError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!invite) {
      return NextResponse.json({
        active: false,
        expired: false,
        invite: null,
      });
    }

    const expired =
      new Date(
        invite.expires_at
      ).getTime() <=
      Date.now();

    const active =
      !expired &&
      !invite.revoked_at &&
      !invite.submitted_at;

    return NextResponse.json({
      active,
      expired,
      invite,
    });
  } catch (error) {
    console.error(
      "Admin candidate invite GET:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao consultar o convite.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST — GERAR NOVO LINK DE 48 HORAS
============================================================ */

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const auth =
      await getAuthorizedStaff();

    if (
      !auth.authorized ||
      !auth.user
    ) {
      return NextResponse.json(
        {
          error:
            "Acesso não autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await context.params;

    const {
      data: candidate,
      error: candidateError,
    } = await auth.supabase
      .from("candidates")
      .select(
        "id, name, ballot_name"
      )
      .eq("id", id)
      .maybeSingle();

    if (
      candidateError ||
      !candidate
    ) {
      return NextResponse.json(
        {
          error:
            "Candidato não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const now =
      new Date().toISOString();

    /*
     * Revoga links anteriores.
     */
    const {
      error: revokeError,
    } = await auth.supabase
      .from(
        "candidate_edit_invites"
      )
      .update({
        revoked_at: now,
      })
      .eq(
        "candidate_id",
        id
      )
      .is(
        "revoked_at",
        null
      )
      .is(
        "submitted_at",
        null
      );

    if (revokeError) {
      return NextResponse.json(
        {
          error:
            "Não foi possível revogar os links anteriores: " +
            revokeError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Token aleatório.
     *
     * O banco recebe apenas o hash.
     */
    const token =
      generateCandidateInviteToken();

    const tokenHash =
      hashCandidateInviteToken(
        token
      );

    const expiresAt =
      candidateInviteExpiration();

    const {
      data: invite,
      error: inviteError,
    } = await auth.supabase
      .from(
        "candidate_edit_invites"
      )
      .insert({
        candidate_id: id,

        token_hash:
          tokenHash,

        expires_at:
          expiresAt.toISOString(),

        created_by:
          auth.user.id,
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

    if (
      inviteError ||
      !invite
    ) {
      return NextResponse.json(
        {
          error:
            "Não foi possível gerar o convite: " +
            (
              inviteError?.message ??
              "erro desconhecido"
            ),
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Marca o cadastro como
     * aguardando preenchimento.
     */
    const {
      error:
        updateCandidateError,
    } = await auth.supabase
      .from("candidates")
      .update({
        review_status:
          "awaiting_completion",
      })
      .eq("id", id);

    if (
      updateCandidateError
    ) {
      /*
       * Revoga o convite criado
       * caso não consigamos atualizar
       * o fluxo do candidato.
       */
      await auth.supabase
        .from(
          "candidate_edit_invites"
        )
        .update({
          revoked_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          invite.id
        );

      return NextResponse.json(
        {
          error:
            "O convite foi cancelado porque não foi possível atualizar o cadastro: " +
            updateCandidateError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Usa o domínio que recebeu
     * a requisição.
     */
    const origin =
      new URL(
        request.url
      ).origin;

    const inviteUrl =
      `${origin}/completar-cadastro/${token}`;

    return NextResponse.json({
      success: true,

      invite: {
        id:
          invite.id,

        candidate_id:
          invite.candidate_id,

        expires_at:
          invite.expires_at,

        created_at:
          invite.created_at,
      },

      url:
        inviteUrl,
    });
  } catch (error) {
    console.error(
      "Admin candidate invite POST:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao gerar o convite.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   DELETE — REVOGAR LINK
============================================================ */

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const auth =
      await getAuthorizedStaff();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          error:
            "Acesso não autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await context.params;

    const now =
      new Date().toISOString();

    const {
      error: revokeError,
    } = await auth.supabase
      .from(
        "candidate_edit_invites"
      )
      .update({
        revoked_at: now,
      })
      .eq(
        "candidate_id",
        id
      )
      .is(
        "revoked_at",
        null
      )
      .is(
        "submitted_at",
        null
      );

    if (revokeError) {
      return NextResponse.json(
        {
          error:
            "Não foi possível revogar o convite: " +
            revokeError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Só volta para draft se ainda
     * estava aguardando preenchimento.
     *
     * Um cadastro já enviado para
     * revisão não será revertido.
     */
    await auth.supabase
      .from("candidates")
      .update({
        review_status:
          "draft",
      })
      .eq(
        "id",
        id
      )
      .eq(
        "review_status",
        "awaiting_completion"
      );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Admin candidate invite DELETE:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao revogar o convite.",
      },
      {
        status: 500,
      }
    );
  }
}
