"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  FileSearch,
  Loader2,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type QueueStatus =
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "ignored"
  | "imported";

type QueueItem = {
  id: string;
  provider_id: string;
  candidate_id: string;
  external_identity_id: string | null;

  record_type:
    | "position"
    | "proposition"
    | "vote"
    | "committee"
    | "delivery"
    | "profile"
    | "other";

  external_id: string | null;
  external_url: string | null;

  title: string | null;
  summary: string | null;
  occurred_at: string | null;

  raw_payload: Record<string, unknown> | null;
  normalized_payload: Record<string, unknown> | null;

  review_status: QueueStatus;

  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;

  imported_table: string | null;
  imported_record_id: string | null;

  created_at: string;
  updated_at: string;
};

type Provider = {
  id: string;
  code: string;
  name: string;
  institution: string | null;
};

type QueueItemWithProvider = QueueItem & {
  provider?: Provider;
};

type Props = {
  candidateId: string;
};

const STATUS_LABELS: Record<QueueStatus, string> = {
  pending: "Pendente",
  in_review: "Em revisão",
  approved: "Aprovado para incorporação",
  rejected: "Rejeitado",
  ignored: "Ignorado",
  imported: "Incorporado",
};

const TYPE_LABELS: Record<QueueItem["record_type"], string> = {
  position: "Cargo / função",
  proposition: "Proposição",
  vote: "Votação",
  committee: "Comissão",
  delivery: "Entrega documentada",
  profile: "Perfil",
  other: "Outro",
};

function statusColors(status: QueueStatus) {
  switch (status) {
    case "approved":
      return {
        background: "#ecfdf3",
        border: "#abefc6",
        color: "#027a48",
      };

    case "imported":
      return {
        background: "#eef4ff",
        border: "#c7d7fe",
        color: "#3538cd",
      };

    case "in_review":
      return {
        background: "#eff8ff",
        border: "#b2ddff",
        color: "#175cd3",
      };

    case "rejected":
      return {
        background: "#fef3f2",
        border: "#fecdca",
        color: "#b42318",
      };

    case "ignored":
      return {
        background: "#f2f4f7",
        border: "#d0d5dd",
        color: "#475467",
      };

    default:
      return {
        background: "#fffaeb",
        border: "#fedf89",
        color: "#b54708",
      };
  }
}

