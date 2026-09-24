"use client";
import { useEffect, useMemo, useState } from "react";
import { STATES } from "@/lib/states";

type PublicCandidate = { id: string; name: string; ballot_name: string | null; cargo: string; number: string | null; state_uf: string; city_name?: string | null; photo_url?: string | null; slug: string };
const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const displayName = (person: PublicCandidate) => person.ballot_name && !/^\d+$/.test(person.ballot_name) ? person.ballot_name : person.name;
export function ColinhaBuilder({ candidates, loadError = false }: { candidates: PublicCandidate[]; loadError?: boolean }) {
  const [state, setState] = useState(() => candidates.some(c => c.state_uf === "DF") ? "DF" : (candidates.find(c => c.state_uf !== "BR")?.state_uf ?? "DF"));
  const [city, setCity] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);
  const cityOptions = useMemo(() => [...new Set(candidates.filter(c => c.state_uf === state && c.city_name).map(c => c.city_name!))].sort((a,b) => a.localeCompare(b,"pt-BR")), [candidates,state]);
  const available = useMemo(() => candidates.filter(c => c.state_uf === "BR" || (c.state_uf === state && (!c.city_name || c.city_name === city))), [candidates,state,city]);
  const chosen = available.filter(c => selected.includes(c.id));
  function choose(id: string) { setSelected(old => old.includes(id) ? old.filter(value => value !== id) : [...old,id]); }
  function upload(file?: File) {
    if (!file) return;
    if (!allowedTypes.has(file.type) || file.size > 5_000_000) { setError("Use JPG, PNG ou WebP com até 5 MB."); return; }
    setError(""); setPhoto(URL.createObjectURL(file));
  }
  async function loadImage(url: string) {
    const image = new Image(); image.crossOrigin = "anonymous"; image.src = url;
    await image.decode(); return image;
  }
  async function makeImage() {
    if (!chosen.length) { setError("Selecione pelo menos um candidato para gerar a colinha."); return; }
    setBusy(true); setError("");
    try {
      const canvas = document.createElement("canvas"); const width = 1080;
      const rowHeight = 170; canvas.width = width; canvas.height = 470 + rowHeight * Math.ceil(chosen.length / 2) + 110;
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Seu navegador não permitiu gerar a imagem.");
      ctx.fillStyle = "#f7faf7"; ctx.fillRect(0,0,width,canvas.height);
      ctx.fillStyle = "#075b3b"; ctx.fillRect(0,0,width,350);
      if (photo) {
        const img = new Image(); img.src = photo; await img.decode();
        const x=45,y=65,w=235,h=235,ratio=Math.max(w/img.width,h/img.height);
        ctx.save(); ctx.beginPath(); ctx.roundRect(x,y,w,h,20); ctx.clip();
        ctx.drawImage(img,x+(w-img.width*ratio)/2,y+(h-img.height*ratio)/2,img.width*ratio,img.height*ratio); ctx.restore();
      }
      ctx.fillStyle="#fff"; ctx.font="bold 52px Arial"; ctx.fillText("MINHA COLINHA",photo?315:62,145);
      ctx.font="30px Arial"; ctx.fillText(`Candidaturas publicadas · ${city ? city + " · " : ""}${state}`,photo?315:62,205);
      ctx.font="24px Arial"; ctx.fillText("Movimento Família Brasileira",photo?315:62,255);
      ctx.fillStyle="#172033"; ctx.font="bold 37px Arial"; ctx.fillText("Meus candidatos",55,425);
      for (const [index,person] of chosen.entries()) {
        const x=45+(index%2)*505, y=455+Math.floor(index/2)*rowHeight;
        ctx.fillStyle="#fff";ctx.beginPath();ctx.roundRect(x,y,485,150,14);ctx.fill();
        if (person.photo_url) {
          try {
            const img=await loadImage(person.photo_url);ctx.save();ctx.beginPath();ctx.roundRect(x+7,y+7,120,136,10);ctx.clip();
            const ratio=Math.max(120/img.width,136/img.height);
            ctx.drawImage(img,x+7+(120-img.width*ratio)/2,y+7+(136-img.height*ratio)/2,img.width*ratio,img.height*ratio);ctx.restore();
          } catch { /* If a source blocks canvas access, keep the card readable. */ }
        }
        ctx.fillStyle="#075b3b";ctx.font="bold 44px Arial";ctx.fillText(person.number || "—",x+142,y+63,315);
        ctx.fillStyle="#172033";ctx.font="bold 25px Arial";ctx.fillText(displayName(person),x+142,y+99,320);
        ctx.fillStyle="#526058";ctx.font="19px Arial";ctx.fillText(person.cargo,x+142,y+127,320);
      }
      ctx.fillStyle="#526058"; ctx.font="23px Arial";ctx.fillText("Confira os dados no perfil de cada candidato antes de compartilhar.",55,canvas.height-60);
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("Não foi possível exportar a imagem.")),"image/png"));
      const file=new File([blob],"minha-colinha-mfb.png",{type:"image/png"});
      if (navigator.canShare?.({ files:[file] }) && navigator.share) {
        try { await navigator.share({files:[file],title:"Minha colinha"}); return; }
        catch (cause) { if (cause instanceof DOMException && cause.name === "AbortError") return; }
      }
      const url=URL.createObjectURL(blob);const anchor=document.createElement("a");anchor.href=url;anchor.download=file.name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível gerar a colinha."); }
    finally { setBusy(false); }
  }
  return <>
    <header className="colinha-heading"><span className="badge">PERSONALIZE</span><h1>Minha colinha</h1><p>Escolha sua localidade e os candidatos que deseja incluir. Sua foto fica neste aparelho durante a edição e entra somente na imagem que você gerar.</p></header>
    <div className="colinha-grid"><section className="card colinha-controls" aria-label="Configuração da colinha">
      <label>Estado<select value={state} onChange={event=>{setState(event.target.value);setCity("");setSelected([]);}}>{STATES.map(item=><option value={item.uf} key={item.uf}>{item.name}</option>)}</select></label>
      {cityOptions.length>0 && <label>Município<select value={city} onChange={event=>{setCity(event.target.value);setSelected([]);}}><option value="">Selecione para ver candidaturas municipais</option>{cityOptions.map(value=><option key={value} value={value}>{value}</option>)}</select></label>}
      <label>Sua foto (opcional)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>upload(event.target.files?.[0])} /></label>
      {photo && <button type="button" className="btn btn-secondary" onClick={()=>setPhoto(null)}>Remover foto</button>}
      <h2>Escolha os candidatos</h2>
      {loadError ? <p role="alert" className="colinha-error">Não foi possível carregar a lista de candidatos. Tente novamente mais tarde.</p>
        : available.length===0 && <p>Não há candidatos publicados para esta localidade.</p>}
      <div className="colinha-options">{available.map(person=><label key={person.id} className="colinha-option"><input type="checkbox" checked={selected.includes(person.id)} onChange={()=>choose(person.id)} /><span><strong>{displayName(person)}</strong><small>{person.cargo} · {person.number || "Número não informado"}</small></span></label>)}</div>
      <button className="btn btn-primary" type="button" disabled={busy || !chosen.length} onClick={makeImage}>{busy?"Gerando…":"Compartilhar ou baixar PNG"}</button>
      {error && <p role="alert" className="colinha-error">{error}</p>}
    </section>
    <section className="colinha-preview" aria-label="Prévia da colinha"><div className="colinha-preview-top">
      {photo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo} alt="Sua foto" />}
      <div><small>Movimento Família Brasileira</small><h2>Minha colinha</h2><p>{city ? `${city} · ` : ""}{state}</p></div>
    </div><div className="colinha-preview-list"><h3>Meus candidatos</h3>{chosen.length?chosen.map(person=><div key={person.id} className="colinha-preview-row">{person.photo_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={person.photo_url} alt="" loading="lazy" />}<b>{person.number||"—"}</b><span><strong>{displayName(person)}</strong><small>{person.cargo}</small></span></div>):<p>Selecione os candidatos para ver a prévia.</p>}</div><footer>Confira os dados no perfil de cada candidato antes de compartilhar.</footer></section></div>
  </>;
}
