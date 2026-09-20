import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Sessão administrativa não encontrada.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (
      profileError ||
      profile?.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Somente administradores podem excluir candidatos.",
        },
        {
          status: 403,
        }
      );
    }

    const admin = createAdminClient();

    const {
      data: candidate,
      error: candidateError,
    } = await admin
      .from("candidates")
      .select("id, name, ballot_name")
      .eq("id", id)
      .maybeSingle();

    if (candidateError) {
      return NextResponse.json(
        {
          error:
            "Não foi possível consultar o candidato.",
        },
        {
          status: 500,
        }
      );
    }

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

    /*
     * Primeiro removemos os registros auxiliares
     * conhecidos. Isso também torna a operação
     * compatível caso alguma dessas relações não
     * esteja configurada com ON DELETE CASCADE.
     */

    const relatedTables = [
      "candidate_edit_submissions",
      "candidate_edit_invites",
      "candidate_sources",
      "candidate_offices",
    ];

    for (const table of relatedTables) {
      const { error } = await admin
        .from(table)
        .delete()
        .eq("candidate_id", id);

      /*
       * Se uma instalação antiga não possuir alguma
       * dessas tabelas, não interrompemos a exclusão.
       * Restrições reais do banco ainda protegerão
       * a exclusão final do candidato.
       */
      if (error) {
        console.warn(
          `Não foi possível limpar ${table}:`,
          error.message
        );
      }
    }

    const { error: deleteError } = await admin
      .from("candidates")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        {
          error:
            `O candidato não pôde ser excluído: ${deleteError.message}`,
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCandidate: {
        id: candidate.id,
        name:
          candidate.ballot_name ||
          candidate.name,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao excluir candidato:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao excluir candidato.",
      },
      {
        status: 500,
      }
    );
  }
}
