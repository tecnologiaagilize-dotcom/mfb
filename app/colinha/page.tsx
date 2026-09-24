import { Header } from "@/components/Header";
import { ColinhaBuilder } from "@/components/ColinhaBuilder";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Minha colinha | Movimento Família Brasileira", description: "Monte e salve sua própria lista de candidatos publicados." };
export default async function ColinhaPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("candidates_public").select("id,name,ballot_name,cargo,number,state_uf,city_name,photo_url,slug").eq("status", "published").order("name");
  // The public view already restricts candidates to published profiles.
  return <><Header /><main className="container colinha-page"><ColinhaBuilder candidates={data ?? []} /></main></>;
}
