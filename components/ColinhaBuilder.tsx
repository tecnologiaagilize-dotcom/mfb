"use client";
import { useEffect, useMemo, useState } from "react";
import { STATES } from "@/lib/states";

type PublicCandidate = { id: string; name: string; ballot_name: string | null; cargo: string; number: string | null; state_uf: string; city_name?: string | null; photo_url?: string | null; slug: string };
const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"]);
const displayName = (person: PublicCandidate) => person.ballot_name && !/^\d+$/.test(person.ballot_name) ? person.ballot_name : person.name;
export function ColinhaBuilder({ candidates, initialState, loadError = false }: { candidates: PublicCandidate[]; initialState?: string; loadError?: boolean }) {
  const [state, setState] = useState(() => STATES.some(s => s.uf === initialState) ? initialState! : candidates.some(c => c.state_uf === "DF") ? "DF" : (candidates.find(c => c.state_uf !== "BR")?.state_uf ?? "DF"));
  const [city, setCity] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);
  const cityOptions = useMemo(() => [...new Set(candidates.filter(c => c.state_uf === state && c.city_name).map(c => c.city_name!))].sort((a,b) => a.localeCompare(b,"pt-BR")), [candidates,state]);
  const available = useMemo(() => candidates.filter(c => c.state_uf === "BR" || (c.state_uf === state && (!c.city_name || c.city_name === city))), [candidates,state,city]);
  const officeRank = (cargo: string) => {
    const value = cargo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (value.includes("president")) return 0;
    if (value.includes("governador")) return 1;
    if (value.includes("senador")) return 2;
    if (value.includes("federal")) return 3;
    if (value.includes("distrital") || value.includes("estadual")) return 4;
    return 5;
  };
  const chosen = available.filter(c => selected.includes(c.id)).sort((a,b) => officeRank(a.cargo)-officeRank(b.cargo));
  const posterRows: PublicCandidate[][] = [];
  for (let index=0; index<chosen.length;) {
    const rank=officeRank(chosen[index].cargo);
    if (rank < 2) { posterRows.push([chosen[index++]]); continue; }
    const first=chosen[index++];
    if (index < chosen.length && officeRank(chosen[index].cargo) === rank) posterRows.push([first,chosen[index++]]);
    else if (index < chosen.length && rank >= 3 && officeRank(chosen[index].cargo) >= 3) posterRows.push([first,chosen[index++]]);
    else posterRows.push([first]);
  }
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
    if (!photo) { setError("Escolha sua foto antes de gerar a colinha."); return; }
    if (!chosen.length) { setError("Selecione pelo menos um candidato para gerar a colinha."); return; }
    setBusy(true); setError("");
    try {
      const canvas = document.createElement("canvas");
      const width=1080, topHeight=390, rowHeight=242, bottomHeight=185;
      canvas.width=width;canvas.height=topHeight+rowHeight*posterRows.length+bottomHeight;
      const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Seu navegador não permitiu gerar a imagem.");
      const background=ctx.createLinearGradient(0,0,width,canvas.height);
      background.addColorStop(0,"#007c4c");background.addColorStop(.3,"#092f71");background.addColorStop(1,"#f6c735");
      ctx.fillStyle=background;ctx.fillRect(0,0,width,canvas.height);
      ctx.fillStyle="#ffd82a";ctx.save();ctx.translate(610,165);ctx.rotate(-.09);ctx.fillRect(-175,-82,660,182);ctx.restore();
      let supporter: HTMLImageElement;
      try { supporter=await loadImage(photo); }
      catch { throw new Error("Não foi possível abrir sua foto. Escolha JPG, PNG ou WebP compatível com seu navegador."); }
      const photoX=22,photoY=30,photoW=350,photoH=338;
      const crop=Math.max(photoW/supporter.width,photoH/supporter.height);
      ctx.save();ctx.beginPath();ctx.roundRect(photoX,photoY,photoW,photoH,18);ctx.clip();
      ctx.drawImage(supporter,photoX+(photoW-supporter.width*crop)/2,photoY+(photoH-supporter.height*crop)/2,supporter.width*crop,supporter.height*crop);ctx.restore();
      ctx.strokeStyle="#fff";ctx.lineWidth=8;ctx.strokeRect(photoX,photoY,photoW,photoH);
      ctx.fillStyle="#082c67";ctx.font="italic 900 100px Arial";ctx.fillText("COLINHA",385,170,645);
      ctx.font="bold 38px Arial";ctx.fillText("MINHA ESCOLHA",404,224,595);
      ctx.fillStyle="#fff";ctx.font="bold 24px Arial";ctx.fillText(`${city ? city + " · " : ""}${state} · Movimento Família Brasileira`,410,318,625);
      let top=topHeight;
      const colors=["#0a397b","#2383cc","#06347d","#007a47","#542894"];
      for(const [rowIndex,row] of posterRows.entries()){
        const gap=8,boxW=(width-32-gap*(row.length-1))/row.length;
        for(const [column,person] of row.entries()){
          const x=16+column*(boxW+gap),y=top+rowIndex*rowHeight,w=boxW,h=rowHeight-8;
          ctx.fillStyle=colors[rowIndex%colors.length];ctx.beginPath();ctx.roundRect(x,y,w,h,16);ctx.fill();
          ctx.strokeStyle="#fff";ctx.lineWidth=4;ctx.stroke();
          const portraitWidth=row.length===1?270:185;
          if(person.photo_url){
            try {const portrait=await loadImage(person.photo_url);const ratio=Math.max(portraitWidth/portrait.width,(h-10)/portrait.height);
              ctx.save();ctx.beginPath();ctx.roundRect(x+5,y+5,portraitWidth,h-10,12);ctx.clip();
              ctx.drawImage(portrait,x+5+(portraitWidth-portrait.width*ratio)/2,y+5+(h-10-portrait.height*ratio)/2,portrait.width*ratio,portrait.height*ratio);ctx.restore();
            }catch{/* Keep a readable card when a photo host disallows browser drawing. */}
          }
          const tx=x+portraitWidth+23,availableWidth=w-portraitWidth-42;
          ctx.fillStyle="#fff";ctx.font=`bold ${row.length===1?35:25}px Arial`;ctx.fillText(person.cargo.toUpperCase(),tx,y+52,availableWidth);
          ctx.fillStyle="#ffe22c";ctx.font=`900 ${row.length===1?128:86}px Arial`;ctx.fillText(person.number||"—",tx,y+154,availableWidth);
          ctx.fillStyle="#fff";ctx.font=`bold ${row.length===1?43:28}px Arial`;ctx.fillText(displayName(person).toUpperCase(),tx,y+204,availableWidth);
        }
      }
      const footerY=top+posterRows.length*rowHeight;
      ctx.fillStyle="#ffe22c";ctx.save();ctx.translate(25,footerY+20);ctx.rotate(-.025);ctx.fillRect(0,0,width-50,107);ctx.restore();
      ctx.fillStyle="#0c306f";ctx.font="italic bold 54px Arial";ctx.fillText("Minha colinha",75,footerY+94);
      ctx.fillStyle="#fff";ctx.font="22px Arial";ctx.fillText("Confira os dados de cada candidatura antes de compartilhar.",44,canvas.height-25);
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
      <label>Sua foto para o topo do cartaz<input type="file" accept="image/*" onChange={event=>upload(event.target.files?.[0])} /></label>
      {photo && <button type="button" className="btn btn-secondary" onClick={()=>setPhoto(null)}>Remover foto</button>}
      {!photo && <p className="colinha-photo-hint">A prévia mostrará sua foto aqui. O arquivo só será gerado depois que ela aparecer.</p>}
      <h2>Escolha os candidatos</h2>
      {loadError ? <p role="alert" className="colinha-error">Não foi possível carregar a lista de candidatos. Tente novamente mais tarde.</p>
        : available.length===0 && <p>Não há candidatos publicados para esta localidade.</p>}
      <div className="colinha-options">{available.map(person=><label key={person.id} className="colinha-option"><input type="checkbox" checked={selected.includes(person.id)} onChange={()=>choose(person.id)} /><span><strong>{displayName(person)}</strong><small>{person.cargo} · {person.number || "Número não informado"}</small></span></label>)}</div>
      <button className="btn btn-primary" type="button" disabled={busy || !chosen.length || !photo} onClick={makeImage}>{busy?"Gerando…":"Compartilhar ou baixar PNG"}</button>
      {error && <p role="alert" className="colinha-error">{error}</p>}
    </section>
    <section className="colinha-preview colinha-poster" aria-label="Prévia da colinha"><div className="colinha-preview-top">
      {photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo} alt="Sua foto" onError={()=>setError("Sua foto não pôde ser exibida. Escolha JPG, PNG ou WebP.")} /> : <div className="colinha-photo-placeholder">Sua foto aqui</div>}
      <div className="colinha-poster-heading"><h2>COLINHA</h2><strong>MINHA ESCOLHA</strong><p>{city ? `${city} · ` : ""}{state} · MFB</p></div>
    </div><div className="colinha-preview-list">{chosen.length?posterRows.map((row,index)=><div key={index} className={`colinha-poster-row colinha-poster-row-${index % 5}`}>{row.map(person=><div key={person.id} className="colinha-preview-row">{person.photo_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={person.photo_url} alt="" loading="lazy" />}<div className="colinha-poster-text"><small>{person.cargo}</small><b>{person.number||"—"}</b><strong>{displayName(person)}</strong></div></div>)}</div>):<p>Escolha candidatos para ver o cartaz.</p>}</div><footer><strong>Minha colinha</strong><small>Confira os dados dos candidatos antes de compartilhar.</small></footer></section></div>
  </>;
}
