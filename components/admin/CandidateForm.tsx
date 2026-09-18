"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { STATES } from "@/lib/states";

export default function CandidateForm({ initial }: { initial?: any }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    ballot_name: initial?.ballot_name ?? "",
    slug: initial?.slug ?? "",

    scope: initial?.state_uf === "BR" ? "national" : "state",
    state_uf: initial?.state_uf ?? "DF",

    cargo: initial?.cargo ?? "Deputado Federal",
    party: initial?.party ?? "",
    number: initial?.number ?? "",

    photo_url: initial?.photo_url ?? "",

    mini_cv: initial?.mini_cv ?? "",
    biography: initial?.biography ?? "",
    political_project: initial?.political_project ?? "",
    proposals: initial?.proposals ?? "",
    public_experience: initial?.public_experience ?? "",
    priority_areas: initial?.priority_areas ?? "",

    instagram_url: initial?.instagram_url ?? "",
    facebook_url: initial?.facebook_url ?? "",
    youtube_url: initial?.youtube_url ?? "",
    website_url: initial?.website_url ?? "",
    video_url: initial?.video_url ?? "",

    source_url: initial?.source_url ?? "",
    source_notes: initial?.source_notes ?? "",
    verified_at: initial?.verified_at
      ? initial.verified_at.substring(0, 10)
      : "",

    status: initial?.status ?? "draft",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");

    const supabase = createClient();

    const slug =
      form.slug ||
      form.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const {
      scope,
      ...formData
    } = form;

    const payload = {
      ...formData,
      slug,
      state_uf: scope === "national" ? "BR" : form.state_uf,
      verified_at: form.verified_at || null,
      updated_at: new Date().toISOString(),
    };

    const result = initial
      ? await supabase
          .from("candidates")
          .update(payload)
          .eq("id", initial.id)
      : await supabase.from("candidates").insert(payload);

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    router.push("/admin/candidatos");
    router.refresh();
  }

  const labelStyle = {
    display: "block",
    fontWeight: 700,
    marginBottom: 7,
  };

  const sectionStyle = {
    marginTop: 32,
    paddingTop: 24,
    borderTop: "1px solid #e4e7ec",
  };

  return (
    <form onSubmit={save} className="card" style={{ padding: 26 }}>
      <h2>Identificação</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 18,
          marginTop: 20,
        }}
      >
        <label>
          <span style={labelStyle}>Nome completo *</span>
          <input
            className="field"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </label>

        <label>
          <span style={labelStyle}>Nome na urna</span>
          <input
            className="field"
            value={form.ballot_name}
            onChange={(e) => set("ballot_name", e.target.value)}
          />
        </label>

        <label>
          <span style={labelStyle}>Slug da URL</span>
          <input
            className="field"
            placeholder="Gerado automaticamente se vazio"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
          />
        </label>

        <label>
          <span style={labelStyle}>Abrangência *</span>
          <select
            className="field"
            value={form.scope}
            onChange={(e) => set("scope", e.target.value)}
          >
            <option value="national">Nacional</option>
            <option value="state">Estadual / Distrital</option>
          </select>
        </label>

        {form.scope === "state" && (
          <label>
            <span style={labelStyle}>Estado *</span>
            <select
              className="field"
              value={form.state_uf}
              onChange={(e) => set("state_uf", e.target.value)}
            >
              {STATES.map((s) => (
                <option key={s.uf} value={s.uf}>
                  {s.uf} — {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          <span style={labelStyle}>Cargo *</span>
          <select
            className="field"
            value={form.cargo}
            onChange={(e) => set("cargo", e.target.value)}
          >
            <option>Presidente</option>
            <option>Governador</option>
            <option>Senador</option>
            <option>Deputado Federal</option>
            <option>Deputado Estadual</option>
            <option>Deputado Distrital</option>
          </select>
        </label>

        <label>
          <span style={labelStyle}>Partido</span>
          <input
            className="field"
            placeholder="Ex.: PL"
            value={form.party}
            onChange={(e) => set("party", e.target.value)}
          />
        </label>

        <label>
          <span style={labelStyle}>Número</span>
          <input
            className="field"
            value={form.number}
            onChange={(e) => set("number", e.target.value)}
          />
        </label>

        <label>
          <span style={labelStyle}>Status *</span>
          <select
            className="field"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>
        </label>
      </div>

      <div style={sectionStyle}>
        <h2>Foto e apresentação</h2>

        <label style={{ display: "block", marginTop: 18 }}>
          <span style={labelStyle}>URL da foto</span>
          <input
            className="field"
            placeholder="https://..."
            value={form.photo_url}
            onChange={(e) => set("photo_url", e.target.value)}
          />
        </label>

        <label style={{ display: "block", marginTop: 18 }}>
          <span style={labelStyle}>Mini-CV</span>
          <textarea
            className="field"
            rows={5}
            placeholder="Resumo da formação, profissão e trajetória."
            value={form.mini_cv}
            onChange={(e) => set("mini_cv", e.target.value)}
          />
        </label>

        <label style={{ display: "block", marginTop: 18 }}>
          <span style={labelStyle}>Biografia</span>
          <textarea
            className="field"
            rows={6}
            value={form.biography}
            onChange={(e) => set("biography", e.target.value)}
          />
        </label>
      </div>

      <div style={sectionStyle}>
        <h2>Projeto político</h2>

        <label style={{ display: "block", marginTop: 18 }}>
          <span style={labelStyle}>Projeto político</span>
          <textarea
            className="field"
            rows={8}
            placeholder="Descrição do projeto político apresentado pelo apoiado."
            value={form.political_project}
            onChange={(e) => set("political_project", e.target.value)}
          />
        </label>

        <label style={{ display: "block", marginTop: 18 }}>
          <span style={labelStyle}>Principais propostas</span>
          <textarea
            className="field"
            rows={8}
            value={form.proposals}
            onChange={(e) => set("proposals", e.target.value)}
          />
        </label>

        <label style={{ display: "block", marginTop: 18 }}>
          <span style={labelStyle}>Experiência pública</span>
          <textarea
            className="field"
            rows={6}
            value={form.public_experience}
            onChange={(e) => set("public_experience", e.target.value)}
          />
        </label>

        <label style={{ display: "block", marginTop: 18 }}>
          <span style={labelStyle}>Áreas prioritárias</span>
          <textarea
            className="field"
            rows={4}
            placeholder="Ex.: saúde, educação, segurança pública..."
            value={form.priority_areas}
            onChange={(e) => set("priority_areas", e.target.value)}
          />
        </label>
      </div>

      <div style={sectionStyle}>
        <h2>Redes e mídia</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 18,
            marginTop: 18,
          }}
        >
          {[
            ["instagram_url", "Instagram"],
            ["facebook_url", "Facebook"],
            ["youtube_url", "YouTube"],
            ["website_url", "Site oficial"],
            ["video_url", "Vídeo de apresentação"],
          ].map(([key, label]) => (
            <label key={key}>
              <span style={labelStyle}>{label}</span>
              <input
                className="field"
                placeholder="https://..."
                value={(form as any)[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </label>
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <h2>Fontes e conferência</h2>

        <label style={{ display: "block", marginTop: 18 }}>
          <span style={labelStyle}>Fonte principal</span>
          <input
            className="field"
            placeholder="Link da fonte oficial"
            value={form.source_url}
            onChange={(e) => set("source_url", e.target.value)}
          />
        </label>

        <label style={{ display: "block", marginTop: 18 }}>
          <span style={labelStyle}>Observações sobre as fontes</span>
          <textarea
            className="field"
            rows={4}
            value={form.source_notes}
            onChange={(e) => set("source_notes", e.target.value)}
          />
        </label>

        <label style={{ display: "block", marginTop: 18, maxWidth: 300 }}>
          <span style={labelStyle}>Data da verificação</span>
          <input
            type="date"
            className="field"
            value={form.verified_at}
            onChange={(e) => set("verified_at", e.target.value)}
          />
        </label>
      </div>

      {error && (
        <div
          style={{
            color: "#b42318",
            background: "#fef3f2",
            padding: 12,
            borderRadius: 8,
            marginTop: 22,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 28,
        }}
      >
        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Salvando..." : initial ? "Salvar alterações" : "Cadastrar apoiado"}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.back()}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
