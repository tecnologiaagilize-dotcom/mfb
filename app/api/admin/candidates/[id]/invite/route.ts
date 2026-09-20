import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  hashCandidateInviteToken,
} from "@/lib/candidate-invites";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      token: string;
    }>;
  }
) {
  try {
    const { token } =
      await context.params;

    if (!token) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "Link inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const tokenHash =
      hashCandidateInviteToken(
        token
      );

    const supabase =
      createAdminClient();

    /*
     * Procuramos somente pelo HASH.
     * O token original nunca está
     * armazenado no banco.
     */
    const {
      data: invite,
      error: inviteError,
    } = await supabase
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
          access_count
        `
      )
      .eq(
        "token_hash",
        tokenHash
      )
      .maybeSingle();

    if (
      inviteError ||
      !invite
    ) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "Este link não é válido.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Link revogado.
     */
    if (invite.revoked_at) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "Este link foi revogado.",
        },
        {
          status: 410,
        }
      );
    }

    /*
     * Formulário já enviado.
     */
    if (invite.submitted_at) {
      return NextResponse.json(
        {
          valid: false,
          submitted: true,
          error:
            "Este cadastro já foi enviado para análise.",
        },
        {
          status: 410,
        }
      );
    }

    /*
     * Validade de 48 horas.
     */
    const expiresAt =
      new Date(
        invite.expires_at
      );

    if (
      Number.isNaN(
        expiresAt.getTime()
      ) ||
      expiresAt.getTime() <=
        Date.now()
    ) {
      return NextResponse.json(
        {
          valid: false,
          expired: true,
          error:
            "Este link expirou. Solicite um novo link.",
        },
        {
          status: 410,
        }
      );
    }

    /*
     * Carrega somente os dados
     * necessários para identificar
     * o cadastro.
     */
    const {
      data: candidate,
      error: candidateError,
    } = await supabase
      .from("candidates")
      .select(
        `
          id,
          name,
          ballot_name,
          photo_url,
          state_uf,
          city_name,
          cargo,
          party,
          number
        `
      )
      .eq(
        "id",
        invite.candidate_id
      )
      .maybeSingle();

    if (
      candidateError ||
      !candidate
    ) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "O cadastro relacionado a este link não foi encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Registra acesso.
     *
     * Não interfere na validade.
     */
    await supabase
      .from(
        "candidate_edit_invites"
      )
      .update({
        last_accessed_at:
          new Date().toISOString(),

        access_count:
          Number(
            invite.access_count ??
              0
          ) + 1,
      })
      .eq(
        "id",
        invite.id
      );

    return NextResponse.json({
      valid: true,

      expires_at:
        invite.expires_at,

      candidate,
    });
  } catch (error) {
    console.error(
      "Candidate invite GET:",
      error
    );

    return NextResponse.json(
      {
        valid: false,
        error:
          "Não foi possível validar o link.",
      },
      {
        status: 500,
      }
    );
  }
}
