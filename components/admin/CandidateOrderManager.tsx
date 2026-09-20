"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

type CandidateOrderItem = {
  id: string;
  name: string;
  ballot_name?: string | null;
  photo_url?: string | null;
  state_uf?: string | null;
  cargo?: string | null;
  party?: string | null;
  status?: string | null;
  display_order?: number | null;
};

export default function CandidateOrderManager({
  candidates,
}: {
  candidates: CandidateOrderItem[];
}) {
  const router = useRouter();

  const initialItems = useMemo(() => {
    return [...candidates]
      .filter((candidate) => candidate.status === "published")
      .sort((a, b) => {
        const orderA = Number(a.display_order ?? 1000);
        const orderB = Number(b.display_order ?? 1000);

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return (a.ballot_name || a.name).localeCompare(
          b.ballot_name || b.name,
          "pt-BR",
          {
            sensitivity: "base",
          }
        );
      });
  }, [candidates]);

  const [items, setItems] =
    useState<CandidateOrderItem[]>(initialItems);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  function move(
    index: number,
    direction: -1 | 1
  ) {
    const targetIndex =
      index + direction;

    if (
      targetIndex < 0 ||
      targetIndex >= items.length
    ) {
      return;
    }

    setItems((current) => {
      const next = [...current];

      const currentItem =
        next[index];

      next[index] =
        next[targetIndex];

      next[targetIndex] =
        currentItem;

      return next;
    });

    setMessage("");
    setError("");
  }

  async function saveOrder() {
    setSaving(true);
    setMessage("");
    setError("");

    const supabase =
      createClient();

    /*
     * Gravamos 10, 20, 30...
     *
     * Isso deixa espaço para futuras
     * inserções entre candidatos sem
     * precisar renumerar manualmente.
     */
    const orderedItems =
      items.map(
        (candidate, index) => ({
          ...candidate,
          display_order:
            (index + 1) * 10,
        })
      );

    for (
      const candidate
      of orderedItems
    ) {
      const { error: updateError } =
        await supabase
          .from("candidates")
          .update({
            display_order:
              candidate.display_order,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            candidate.id
          );

      if (updateError) {
        setError(
          `Não foi possível salvar a ordem: ${updateError.message}`
        );

        setSaving(false);

        return;
      }
    }

    setItems(orderedItems);

    setMessage(
      "Ordem dos cards salva com sucesso."
    );

    setSaving(false);

    router.refresh();
  }

  return (
    <section
      className="admin-panel"
      style={{
        marginTop: 24,
        padding: 22,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span
            style={{
              display:
                "inline-block",
              color: "#157347",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1,
              marginBottom: 5,
            }}
          >
            ORDEM DE EXIBIÇÃO
          </span>

          <h2
            style={{
              margin:
                "0 0 6px",
              fontSize: 26,
            }}
          >
            Organizar cards
          </h2>

          <p
            style={{
              margin: 0,
              color: "#667085",
              lineHeight: 1.6,
              maxWidth: 720,
            }}
          >
            Defina manualmente a
            ordem em que os candidatos
            publicados serão exibidos.
            Use as setas para alterar
            as posições e depois salve.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={saveOrder}
          disabled={
            saving ||
            items.length === 0
          }
        >
          {saving
            ? "Salvando..."
            : "💾 Salvar ordem"}
        </button>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            marginTop: 20,
            padding: 18,
            borderRadius: 12,
            background: "#f9fafb",
            color: "#667085",
          }}
        >
          Nenhum candidato publicado
          para organizar.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 10,
            marginTop: 22,
          }}
        >
          {items.map(
            (
              candidate,
              index
            ) => (
              <div
                key={
                  candidate.id
                }
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "52px 58px minmax(180px,1fr) auto",

                  gap: 14,

                  alignItems:
                    "center",

                  padding: 12,

                  border:
                    "1px solid #e4e7ec",

                  borderRadius: 12,

                  background:
                    "#fff",
                }}
              >
                {/* POSIÇÃO */}

                <div
                  style={{
                    width: 40,
                    height: 40,

                    borderRadius:
                      "50%",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    background:
                      "#e9f7ef",

                    color:
                      "#157347",

                    fontWeight:
                      900,

                    fontSize:
                      16,
                  }}
                >
                  {index + 1}
                </div>

                {/* FOTO */}

                <div
                  style={{
                    width: 50,

                    aspectRatio:
                      "3 / 4",

                    borderRadius:
                      8,

                    overflow:
                      "hidden",

                    background:
                      "#f2f4f7",

                    border:
                      "1px solid #e4e7ec",
                  }}
                >
                  {candidate.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        candidate.photo_url
                      }
                      alt=""
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

                        color:
                          "#157347",

                        fontWeight:
                          900,
                      }}
                    >
                      {(
                        candidate.ballot_name ||
                        candidate.name
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>

                {/* DADOS */}

                <div
                  style={{
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontWeight:
                        900,
                    }}
                  >
                    {candidate.ballot_name ||
                      candidate.name}
                  </div>

                  <div
                    style={{
                      marginTop: 3,

                      color:
                        "#667085",

                      fontSize:
                        13,
                    }}
                  >
                    {[
                      candidate.cargo,
                      candidate.party,
                      candidate.state_uf,
                    ]
                      .filter(
                        Boolean
                      )
                      .join(" • ")}
                  </div>
                </div>

                {/* CONTROLES */}

                <div
                  style={{
                    display:
                      "flex",

                    gap: 7,
                  }}
                >
                  <button
                    type="button"
                    title="Subir"
                    aria-label={`Subir ${
                      candidate.ballot_name ||
                      candidate.name
                    }`}
                    disabled={
                      index === 0
                    }
                    onClick={() =>
                      move(
                        index,
                        -1
                      )
                    }
                    style={{
                      width: 42,
                      height: 42,

                      borderRadius:
                        8,

                      border:
                        "1px solid #d0d5dd",

                      background:
                        "#fff",

                      cursor:
                        index === 0
                          ? "not-allowed"
                          : "pointer",

                      fontWeight:
                        900,

                      fontSize:
                        20,

                      opacity:
                        index === 0
                          ? 0.35
                          : 1,
                    }}
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    title="Descer"
                    aria-label={`Descer ${
                      candidate.ballot_name ||
                      candidate.name
                    }`}
                    disabled={
                      index ===
                      items.length - 1
                    }
                    onClick={() =>
                      move(
                        index,
                        1
                      )
                    }
                    style={{
                      width: 42,
                      height: 42,

                      borderRadius:
                        8,

                      border:
                        "1px solid #d0d5dd",

                      background:
                        "#fff",

                      cursor:
                        index ===
                        items.length - 1
                          ? "not-allowed"
                          : "pointer",

                      fontWeight:
                        900,

                      fontSize:
                        20,

                      opacity:
                        index ===
                        items.length - 1
                          ? 0.35
                          : 1,
                    }}
                  >
                    ↓
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {message && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 9,
            background: "#ecfdf3",
            color: "#027a48",
            fontWeight: 700,
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 9,
            background: "#fef3f2",
            color: "#b42318",
          }}
        >
          {error}
        </div>
      )}
    </section>
  );
}
