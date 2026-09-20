import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CandidateForm from "@/components/admin/CandidateForm";
import CandidateOffices from "@/components/admin/CandidateOffices";
import CandidateSources from "@/components/admin/CandidateSources";
import CandidateInviteManager from "@/components/admin/CandidateInviteManager";
import CandidateDangerZone from "@/components/admin/CandidateDangerZone";

export const dynamic = "force-dynamic";

function StatusBadge({
  children,
  background,
  color,
}: {
  children: React.ReactNode;
  background: string;
  color: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background,
        color,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {children}
    </span>
  );
}

export default async function EditCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: candidate,
    error,
  } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !candidate) {
    return notFound();
  }

  const displayName =
    candidate.ballot_name ||
    candidate.name;

  const reviewLabels: Record<
    string,
    string
  > = {
    draft: "Cadastro em rascunho",
    awaiting_completion:
      "Aguardando preenchimento",
    in_review: "Dados em revisão",
    approved: "Dados aprovados",
  };

  const reviewLabel =
    reviewLabels[
      candidate.review_status
    ] || "Cadastro em rascunho";

  const isPublished =
    candidate.status === "published";

  return (
    <main className="section">
      <div
        className="container"
        style={{
          maxWidth: 1100,
        }}
      >
        {/* ===================================================
            CABEÇALHO
        =================================================== */}

        <div
          style={{
            marginBottom: 26,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 18,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  color: "#667085",
                  marginBottom: 8,
                }}
              >
                Central Administrativa
                {" / "}
                Apoiados
                {" / "}
                Editar
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize:
                    "clamp(30px,5vw,42px)",
                  color: "#101828",
                }}
              >
                {displayName}
              </h1>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <StatusBadge
                  background={
                    isPublished
                      ? "#ecfdf3"
                      : "#f2f4f7"
                  }
                  color={
                    isPublished
                      ? "#027a48"
                      : "#475467"
                  }
                >
                  {isPublished
                    ? "● Publicado"
                    : "○ Rascunho"}
                </StatusBadge>

                <StatusBadge
                  background="#eff8ff"
                  color="#175cd3"
                >
                  {reviewLabel}
                </StatusBadge>

                {candidate.party && (
                  <StatusBadge
                    background="#f9fafb"
                    color="#344054"
                  >
                    {candidate.party}
                    {candidate.number
                      ? ` • ${candidate.number}`
                      : ""}
                  </StatusBadge>
                )}
              </div>

              <p
                style={{
                  color: "#667085",
                  margin: "12px 0 0",
                }}
              >
                {candidate.cargo}

                {candidate.city_name
                  ? ` • ${candidate.city_name}`
                  : ""}

                {candidate.state_uf &&
                candidate.state_uf !==
                  "BR"
                  ? ` • ${candidate.state_uf}`
                  : candidate.state_uf ===
                      "BR"
                    ? " • Nacional"
                    : ""}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <Link
                href="/admin/candidatos"
                className="btn btn-secondary"
              >
                ← Candidatos
              </Link>

              {candidate.slug &&
                isPublished && (
                  <Link
                    href={`/candidatos/${candidate.slug}`}
                    target="_blank"
                    className="btn btn-secondary"
                  >
                    Visualizar página ↗
                  </Link>
                )}
            </div>
          </div>
        </div>

        {/* ===================================================
            ORIENTAÇÃO
        =================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              padding: 16,
              border:
                "1px solid #e4e7ec",
              borderRadius: 12,
              background: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#667085",
                fontWeight: 800,
              }}
            >
              CADASTRO
            </div>

            <div
              style={{
                marginTop: 5,
                fontWeight: 800,
                color: "#101828",
              }}
            >
              Editar informações
            </div>

            <div
              style={{
                marginTop: 4,
                color: "#667085",
                fontSize: 13,
              }}
            >
              Identificação, perfil,
              foto, contatos e fontes.
            </div>
          </div>

          <div
            style={{
              padding: 16,
              border:
                "1px solid #e4e7ec",
              borderRadius: 12,
              background: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#667085",
                fontWeight: 800,
              }}
            >
              COLABORAÇÃO
            </div>

            <div
              style={{
                marginTop: 5,
                fontWeight: 800,
                color: "#101828",
              }}
            >
              Preenchimento 48h
            </div>

            <div
              style={{
                marginTop: 4,
                color: "#667085",
                fontSize: 13,
              }}
            >
              Envie um acesso temporário
              ao candidato ou assessoria.
            </div>
          </div>

          <div
            style={{
              padding: 16,
              border:
                "1px solid #e4e7ec",
              borderRadius: 12,
              background: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#667085",
                fontWeight: 800,
              }}
            >
              VERIFICAÇÃO
            </div>

            <div
              style={{
                marginTop: 5,
                fontWeight: 800,
                color: "#101828",
              }}
            >
              Fontes documentais
            </div>

            <div
              style={{
                marginTop: 4,
                color: "#667085",
                fontSize: 13,
              }}
            >
              Registre e confira as
              fontes públicas do cadastro.
            </div>
          </div>
        </div>

        {/* ===================================================
            1 — FICHA PRINCIPAL
        =================================================== */}

        <div
          style={{
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1,
              color: "#157347",
            }}
          >
            1 · FICHA DO CANDIDATO
          </div>
        </div>

        <CandidateForm
          initial={candidate}
        />

        {/* ===================================================
            2 — PREENCHIMENTO COLABORATIVO
        =================================================== */}

        <div
          style={{
            marginTop: 42,
            paddingTop: 30,
            borderTop:
              "1px solid #e4e7ec",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1,
              color: "#157347",
            }}
          >
            2 · PREENCHIMENTO EXTERNO
          </div>

          <h2
            style={{
              margin: "5px 0 0",
              fontSize: 28,
            }}
          >
            Candidato ou assessoria
          </h2>

          <p
            style={{
              margin: "7px 0 0",
              color: "#667085",
              maxWidth: 750,
              lineHeight: 1.6,
            }}
          >
            Gere um acesso temporário
            para complementar informações
            sem conceder acesso à Central
            Administrativa.
          </p>
        </div>

        <CandidateInviteManager
          candidateId={candidate.id}
        />

        {/* ===================================================
            3 — ESCRITÓRIOS
        =================================================== */}

        <div
          style={{
            marginTop: 42,
            paddingTop: 30,
            borderTop:
              "1px solid #e4e7ec",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1,
              color: "#157347",
            }}
          >
            3 · PRESENÇA TERRITORIAL
          </div>

          <h2
            style={{
              margin: "5px 0 0",
              fontSize: 28,
            }}
          >
            Escritórios e pontos de
            atendimento
          </h2>
        </div>

        <CandidateOffices
          candidateId={candidate.id}
        />

        {/* ===================================================
            4 — FONTES DOCUMENTAIS
        =================================================== */}

        <div
          style={{
            marginTop: 42,
            paddingTop: 30,
            borderTop:
              "1px solid #e4e7ec",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1,
              color: "#157347",
            }}
          >
            4 · VERIFICAÇÃO
          </div>

          <h2
            style={{
              margin: "5px 0 0",
              fontSize: 28,
            }}
          >
            Fontes documentais
          </h2>

          <p
            style={{
              margin: "7px 0 0",
              color: "#667085",
              maxWidth: 750,
              lineHeight: 1.6,
            }}
          >
            Cadastre as fontes utilizadas
            para documentar e conferir as
            informações apresentadas.
          </p>
        </div>

        <CandidateSources
          candidateId={candidate.id}
        />

        {/* ===================================================
            5 — ZONA DE PERIGO
        =================================================== */}

        <div
          style={{
            marginTop: 42,
            paddingTop: 30,
            borderTop:
              "1px solid #e4e7ec",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1,
              color: "#b42318",
            }}
          >
            5 · ADMINISTRAÇÃO
          </div>
        </div>

        <CandidateDangerZone
          candidateId={candidate.id}
          candidateName={displayName}
        />
      </div>
    </main>
  );
}
