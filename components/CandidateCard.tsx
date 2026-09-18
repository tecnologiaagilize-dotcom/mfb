import Link from "next/link";
import type { Candidate } from "@/lib/types";

export function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <article className="card" style={{overflow:"hidden"}}>
      <div style={{height:170,background:"linear-gradient(135deg,#e9f7ef,#eef2ff)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {candidate.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={candidate.photo_url} alt={candidate.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
        ) : (
          <div style={{fontSize:48,fontWeight:900,color:"#009b5b"}}>{candidate.name.charAt(0)}</div>
        )}
      </div>
      <div style={{padding:20}}>
        <span className="badge">{candidate.cargo}</span>
        <h3 style={{fontSize:21,margin:"10px 0 4px"}}>{candidate.name}</h3>
        <div style={{color:"#667085",fontSize:14}}>
          {candidate.state_uf}{candidate.party ? ` · ${candidate.party}` : ""}{candidate.number ? ` · Nº ${candidate.number}` : ""}
        </div>
        <Link href={`/candidato/${candidate.slug}`} className="btn btn-primary" style={{marginTop:16,width:"100%"}}>
          Ver perfil
        </Link>
      </div>
    </article>
  );
}
