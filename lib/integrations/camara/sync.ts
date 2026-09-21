import type { SupabaseClient } from "@supabase/supabase-js";

import {
  CAMARA_PROVIDER_CODE,
  obterDeputado,
  obterHistoricoDeputado,
  obterMandatosExternos,
  obterOrgaosDeputado,
  buscarTodasProposicoes,
  obterProposicao,
  obterAutoresProposicao,
  obterTemasProposicao,
  buscarTodasVotacoes,
  obterVotosVotacao,
} from "./client";

import {
  normalizeDeputadoProfile,
  normalizeHistoricoList,
  normalizeMandatosExternosList,
  normalizeOrgaosList,
  normalizeProposicao,
  normalizeVotoNominal,
  findVoteForDeputado,
  validateNormalizedRecord,
  type CamaraNormalizationContext,
  type MfbNormalizedPublicRecord,
} from "./normalizers";

/* ============================================================
   TIPOS
============================================================ */

type SyncOptions = {
  candidateId: string;

  externalIdentityId?: string | null;

  deputadoId?: string | number | null;

  candidateName?: string | null;

  stateUf?: string | null;
};

type ProviderRow = {
  id: string;
  code: string;
  name: string;
  active: boolean;
};

type ExternalIdentityRow = {
  id: string;
  candidate_id: string;
  provider_id: string;
  external_id: string;
  external_name: string | null;
  external_url: string | null;
  verification_status: string | null;
};

type QueueExistingRow = {
  id: string;
  review_status: string;
  imported_table: string | null;
  imported_record_id: string | null;
};

type QueueInsertResult = {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
};

export type CamaraSyncResult = {
  success: boolean;

  syncRunId: string;

  candidateId: string;

  deputadoId: string;

  providerId: string;

  collected: number;

  inserted: number;

  updated: number;

  skipped: number;

  errors: number;

  errorMessages: string[];
};

/* ============================================================
   HELPERS
============================================================ */

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    return String(
      (error as { message?: unknown }).message
    );
  }

  return String(error);
}

function mergeResult(
  target: QueueInsertResult,
  source: QueueInsertResult
) {
  target.inserted += source.inserted;
  target.updated += source.updated;
  target.skipped += source.skipped;
  target.errors += source.errors;
}

function deduplicateRecords(
  records: MfbNormalizedPublicRecord[]
) {
  const map =
    new Map<
      string,
      MfbNormalizedPublicRecord
    >();

  for (const record of records) {
    const key = [
      record.record_type,
      record.external_id ||
        record.title,
      record.occurred_at ||
        "sem-data",
    ].join("::");

    /*
     * Em caso de duplicidade dentro da própria coleta,
     * mantemos a última representação normalizada.
     */
    map.set(key, record);
  }

  return Array.from(map.values());
}

/* ============================================================
   PROVIDER
============================================================ */

async function getCamaraProvider(
  supabase: SupabaseClient
): Promise<ProviderRow> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "mfb_public_data_providers"
    )
    .select(
      "id, code, name, active"
    )
    .eq(
      "code",
      CAMARA_PROVIDER_CODE
    )
    .single();

  if (error || !data) {
    throw new Error(
      "O provedor oficial da Câmara não foi encontrado na Central de Dados Públicos."
    );
  }

  const provider =
    data as ProviderRow;

  if (!provider.active) {
    throw new Error(
      "O provedor da Câmara está desativado."
    );
  }

  return provider;
}

/* ============================================================
   IDENTIDADE EXTERNA
============================================================ */

