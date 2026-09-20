import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CandidateForm from "@/components/admin/CandidateForm";
import CandidateOffices from "@/components/admin/CandidateOffices";
import CandidateSources from "@/components/admin/CandidateSources";

export const dynamic = "force-dynamic";

export default async function EditCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: candidate } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!candidate) {
    return notFound();
  }

  return (
    <main className="section">
      <div
        className="container"
        style={{
          maxWidth: 1000,
        }}
      >
        <div style={{ marginBottom: 25 }}>
          <div
            style={{
              fontSize: 14,
              color: "#667085",
              marginBottom: 6,
            }}
          >
            Central Administrativa / Apoiados
          </div>

          <h1
            style={{
              fontSize: 42,
              margin: 0,
            }}
          >
            Editar candidato
          </h1>

          <p
            style={{
              color: "#667085",
              marginTop: 8,
            }}
          >
            {candidate.ballot_name || candidate.name}
            {candidate.party ? ` • ${candidate.party}` : ""}
            {candidate.number ? ` • ${candidate.number}` : ""}
          </p>
        </div>

        {/* =====================================================
            DADOS PRINCIPAIS
        ===================================================== */}

        <CandidateForm initial={candidate} />

        {/* =====================================================
            COMITÊS E PONTOS DE APOIO
        ===================================================== */}

        <CandidateOffices candidateId={candidate.id} />

        {/* =====================================================
            FONTES, REDES E CANAIS OFICIAIS
        ===================================================== */}

        <CandidateSources candidateId={candidate.id} />
      </div>
    </main>
  );
}
