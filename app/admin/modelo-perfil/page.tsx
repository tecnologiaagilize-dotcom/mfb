import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { CertificateTemplateEditor } from "@/components/admin/CertificateTemplateEditor";
import { createClient } from "@/lib/supabase/server";
import { normalizeCertificateTemplate } from "@/lib/candidates/certificate-template";

export default async function TemplatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: staff } = await supabase.from("admin_profiles").select("role").eq("id", user.id).maybeSingle();
  if (staff?.role !== "admin") redirect("/admin");
  const [{ data: saved }, { data: candidates }] = await Promise.all([
    supabase.from("candidate_profile_templates").select("config").eq("template_key", "global").maybeSingle(),
    supabase.from("candidates").select("id,name,ballot_name,cargo,party,number,photo_url,photo_position_x,photo_position_y,photo_zoom,endorsement_reason,endorsement_issued_at,state_uf").eq("status", "published").limit(1),
  ]);
  const sample = candidates?.[0] ?? { name: "Nome da candidatura", ballot_name: null, cargo: "Cargo", party: "Partido", number: "000", photo_url: null, endorsement_reason: null, endorsement_issued_at: null, state_uf: "DF" };
  return <AdminShell email={user.email}>
    <div className="admin-heading"><div><span className="badge">MODELO GLOBAL</span><h1>Modelo do perfil</h1><p>Edite o certificado de apoio com prévia. Após salvar, o mesmo modelo aparece nas páginas de todos os candidatos.</p></div></div>
    <CertificateTemplateEditor initial={normalizeCertificateTemplate(saved?.config)} sample={sample} />
  </AdminShell>;
}
