import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

type ActivitySource = {
  source_name?: string | null;
  source_url?: string | null;
  source_type?: string | null;
  official_url?: string | null;
  verification_status?: string | null;
};

function formatDate(
  value?: string | null
) {
  if (!value) return null;

  try {
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      }
    ).format(new Date(value));
  } catch {
    return value;
  }
}

function sourceUrl(
  item: ActivitySource
) {
  return (
    item.official_url ||
    item.source_url ||
    null
  );
}

function SourceLink({
  item,
}: {
  item: ActivitySource;
}) {
  const url = sourceUrl(item);

  if (!url) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        marginTop: 10,
        color: "#157347",
        fontSize: 13,
        fontWeight: 800,
        textDecoration: "none",
      }}
    >
      Consultar fonte ↗
    </a>
  );
}

function VerifiedBadge({
  status,
}: {
  status?: string | null;
}) {
  if (status !== "verified") {
    return null;
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 8px",
        borderRadius: 999,
        background: "#ecfdf3",
        color: "#027a48",
        border: "1px solid #abefc6",
        fontSize: 11,
        fontWeight: 800,
      }}
    >
      Fonte verificada
    </span>
  );
}

function ContentSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginTop: 36,
        paddingTop: 30,
        borderTop: "1px solid #e4e7ec",
      }}
    >
      <h2
        style={{
          margin: "0 0 16px",
          fontSize: 26,
          color: "#101828",
        }}
      >
        {title}
      </h2>

      {children}
    </section>
  );
}