async function getExternalIdentity(
  supabase: SupabaseClient,
  providerId: string,
  options: SyncOptions
): Promise<ExternalIdentityRow | null> {
  if (
    options.externalIdentityId
  ) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "candidate_external_identities"
      )
      .select(
        `
          id,
          candidate_id,
          provider_id,
          external_id,
          external_name,
          external_url,
          verification_status
        `
      )
      .eq(
        "id",
        options.externalIdentityId
      )
      .eq(
        "candidate_id",
        options.candidateId
      )
      .eq(
        "provider_id",
        providerId
      )
      .single();

    if (error || !data) {
      throw new Error(
        "A identidade externa informada não foi encontrada para este candidato."
      );
    }

    return data as ExternalIdentityRow;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "candidate_external_identities"
    )
    .select(
      `
        id,
        candidate_id,
        provider_id,
        external_id,
        external_name,
        external_url,
        verification_status
      `
    )
    .eq(
      "candidate_id",
      options.candidateId
    )
    .eq(
      "provider_id",
      providerId
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Erro ao localizar identidade externa: ${error.message}`
    );
  }

  return data as ExternalIdentityRow | null;
}

/* ============================================================
   SYNC RUN
============================================================ */

async function createSyncRun(
  supabase: SupabaseClient,
  providerId: string,
  candidateId: string
) {
  const {
    data,
    error,
  } = await supabase
    .from(
      "mfb_public_data_sync_runs"
    )
    .insert({
      provider_id:
        providerId,

      candidate_id:
        candidateId,

      sync_type:
        "candidate",

      status:
        "running",

      started_at:
        new Date().toISOString(),

      metadata: {
        provider_code:
          CAMARA_PROVIDER_CODE,

        source:
          "manual_admin_sync",
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      `Não foi possível iniciar o registro da sincronização: ${
        error?.message ||
        "erro desconhecido"
      }`
    );
  }

  return String(data.id);
}

async function finishSyncRun(
  supabase: SupabaseClient,
  syncRunId: string,
  status:
    | "completed"
    | "completed_with_errors"
    | "failed",
  counters: {
    collected: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: number;
  },
  errorMessages: string[]
) {
  const payload = {
    status,

    finished_at:
      new Date().toISOString(),

    records_found:
      counters.collected,

    records_imported:
      counters.inserted,

    records_skipped:
      counters.skipped,

    records_errors:
      counters.errors,

    error_message:
      errorMessages.length
        ? errorMessages.join(
            "\n"
          )
        : null,

    metadata: {
      provider_code:
        CAMARA_PROVIDER_CODE,

      collected:
        counters.collected,

      inserted:
        counters.inserted,

      updated:
        counters.updated,

      skipped:
        counters.skipped,

      errors:
        counters.errors,
    },
  };

  const { error } =
    await supabase
      .from(
        "mfb_public_data_sync_runs"
      )
      .update(payload)
      .eq(
        "id",
        syncRunId
      );

  if (error) {
    /*
     * Não transformamos uma sincronização já realizada
     * em falha apenas porque o fechamento do log falhou.
     */
    console.error(
      "Erro ao finalizar sync run:",
      error
    );
  }
}

/* ============================================================
   FILA
============================================================ */

async function findExistingQueueItem(
  supabase: SupabaseClient,
  providerId: string,
  candidateId: string,
  record: MfbNormalizedPublicRecord
): Promise<QueueExistingRow | null> {
  if (!record.external_id) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "mfb_public_data_import_queue"
    )
    .select(
      `
        id,
        review_status,
        imported_table,
        imported_record_id
      `
    )
    .eq(
      "provider_id",
      providerId
    )
    .eq(
      "candidate_id",
      candidateId
    )
    .eq(
      "record_type",
      record.record_type
    )
    .eq(
      "external_id",
      record.external_id
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Erro ao verificar duplicidade na fila: ${error.message}`
    );
  }

  return data as QueueExistingRow | null;
}

