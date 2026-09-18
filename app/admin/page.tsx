import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Users, Clock3, CheckCircle2, Globe2, UserPlus, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: candidates } = await supabase.from("candidates").select("*").order("created_at",{ascending:false});
  const rows = candidates ?? [];
  const published = rows.filter((c:any)=>c.status === "published").length;
  const draft = rows.filter((c:any)=>c.status === "draft").length;
  const states = new Set(rows.map((c:any)=>c.state_uf)).size;
  const cards = [
    ["Apoiados cadastrados", rows.length, Users], ["Publicados", published, CheckCircle2], ["Em preparação", draft, Clock3], ["Estados com registros", states, Globe2]
  ] as const;
  return <AdminShell email={user.email}>
    <div className="admin-heading"><div><span className="badge">VISÃO GERAL</span><h1>Dashboard</h1><p>Acompanhe a operação nacional do MFB em um só lugar.</p></div><Link href="/admin/candidatos/novo" className="btn btn-primary">+ Novo cadastro</Link></div>
    <div className="metric-grid">{cards.map(([label,value,Icon])=><div className="metric-card" key={label}><div className="metric-icon"><Icon size={22}/></div><div><strong>{value}</strong><span>{label}</span></div></div>)}</div>
    <div className="admin-grid">
      <section className="admin-panel"><div className="panel-title"><div><h2>Gestão de apoiados</h2><p>Últimos registros cadastrados</p></div><Link href="/admin/candidatos">Ver todos</Link></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nome</th><th>UF</th><th>Cargo</th><th>Partido</th><th>Status</th></tr></thead><tbody>
          {rows.slice(0,7).map((c:any)=><tr key={c.id}><td><b>{c.name}</b></td><td>{c.state_uf}</td><td>{c.cargo}</td><td>{c.party ?? "—"}</td><td><span className={`status-pill ${c.status}`}>{c.status === "published" ? "Publicado" : "Rascunho"}</span></td></tr>)}
          {!rows.length && <tr><td colSpan={5} className="empty-cell">Nenhum registro cadastrado ainda.</td></tr>}
        </tbody></table></div>
      </section>
      <aside className="admin-panel quick-panel"><div className="panel-title"><div><h2>Atalhos</h2><p>Próximos módulos da plataforma</p></div></div>
        <Link href="/admin/candidatos/novo"><UserPlus/> <span><b>Novo apoiado</b><small>Cadastrar e preparar publicação</small></span></Link>
        <Link href="/admin/membros"><Users/> <span><b>Membros MFB</b><small>Cadastro e comunidade logada</small></span></Link>
        <Link href="/admin/cursos"><GraduationCap/> <span><b>Cursos</b><small>Conteúdo, progresso e certificados</small></span></Link>
      </aside>
    </div>
  </AdminShell>
}
