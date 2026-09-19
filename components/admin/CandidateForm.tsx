"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { STATES } from "@/lib/states";

export default function CandidateForm({
  initial,
}: {
  initial?: any;
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    ballot_name: initial?.ballot_name ?? "",
    slug: initial?.slug ?? "",

    scope:
      initial?.state_uf === "BR"
        ? "national"
        : ["Prefeito(a)", "Vice-Prefeito(a)", "Vereador(a)"].includes(
            initial?.cargo
          )
        ? "municipal"
        : "state",

    state_uf: initial?.state_uf ?? "DF",

    city_name: initial?.city_name ?? "",

    cargo:
      initial?.cargo ?? "Deputado(a) Federal",

    party: initial?.party ?? "",
    number: initial?.number ?? "",

    photo_url: initial?.photo_url ?? "",

    photo_position_x:
      Number(initial?.photo_position_x ?? 50),

    photo_position_y:
      Number(initial?.photo_position_y ?? 20),

    photo_zoom:
      Number(initial?.photo_zoom ?? 1),

    external_page_url:
      initial?.external_page_url ?? "",

    mini_cv: initial?.mini_cv ?? "",
    biography: initial?.biography ?? "",

    political_project:
      initial?.political_project ?? "",

    proposals: initial?.proposals ?? "",

    public_experience:
      initial?.public_experience ?? "",

    priority_areas:
      initial?.priority_areas ?? "",

    instagram_url:
      initial?.instagram_url ?? "",

    facebook_url:
      initial?.facebook_url ?? "",

    youtube_url:
      initial?.youtube_url ?? "",

    website_url:
      initial?.website_url ?? "",

    video_url:
      initial?.video_url ?? "",

    source_url:
      initial?.source_url ?? "",

    source_notes:
      initial?.source_notes ?? "",

    verified_at: initial?.verified_at
      ? initial.verified_at.substring(0, 10)
      : "",

    status: initial?.status ?? "draft",
  });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =========================================================
     ALTERAÇÃO GENÉRICA
  ========================================================= */

  function set(
    key: string,
    value: string | number
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /* =========================================================
     CARGO / ABRANGÊNCIA
  ========================================================= */

  function changeCargo(cargo: string) {
    const nationalCargos = [
      "Presidente",
      "Vice-Presidente",
    ];

    const municipalCargos = [
      "Prefeito(a)",
      "Vice-Prefeito(a)",
      "Vereador(a)",
    ];

    if (nationalCargos.includes(cargo)) {
      setForm((current) => ({
        ...current,
        cargo,
        scope: "national",
        state_uf: "BR",
        city_name: "",
      }));

      return;
    }

    if (cargo === "Deputado(a) Distrital") {
      setForm((current) => ({
        ...current,
        cargo,
        scope: "state",
        state_uf: "DF",
        city_name: "",
      }));

      return;
    }

    if (municipalCargos.includes(cargo)) {
      setForm((current) => ({
        ...current,
        cargo,
        scope: "municipal",
        state_uf:
          current.state_uf === "BR"
            ? "DF"
            : current.state_uf,
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      cargo,
      scope: "state",
      state_uf:
        current.state_uf === "BR"
          ? "DF"
          : current.state_uf,
      city_name: "",
    }));
  }

  /* =========================================================
     CONTROLES DA FOTO
  ========================================================= */

  function centralizePhoto() {
    setForm((current) => ({
      ...current,
      photo_position_x: 50,
      photo_position_y: 50,
    }));
  }

  function restorePhoto() {
    setForm((current) => ({
      ...current,
      photo_position_x: 50,
      photo_position_y: 20,
      photo_zoom: 1,
    }));
  }

  /* =========================================================
     SALVAR
  ========================================================= */

  async function save(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setSaving(true);
    setError("");

    const supabase = createClient();

    const slug =
      form.slug ||
      form.name
        .toLowerCase()
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-|-$/g,
          ""
        );

    const {
      scope,
      ...formData
    } = form;

    const payload = {
      ...formData,

      slug,

      state_uf:
        scope === "national"
          ? "BR"
          : form.state_uf,

      city_name:
        scope === "municipal"
          ? form.city_name.trim()
          : null,

      photo_position_x:
        Number(
          form.photo_position_x
        ),

      photo_position_y:
        Number(
          form.photo_position_y
        ),

      photo_zoom:
        Number(form.photo_zoom),

      verified_at:
        form.verified_at || null,

      updated_at:
        new Date().toISOString(),
    };

    const result = initial
      ? await supabase
          .from("candidates")
          .update(payload)
          .eq("id", initial.id)
      : await supabase
          .from("candidates")
          .insert(payload);

    if (result.error) {
      setError(
        result.error.message
      );

      setSaving(false);

      return;
    }

    router.push(
      "/admin/candidatos"
    );

    router.refresh();
  }

  /* =========================================================
     ESTILOS
  ========================================================= */

  const labelStyle = {
    display: "block",
    fontWeight: 700,
    marginBottom: 7,
  };

  const sectionStyle = {
    marginTop: 32,
    paddingTop: 24,
    borderTop:
      "1px solid #e4e7ec",
  };

  const controlBoxStyle = {
    padding: 18,
    border:
      "1px solid #e4e7ec",
    borderRadius: 12,
    background: "#fff",
  };

  return (
    <form
      onSubmit={save}
      className="card"
      style={{
        padding: 26,
      }}
    >
      {/* =====================================================
          IDENTIFICAÇÃO
      ===================================================== */}

      <h2>
        Identificação
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(260px,1fr))",
          gap: 18,
          marginTop: 20,
        }}
      >
        <label>
          <span style={labelStyle}>
            Nome completo *
          </span>

          <input
            className="field"
            required
            value={form.name}
            onChange={(e) =>
              set(
                "name",
                e.target.value
              )
            }
          />
        </label>

        <label>
          <span style={labelStyle}>
            Nome na urna
          </span>

          <input
            className="field"
            value={
              form.ballot_name
            }
            onChange={(e) =>
              set(
                "ballot_name",
                e.target.value
              )
            }
          />
        </label>

        <label>
          <span style={labelStyle}>
            Slug da URL
          </span>

          <input
            className="field"
            placeholder="Gerado automaticamente se vazio"
            value={form.slug}
            onChange={(e) =>
              set(
                "slug",
                e.target.value
              )
            }
          />
        </label>

        <label>
          <span style={labelStyle}>
            Abrangência *
          </span>

          <select
            className="field"
            value={form.scope}
            disabled
            aria-label="Abrangência definida automaticamente pelo cargo"
          >
            <option value="national">
              Nacional
            </option>

            <option value="state">
              Estadual / Distrital
            </option>

            <option value="municipal">
              Municipal
            </option>
          </select>

          <div
            style={{
              marginTop: 6,
              color: "#667085",
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            Definida automaticamente conforme o cargo.
          </div>
        </label>

        {form.scope !== "national" && (
          <label>
            <span style={labelStyle}>
              Estado *
            </span>

            <select
              className="field"
              required
              value={form.state_uf}
              disabled={
                form.cargo === "Deputado(a) Distrital"
              }
              onChange={(e) =>
                set(
                  "state_uf",
                  e.target.value
                )
              }
            >
              {STATES.map(
                (state) => (
                  <option
                    key={state.uf}
                    value={state.uf}
                  >
                    {state.uf} —{" "}
                    {state.name}
                  </option>
                )
              )}
            </select>
          </label>
        )}

        {form.scope === "municipal" && (
          <label>
            <span style={labelStyle}>
              Município *
            </span>

            <input
              className="field"
              required
              placeholder="Ex.: Goiânia"
              value={form.city_name}
              onChange={(e) =>
                set(
                  "city_name",
                  e.target.value
                )
              }
            />
          </label>
        )}

        <label>
          <span style={labelStyle}>
            Cargo *
          </span>

          <select
            className="field"
            required
            value={form.cargo}
            onChange={(e) =>
              changeCargo(
                e.target.value
              )
            }
          >
            <option>
              Presidente
            </option>

            <option>
              Vice-Presidente
            </option>

            <option>
              Governador(a)
            </option>

            <option>
              Vice-Governador(a)
            </option>

            <option>
              Senador(a)
            </option>

            <option>
              Deputado(a) Federal
            </option>

            <option>
              Deputado(a) Estadual
            </option>

            <option>
              Deputado(a) Distrital
            </option>

            <option>
              Prefeito(a)
            </option>

            <option>
              Vice-Prefeito(a)
            </option>

            <option>
              Vereador(a)
            </option>
          </select>
        </label>

        <label>
          <span style={labelStyle}>
            Partido
          </span>

          <input
            className="field"
            placeholder="Ex.: PL"
            value={form.party}
            onChange={(e) =>
              set(
                "party",
                e.target.value
              )
            }
          />
        </label>

        <label>
          <span style={labelStyle}>
            Número
          </span>

          <input
            className="field"
            placeholder="Ex.: 22"
            value={form.number}
            onChange={(e) =>
              set(
                "number",
                e.target.value
              )
            }
          />
        </label>

        <label>
          <span style={labelStyle}>
            Status *
          </span>

          <select
            className="field"
            value={form.status}
            onChange={(e) =>
              set(
                "status",
                e.target.value
              )
            }
          >
            <option value="draft">
              Rascunho
            </option>

            <option value="published">
              Publicado
            </option>
          </select>
        </label>
      </div>

      {/* =====================================================
          FOTO
      ===================================================== */}

      <div style={sectionStyle}>
        <h2>
          Foto do candidato
        </h2>

        <p
          style={{
            color: "#667085",
            lineHeight: 1.6,
            maxWidth: 760,
          }}
        >
          Informe a URL da foto e
          utilize os controles para
          escolher o melhor
          enquadramento. O ajuste
          será utilizado nos cards
          públicos do candidato.
        </p>

        <label
          style={{
            display: "block",
            marginTop: 18,
          }}
        >
          <span style={labelStyle}>
            URL da foto
          </span>

          <input
            type="url"
            className="field"
            placeholder="https://..."
            value={form.photo_url}
            onChange={(e) =>
              set(
                "photo_url",
                e.target.value
              )
            }
          />
        </label>

        {form.photo_url && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(220px,320px) minmax(280px,1fr)",
              gap: 28,
              marginTop: 26,
              alignItems: "start",
            }}
          >
            {/* PREVIEW */}

            <div>
              <div
                style={{
                  width: "100%",
                  maxWidth: 300,
                  aspectRatio:
                    "3 / 4",
                  borderRadius: 14,
                  overflow:
                    "hidden",
                  border:
                    "1px solid #d0d5dd",
                  background:
                    "#f2f4f7",
                  position:
                    "relative",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    form.photo_url
                  }
                  alt="Pré-visualização do candidato"
                  style={{
                    position:
                      "absolute",
                    width: "100%",
                    height: "100%",
                    inset: 0,

                    objectFit:
                      "cover",

                    objectPosition: `${form.photo_position_x}% ${form.photo_position_y}%`,

                    transform: `scale(${form.photo_zoom})`,

                    transformOrigin: `${form.photo_position_x}% ${form.photo_position_y}%`,

                    display:
                      "block",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 10,
                  color: "#667085",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                Pré-visualização
                pública em formato
                retrato 3:4.
              </div>
            </div>

            {/* CONTROLES */}

            <div
              style={{
                display: "grid",
                gap: 16,
              }}
            >
              {/* HORIZONTAL */}

              <div
                style={
                  controlBoxStyle
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <strong>
                    Posição
                    horizontal
                  </strong>

                  <span
                    style={{
                      color:
                        "#667085",
                    }}
                  >
                    {
                      form.photo_position_x
                    }
                    %
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={
                    form.photo_position_x
                  }
                  onChange={(e) =>
                    set(
                      "photo_position_x",
                      Number(
                        e.target
                          .value
                      )
                    )
                  }
                  style={{
                    width:
                      "100%",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginTop: 5,
                    color:
                      "#98a2b3",
                    fontSize: 12,
                  }}
                >
                  <span>
                    Esquerda
                  </span>

                  <span>
                    Direita
                  </span>
                </div>
              </div>

              {/* VERTICAL */}

              <div
                style={
                  controlBoxStyle
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <strong>
                    Posição
                    vertical
                  </strong>

                  <span
                    style={{
                      color:
                        "#667085",
                    }}
                  >
                    {
                      form.photo_position_y
                    }
                    %
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={
                    form.photo_position_y
                  }
                  onChange={(e) =>
                    set(
                      "photo_position_y",
                      Number(
                        e.target
                          .value
                      )
                    )
                  }
                  style={{
                    width:
                      "100%",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginTop: 5,
                    color:
                      "#98a2b3",
                    fontSize: 12,
                  }}
                >
                  <span>
                    Topo
                  </span>

                  <span>
                    Inferior
                  </span>
                </div>
              </div>

              {/* ZOOM */}

              <div
                style={
                  controlBoxStyle
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <strong>
                    Zoom
                  </strong>

                  <span
                    style={{
                      color:
                        "#667085",
                    }}
                  >
                    {Math.round(
                      form.photo_zoom *
                        100
                    )}
                    %
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.01"
                  value={
                    form.photo_zoom
                  }
                  onChange={(e) =>
                    set(
                      "photo_zoom",
                      Number(
                        e.target
                          .value
                      )
                    )
                  }
                  style={{
                    width:
                      "100%",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginTop: 5,
                    color:
                      "#98a2b3",
                    fontSize: 12,
                  }}
                >
                  <span>
                    100%
                  </span>

                  <span>
                    200%
                  </span>
                </div>
              </div>

              {/* BOTÕES */}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    centralizePhoto
                  }
                >
                  Centralizar foto
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={
                    restorePhoto
                  }
                >
                  Restaurar padrão
                </button>
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background:
                    "#f9fafb",
                  color:
                    "#667085",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                Ajuste a posição e
                o zoom até que o
                rosto e a parte
                superior do corpo
                fiquem bem
                enquadrados dentro
                do formato 3:4.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          CONHEÇA MINHA PÁGINA
      ===================================================== */}

      <div
        style={{
          marginTop: 32,
          padding: 24,
          border:
            "2px solid #157347",
          borderRadius: 14,
          background:
            "#f6fff9",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 1,
            color: "#157347",
            marginBottom: 6,
          }}
        >
          PÁGINA DO CANDIDATO
        </div>

        <h2
          style={{
            margin:
              "0 0 8px",
          }}
        >
          Conheça minha página
        </h2>

        <p
          style={{
            color: "#667085",
            marginTop: 0,
            marginBottom: 18,
            lineHeight: 1.6,
          }}
        >
          Informe uma página
          pública relacionada ao
          candidato. Pode ser o
          site informado no
          cadastro, página pública
          ou perfil em rede social.
        </p>

        <label>
          <span style={labelStyle}>
            URL externa
          </span>

          <input
            type="url"
            className="field"
            placeholder="https://..."
            value={
              form.external_page_url
            }
            onChange={(e) =>
              set(
                "external_page_url",
                e.target.value
              )
            }
          />
        </label>

        {form.external_page_url && (
          <div
            style={{
              marginTop: 16,
            }}
          >
            <a
              href={
                form.external_page_url
              }
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              Visualizar página ↗
            </a>
          </div>
        )}
      </div>

      {/* =====================================================
          APRESENTAÇÃO
      ===================================================== */}

      <div style={sectionStyle}>
        <h2>
          Apresentação
        </h2>

        <label
          style={{
            display: "block",
            marginTop: 18,
          }}
        >
          <span style={labelStyle}>
            Mini-CV
          </span>

          <textarea
            className="field"
            rows={5}
            placeholder="Resumo da formação, profissão e trajetória."
            value={form.mini_cv}
            onChange={(e) =>
              set(
                "mini_cv",
                e.target.value
              )
            }
          />
        </label>

        <label
          style={{
            display: "block",
            marginTop: 18,
          }}
        >
          <span style={labelStyle}>
            Biografia
          </span>

          <textarea
            className="field"
            rows={6}
            value={form.biography}
            onChange={(e) =>
              set(
                "biography",
                e.target.value
              )
            }
          />
        </label>
      </div>

      {/* =====================================================
          PROJETO POLÍTICO
      ===================================================== */}

      <div style={sectionStyle}>
        <h2>
          Projeto político
        </h2>

        <label
          style={{
            display: "block",
            marginTop: 18,
          }}
        >
          <span style={labelStyle}>
            Projeto político
          </span>

          <textarea
            className="field"
            rows={8}
            placeholder="Descrição do projeto político apresentado pelo candidato."
            value={
              form.political_project
            }
            onChange={(e) =>
              set(
                "political_project",
                e.target.value
              )
            }
          />
        </label>

        <label
          style={{
            display: "block",
            marginTop: 18,
          }}
        >
          <span style={labelStyle}>
            Principais propostas
          </span>

          <textarea
            className="field"
            rows={8}
            placeholder="Registre as principais propostas apresentadas."
            value={form.proposals}
            onChange={(e) =>
              set(
                "proposals",
                e.target.value
              )
            }
          />
        </label>

        <label
          style={{
            display: "block",
            marginTop: 18,
          }}
        >
          <span style={labelStyle}>
            Experiência pública
          </span>

          <textarea
            className="field"
            rows={6}
            placeholder="Mandatos, cargos e outras experiências públicas."
            value={
              form.public_experience
            }
            onChange={(e) =>
              set(
                "public_experience",
                e.target.value
              )
            }
          />
        </label>

        <label
          style={{
            display: "block",
            marginTop: 18,
          }}
        >
          <span style={labelStyle}>
            Áreas prioritárias
          </span>

          <textarea
            className="field"
            rows={4}
            placeholder="Ex.: saúde, educação, segurança pública, economia..."
            value={
              form.priority_areas
            }
            onChange={(e) =>
              set(
                "priority_areas",
                e.target.value
              )
            }
          />
        </label>
      </div>

      {/* =====================================================
          REDES E MÍDIA
      ===================================================== */}

      <div style={sectionStyle}>
        <h2>
          Redes e mídia
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(260px,1fr))",
            gap: 18,
            marginTop: 18,
          }}
        >
          <label>
            <span
              style={labelStyle}
            >
              Instagram
            </span>

            <input
              type="url"
              className="field"
              placeholder="https://..."
              value={
                form.instagram_url
              }
              onChange={(e) =>
                set(
                  "instagram_url",
                  e.target.value
                )
              }
            />
          </label>

          <label>
            <span
              style={labelStyle}
            >
              Facebook
            </span>

            <input
              type="url"
              className="field"
              placeholder="https://..."
              value={
                form.facebook_url
              }
              onChange={(e) =>
                set(
                  "facebook_url",
                  e.target.value
                )
              }
            />
          </label>

          <label>
            <span
              style={labelStyle}
            >
              YouTube
            </span>

            <input
              type="url"
              className="field"
              placeholder="https://..."
              value={
                form.youtube_url
              }
              onChange={(e) =>
                set(
                  "youtube_url",
                  e.target.value
                )
              }
            />
          </label>

          <label>
            <span
              style={labelStyle}
            >
              Site oficial
            </span>

            <input
              type="url"
              className="field"
              placeholder="https://..."
              value={
                form.website_url
              }
              onChange={(e) =>
                set(
                  "website_url",
                  e.target.value
                )
              }
            />
          </label>

          <label>
            <span
              style={labelStyle}
            >
              Vídeo de apresentação
            </span>

            <input
              type="url"
              className="field"
              placeholder="https://..."
              value={
                form.video_url
              }
              onChange={(e) =>
                set(
                  "video_url",
                  e.target.value
                )
              }
            />
          </label>
        </div>
      </div>

      {/* =====================================================
          FONTES
      ===================================================== */}

      <div style={sectionStyle}>
        <h2>
          Fontes e conferência
        </h2>

        <p
          style={{
            color: "#667085",
            lineHeight: 1.6,
          }}
        >
          Registre a origem das
          informações para
          facilitar futuras
          atualizações e
          conferências.
        </p>

        <label
          style={{
            display: "block",
            marginTop: 18,
          }}
        >
          <span style={labelStyle}>
            Fonte principal
          </span>

          <input
            type="url"
            className="field"
            placeholder="https://..."
            value={form.source_url}
            onChange={(e) =>
              set(
                "source_url",
                e.target.value
              )
            }
          />
        </label>

        <label
          style={{
            display: "block",
            marginTop: 18,
          }}
        >
          <span style={labelStyle}>
            Observações sobre as
            fontes
          </span>

          <textarea
            className="field"
            rows={4}
            value={
              form.source_notes
            }
            onChange={(e) =>
              set(
                "source_notes",
                e.target.value
              )
            }
          />
        </label>

        <label
          style={{
            display: "block",
            marginTop: 18,
            maxWidth: 300,
          }}
        >
          <span style={labelStyle}>
            Data da verificação
          </span>

          <input
            type="date"
            className="field"
            value={
              form.verified_at
            }
            onChange={(e) =>
              set(
                "verified_at",
                e.target.value
              )
            }
          />
        </label>
      </div>

      {/* =====================================================
          ERRO
      ===================================================== */}

      {error && (
        <div
          style={{
            color: "#b42318",
            background:
              "#fef3f2",
            padding: 14,
            borderRadius: 8,
            marginTop: 24,
          }}
        >
          <strong>
            Não foi possível
            salvar.
          </strong>

          <div
            style={{
              marginTop: 4,
            }}
          >
            {error}
          </div>
        </div>
      )}

      {/* =====================================================
          AÇÕES
      ===================================================== */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 30,
          paddingTop: 24,
          borderTop:
            "1px solid #e4e7ec",
        }}
      >
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving
            ? "Salvando..."
            : initial
            ? "Salvar alterações"
            : "Cadastrar candidato"}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() =>
            router.back()
          }
        >
          ← Voltar
        </button>
      </div>
    </form>
  );
}
