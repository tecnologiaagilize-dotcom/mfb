import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CandidatePage({ params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("candidates_public")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) return notFound();

  return (
    <>
      <Header />
      <main className="section">
        <div className="container" style={{maxWidth:950}}>
          <div className="card" style={{padding:28}}>
            <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:30,alignItems:"start"}}>
              <div style={{height:330,borderRadius:14,overflow:"hidden",background:"#edf8f2",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {data.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.photo_url} alt={data.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                ) : <div style={{fontSize:80,fontWeight:900,color:"#009b5b"}}>{data.name.charAt(0)}</div>}
              </div>
              <div>
                <span className="badge">{data.cargo}</span>
                <h1 style={{fontSize:"clamp(34px,5vw,54px)",margin:"12px 0 8px"}}>{data.name}</h1>
                <p style={{color:"#667085",fontSize:17}}>{data.state_uf} · {data.state_name}{data.party ? ` · ${data.party}` : ""}{data.number ? ` · Nº ${data.number}` : ""}</p>

                {data.biography && <section style={{marginTop:28}}><h2>Biografia</h2><p style={{lineHeight:1.8,color:"#475467",whiteSpace:"pre-wrap"}}>{data.biography}</p></section>}
                {data.proposals && <section style={{marginTop:28}}><h2>Propostas e informações</h2><p style={{lineHeight:1.8,color:"#475467",whiteSpace:"pre-wrap"}}>{data.proposals}</p></section>}

                <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:24}}>
                  {data.instagram_url && <a className="btn btn-secondary" href={data.instagram_url} target="_blank" rel="noreferrer">Instagram</a>}
                  {data.facebook_url && <a className="btn btn-secondary" href={data.facebook_url} target="_blank" rel="noreferrer">Facebook</a>}
                  {data.youtube_url && <a className="btn btn-secondary" href={data.youtube_url} target="_blank" rel="noreferrer">YouTube</a>}
                  {data.website_url && <a className="btn btn-primary" href={data.website_url} target="_blank" rel="noreferrer">Site</a>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
