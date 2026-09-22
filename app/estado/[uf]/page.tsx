import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { CandidateCard } from "@/components/CandidateCard";
import { stateName } from "@/lib/states";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StatePage({ params }: { params: Promise<{uf:string}> }) {
  const { uf } = await params;
  const upper = uf.toUpperCase();
  const name = stateName(upper);
  if (name === upper) return notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("candidates_public")
    .select("*")
    .eq("state_uf", upper)
    .eq("status", "published")
    .order("cargo")
    .order("name");

  const candidates = data ?? [];

  return (
    <>
      <Header />
      <main className="section">
        <div className="container">
          <span className="badge">{upper}</span>
          <h1 style={{fontSize:"clamp(40px,6vw,62px)",margin:"12px 0"}}>{name}</h1>
          <p style={{fontSize:18,color:"#667085"}}>Candidatos indicados pelo Movimento Família Brasileira — Eleições 2026.</p>

          {candidates.length === 0 ? (
            <div className="card" style={{padding:26,marginTop:30}}>
              <strong>Nenhum candidato publicado neste Estado.</strong>
              <p style={{color:"#667085"}}>A lista poderá ser atualizada pelo painel administrativo.</p>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:20,marginTop:30}}>
              {candidates.map((c:any) => <CandidateCard candidate={c} key={c.id} />)}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
