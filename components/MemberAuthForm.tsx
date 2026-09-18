"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type Mode = "login" | "signup";

export function MemberAuthForm({ mode }: { mode: Mode }) {
  const signup = mode === "signup";
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(""); setMessage("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const supabase = createClient();

    if (signup) {
      const fullName = String(form.get("full_name") || "").trim();
      const whatsapp = String(form.get("whatsapp") || "").trim();
      const stateUf = String(form.get("state_uf") || "").trim();
      const city = String(form.get("city") || "").trim();
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, whatsapp, state_uf: stateUf, city } }
      });
      if (error) setError(error.message);
      else if (data.session) { router.push("/membro"); router.refresh(); }
      else setMessage("Cadastro realizado. Confira seu e-mail para confirmar a conta e depois faça login.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else { router.push("/membro"); router.refresh(); }
    }
    setLoading(false);
  }

  return <main className="member-auth-page">
    <section className="member-auth-brand">
      <div className="member-auth-copy">
        <Link href="/" className="member-back">← Voltar ao MFB</Link>
        <div className="member-kicker">COMUNIDADE MFB</div>
        <h1>{signup ? "Faça parte do Movimento Família Brasileira" : "Bem-vindo de volta"}</h1>
        <p>{signup ? "Crie sua conta para acessar cursos, conteúdos, eventos, pesquisas e as próximas funcionalidades da comunidade MFB." : "Acesse seu ambiente exclusivo, continue seus cursos e acompanhe as atividades da comunidade."}</p>
        <div className="member-benefits"><span>✓ Cursos e trilhas</span><span>✓ Conteúdo exclusivo</span><span>✓ Eventos e pesquisas</span><span>✓ Perfil e certificados</span></div>
      </div>
    </section>
    <section className="member-auth-form-wrap">
      <form className="member-auth-card" onSubmit={submit}>
        <div className="member-auth-title"><div className="member-mark">MFB</div><h2>{signup ? "Criar minha conta" : "Entrar na minha conta"}</h2><p>{signup ? "Leva menos de dois minutos." : "Informe seus dados de acesso."}</p></div>
        {signup && <><label>Nome completo</label><input className="field" name="full_name" required placeholder="Seu nome completo" />
          <div className="form-two"><div><label>WhatsApp</label><input className="field" name="whatsapp" placeholder="(61) 99999-9999" /></div><div><label>UF</label><input className="field" name="state_uf" maxLength={2} placeholder="DF" /></div></div>
          <label>Cidade</label><input className="field" name="city" placeholder="Sua cidade" /></>}
        <label>E-mail</label><input className="field" name="email" type="email" required placeholder="voce@email.com" />
        <label>Senha</label><input className="field" name="password" type="password" required minLength={6} placeholder="Mínimo de 6 caracteres" />
        {signup && <label className="consent"><input type="checkbox" required /> <span>Li e aceito os Termos de Uso e a Política de Privacidade.</span></label>}
        {error && <div className="form-error">{error}</div>}{message && <div className="form-success">{message}</div>}
        <button className="btn btn-primary member-submit" disabled={loading}>{loading ? "Aguarde..." : signup ? "FAZER PARTE DO MFB" : "ENTRAR"}</button>
        <p className="member-switch">{signup ? "Já possui cadastro?" : "Ainda não faz parte?"} <Link href={signup ? "/entrar" : "/cadastro"}>{signup ? "Entrar" : "Cadastre-se"}</Link></p>
      </form>
    </section>
  </main>;
}
