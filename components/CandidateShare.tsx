"use client";

import { useState } from "react";

type Props = { slug: string; name: string };

export function CandidateShare({ slug, name }: Props) {
  const [copied, setCopied] = useState(false);
  const [imageStatus, setImageStatus] = useState("");
  const [sharingImage, setSharingImage] = useState(false);
  const path = `/candidato/${encodeURIComponent(slug)}`;
  const caption = `Conheça o perfil de ${name}, candidato(a) indicado(a) pelo Movimento Família Brasileira:`;

  function shareUrl() {
    const url = new URL(path, window.location.origin);
    url.searchParams.set("mfb", "4");
    return url.toString();
  }

  async function shareOther() {
    const url = shareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} | MFB`, text: caption, url });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      window.prompt("Copie o link do perfil:", url);
    }
  }

  function shareWhatsApp() {
    const message = `${caption} ${shareUrl()}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function shareImage() {
    if (sharingImage) return;
    setSharingImage(true);
    setImageStatus("");
    try {
      const imageUrl = new URL(`${path}/opengraph-image?mfb=4`, window.location.origin);
      const response = await fetch(imageUrl);
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
        throw new Error("A imagem do candidato ainda não está disponível.");
      }
      const file = new File([await response.blob()], `mfb-${slug}.png`, { type: "image/png" });
      const text = `Conheça o perfil de ${name}, indicado(a) pelo Movimento Família Brasileira: ${shareUrl()}`;

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text, title: `${name} | MFB` });
        } catch (error) {
          if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
        }
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const download = document.createElement("a");
      download.href = objectUrl;
      download.download = file.name;
      document.body.append(download);
      download.click();
      download.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setImageStatus("Imagem baixada. Anexe o arquivo à mensagem no WhatsApp.");
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    } catch (error) {
      setImageStatus(error instanceof Error ? error.message : "Não foi possível preparar a imagem.");
    } finally {
      setSharingImage(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
      <button type="button" className="btn btn-secondary" onClick={shareWhatsApp} style={{ flex: 1, minWidth: 110 }}>
        WhatsApp
      </button>
      <button type="button" className="btn btn-secondary" onClick={() => void shareOther()} style={{ flex: 1, minWidth: 110 }}>
        {copied ? "Link copiado" : "Outras mídias"}
      </button>
      <button type="button" className="btn btn-secondary" disabled={sharingImage} onClick={() => void shareImage()} style={{ flex: 1, minWidth: 110 }}>
        {sharingImage ? "Preparando imagem…" : "Enviar imagem"}
      </button>
      {imageStatus && <small role="status" style={{ width: "100%" }}>{imageStatus}</small>}
    </div>
  );
}
