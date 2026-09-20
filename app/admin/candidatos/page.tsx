import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

import { AdminShell } from "@/components/admin/AdminShell";
import CandidateOrderManager from "@/components/admin/CandidateOrderManager";

export const dynamic =
  "force-dynamic";

export default async function Page() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  const candidates =
    data ?? [];

  return (
    <AdminShell
      email={user.email}
    >
      {/* CABEÇALHO */}

      <div className="admin-heading">
        <div>
          <span className="badge">
            GESTÃO
          </span>

          <h1>
            Apoiados
          </h1>

          <p>
            Cadastre, revise,
            publique e organize os
            registros exibidos no
            ambiente público.
          </p>
        </div>

        <Link
          className="btn btn-primary"
          href="/admin/candidatos/novo"
        >
          + Novo cadastro
        </Link>
      </div>

      {/* ===============================================
          ORGANIZAÇÃO DOS CARDS
      =============================================== */}

      <CandidateOrderManager
        candidates={candidates.map(
          (candidate: any) => ({
            id:
              candidate.id,

            name:
              candidate.name,

            ballot_name:
              candidate.ballot_name,

            photo_url:
              candidate.photo_url,

            state_uf:
              candidate.state_uf,

            cargo:
              candidate.cargo,

            party:
              candidate.party,

            status:
              candidate.status,

            display_order:
              candidate.display_order ??
              1000,
          })
        )}
      />

      {/* ===============================================
          TABELA DE CADASTROS
      =============================================== */}

      <section
        className="admin-panel"
        style={{
          marginTop: 24,
        }}
      >
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  Nome
                </th>

                <th>
                  Estado
                </th>

                <th>
                  Cargo
                </th>

                <th>
                  Partido
                </th>

                <th>
                  Status
                </th>

                <th>
                  Posição
                </th>

                <th>
                  Ação
                </th>
              </tr>
            </thead>

            <tbody>
              {candidates.map(
                (c: any) => (
                  <tr
                    key={
                      c.id
                    }
                  >
                    <td>
                      <b>
                        {c.name}
                      </b>
                    </td>

                    <td>
                      {c.state_uf}
                    </td>

                    <td>
                      {c.cargo}
                    </td>

                    <td>
                      {c.party ??
                        "—"}
                    </td>

                    <td>
                      <span
                        className={`status-pill ${c.status}`}
                      >
                        {c.status ===
                        "published"
                          ? "Publicado"
                          : "Rascunho"}
                      </span>
                    </td>

                    <td>
                      {c.display_order ??
                        1000}
                    </td>

                    <td>
                      <Link
                        href={`/admin/candidatos/${c.id}`}
                        className="admin-edit"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 10,
            background:
              "#fef3f2",
            color:
              "#b42318",
          }}
        >
          Não foi possível
          carregar todos os
          candidatos:{" "}
          {error.message}
        </div>
      )}
    </AdminShell>
  );
}
