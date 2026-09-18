import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll(){return request.cookies.getAll()},setAll(items){items.forEach(({name,value,options})=>{request.cookies.set(name,value);response.cookies.set(name,value,options)})}}});
  const {data:{user}}=await supabase.auth.getUser();
  const path=request.nextUrl.pathname;
  if(path.startsWith("/membro")&&!user) return NextResponse.redirect(new URL("/entrar",request.url));
  if(path.startsWith("/admin")&&!path.startsWith("/admin/login")){
    if(!user) return NextResponse.redirect(new URL("/admin/login",request.url));
    const {data:staff}=await supabase.from("admin_profiles").select("role").eq("id",user.id).maybeSingle();
    if(!staff) return NextResponse.redirect(new URL("/membro",request.url));
  }
  return response;
}
export const config={matcher:["/admin/:path*","/membro/:path*"]};
