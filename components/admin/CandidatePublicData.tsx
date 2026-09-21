"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  ExternalLink,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Provider = {
  id: string;
  code: string;
  name: string;
  institution: string | null;
  provider_type: string;
  base_url: string | null;
  documentation_url: string | null;
  active: boolean;
};

type ExternalIdentity = {
  id: string;
  candidate_id: string;
  provider_id: string;
  external_id: string;
  external_name: string | null;
  external_url: string | null;
  metadata: Record<string, unknown> | null;
  verification_status:
    | "pending"
    | "verified"
    | "needs_review"
    | "rejected";
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

type IdentityWithProvider = ExternalIdentity & {
  provider?: Provider;
};

type Props = {
  candidateId: string;
};

type FormState = {
  provider_id: string;
  external_id: string;
  external_name: string;
  external_url: string;
  verification_status:
    | "pending"
    | "verified"
    | "needs_review"
    | "rejected";
};

const EMPTY_FORM: FormState = {
  provider_id: "",
  external_id: "",
  external_name: "",
  external_url: "",
  verification_status: "pending",
};

const STATUS_LABELS: Record<
  ExternalIdentity["verification_status"],
  string
> = {
  pending: "Pendente",
  verified: "Verificado",
  needs_review: "Requer revisão",
  rejected: "Rejeitado",
};

function statusStyle(
  status: ExternalIdentity["verification_status"]
) {
  switch (status) {
    case "verified":
      return {
        background: "#ecfdf3",
        border: "#abefc6",
        color: "#027a48",
      };

    case "needs_review":
      return {
        background: "#fffaeb",
        border: "#fedf89",
        color: "#b54708",
      };

    case "rejected":
      return {
        background: "#fef3f2",
        border: "#fecdca",
        color: "#b42318",
      };

    default:
      return {
        background: "#f2f4f7",
        border: "#d0d5dd",
        color: "#475467",
      };
  }
}

export default function CandidatePublicData({
  candidateId,
}: Props) {
  const supabase = createClient();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [identities, setIdentities] = useState<
    IdentityWithProvider[]
  >([]);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(
    null
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [providersResult, identitiesResult] =
        await Promise.all([
          supabase
            .from("mfb_public_data_providers")
            .select(
              `
                id,
                code,
                name,
                institution,
                provider_type,
                base_url,
                documentation_url,
                active
              `
            )
            .eq("active", true)
            .order("name", {
              ascending: true,
            }),

          supabase
            .from("candidate_external_identities")
            .select(
              `
                id,
                candidate_id,
                provider_id,
                external_id,
                external_name,
                external_url,
                metadata,
                verification_status,
                verified_at,
                created_at,
                updated_at
              `
            )
            .eq("candidate_id", candidateId)
            .order("created_at", {
              ascending: true,
            }),
        ]);

      if (providersResult.error) {
        throw providersResult.error;
      }

      if (identitiesResult.error) {
        throw identitiesResult.error;
      }

      const providerList =
        (providersResult.data || []) as Provider[];

      const identityList =
        (identitiesResult.data || []) as ExternalIdentity[];

      const joined: IdentityWithProvider[] =
        identityList.map((identity) => ({
          ...identity,
          provider: providerList.find(
            (provider) =>
              provider.id === identity.provider_id
          ),
        }));

      setProviders(providerList);
      setIdentities(joined);
    } catch (err: any) {
      setError(
        err?.message ||
          "Não foi possível carregar os dados públicos."
      );
    } finally {
      setLoading(false);
    }
  }, [candidateId, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setSuccess(null);
  }

  function startEdit(identity: IdentityWithProvider) {
    setEditingId(identity.id);

    setForm({
      provider_id: identity.provider_id,
      external_id: identity.external_id,
      external_name: identity.external_name || "",
      external_url: identity.external_url || "",
      verification_status: identity.verification_status,
    });

    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (!form.provider_id) {
      setError("Selecione a fonte de dados.");
      return;
    }

    if (!form.external_id.trim()) {
      setError("Informe o identificador externo.");
      return;
    }

    setSaving(true);

    try {
      const verifiedAt =
        form.verification_status === "verified"
          ? new Date().toISOString()
          : null;

      const payload = {
        candidate_id: candidateId,
        provider_id: form.provider_id,
        external_id: form.external_id.trim(),
        external_name:
          form.external_name.trim() || null,
        external_url:
          form.external_url.trim() || null,
        verification_status:
          form.verification_status,
        verified_at: verifiedAt,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("candidate_external_identities")
          .update(payload)
          .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        setSuccess("Identidade externa atualizada.");
      } else {
        const { error: insertError } = await supabase
          .from("candidate_external_identities")
          .insert(payload);

        if (insertError) {
          throw insertError;
        }

        setSuccess("Identidade externa vinculada.");
      }

      setEditingId(null);
      setForm(EMPTY_FORM);

      await loadData();
    } catch (err: any) {
      if (
        err?.code === "23505" ||
        String(err?.message || "").includes(
          "duplicate key"
        )
      ) {
        setError(
          "Este identificador já está vinculado a este candidato nessa fonte."
        );
      } else {
        setError(
          err?.message ||
            "Não foi possível salvar a identidade externa."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(identityId: string) {
    const confirmed = window.confirm(
      "Deseja remover este vínculo com a fonte externa?"
    );

    if (!confirmed) return;

    setDeletingId(identityId);
    setError(null);
    setSuccess(null);

    try {
      const { error: deleteError } = await supabase
        .from("candidate_external_identities")
        .delete()
        .eq("id", identityId);

      if (deleteError) {
        throw deleteError;
      }

      if (editingId === identityId) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }

      setSuccess("Vínculo removido.");

      await loadData();
    } catch (err: any) {
      setError(
        err?.message ||
          "Não foi possível remover o vínculo."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 22,
          color: "#667085",
        }}
      >
        <Loader2
          size={20}
          style={{
            animation: "spin 1s linear infinite",
          }}
        />

        Carregando dados públicos...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 22,
      }}
    >
      <div
        style={{
          padding: 18,
          border: "1px solid #d1e9ff",
          borderRadius: 12,
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
              Central de Dados Públicos
            </strong>

            <p
              style={{
                margin: "5px 0 0",
                color: "#475467",
                lineHeight: 1.6,
                fontSize: 14,
              }}
            >
              Vincule o cadastro do candidato aos
              identificadores utilizados por fontes
              públicas. Nesta etapa nenhum dado é
              importado ou publicado automaticamente.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            display: "flex",
            gap: 9,
            alignItems: "flex-start",
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
            gap: 9,
            alignItems: "center",
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

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
              }}
            >
              Identidades externas
            </h3>

            <p
              style={{
                margin: "4px 0 0",
                color: "#667085",
                fontSize: 13,
              }}
            >
              {identities.length} vínculo
              {identities.length === 1 ? "" : "s"} cadastrado
              {identities.length === 1 ? "" : "s"}.
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

        {identities.length === 0 ? (
          <div
            style={{
              padding: 24,
              border: "1px dashed #d0d5dd",
              borderRadius: 12,
              textAlign: "center",
              color: "#667085",
              background: "#fcfcfd",
            }}
          >
            <Link2
              size={28}
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
              Nenhuma identidade externa vinculada
            </div>

            <div
              style={{
                marginTop: 5,
                fontSize: 14,
              }}
            >
              Utilize o formulário abaixo para criar o
              primeiro vínculo.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 10,
            }}
          >
            {identities.map((identity) => {
              const status = statusStyle(
                identity.verification_status
              );

              return (
                <div
                  key={identity.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 14,
                    alignItems: "center",
                    padding: 16,
                    border: "1px solid #e4e7ec",
                    borderRadius: 12,
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong
                        style={{
                          color: "#101828",
                        }}
                      >
                        {identity.provider?.name ||
                          "Fonte externa"}
                      </strong>

                      <span
                        style={{
                          display: "inline-flex",
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: status.background,
                          border: `1px solid ${status.border}`,
                          color: status.color,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {
                          STATUS_LABELS[
                            identity.verification_status
                          ]
                        }
                      </span>
                    </div>

                    {identity.provider?.institution && (
                      <div
                        style={{
                          marginTop: 3,
                          color: "#667085",
                          fontSize: 13,
                        }}
                      >
                        {identity.provider.institution}
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: 9,
                        fontSize: 14,
                        color: "#344054",
                      }}
                    >
                      <strong>ID externo:</strong>{" "}
                      {identity.external_id}
                    </div>

                    {identity.external_name && (
                      <div
                        style={{
                          marginTop: 4,
                          color: "#475467",
                          fontSize: 14,
                        }}
                      >
                        <strong>Nome na fonte:</strong>{" "}
                        {identity.external_name}
                      </div>
                    )}

                    {identity.external_url && (
                      <a
                        href={identity.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          marginTop: 8,
                          color: "#157347",
                          fontSize: 13,
                          fontWeight: 800,
                          textDecoration: "none",
                        }}
                      >
                        Abrir registro externo
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 7,
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => startEdit(identity)}
                      title="Editar vínculo"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        void handleDelete(identity.id)
                      }
                      disabled={deletingId === identity.id}
                      title="Remover vínculo"
                    >
                      {deletingId === identity.id ? (
                        <Loader2 size={16} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          padding: 20,
          border: "1px solid #e4e7ec",
          borderRadius: 14,
          background: "#f9fafb",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
              }}
            >
              {editingId
                ? "Editar identidade externa"
                : "Vincular fonte pública"}
            </h3>

            <p
              style={{
                margin: "4px 0 0",
                color: "#667085",
                fontSize: 13,
              }}
            >
              O vínculo identifica o mesmo candidato em uma
              fonte externa.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
            >
              <X size={16} />
              Cancelar
            </button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 14,
          }}
        >
          <label>
            <div
              style={{
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Fonte de dados *
            </div>

            <select
              value={form.provider_id}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  provider_id: event.target.value,
                }))
              }
              required
              style={{
                width: "100%",
                minHeight: 42,
              }}
            >
              <option value="">
                Selecione...
              </option>

              {providers.map((provider) => (
                <option
                  key={provider.id}
                  value={provider.id}
                >
                  {provider.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div
              style={{
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Identificador externo *
            </div>

            <input
              value={form.external_id}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  external_id: event.target.value,
                }))
              }
              placeholder="ID utilizado pela fonte"
              required
              style={{
                width: "100%",
              }}
            />
          </label>

          <label>
            <div
              style={{
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Nome na fonte
            </div>

            <input
              value={form.external_name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  external_name: event.target.value,
                }))
              }
              placeholder="Nome exibido pela fonte"
              style={{
                width: "100%",
              }}
            />
          </label>

          <label>
            <div
              style={{
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Situação da conferência
            </div>

            <select
              value={form.verification_status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  verification_status:
                    event.target
                      .value as FormState["verification_status"],
                }))
              }
              style={{
                width: "100%",
                minHeight: 42,
              }}
            >
              <option value="pending">
                Pendente
              </option>

              <option value="verified">
                Verificado
              </option>

              <option value="needs_review">
                Requer revisão
              </option>

              <option value="rejected">
                Rejeitado
              </option>
            </select>
          </label>
        </div>

        <label
          style={{
            display: "block",
            marginTop: 14,
          }}
        >
          <div
            style={{
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            URL do registro na fonte
          </div>

          <input
            type="url"
            value={form.external_url}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                external_url: event.target.value,
              }))
            }
            placeholder="https://..."
            style={{
              width: "100%",
            }}
          />
        </label>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 18,
          }}
        >
          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={16} />
                Salvando...
              </>
            ) : editingId ? (
              <>
                <CheckCircle2 size={16} />
                Salvar alterações
              </>
            ) : (
              <>
                <Plus size={16} />
                Vincular fonte
              </>
            )}
          </button>
        </div>
      </form>

      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e4e7ec",
          background: "#fff",
          color: "#667085",
          fontSize: 13,
          lineHeight: 1.65,
        }}
      >
        <strong
          style={{
            color: "#344054",
          }}
        >
          Próxima fase:
        </strong>{" "}
        depois que as identidades oficiais estiverem vinculadas,
        este módulo poderá solicitar dados às fontes integradas.
        Os registros recebidos irão primeiro para a fila de
        conferência administrativa antes de eventual incorporação
        à Atuação Pública.
      </div>
    </div>
  );
}
