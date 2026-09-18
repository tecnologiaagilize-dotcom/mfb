"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLogin() {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");
  const router = useRouter();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push("/admin");
  }

  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:20}}>
      <form className="card" onSubmit={submit} style={{width:"min(430px,100%)",padding:30}}>
        <Link href="/" style={{color:"#006c40",fontWeight:800}}>← MFB</Link>
        <h1 style={{fontSize:32,margin:"18px 0 6px"}}>Painel administrativo</h1>
        <p style={{color:"#667085"}}>Entre com sua conta de administrador.</p>
        <label style={{display:"block",marginTop:20,fontWeight:700}}>E-mail</label>
        <input className="field" type="email" required value={email} onChange={e=>setEmail(e.target.value)} />
        <label style={{display:"block",marginTop:16,fontWeight:700}}>Senha</label>
        <input className="field" type="password" required value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <div style={{color:"#b42318",background:"#fef3f2",padding:12,borderRadius:8,marginTop:14}}>{error}</div>}
        <button className="btn btn-primary" style={{width:"100%",marginTop:20}}>Entrar</button>
      </form>
    </main>
  );
}
