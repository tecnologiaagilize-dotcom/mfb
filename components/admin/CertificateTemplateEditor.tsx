"use client";
import { useState } from "react";
import { CandidateCertificate } from "@/components/CandidateCertificate";
import { CertificateTemplate, defaultCertificateTemplate, normalizeCertificateTemplate } from "@/lib/candidates/certificate-template";

type Sample = { name: string; ballot_name?: string | null; cargo?: string | null; party?: string | null; number?: string | null; photo_url?: string | null; photo_position_x?: number | null; photo_position_y?: number | null; photo_zoom?: number | null; endorsement_reason?: string | null; endorsement_issued_at?: string | null; state_uf?: string | null };
export function CertificateTemplateEditor({ initial, sample }: { initial: CertificateTemplate; sample: Sample }) {
  const [template, setTemplate] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  function update<K extends keyof CertificateTemplate>(key: K, value: CertificateTemplate[K]) { setTemplate(current => ({ ...current, [key]: value })); setMessage(""); }
  const text = (key: keyof CertificateTemplate, label: string, multiline = false) => <label key={key}>{label}{multiline
    ? <textarea rows={key === "fallbackReason" ? 5 : 3} value={String(template[key])} onChange={event => update(key, event.target.value as never)} />
    : <input value={String(template[key])} onChange={event => update(key, event.target.value as never)} />}</label>;
  const color = (key: keyof CertificateTemplate, label: string) => <label key={key}>{label}<input type="color" value={String(template[key])} onChange={event => update(key, event.target.value as never)} /></label>;
  const number = (key: keyof CertificateTemplate, label: string, min: number, max: number) => <label key={key}>{label} ({String(template[key])}{key === "photoPercent" ? "%" : "px"})<input type="range" min={min} max={max} value={Number(template[key])} onChange={event => update(key, Number(event.target.value) as never)} /></label>;
  async function save() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/certificate-template", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(template) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao salvar.");
      setTemplate(normalizeCertificateTemplate(result.config)); setError(false); setMessage("Modelo salvo. A alteração já se aplica a todos os perfis publicados.");
    } catch (cause) { setError(true); setMessage(cause instanceof Error ? cause.message : "Falha ao salvar."); }
    finally { setBusy(false); }
  }
  return <div className="certificate-editor">
    <div className="admin-panel certificate-editor-controls">
      <p>As alterações abaixo aparecem na prévia. Clique em salvar para publicar o modelo em todos os perfis.</p>
      <fieldset><legend>Identidade e textos</legend>
        {text("brandText", "Nome do movimento")}{text("title", "Título do certificado")}{text("kicker", "Texto acima do nome")}
        {text("endorsementHeading", "Título do apoio — use {nome} para o nome do candidato")}
        {text("fallbackReason", "Justificativa padrão, aplicada quando o candidato não tiver texto próprio", true)}
        {text("disclosure", "Nota institucional", true)}{text("datePrefix", "Local da emissão")}
      </fieldset>
      <fieldset><legend>Responsáveis</legend>{text("signerOne", "Primeiro nome")}{text("signerOneRole", "Primeiro cargo")}{text("signerTwo", "Segundo nome")}{text("signerTwoRole", "Segundo cargo")}</fieldset>
      <fieldset><legend>Imagens e posições</legend>{text("logoUrl", "Endereço da logomarca")}{text("sealUrl", "Endereço do selo")}
        <label>Lado da foto<select value={template.photoSide} onChange={event => update("photoSide", event.target.value as CertificateTemplate["photoSide"])}><option value="left">Esquerda</option><option value="right">Direita</option></select></label>
        <label>Lado do selo<select value={template.sealSide} onChange={event => update("sealSide", event.target.value as CertificateTemplate["sealSide"])}><option value="left">Esquerda</option><option value="right">Direita</option></select></label>
        <label>Ordem do texto<select value={template.contentOrder} onChange={event => update("contentOrder", event.target.value as CertificateTemplate["contentOrder"])}><option value="identity-first">Candidato, depois apoio</option><option value="reason-first">Apoio, depois candidato</option></select></label>
        {number("photoPercent", "Largura da foto", 22, 48)}{number("logoSize", "Tamanho da logomarca", 36, 100)}{number("sealSize", "Tamanho do selo", 70, 210)}
      </fieldset>
      <fieldset><legend>Tipografia e cores</legend><label>Família da fonte<select value={template.fontFamily} onChange={event => update("fontFamily", event.target.value as CertificateTemplate["fontFamily"])}><option value="serif">Clássica</option><option value="sans">Sem serifa</option></select></label>
        {number("nameSize", "Tamanho do nome", 30, 90)}{number("bodySize", "Tamanho do texto de apoio", 14, 28)}
        {color("paperColor", "Fundo")}{color("borderColor", "Moldura")}{color("primaryColor", "Destaque")}{color("textColor", "Texto")}
      </fieldset>
      <div className="certificate-editor-actions"><button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? "Salvando…" : "Salvar e aplicar a todos"}</button><button className="btn" type="button" onClick={() => { setTemplate({ ...defaultCertificateTemplate }); setMessage("Prévia restaurada. Salve para aplicar."); }}>Restaurar modelo padrão</button></div>
      {message && <p role="status" className={`certificate-editor-message ${error ? "error" : ""}`}>{message}</p>}
    </div>
    <div className="certificate-editor-preview"><h2>Prévia: {sample.ballot_name || sample.name}</h2><CandidateCertificate template={normalizeCertificateTemplate(template)} candidate={sample} publicName={sample.ballot_name || sample.name} territory={sample.state_uf || "DF"} /></div>
  </div>;
}