function ActivityCard({
  title,
  meta,
  description,
  children,
  source,
}: {
  title: string;
  meta?: string | null;
  description?: string | null;
  children?: React.ReactNode;
  source?: ActivitySource;
}) {
  return (
    <article
      style={{
        padding: 20,
        border: "1px solid #e4e7ec",
        borderRadius: 14,
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              lineHeight: 1.4,
              color: "#101828",
            }}
          >
            {title}
          </h3>

          {meta && (
            <div
              style={{
                marginTop: 5,
                color: "#667085",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {meta}
            </div>
          )}
        </div>

        {source && (
          <VerifiedBadge
            status={
              source.verification_status
            }
          />
        )}
      </div>

      {description && (
        <p
          style={{
            margin: "12px 0 0",
            color: "#475467",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}
        >
          {description}
        </p>
      )}

      {children}

      {source && (
        <SourceLink item={source} />
      )}
    </article>
  );
}

export default async function CandidatePage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  const supabase =
    await createClient();

  const {
    data: candidate,
  } = await supabase
    .from("candidates_public")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!candidate) {
    return notFound();
  }

  /*
   * Atuação Pública
   *
   * Essas tabelas somente aparecerão publicamente
   * se as políticas RLS permitirem leitura pública.
   * Caso ainda estejam restritas ao admin,
   * simplesmente retornarão listas vazias.
   */

  const [
    positionsResult,
    propositionsResult,
    votesResult,
    committeesResult,
    deliveriesResult,
  ] = await Promise.all([
    supabase
      .from(
        "candidate_public_positions"
      )
      .select("*")
      .eq(
        "candidate_id",
        candidate.id
      )
      .order("start_date", {
        ascending: false,
      }),

    supabase
      .from(
        "candidate_public_propositions"
      )
      .select("*")
      .eq(
        "candidate_id",
        candidate.id
      )
      .order("presented_at", {
        ascending: false,
      }),

    supabase
      .from(
        "candidate_public_votes"
      )
      .select("*")
      .eq(
        "candidate_id",
        candidate.id
      )
      .order("vote_date", {
        ascending: false,
      }),

    supabase
      .from(
        "candidate_public_committees"
      )
      .select("*")
      .eq(
        "candidate_id",
        candidate.id
      )
      .order("start_date", {
        ascending: false,
      }),

    supabase
      .from(
        "candidate_public_deliveries"
      )
      .select("*")
      .eq(
        "candidate_id",
        candidate.id
      )
      .order("occurred_at", {
        ascending: false,
      }),
  ]);

  const positions =
    positionsResult.data || [];

  const propositions =
    propositionsResult.data || [];

  const votes =
    votesResult.data || [];

  const committees =
    committeesResult.data || [];

  const deliveries =
    deliveriesResult.data || [];

  const hasActivity =
    positions.length > 0 ||
    propositions.length > 0 ||
    votes.length > 0 ||
    committees.length > 0 ||
    deliveries.length > 0;

  const publicName =
    candidate.ballot_name ||
    candidate.name;

  const territory =
    candidate.state_uf === "BR"
      ? "Brasil"
      : candidate.city_name
        ? `${candidate.city_name} · ${
            candidate.state_name ||
            candidate.state_uf
          }`
        : candidate.state_name ||
          candidate.state_uf;

  const hasProfile =
    candidate.mini_cv ||
    candidate.biography;

  const hasPoliticalContent =
    candidate.political_project ||
    candidate.proposals ||
    candidate.priority_areas;

  const hasChannels =
    candidate.instagram_url ||
    candidate.facebook_url ||
    candidate.youtube_url ||
    candidate.website_url;

  return (
    <>
      <Header />

      <main
        className="section"
        style={{
          background: "#f8fafc",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: 1050,
          }}
        >
          {/* VOLTAR */}

          <div
            style={{
              marginBottom: 22,
            }}
          >
            <Link
              href="/candidatos"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "#157347",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              ← Voltar para candidatos
            </Link>
          </div>

          {/* CABEÇALHO */}

          <div
            className="card"
            style={{
              padding: 28,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(220px,280px) minmax(0,1fr)",
                gap: 32,
                alignItems: "start",
              }}
            >
              <div>
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "3 / 4",
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "#edf8f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                  }}
                >
                  {candidate.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        candidate.photo_url
                      }
                      alt={publicName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition:
                          `${
                            candidate.photo_position_x ??
                            50
                          }% ${
                            candidate.photo_position_y ??
                            20
                          }%`,
                        transform: `scale(${
                          candidate.photo_zoom ??
                          1
                        })`,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        fontSize: 80,
                        fontWeight: 900,
                        color: "#009b5b",
                      }}
                    >
                      {publicName
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <span className="badge">
                  {candidate.cargo}
                </span>

                <h1
                  style={{
                    fontSize:
                      "clamp(34px,5vw,54px)",
                    margin:
                      "12px 0 5px",
                    lineHeight: 1.05,
                  }}
                >
                  {publicName}
                </h1>

                {candidate.ballot_name &&
                  candidate.name &&
                  candidate.ballot_name !==
                    candidate.name && (
                    <p
                      style={{
                        margin:
                          "8px 0 0",
                        color: "#667085",
                        fontSize: 15,
                      }}
                    >
                      {candidate.name}
                    </p>
                  )}

                <p
                  style={{
                    color: "#667085",
                    fontSize: 17,
                    lineHeight: 1.6,
                  }}
                >
                  {territory}

                  {candidate.party
                    ? ` · ${candidate.party}`
                    : ""}

                  {candidate.number
                    ? ` · Nº ${candidate.number}`
                    : ""}
                </p>

                {candidate.mini_cv && (
                  <p
                    style={{
                      marginTop: 22,
                      fontSize: 18,
                      lineHeight: 1.7,
                      color: "#344054",
                      whiteSpace:
                        "pre-wrap",
                    }}
                  >
                    {
                      candidate.mini_cv
                    }
                  </p>
                )}

                {hasChannels && (
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      marginTop: 24,
                    }}
                  >
                    {candidate.instagram_url && (
                      <a
                        className="btn btn-secondary"
                        href={
                          candidate.instagram_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Instagram
                      </a>
                    )}

                    {candidate.facebook_url && (
                      <a
                        className="btn btn-secondary"
                        href={
                          candidate.facebook_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Facebook
                      </a>
                    )}

                    {candidate.youtube_url && (
                      <a
                        className="btn btn-secondary"
                        href={
                          candidate.youtube_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        YouTube
                      </a>
                    )}

                    {candidate.website_url && (
                      <a
                        className="btn btn-primary"
                        href={
                          candidate.website_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Site
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* PERFIL */}

            {hasProfile && (
              <ContentSection title="Sobre">
                {candidate.biography && (
                  <p
                    style={{
                      margin: 0,
                      lineHeight: 1.8,
                      color: "#475467",
                      whiteSpace:
                        "pre-wrap",
                    }}
                  >
                    {
                      candidate.biography
                    }
                  </p>
                )}
              </ContentSection>
            )}

            {/* PROJETO / PROPOSTAS */}

            {hasPoliticalContent && (
              <ContentSection title="Projeto e propostas">
                <div
                  style={{
                    display: "grid",
                    gap: 22,
                  }}
                >
                  {candidate.political_project && (
                    <div>
                      <h3
                        style={{
                          margin:
                            "0 0 8px",
                          fontSize: 18,
                        }}
                      >
                        Projeto apresentado
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          lineHeight: 1.8,
                          color: "#475467",
                          whiteSpace:
                            "pre-wrap",
                        }}
                      >
                        {
                          candidate.political_project
                        }
                      </p>
                    </div>
                  )}

                  {candidate.proposals && (
                    <div>
                      <h3
                        style={{
                          margin:
                            "0 0 8px",
                          fontSize: 18,
                        }}
                      >
                        Propostas informadas
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          lineHeight: 1.8,
                          color: "#475467",
                          whiteSpace:
                            "pre-wrap",
                        }}
                      >
                        {
                          candidate.proposals
                        }
                      </p>
                    </div>
                  )}

                  {candidate.priority_areas && (
                    <div>
                      <h3
                        style={{
                          margin:
                            "0 0 8px",
                          fontSize: 18,
                        }}
                      >
                        Áreas prioritárias informadas
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          lineHeight: 1.8,
                          color: "#475467",
                          whiteSpace:
                            "pre-wrap",
                        }}
                      >
                        {
                          candidate.priority_areas
                        }
                      </p>
                    </div>
                  )}
                </div>
              </ContentSection>
            )}

            {/* ATUAÇÃO PÚBLICA */}

            {hasActivity && (
              <ContentSection title="Atuação Pública documentada">
                <p
                  style={{
                    margin:
                      "-5px 0 22px",
                    color: "#667085",
                    lineHeight: 1.65,
                    fontSize: 14,
                  }}
                >
                  Registros factuais
                  cadastrados com base nas
                  fontes indicadas. A
                  apresentação destes dados
                  não constitui avaliação ou
                  recomendação política.
                </p>

                <div
                  style={{
                    display: "grid",
                    gap: 28,
                  }}
                >
                  {positions.length > 0 && (
                    <div>
                      <h3>
                        Cargos e funções públicas
                      </h3>

                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                        }}
                      >
                        {positions.map(
                          (item: any) => (
                            <ActivityCard
                              key={item.id}
                              title={
                                item.title ||
                                "Cargo ou função"
                              }
                              meta={[
                                item.institution,
                                item.start_date
                                  ? `Início: ${formatDate(
                                      item.start_date
                                    )}`
                                  : null,
                                item.end_date
                                  ? `Término: ${formatDate(
                                      item.end_date
                                    )}`
                                  : item.is_current
                                    ? "Atual"
                                    : null,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(" · ")}
                              description={
                                item.description
                              }
                              source={item}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {propositions.length >
                    0 && (
                    <div>
                      <h3>
                        Proposições
                      </h3>

                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                        }}
                      >
                        {propositions.map(
                          (item: any) => (
                            <ActivityCard
                              key={item.id}
                              title={
                                item.title ||
                                item.proposition_number ||
                                "Proposição"
                              }
                              meta={[
                                item.proposition_type,
                                item.proposition_number,
                                item.institution,
                                formatDate(
                                  item.presented_at
                                ),
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(" · ")}
                              description={
                                item.description
                              }
                              source={item}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {votes.length > 0 && (
                    <div>
                      <h3>
                        Votações nominais documentadas
                      </h3>

                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                        }}
                      >
                        {votes.map(
                          (item: any) => (
                            <ActivityCard
                              key={item.id}
                              title={
                                item.title ||
                                item.proposition_reference ||
                                "Votação"
                              }
                              meta={[
                                item.institution,
                                formatDate(
                                  item.vote_date
                                ),
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(" · ")}
                              description={
                                item.description
                              }
                              source={item}
                            >
                              {item.vote_value && (
                                <div
                                  style={{
                                    marginTop: 12,
                                    padding:
                                      "9px 12px",
                                    borderRadius:
                                      9,
                                    background:
                                      "#f9fafb",
                                    color:
                                      "#344054",
                                    fontSize:
                                      14,
                                  }}
                                >
                                  Voto registrado:{" "}
                                  <strong>
                                    {
                                      item.vote_value
                                    }
                                  </strong>
                                </div>
                              )}
                            </ActivityCard>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {committees.length >
                    0 && (
                    <div>
                      <h3>
                        Comissões e colegiados
                      </h3>

                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                        }}
                      >
                        {committees.map(
                          (item: any) => (
                            <ActivityCard
                              key={item.id}
                              title={
                                item.committee_name ||
                                "Comissão"
                              }
                              meta={[
                                item.role,
                                item.institution,
                                item.start_date
                                  ? `Início: ${formatDate(
                                      item.start_date
                                    )}`
                                  : null,
                                item.end_date
                                  ? `Término: ${formatDate(
                                      item.end_date
                                    )}`
                                  : item.is_current
                                    ? "Atual"
                                    : null,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(" · ")}
                              description={
                                item.description
                              }
                              source={item}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {deliveries.length >
                    0 && (
                    <div>
                      <h3>
                        Entregas e realizações documentadas
                      </h3>

                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                        }}
                      >
                        {deliveries.map(
                          (item: any) => (
                            <ActivityCard
                              key={item.id}
                              title={
                                item.title ||
                                "Registro"
                              }
                              meta={[
                                item.institution,
                                item.category,
                                item.city_name,
                                item.state_uf,
                                formatDate(
                                  item.occurred_at
                                ),
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(" · ")}
                              description={
                                item.description
                              }
                              source={item}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ContentSection>
            )}

            {/* EXPERIÊNCIA INFORMADA */}

            {candidate.public_experience && (
              <ContentSection title="Experiência pública informada">
                <p
                  style={{
                    margin: 0,
                    lineHeight: 1.8,
                    color: "#475467",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {
                    candidate.public_experience
                  }
                </p>
              </ContentSection>
            )}

            {/* VÍDEO */}

            {candidate.video_url && (
              <ContentSection title="Apresentação">
                <a
                  href={
                    candidate.video_url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  Assistir vídeo ↗
                </a>
              </ContentSection>
            )}

            {/* FONTE PRINCIPAL */}

            {candidate.source_url && (
              <ContentSection title="Fonte de referência">
                <p
                  style={{
                    margin:
                      "0 0 12px",
                    color: "#667085",
                    lineHeight: 1.65,
                  }}
                >
                  Consulte a referência
                  registrada para conferência
                  das informações deste perfil.
                </p>

                <a
                  href={
                    candidate.source_url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  Consultar fonte ↗
                </a>

                {candidate.verified_at && (
                  <div
                    style={{
                      marginTop: 12,
                      color: "#667085",
                      fontSize: 13,
                    }}
                  >
                    Data de conferência:{" "}
                    {formatDate(
                      candidate.verified_at
                    )}
                  </div>
                )}
              </ContentSection>
            )}

            {/* NOTA */}

            <div
              style={{
                marginTop: 36,
                padding: 18,
                borderRadius: 12,
                background: "#f9fafb",
                border:
                  "1px solid #e4e7ec",
                color: "#667085",
                fontSize: 13,
                lineHeight: 1.65,
              }}
            >
              As informações desta página são
              apresentadas para consulta
              documental. Propostas,
              prioridades e informações de
              apresentação são identificadas
              conforme os dados cadastrados no
              perfil. Registros de atuação
              pública podem conter links para
              suas respectivas fontes.
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
