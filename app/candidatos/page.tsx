import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CandidateCard } from "@/components/CandidateCard";
import { BrazilMap } from "@/components/BrazilMap";
import { STATES } from "@/lib/states";

export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("candidates_public")
    .select("*")
    .eq("status", "published")
    .order("state_uf")
    .order("cargo")
    .order("name");

  const candidates = data ?? [];
  const counts = candidates.reduce((acc: Record<string,number>, c: any) => {
    acc[c.state_uf] = (acc[c.state_uf] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <Header />
      <main>
        <section className="section" style={{background:"#fff"}}>
          <div className="container">
            <span className="badge">ELEIÇÕES 2026</span>
            <h1 style={{fontSize:"clamp(38px,6vw,62px)",margin:"12px 0"}}>Candidatos indicados pelo MFB</h1>
            <p style={{fontSize:18,color:"#667085",maxWidth:760,lineHeight:1.7}}>
              Consulte a distribuição por Estado e acesse o perfil de cada candidato cadastrado na plataforma.
            </p>

            <div className="card" style={{marginTop:30,padding:18}}>
              <h2 style={{fontSize:24,margin:"6px 8px"}}>Mapa do Brasil</h2>
              <p style={{color:"#667085",margin:"0 8px 12px"}}>Clique em um Estado para consultar os candidatos.</p>
              <BrazilMap
              counts={counts}
               candidates={candidates}
            />
            </div>

            <div style={{marginTop:42}}>
              <h2 style={{fontSize:30}}>Estados</h2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginTop:18}}>
                {STATES.map(s => (
                  <a className="card" style={{padding:16,color:"#172033"}} href={`/estado/${s.uf}`} key={s.uf}>
                    <strong>{s.uf}</strong> — {s.name}
                    <div style={{fontSize:13,color:"#667085",marginTop:5}}>{counts[s.uf] ?? 0} candidato(s)</div>
                  </a>
                ))}
              </div>
            </div>

            <div style={{marginTop:54}}>
              <h2 style={{fontSize:30}}>Todos os candidatos publicados</h2>
              {candidates.length === 0 ? (
                <div className="card" style={{padding:24,marginTop:18,color:"#667085"}}>
                  Nenhum candidato publicado ainda. Cadastre os candidatos pelo painel administrativo.
                </div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:20,marginTop:20}}>
                  {candidates.map((c: any) => <CandidateCard candidate={c} key={c.id} />)}
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
