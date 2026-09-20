"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type LoginStep =
  | "idle"
  | "creating-client"
  | "sending"
  | "authenticated"
  | "redirecting"
  | "error";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<LoginStep>("idle");

  function stepText() {
    switch (step) {
      case "creating-client":
        return "1/4 — Criando cliente Supabase...";
      case "sending":
        return "2/4 — Enviando autenticação ao Supabase...";
      case "authenticated":
        return "3/4 — Autenticação concluída. Sessão recebida.";
      case "redirecting":
        return "4/4 — Redirecionando para a administração...";
      case "error":
        return "A tentativa foi interrompida por um erro.";
      default:
        return "Aguardando login.";
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setStep("creating-client");

    const form = new FormData(event.currentTarget);

    const email = String(form.get("email") || "")
      .trim()
      .toLowerCase();

    const password = String(form.get("password") || "");

    try {
      /*
       * ETAPA 1
       * Criação do cliente Supabase.
       */
      const supabase = createClient();

      setStep("sending");

      /*
       * ETAPA 2
       * Executa o login, mas não permite que
       * a tela fique indefinidamente aguardando.
       */
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => {
          reject(
            new Error(
              "TIMEOUT_SUPABASE_AUTH"
            )
          );
        }, 15000);
      });

      const result = await Promise.race([
        loginPromise,
        timeoutPromise,
      ]);

      /*
       * ETAPA 3
       * O Supabase respondeu.
       */
      if (result.error) {
        setStep("error");

        setError(
          `O Supabase respondeu com erro: ${result.error.message}`
        );

        return;
      }

      if (!result.data.user) {
        setStep("error");

        setError(
          "O Supabase respondeu, mas não retornou o usuário autenticado."
        );

        return;
      }

      if (!result.data.session) {
        setStep("error");

        setError(
          "O Supabase autenticou o usuário, mas não retornou uma sessão."
        );

        return;
      }

      setStep("authenticated");

      /*
       * Confirma adicionalmente que o cliente
       * consegue enxergar a sessão recém-criada.
       */
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        setStep("error");

        setError(
          `Login realizado, mas houve erro ao recuperar a sessão: ${sessionError.message}`
        );

        return;
      }

      if (!sessionData.session) {
        setStep("error");

        setError(
          "Login realizado, mas a sessão não permaneceu disponível no navegador."
        );

        return;
      }

      /*
       * ETAPA 4
       * Só chegamos aqui se autenticação e
       * sessão estiverem funcionando.
       */
      setStep("redirecting");

      window.location.assign("/admin");
    } catch (err) {
      console.error("Admin login diagnostic:", err);

      setStep("error");

      if (
        err instanceof Error &&
        err.message === "TIMEOUT_SUPABASE_AUTH"
      ) {
        setError(
          "DIAGNÓSTICO: o navegador enviou a solicitação de login, mas o Supabase não respondeu em 15 segundos. O problema está na comunicação com o serviço de autenticação, antes da verificação do perfil administrativo."
        );
      } else if (err instanceof Error) {
        setError(
          `Erro durante o login: ${err.message}`
        );
      } else {
        setError(
          "Ocorreu um erro desconhecido durante o login."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "#f8faf9",
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "min(460px, 100%)",
          padding: 30,
          background: "#ffffff",
          border: "1px solid #e4e7ec",
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(16,24,40,.06)",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#157347",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          ← Site MFB
        </Link>

        <div
          style={{
            marginTop: 22,
            color: "#157347",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: 1,
          }}
        >
          CENTRAL ADMINISTRATIVA
        </div>

        <h1
          style={{
            margin: "8px 0",
            fontSize: 32,
            color: "#101828",
          }}
        >
          Administração MFB
        </h1>

        <p
          style={{
            margin: "0 0 24px",
            color: "#667085",
          }}
        >
          Diagnóstico controlado da autenticação administrativa.
        </p>

        <label
          htmlFor="email"
          style={{
            display: "block",
            marginBottom: 6,
            fontWeight: 700,
          }}
        >
          E-mail
        </label>

        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={loading}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            border: "1px solid #d0d5dd",
            borderRadius: 9,
            fontSize: 15,
            marginBottom: 16,
          }}
        />

        <label
          htmlFor="password"
          style={{
            display: "block",
            marginBottom: 6,
            fontWeight: 700,
          }}
        >
          Senha
        </label>

        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          disabled={loading}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            border: "1px solid #d0d5dd",
            borderRadius: 9,
            fontSize: 15,
          }}
        />

        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 9,
            background: "#f9fafb",
            border: "1px solid #eaecf0",
            color: "#344054",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <strong>Estado do login:</strong>
          <br />
          {stepText()}
        </div>

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: 13,
              borderRadius: 9,
              background: "#fef3f2",
              border: "1px solid #fecdca",
              color: "#b42318",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            <strong>Resultado do diagnóstico:</strong>
            <br />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "13px 18px",
            border: 0,
            borderRadius: 9,
            background: "#157347",
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 800,
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Testando acesso..." : "Entrar"}
        </button>

        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid #eaecf0",
            textAlign: "center",
            color: "#98a2b3",
            fontSize: 12,
          }}
        >
          Movimento Família Brasileira
        </div>
      </form>
    </main>
  );
}
