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

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getStaff() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      supabase,
      user: null,
    };
  }

  const {
    data: profile,
  } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const authorized =
    profile?.role === "admin" ||
    profile?.role === "editor";

  return {
    ok: authorized,
    supabase,
    user,
  };
}

/* ============================================================
   GET — STATUS DO LINK
============================================================ */

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const auth =
      await getStaff();

    if (!auth.ok) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await context.params;

    const {
      data: invite,
      error,
    } = await auth.supabase
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
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
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
      new Date(
        invite.expires_at
      ).getTime() <= Date.now();

    const active =
      !expired &&
      !invite.revoked_at &&
      !invite.submitted_at;

    return NextResponse.json({
      active,
      expired,
      revoked: Boolean(
        invite.revoked_at
      ),
      submitted: Boolean(
        invite.submitted_at
      ),
      invite,
    });
  } catch (error) {
    console.error(
      "GET candidate invite:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao consultar o link.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST — GERAR LINK
============================================================ */

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth =
      await getStaff();

    if (
      !auth.ok ||
      !auth.user
    ) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await context.params;

    /*
     * Verifica candidato.
     */

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

    if (candidateError) {
      return NextResponse.json(
        {
          error:
            candidateError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!candidate) {
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

    /*
     * Revoga links anteriores
     * ainda utilizáveis.
     */

    const now =
      new Date().toISOString();

    const {
      error: revokeError,
    } = await auth.supabase
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
            revokeError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Cria novo token.
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
      error: insertError,
    } = await auth.supabase
      .from("candidate_edit_invites")
      .insert({
        candidate_id: id,
        token_hash: tokenHash,
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
      insertError ||
      !invite
    ) {
      return NextResponse.json(
        {
          error:
            insertError?.message ||
            "Não foi possível criar o link.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Atualiza situação.
     */

    const {
      error: updateError,
    } = await auth.supabase
      .from("candidates")
      .update({
        review_status:
          "awaiting_completion",
        updated_at: now,
      })
      .eq("id", id);

    if (updateError) {
      await auth.supabase
        .from(
          "candidate_edit_invites"
        )
        .update({
          revoked_at:
            new Date().toISOString(),
        })
        .eq("id", invite.id);

      return NextResponse.json(
        {
          error:
            updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Preferimos o domínio configurado.
     */

    const configuredOrigin =
      process.env
        .NEXT_PUBLIC_SITE_URL
        ?.trim()
        .replace(/\/+$/, "");

    const requestOrigin =
      new URL(request.url).origin;

    const origin =
      configuredOrigin ||
      requestOrigin;

    const url =
      `${origin}/completar-cadastro/${token}`;

    return NextResponse.json({
      success: true,
      url,
      expires_at:
        invite.expires_at,
      candidate: {
        id: candidate.id,
        name:
          candidate.ballot_name ||
          candidate.name,
      },
    });
  } catch (error) {
    console.error(
      "POST candidate invite:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao gerar o link.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   DELETE — REVOGAR
============================================================ */

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const auth =
      await getStaff();

    if (!auth.ok) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await context.params;

    const {
      error,
    } = await auth.supabase
      .from("candidate_edit_invites")
      .update({
        revoked_at:
          new Date().toISOString(),
      })
      .eq("candidate_id", id)
      .is("revoked_at", null)
      .is("submitted_at", null);

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

    await auth.supabase
      .from("candidates")
      .update({
        review_status: "draft",
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .eq(
        "review_status",
        "awaiting_completion"
      );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE candidate invite:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao revogar o link.",
      },
      {
        status: 500,
      }
    );
  }
}
