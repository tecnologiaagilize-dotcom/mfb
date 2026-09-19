import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CandidateCard } from "@/components/CandidateCard";
import { BrazilMap } from "@/components/BrazilMap";

import { STATES } from "@/lib/states";

export const dynamic = "force-dynamic";

type Candidate = {
  id: string;
  name: string;
  ballot_name?: string | null;
  slug?: string | null;
  state_uf: string;
  cargo?: string | null;
  party?: string | null;
  number?: string | number | null;
  photo_url?: string | null;
  biography?: string | null;
  proposals?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  website_url?: string | null;
  status?: string | null;
};

/* =========================================================
   PÁGINA
========================================================= */

export default async function CandidatesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("candidates_public")
    .select("*")
    .eq("status", "published")
    .order("state_uf")
    .order("cargo")
    .order("name");

  const candidates: Candidate[] =
    (data as Candidate[] | null) ?? [];

  /* =======================================================
     SEPARAÇÃO NACIONAL / ESTADOS
  ======================================================= */

  const nationalCandidates =
    candidates.filter(
      (candidate) =>
        candidate.state_uf?.toUpperCase() === "BR"
    );

  const stateCandidates =
    candidates.filter(
      (candidate) =>
        candidate.state_uf?.toUpperCase() !== "BR"
    );

  /* =======================================================
     AGRUPAMENTO POR ESTADO
  ======================================================= */

  const candidatesByState =
    stateCandidates.reduce(
      (
        acc: Record<string, Candidate[]>,
        candidate
      ) => {
        if (!candidate.state_uf) {
          return acc;
        }

        const uf =
          candidate.state_uf.toUpperCase();

        if (!acc[uf]) {
          acc[uf] = [];
        }

        acc[uf].push(candidate);

        return acc;
      },
      {}
    );

  /* =======================================================
     CONTAGEM POR ESTADO
  ======================================================= */

  const counts = Object.entries(
    candidatesByState
  ).reduce(
    (
      acc: Record<string, number>,
      [uf, stateList]
    ) => {
      acc[uf] = stateList.length;
      return acc;
    },
    {}
  );

  return (
    <>
      <Header />

      <main>
        <section
          className="section"
          style={{
            background: "#fff",
          }}
        >
          <div className="container">

            {/* =============================================
                VOLTAR
            ============================================= */}

            <div
              style={{
                marginBottom: 22,
              }}
            >
              <Link
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#157347",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                ← Voltar
              </Link>
            </div>

            {/* =============================================
                CABEÇALHO
            ============================================= */}

            <span className="badge">
              ELEIÇÕES 2026
            </span>

            <h1
              style={{
                fontSize:
                  "clamp(38px,6vw,62px)",
                margin: "12px 0",
                lineHeight: 1.05,
              }}
            >
              Candidatos indicados pelo MFB
            </h1>

            <p
              style={{
                fontSize: 18,
                color: "#667085",
                maxWidth: 780,
                lineHeight: 1.7,
              }}
            >
              Consulte os candidatos cadastrados
              na plataforma, navegue pelo mapa do
              Brasil e acesse os perfis
              disponíveis em cada Estado.
            </p>

            {/* =============================================
                CANDIDATURAS NACIONAIS
            ============================================= */}

            {nationalCandidates.length > 0 && (
              <div
                style={{
                  marginTop: 42,
                }}
              >
                <div
                  style={{
                    marginBottom: 18,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      color: "#157347",
                      fontSize: 13,
                      fontWeight: 900,
                      letterSpacing: 1,
                      marginBottom: 5,
                    }}
                  >
                    ABRANGÊNCIA NACIONAL
                  </span>

                  <h2
                    style={{
                      fontSize: 32,
                      margin: 0,
                    }}
                  >
                    Candidaturas nacionais
                  </h2>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(250px,320px))",
                    gap: 20,
                  }}
                >
                  {nationalCandidates.map(
                    (candidate) => (
                      <CandidateCard
                        candidate={candidate}
                        key={candidate.id}
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {/* =============================================
                MAPA
            ============================================= */}

            <div
              className="card"
              style={{
                marginTop: 42,
                padding: 20,
              }}
            >
              <h2
                style={{
                  fontSize: 26,
                  margin: "6px 8px",
                }}
              >
                Mapa do Brasil
              </h2>

              <p
                style={{
                  color: "#667085",
                  margin: "0 8px 18px",
                  lineHeight: 1.6,
                }}
              >
                Passe o mouse sobre um Estado para
                visualizar seus candidatos ou
                clique para acessar a página
                completa da unidade da Federação.
              </p>

              <BrazilMap
                counts={counts}
                candidates={stateCandidates}
                hrefPrefix="/estado"
                showCandidateMosaic={true}
              />
            </div>

            {/* =============================================
                ESTADOS
            ============================================= */}

            <div
              style={{
                marginTop: 50,
              }}
            >
              <div
                style={{
                  marginBottom: 20,
                }}
              >
                <h2
                  style={{
                    fontSize: 32,
                    marginBottom: 6,
                  }}
                >
                  Estados
                </h2>

                <p
                  style={{
                    color: "#667085",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Consulte os candidatos
                  cadastrados em cada unidade da
                  Federação.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(260px,1fr))",
                  gap: 16,
                }}
              >
                {STATES.map((state) => {
                  const stateList =
                    candidatesByState[state.uf] ??
                    [];

                  const visibleCandidates =
                    stateList.slice(0, 5);

                  const remaining =
                    Math.max(
                      stateList.length -
                        visibleCandidates.length,
                      0
                    );

                  return (
                    <Link
                      href={`/estado/${state.uf}`}
                      key={state.uf}
                      className="card"
                      style={{
                        display: "block",
                        padding: 18,
                        color: "#172033",
                        textDecoration: "none",
                        minHeight: 180,
                      }}
                    >
                      {/* CABEÇALHO DO ESTADO */}

                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "flex-start",
                          justifyContent:
                            "space-between",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 24,
                              fontWeight: 900,
                              color: "#157347",
                            }}
                          >
                            {state.uf}
                          </div>

                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              marginTop: 2,
                            }}
                          >
                            {state.name}
                          </div>
                        </div>

                        <div
                          style={{
                            minWidth: 34,
                            height: 34,
                            padding: "0 9px",
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            background:
                              "#f2f4f7",
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 800,
                          }}
                        >
                          {stateList.length}
                        </div>
                      </div>

                      {/* FOTOS DOS CANDIDATOS */}

                      {visibleCandidates.length >
                      0 ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "flex-end",
                            gap: 7,
                            marginTop: 18,
                          }}
                        >
                          {visibleCandidates.map(
                            (
                              candidate,
                              index
                            ) => (
                              <div
                                key={
                                  candidate.id ||
                                  `${candidate.name}-${index}`
                                }
                                title={
                                  candidate.ballot_name ||
                                  candidate.name
                                }
                                style={{
                                  width: 46,
                                  aspectRatio:
                                    "3 / 4",
                                  flexShrink: 0,
                                  borderRadius: 7,
                                  overflow:
                                    "hidden",
                                  background:
                                    "#eef2f4",
                                  border:
                                    "1px solid #e4e7ec",
                                }}
                              >
                                {candidate.photo_url ? (
                                  <img
                                    src={
                                      candidate.photo_url
                                    }
                                    alt={
                                      candidate.ballot_name ||
                                      candidate.name
                                    }
                                    style={{
                                      width:
                                        "100%",
                                      height:
                                        "100%",
                                      display:
                                        "block",
                                      objectFit:
                                        "cover",
                                      objectPosition:
                                        "center top",
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width:
                                        "100%",
                                      height:
                                        "100%",
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      justifyContent:
                                        "center",
                                      background:
                                        "#f2f4f7",
                                      color:
                                        "#98a2b3",
                                      fontSize:
                                        20,
                                    }}
                                  >
                                    👤
                                  </div>
                                )}
                              </div>
                            )
                          )}

                          {remaining > 0 && (
                            <div
                              style={{
                                width: 46,
                                height: 46,
                                display: "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                flexShrink: 0,
                                borderRadius:
                                  "50%",
                                background:
                                  "#157347",
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 900,
                              }}
                            >
                              +{remaining}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            marginTop: 20,
                            padding:
                              "12px 0",
                            color: "#98a2b3",
                            fontSize: 13,
                          }}
                        >
                          Nenhum candidato
                          publicado.
                        </div>
                      )}

                      {/* RODAPÉ DO CARD */}

                      <div
                        style={{
                          marginTop: 16,
                          paddingTop: 12,
                          borderTop:
                            "1px solid #eaecf0",
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#157347",
                        }}
                      >
                        {stateList.length > 0
                          ? `Ver candidatos de ${state.uf} →`
                          : `Ver ${state.uf} →`}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* =============================================
                TODOS OS CANDIDATOS
            ============================================= */}

            <div
              style={{
                marginTop: 60,
              }}
            >
              <h2
                style={{
                  fontSize: 32,
                  marginBottom: 6,
                }}
              >
                Todos os candidatos publicados
              </h2>

              <p
                style={{
                  color: "#667085",
                  marginTop: 0,
                  lineHeight: 1.6,
                }}
              >
                Relação dos perfis atualmente
                publicados na plataforma.
              </p>

              {error ? (
                <div
                  className="card"
                  style={{
                    padding: 24,
                    marginTop: 18,
                    color: "#b42318",
                  }}
                >
                  Não foi possível carregar os
                  candidatos.
                </div>
              ) : candidates.length === 0 ? (
                <div
                  className="card"
                  style={{
                    padding: 24,
                    marginTop: 18,
                    color: "#667085",
                  }}
                >
                  Nenhum candidato publicado
                  ainda.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(250px,1fr))",
                    gap: 20,
                    marginTop: 22,
                  }}
                >
                  {candidates.map(
                    (candidate) => (
                      <CandidateCard
                        candidate={candidate}
                        key={candidate.id}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
