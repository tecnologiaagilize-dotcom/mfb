export type CertificateTemplate = {
  brandText: string; title: string; kicker: string; endorsementHeading: string;
  fallbackReason: string; disclosure: string; datePrefix: string;
  signerOne: string; signerOneRole: string; signerTwo: string; signerTwoRole: string;
  logoUrl: string; sealUrl: string; photoSide: "left" | "right";
  sealSide: "left" | "right"; contentOrder: "identity-first" | "reason-first";
  fontFamily: "serif" | "sans"; paperColor: string; borderColor: string;
  primaryColor: string; textColor: string; nameSize: number; bodySize: number;
  photoPercent: number; logoSize: number; sealSize: number;
};
export const defaultCertificateTemplate: CertificateTemplate = {
  brandText: "MOVIMENTO FAMÍLIA BRASILEIRA", title: "Certificado de apoio",
  kicker: "Certificado de apoio à candidatura", endorsementHeading: "Por que apoiamos {nome}?",
  fallbackReason: "O Movimento Família Brasileira apoia esta candidatura por identificar afinidade com princípios que orientam sua atuação: valorização da família, proteção de crianças e adolescentes, liberdade de crença e responsabilidade na vida pública.",
  disclosure: "Manifestação institucional de apoio do MFB. A trajetória, as propostas e as fontes estão nas seções deste perfil.",
  datePrefix: "Brasília", signerOne: "Helen Pontes", signerOneRole: "Presidente · MFB",
  signerTwo: "Paulo Rocha", signerTwoRole: "Coordenador · MFB",
  logoUrl: "/logo-mfb.png", sealUrl: "/selo-aprovacao-mfb.svg",
  photoSide: "left", sealSide: "left", contentOrder: "identity-first", fontFamily: "serif",
  paperColor: "#fffcf6", borderColor: "#ba8e47", primaryColor: "#14563d", textColor: "#202922",
  nameSize: 68, bodySize: 19, photoPercent: 32, logoSize: 64, sealSize: 135,
};
export function normalizeCertificateTemplate(input: unknown): CertificateTemplate {
  const data = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const result = { ...defaultCertificateTemplate };
  const strings = ["brandText", "title", "kicker", "endorsementHeading", "fallbackReason", "disclosure", "datePrefix", "signerOne", "signerOneRole", "signerTwo", "signerTwoRole"] as const;
  for (const key of strings) if (typeof data[key] === "string") result[key] = data[key].trim().slice(0, key === "fallbackReason" ? 1800 : 350) || defaultCertificateTemplate[key];
  const colors = ["paperColor", "borderColor", "primaryColor", "textColor"] as const;
  for (const key of colors) if (typeof data[key] === "string" && /^#[0-9a-fA-F]{6}$/.test(data[key])) result[key] = data[key];
  const sizes = { nameSize: [30, 90], bodySize: [14, 28], photoPercent: [22, 48], logoSize: [36, 100], sealSize: [70, 210] } as const;
  for (const key of Object.keys(sizes) as (keyof typeof sizes)[]) {
    const n = Number(data[key]); if (data[key] !== undefined && Number.isFinite(n)) result[key] = Math.max(sizes[key][0], Math.min(sizes[key][1], Math.round(n)));
  }
  for (const key of ["logoUrl", "sealUrl"] as const) if (typeof data[key] === "string") {
    const url = data[key].trim();
    if ((url.startsWith("/") && !url.startsWith("//")) || /^https:\/\/[^\s]+$/i.test(url)) result[key] = url.slice(0, 1000);
  }
  if (data.photoSide === "right") result.photoSide = "right";
  if (data.sealSide === "right") result.sealSide = "right";
  if (data.contentOrder === "reason-first") result.contentOrder = "reason-first";
  if (data.fontFamily === "sans") result.fontFamily = "sans";
  return result;
}
