"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { STATES } from "@/lib/states";

export default function CandidateForm({ initial }: { initial?: any }) {
  const router = useRouter();
  const [form,setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    state_uf: initial?.state_uf ?? "DF",
    cargo: initial?.cargo ?? "Deputado Federal",
    party: initial?.party ?? "",
    number: initial?.number ?? "",
    photo_url: initial?.photo_url ?? "",
    biography: initial?.biography ?? "",
    proposals: initial?.proposals ?? "",
    instagram_url: initial?.instagram_url ?? "",
    facebook_url: initial?.facebook_url ?? "",
    youtube_url: initial?.youtube_url ?? "",
    website_url: initial?.website_url ?? "",
    status: initial?.status ?? "draft"
  });
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");

  const set = (key:string, value:string) => setForm(f=>({...f,[key]:value}));

  async function save(e:React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const supabase = createClient();
    const payload = {...form, slug: form.slug || form.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")};
    const result = initial
      ? await supabase.from("candidates").update(payload).eq("id",initial.id)
      : await supabase.from("candidates").insert(payload);
    if (result.error) { setError(result.error.message); setSaving(false); return; }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="card" style={{padding:26}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        {[
          ["name","Nome completo"],["slug","Slug da URL"],["party","Partido"],["number","Número"],["photo_url","URL da foto"],["instagram_url","Instagram"],["facebook_url","Facebook"],["youtube_url","YouTube"],["website_url","Site"]
        ].map(([key,label])=>(
          <label key={key} style={{display:"block"}}>
            <span style={{display:"block",fontWeight:700,marginBottom:7}}>{label}</span>
            <input className="field" value={(form as any)[key]} onChange={e=>set(key,e.target.value)} />
          </label>
        ))}
        <label><span style={{display:"block",fontWeight:700,marginBottom:7}}>Estado</span>
          <select className="field" value={form.state_uf} onChange={e=>set("state_uf",e.target.value)}>
            {STATES.map(s=><option key={s.uf} value={s.uf}>{s.uf} — {s.name}</option>)}
          </select>
        </label>
        <label><span style={{display:"block",fontWeight:700,marginBottom:7}}>Cargo</span>
          <select className="field" value={form.cargo} onChange={e=>set("cargo",e.target.value)}>
            <option>Governador</option><option>Senador</option><option>Deputado Federal</option><option>Deputado Estadual</option><option>Deputado Distrital</option>
          </select>
        </label>
        <label><span style={{display:"block",fontWeight:700,marginBottom:7}}>Status</span>
          <select className="field" value={form.status} onChange={e=>set("status",e.target.value)}>
            <option value="draft">Rascunho</option><option value="published">Publicado</option>
          </select>
        </label>
      </div>

      <label style={{display:"block",marginTop:18}}><span style={{display:"block",fontWeight:700,marginBottom:7}}>Biografia</span><textarea className="field" rows={6} value={form.biography} onChange={e=>set("biography",e.target.value)} /></label>
      <label style={{display:"block",marginTop:18}}><span style={{display:"block",fontWeight:700,marginBottom:7}}>Propostas / informações</span><textarea className="field" rows={8} value={form.proposals} onChange={e=>set("proposals",e.target.value)} /></label>

      {error && <div style={{color:"#b42318",background:"#fef3f2",padding:12,borderRadius:8,marginTop:18}}>{error}</div>}
      <div style={{display:"flex",gap:10,marginTop:22}}>
        <button className="btn btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar candidato"}</button>
        <button type="button" className="btn btn-secondary" onClick={()=>router.back()}>Cancelar</button>
      </div>
    </form>
  );
}
