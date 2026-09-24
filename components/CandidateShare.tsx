"use client";

import { useState } from "react";

type Props = { slug: string; name: string };

export function CandidateShare({ slug, name }: Props) {
  const [copied, setCopied] = useState(false);
  const path = `/candidato/${encodeURIComponent(slug)}`;
  const caption = `Conheça o perfil de ${name}, candidato(a) indicado(a) pelo Movimento Família Brasileira:`;

  function shareUrl() {
    const url = new URL(path, window.location.origin);
    url.searchParams.set("mfb", "2");
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

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
      <button type="button" className="btn btn-secondary" onClick={shareWhatsApp} style={{ flex: 1, minWidth: 110 }}>
        WhatsApp
      </button>
      <button type="button" className="btn btn-secondary" onClick={() => void shareOther()} style={{ flex: 1, minWidth: 110 }}>
        {copied ? "Link copiado" : "Outras mídias"}
      </button>
    </div>
  );
}