async function queueRecord(
  supabase: SupabaseClient,
  params: {
    providerId: string;
    syncRunId: string;
    candidateId: string;
    externalIdentityId: string | null;
    record: MfbNormalizedPublicRecord;
  }
): Promise<QueueInsertResult> {
  const result: QueueInsertResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  const validation =
    validateNormalizedRecord(
      params.record
    );

  if (!validation.valid) {
    result.errors = 1;
    return result;
  }

  const existing =
    await findExistingQueueItem(
      supabase,
      params.providerId,
      params.candidateId,
      params.record
    );

  /*
   * Um registro já incorporado não deve ser reaberto
   * automaticamente por uma nova sincronização.
   *
   * Futuramente poderemos criar uma rotina específica
   * de detecção de alterações.
   */
  if (
    existing?.review_status ===
      "imported" ||
    existing?.imported_record_id
  ) {
    result.skipped = 1;
    return result;
  }

  const queuePayload = {
    provider_id:
      params.providerId,

    sync_run_id:
      params.syncRunId,

    candidate_id:
      params.candidateId,

    external_identity_id:
      params.externalIdentityId,

    record_type:
      params.record.record_type,

    external_id:
      params.record.external_id,

    external_url:
      params.record.external_url,

    title:
      params.record.title,

    summary:
      params.record.summary,

    occurred_at:
      params.record.occurred_at,

    raw_payload:
      params.record.raw_payload,

    normalized_payload: {
      ...params.record
        .normalized_payload,

      _mfb_metadata:
        params.record.metadata,
    },
  };

  if (existing) {
    /*
     * Se o item já existe e ainda está em revisão,
     * atualizamos os dados oficiais, mas preservamos
     * o estado editorial.
     *
     * Portanto NÃO alteramos:
     * - review_status
     * - review_notes
     * - reviewed_by
     * - reviewed_at
     */
    const {
      error,
    } = await supabase
      .from(
        "mfb_public_data_import_queue"
      )
      .update(
        queuePayload
      )
      .eq(
        "id",
        existing.id
      );

    if (error) {
      result.errors = 1;
      return result;
    }

    result.updated = 1;
    return result;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "mfb_public_data_import_queue"
    )
    .insert({
      ...queuePayload,

      review_status:
        "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    result.errors = 1;
    return result;
  }

  /*
   * Auditoria da entrada na fila.
   */
  await supabase
    .from(
      "mfb_public_data_import_events"
    )
    .insert({
      queue_item_id:
        data.id,

      event_type:
        "synced",

      previous_status:
        null,

      new_status:
        "pending",

      notes:
        "Registro incluído automaticamente na fila a partir da fonte oficial da Câmara dos Deputados.",

      metadata: {
        provider_code:
          CAMARA_PROVIDER_CODE,

        sync_run_id:
          params.syncRunId,
      },
    });

  result.inserted = 1;

  return result;
}

/* ============================================================
   COLETA
============================================================ */

async function collectCamaraRecords(
  deputadoId: string,
  context: CamaraNormalizationContext
): Promise<{
  records: MfbNormalizedPublicRecord[];
  errors: string[];
}> {
  const records:
    MfbNormalizedPublicRecord[] = [];

  const errors: string[] = [];

  /*
   * PERFIL
   */
  try {
    const response =
      await obterDeputado(
        deputadoId
      );

    if (response?.dados) {
      records.push(
        normalizeDeputadoProfile(
          response.dados,
          context
        )
      );
    }
  } catch (error) {
    errors.push(
      `Perfil: ${errorMessage(
        error
      )}`
    );
  }

  /*
   * HISTÓRICO
   */
  try {
    const response =
      await obterHistoricoDeputado(
        deputadoId
      );

    if (
      Array.isArray(
        response?.dados
      )
    ) {
      records.push(
        ...normalizeHistoricoList(
          response.dados,
          context
        )
      );
    }
  } catch (error) {
    errors.push(
      `Histórico: ${errorMessage(
        error
      )}`
    );
  }

  /*
   * MANDATOS EXTERNOS
   */
  try {
    const response =
      await obterMandatosExternos(
        deputadoId
      );

    if (
      Array.isArray(
        response?.dados
      )
    ) {
      records.push(
        ...normalizeMandatosExternosList(
          response.dados,
          context
        )
      );
    }
  } catch (error) {
    errors.push(
      `Mandatos externos: ${errorMessage(
        error
      )}`
    );
  }

  /*
   * ÓRGÃOS / COMISSÕES
   */
  try {
    const response =
      await obterOrgaosDeputado(
        deputadoId
      );

    if (
      Array.isArray(
        response?.dados
      )
    ) {
      records.push(
        ...normalizeOrgaosList(
          response.dados,
          context
        )
      );
    }
  } catch (error) {
    errors.push(
      `Órgãos: ${errorMessage(
        error
      )}`
    );
  }

  /*
   * PROPOSIÇÕES
   *
   * A API da Câmara permite filtrar proposições por autor.
   * Limitamos a coleta para evitar uma sincronização
   * administrativa excessivamente longa.
   */
  try {
    const proposicoes =
      await buscarTodasProposicoes(
        {
          idDeputadoAutor:
            deputadoId,
          ordem:
            "DESC",
          ordenarPor:
            "id",
        },
        {
          maxPages: 10,
          maxRecords: 500,
        }
      );

    for (const proposicao of proposicoes) {
      try {
        const proposicaoId =
          proposicao?.id;

        if (!proposicaoId) {
          continue;
        }

        const [
          detalheResult,
          autoresResult,
          temasResult,
        ] = await Promise.allSettled([
          obterProposicao(
            proposicaoId
          ),
          obterAutoresProposicao(
            proposicaoId
          ),
          obterTemasProposicao(
            proposicaoId
          ),
        ]);

        const detalhe =
          detalheResult.status ===
          "fulfilled"
            ? detalheResult.value
                ?.dados
            : proposicao;

        const autores =
          autoresResult.status ===
            "fulfilled" &&
          Array.isArray(
            autoresResult.value
              ?.dados
          )
            ? autoresResult.value
                .dados
            : [];

        const temas =
          temasResult.status ===
            "fulfilled" &&
          Array.isArray(
            temasResult.value
              ?.dados
          )
            ? temasResult.value
                .dados
            : [];

        records.push(
          normalizeProposicao(
            detalhe ||
              proposicao,
            {
              authors: autores,
              themes: temas,
            }
          )
        );
      } catch (error) {
        errors.push(
          `Proposição ${String(
            proposicao?.id ||
              "sem-id"
          )}: ${errorMessage(
            error
          )}`
        );
      }
    }
  } catch (error) {
    errors.push(
      `Proposições: ${errorMessage(
        error
      )}`
    );
  }

  /*
   * VOTAÇÕES NOMINAIS
   *
   * A Câmara não fornece, neste cliente, uma consulta
   * direta "votações por deputado". Por isso coletamos
   * votações recentes em janela limitada e, em cada
   * votação, verificamos se há voto nominal do deputado.
   */
  try {
    const votacoes =
      await buscarTodasVotacoes(
        {
          ordem:
            "DESC",
          ordenarPor:
            "dataHoraRegistro",
        },
        {
          maxPages: 10,
          maxRecords: 500,
        }
      );

    for (const votacao of votacoes) {
      try {
        const votacaoRecord =
          votacao as Record<
            string,
            unknown
          >;

        const votacaoId =
          votacaoRecord["id"];

        if (
          votacaoId ===
            undefined ||
          votacaoId === null ||
          votacaoId === ""
        ) {
          continue;
        }

        const votosResponse =
          await obterVotosVotacao(
            String(votacaoId)
          );

        if (
          !Array.isArray(
            votosResponse?.dados
          )
        ) {
          continue;
        }

        const voto =
          findVoteForDeputado(
            votosResponse.dados,
            deputadoId
          );

        if (!voto) {
          continue;
        }

        records.push(
          normalizeVotoNominal(
            votacao,
            voto,
            context
          )
        );
      } catch (error) {
        errors.push(
          `Votação: ${errorMessage(
            error
          )}`
        );
      }
    }
  } catch (error) {
    errors.push(
      `Votações: ${errorMessage(
        error
      )}`
    );
  }

  return {
    records:
      deduplicateRecords(
        records
      ),

    errors,
  };
}

/* ============================================================
   SINCRONIZAÇÃO PRINCIPAL
============================================================ */

export async function syncCamaraCandidate(
  supabase: SupabaseClient,
  options: SyncOptions
): Promise<CamaraSyncResult> {
  if (!options.candidateId) {
    throw new Error(
      "candidateId é obrigatório."
    );
  }

  const provider =
    await getCamaraProvider(
      supabase
    );

  const identity =
    await getExternalIdentity(
      supabase,
      provider.id,
      options
    );

  const deputadoId =
    options.deputadoId
      ? String(
          options.deputadoId
        )
      : identity?.external_id
        ? String(
            identity.external_id
          )
        : null;

  if (!deputadoId) {
    throw new Error(
      "O candidato ainda não possui identificação externa da Câmara."
    );
  }

  const syncRunId =
    await createSyncRun(
      supabase,
      provider.id,
      options.candidateId
    );

  const counters = {
    collected: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  const errorMessages:
    string[] = [];

  try {
    const context:
      CamaraNormalizationContext =
      {
        candidateId:
          options.candidateId,

        deputadoId,

        candidateName:
          options.candidateName ||
          identity?.external_name ||
          undefined,

        stateUf:
          options.stateUf ||
          undefined,
      };

    const collection =
      await collectCamaraRecords(
        deputadoId,
        context
      );

    counters.collected =
      collection.records.length;

    errorMessages.push(
      ...collection.errors
    );

    counters.errors +=
      collection.errors.length;

    for (
      const record of
      collection.records
    ) {
      try {
        const queueResult =
          await queueRecord(
            supabase,
            {
              providerId:
                provider.id,

              syncRunId,

              candidateId:
                options.candidateId,

              externalIdentityId:
                identity?.id ||
                null,

              record,
            }
          );

        mergeResult(
          counters,
          queueResult
        );

        if (
          queueResult.errors >
          0
        ) {
          errorMessages.push(
            `Não foi possível incluir/atualizar: ${record.title}`
          );
        }
      } catch (error) {
        counters.errors += 1;

        errorMessages.push(
          `${record.title}: ${errorMessage(
            error
          )}`
        );
      }
    }

    const finalStatus =
      counters.errors > 0
        ? "completed_with_errors"
        : "completed";

    await finishSyncRun(
      supabase,
      syncRunId,
      finalStatus,
      counters,
      errorMessages
    );

    return {
      success:
        counters.errors === 0,

      syncRunId,

      candidateId:
        options.candidateId,

      deputadoId,

      providerId:
        provider.id,

      ...counters,

      errorMessages,
    };
  } catch (error) {
    counters.errors += 1;

    errorMessages.push(
      errorMessage(error)
    );

    await finishSyncRun(
      supabase,
      syncRunId,
      "failed",
      counters,
      errorMessages
    );

    throw error;
  }
}

/* ============================================================
   EXPORTAÇÃO
============================================================ */

export const camaraSync = {
  candidate:
    syncCamaraCandidate,
};