function formatDate(value: string | null) {
  if (!value) return null;

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function CandidatePublicDataQueue({
  candidateId,
}: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [items, setItems] = useState<QueueItemWithProvider[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [filter, setFilter] = useState<QueueStatus | "all">("all");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [queueResult, providersResult] = await Promise.all([
        supabase
          .from("mfb_public_data_import_queue")
          .select(
            `
              id,
              provider_id,
              candidate_id,
              external_identity_id,
              record_type,
              external_id,
              external_url,
              title,
              summary,
              occurred_at,
              raw_payload,
              normalized_payload,
              review_status,
              review_notes,
              reviewed_by,
              reviewed_at,
              imported_table,
              imported_record_id,
              created_at,
              updated_at
            `
          )
          .eq("candidate_id", candidateId)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("mfb_public_data_providers")
          .select(
            `
              id,
              code,
              name,
              institution
            `
          )
          .order("name", {
            ascending: true,
          }),
      ]);

      if (queueResult.error) {
        throw queueResult.error;
      }

      if (providersResult.error) {
        throw providersResult.error;
      }

      const providerList = (providersResult.data || []) as Provider[];
      const queueList = (queueResult.data || []) as QueueItem[];

      setProviders(providerList);

      setItems(
        queueList.map((item) => ({
          ...item,
          provider: providerList.find(
            (provider) => provider.id === item.provider_id
          ),
        }))
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Não foi possível carregar a fila de dados públicos."
      );
    } finally {
      setLoading(false);
    }
  }, [candidateId, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const visibleItems = useMemo(() => {
    if (filter === "all") {
      return items;
    }

    return items.filter((item) => item.review_status === filter);
  }, [filter, items]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      pending: items.filter((item) => item.review_status === "pending")
        .length,
      in_review: items.filter(
        (item) => item.review_status === "in_review"
      ).length,
      approved: items.filter(
        (item) => item.review_status === "approved"
      ).length,
      rejected: items.filter(
        (item) => item.review_status === "rejected"
      ).length,
      ignored: items.filter((item) => item.review_status === "ignored")
        .length,
      imported: items.filter(
        (item) => item.review_status === "imported"
      ).length,
    };
  }, [items]);

  async function changeStatus(
    item: QueueItemWithProvider,
    newStatus: QueueStatus
  ) {
    if (item.review_status === "imported") {
      setError(
        "Este registro já foi incorporado. O histórico da importação deve ser preservado."
      );
      return;
    }

    setUpdatingId(item.id);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Sessão administrativa não encontrada.");
      }

      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("mfb_public_data_import_queue")
        .update({
          review_status: newStatus,
          reviewed_by: user.id,
          reviewed_at: now,
        })
        .eq("id", item.id)
        .eq("candidate_id", candidateId);

      if (updateError) {
        throw updateError;
      }

      const { error: eventError } = await supabase
        .from("mfb_public_data_import_events")
        .insert({
          queue_item_id: item.id,
          event_type: "review_status_changed",
          previous_status: item.review_status,
          new_status: newStatus,
          performed_by: user.id,
          notes: null,
          metadata: {
            record_type: item.record_type,
            provider_id: item.provider_id,
          },
        });

      if (eventError) {
        throw eventError;
      }

      setSuccess(
        `Registro atualizado para "${STATUS_LABELS[newStatus]}".`
      );

      await loadData();
    } catch (err: any) {
      setError(
        err?.message ||
          "Não foi possível atualizar o registro importado."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 24,
          color: "#667085",
        }}
      >
        <Loader2 size={20} />
        Carregando fila de dados públicos...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 20,
      }}
    >
      <div
        style={{
          padding: 18,
          borderRadius: 12,
          border: "1px solid #d1e9ff",
          background: "#f5fbff",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <Database
            size={22}
            style={{
              color: "#175cd3",
              flexShrink: 0,
              marginTop: 2,
            }}
          />

          <div>
            <strong
              style={{
                color: "#1849a9",
              }}
            >
              Fila de conferência
            </strong>

            <p
              style={{
                margin: "5px 0 0",
                color: "#475467",
                fontSize: 14,
                lineHeight: 1.65,
              }}
            >
              Registros recebidos de integrações externas serão
              apresentados aqui antes de qualquer incorporação à
              Atuação Pública. Aprovar nesta fila não significa
              publicar o registro.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 9,
            padding: 13,
            borderRadius: 10,
            background: "#fef3f2",
            border: "1px solid #fecdca",
            color: "#b42318",
          }}
        >
          <AlertCircle
            size={18}
            style={{
              flexShrink: 0,
              marginTop: 1,
            }}
          />

          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: 13,
            borderRadius: 10,
            background: "#ecfdf3",
            border: "1px solid #abefc6",
            color: "#027a48",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              color: "#101828",
            }}
          >
            Registros recebidos
          </h3>

          <p
            style={{
              margin: "4px 0 0",
              color: "#667085",
              fontSize: 13,
            }}
          >
            {items.length} registro
            {items.length === 1 ? "" : "s"} na fila.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void loadData()}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 7,
          flexWrap: "wrap",
        }}
      >
        {(
          [
            ["all", "Todos"],
            ["pending", "Pendentes"],
            ["in_review", "Em revisão"],
            ["approved", "Aprovados"],
            ["rejected", "Rejeitados"],
            ["ignored", "Ignorados"],
            ["imported", "Incorporados"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            style={{
              padding: "7px 11px",
              borderRadius: 999,
              border:
                filter === value
                  ? "1px solid #157347"
                  : "1px solid #d0d5dd",
              background: filter === value ? "#ecfdf3" : "#fff",
              color: filter === value ? "#027a48" : "#475467",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {label} ({counts[value]})
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            border: "1px dashed #d0d5dd",
            borderRadius: 12,
            background: "#fcfcfd",
            color: "#667085",
          }}
        >
          <FileSearch
            size={30}
            style={{
              marginBottom: 8,
            }}
          />

          <div
            style={{
              fontWeight: 800,
              color: "#344054",
            }}
          >
            Nenhum registro nesta fila
          </div>

          <div
            style={{
              marginTop: 5,
              fontSize: 14,
            }}
          >
            Quando conectarmos as fontes oficiais, os registros
            encontrados aparecerão aqui para conferência.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          {visibleItems.map((item) => {
            const status = statusColors(item.review_status);
            const busy = updatingId === item.id;

            return (
              <article
                key={item.id}
                style={{
                  padding: 18,
                  border: "1px solid #e4e7ec",
                  borderRadius: 14,
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 15,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 7,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          padding: "4px 8px",
                          borderRadius: 999,
                          background: status.background,
                          border: `1px solid ${status.border}`,
                          color: status.color,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {STATUS_LABELS[item.review_status]}
                      </span>

                      <span
                        style={{
                          display: "inline-flex",
                          padding: "4px 8px",
                          borderRadius: 999,
                          background: "#f2f4f7",
                          color: "#475467",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {TYPE_LABELS[item.record_type]}
                      </span>
                    </div>

                    <h4
                      style={{
                        margin: "10px 0 0",
                        color: "#101828",
                        fontSize: 17,
                      }}
                    >
                      {item.title || "Registro sem título"}
                    </h4>

                    <div
                      style={{
                        marginTop: 5,
                        color: "#667085",
                        fontSize: 13,
                        lineHeight: 1.6,
                      }}
                    >
                      <div>
                        <strong>Fonte:</strong>{" "}
                        {item.provider?.name || "Fonte externa"}
                      </div>

                      {item.external_id && (
                        <div>
                          <strong>ID externo:</strong>{" "}
                          {item.external_id}
                        </div>
                      )}

                      {item.occurred_at && (
                        <div>
                          <strong>Data do registro:</strong>{" "}
                          {formatDate(item.occurred_at)}
                        </div>
                      )}

                      <div>
                        <strong>Recebido:</strong>{" "}
                        {formatDate(item.created_at)}
                      </div>
                    </div>

                    {item.summary && (
                      <p
                        style={{
                          margin: "12px 0 0",
                          color: "#475467",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {item.summary}
                      </p>
                    )}

                    {item.external_url?.startsWith("http") && (
                      <a
                        href={item.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          marginTop: 10,
                          color: "#157347",
                          fontWeight: 800,
                          fontSize: 13,
                          textDecoration: "none",
                        }}
                      >
                        Consultar registro na fonte
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>

                {item.review_status !== "imported" && (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginTop: 18,
                      paddingTop: 15,
                      borderTop: "1px solid #eaecf0",
                    }}
                  >
                    {item.review_status !== "in_review" && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={busy}
                        onClick={() =>
                          void changeStatus(item, "in_review")
                        }
                      >
                        <Clock3 size={15} />
                        Em revisão
                      </button>
                    )}

                    {item.review_status !== "approved" && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={busy}
                        onClick={() =>
                          void changeStatus(item, "approved")
                        }
                      >
                        <CheckCircle2 size={15} />
                        Aprovar
                      </button>
                    )}

                    {item.review_status !== "rejected" && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={busy}
                        onClick={() =>
                          void changeStatus(item, "rejected")
                        }
                      >
                        <XCircle size={15} />
                        Rejeitar
                      </button>
                    )}

                    {item.review_status !== "ignored" && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={busy}
                        onClick={() =>
                          void changeStatus(item, "ignored")
                        }
                      >
                        Ignorar
                      </button>
                    )}

                    {item.review_status !== "pending" && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={busy}
                        onClick={() =>
                          void changeStatus(item, "pending")
                        }
                      >
                        <RotateCcw size={15} />
                        Voltar para pendente
                      </button>
                    )}

                    {busy && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          color: "#667085",
                          fontSize: 13,
                        }}
                      >
                        <Loader2 size={15} />
                        Atualizando...
                      </span>
                    )}
                  </div>
                )}

                {item.review_status === "imported" && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 12,
                      borderRadius: 9,
                      background: "#eef4ff",
                      color: "#3538cd",
                      fontSize: 13,
                    }}
                  >
                    Este registro já foi incorporado
                    {item.imported_table
                      ? ` em ${item.imported_table}`
                      : ""}
                    . O histórico da fila foi preservado.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div
        style={{
          padding: 15,
          borderRadius: 11,
          background: "#f9fafb",
          border: "1px solid #e4e7ec",
          color: "#667085",
          fontSize: 13,
          lineHeight: 1.65,
        }}
      >
        <strong style={{ color: "#344054" }}>
          Separação de etapas:
        </strong>{" "}
        “Aprovado para incorporação” significa apenas que o registro
        passou pela conferência administrativa. A incorporação à
        Atuação Pública será uma operação separada e auditável.
      </div>
    </div>
  );
}
