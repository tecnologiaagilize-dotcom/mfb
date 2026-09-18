import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CandidateForm from "@/components/admin/CandidateForm";

export const dynamic = "force-dynamic";

export default async function EditCandidatePage({ params }: { params: Promise<{id:string}> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("candidates").select("*").eq("id",id).maybeSingle();
  if (!data) return notFound();
  return <main className="section"><div className="container" style={{maxWidth:900}}><h1 style={{fontSize:42,marginBottom:25}}>Editar candidato</h1><CandidateForm initial={data} /></div></main>;
}
