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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ============================================================
   GET
   VALIDAR LINK PÚBLICO DO CANDIDATO
============================================================ */

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

    /* --------------------------------------------------------
       Validação básica
    -------------------------------------------------------- */

    if (
      !token ||
      typeof token !== "string"
    ) {
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

    /* --------------------------------------------------------
       Converte o token recebido em SHA-256.

       O banco NÃO armazena o token original.
    -------------------------------------------------------- */

    const tokenHash =
      hashCandidateInviteToken(
        token
      );

    /*
     * Esta rota roda exclusivamente
     * no servidor.
     *
     * SUPABASE_SERVICE_ROLE_KEY
     * nunca é enviada ao navegador.
     */

    const supabase =
      createAdminClient();

    /* --------------------------------------------------------
       Localiza o convite pelo HASH
    -------------------------------------------------------- */

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
          access_count,
          created_at
        `
      )
      .eq(
        "token_hash",
        tokenHash
      )
      .maybeSingle();

    if (inviteError) {
      console.error(
        "Erro ao consultar convite:",
        inviteError
      );

      return NextResponse.json(
        {
          valid: false,
          error:
            "Não foi possível validar este link.",
        },
        {
          status: 500,
        }
      );
    }

    /* --------------------------------------------------------
       Token inexistente
    -------------------------------------------------------- */

    if (!invite) {
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

    /* --------------------------------------------------------
       Link revogado
    -------------------------------------------------------- */

    if (invite.revoked_at) {
      return NextResponse.json(
        {
          valid: false,
          revoked: true,
          error:
            "Este link foi revogado. Solicite um novo link.",
        },
        {
          status: 410,
        }
      );
    }

    /* --------------------------------------------------------
       Cadastro já enviado

       Um token submetido não pode ser reutilizado.
    -------------------------------------------------------- */

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

    /* --------------------------------------------------------
       Validade de 48 horas
    -------------------------------------------------------- */

    const expiration =
      new Date(
        invite.expires_at
      ).getTime();

    if (
      Number.isNaN(
        expiration
      ) ||
      expiration <=
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

    /* --------------------------------------------------------
       Carrega os dados do candidato

       Por enquanto retornamos os dados necessários
       para identificação na página pública.

       Na próxima etapa ampliaremos estes campos
       para o formulário completo.
    -------------------------------------------------------- */

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
          photo_position_x,
          photo_position_y,
          photo_zoom,
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

    if (candidateError) {
      console.error(
        "Erro ao consultar candidato:",
        candidateError
      );

      return NextResponse.json(
        {
          valid: false,
          error:
            "Não foi possível localizar o cadastro relacionado a este link.",
        },
        {
          status: 500,
        }
      );
    }

    if (!candidate) {
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

    /* --------------------------------------------------------
       Registra acesso

       Falha nessa atualização NÃO invalida o link.
    -------------------------------------------------------- */

    const currentAccessCount =
      Number(
        invite.access_count ??
          0
      );

    const {
      error: accessError,
    } = await supabase
      .from(
        "candidate_edit_invites"
      )
      .update({
        last_accessed_at:
          new Date().toISOString(),

        access_count:
          currentAccessCount + 1,
      })
      .eq(
        "id",
        invite.id
      );

    if (accessError) {
      console.error(
        "Não foi possível registrar acesso ao convite:",
        accessError
      );
    }

    /* --------------------------------------------------------
       Link válido
    -------------------------------------------------------- */

    return NextResponse.json({
      valid: true,

      invite: {
        id:
          invite.id,

        expires_at:
          invite.expires_at,

        created_at:
          invite.created_at,
      },

      expires_at:
        invite.expires_at,

      candidate: {
        id:
          candidate.id,

        name:
          candidate.name,

        ballot_name:
          candidate.ballot_name,

        photo_url:
          candidate.photo_url,

        photo_position_x:
          candidate.photo_position_x,

        photo_position_y:
          candidate.photo_position_y,

        photo_zoom:
          candidate.photo_zoom,

        state_uf:
          candidate.state_uf,

        city_name:
          candidate.city_name,

        cargo:
          candidate.cargo,

        party:
          candidate.party,

        number:
          candidate.number,
      },
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
          "Não foi possível validar este link.",
      },
      {
        status: 500,
      }
    );
  }
}
