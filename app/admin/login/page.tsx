"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    const form =
      new FormData(
        event.currentTarget
      );

    const email =
      String(
        form.get("email") || ""
      )
        .trim()
        .toLowerCase();

    const password =
      String(
        form.get("password") || ""
      );

    try {
      const supabase =
        createClient();

      const {
        data,
        error: loginError,
      } =
        await supabase.auth
          .signInWithPassword({
            email,
            password,
          });

      if (loginError) {
        setError(
          loginError.message
        );
        return;
      }

      if (
        !data.user ||
        !data.session
      ) {
        setError(
          "A autenticação não retornou uma sessão válida."
        );
        return;
      }

      /*
       * A autenticação terminou.
       *
       * A autorização administrativa
       * será conferida pelo servidor
       * dentro da área /admin.
       */
      window.location.href =
        "/admin";
    } catch (err) {
      console.error(
        "Admin login:",
        err
      );

      setError(
        "Não foi possível concluir o login."
      );
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
          width:
            "min(430px, 100%)",
          padding: 30,
          background: "#ffffff",
          border:
            "1px solid #e4e7ec",
          borderRadius: 16,
          boxShadow:
            "0 10px 30px rgba(16,24,40,.06)",
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
            margin:
              "0 0 24px",
            color: "#667085",
          }}
        >
          Entre com sua conta
          administrativa.
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
          style={{
            width: "100%",
            boxSizing:
              "border-box",
            padding: "12px 14px",
            border:
              "1px solid #d0d5dd",
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
          style={{
            width: "100%",
            boxSizing:
              "border-box",
            padding: "12px 14px",
            border:
              "1px solid #d0d5dd",
            borderRadius: 9,
            fontSize: 15,
          }}
        />

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: 13,
              borderRadius: 9,
              background:
                "#fef3f2",
              border:
                "1px solid #fecdca",
              color: "#b42318",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 20,
            padding:
              "13px 18px",
            border: 0,
            borderRadius: 9,
            background:
              "#157347",
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 800,
            cursor:
              loading
                ? "wait"
                : "pointer",
            opacity:
              loading
                ? 0.7
                : 1,
          }}
        >
          {loading
            ? "Entrando..."
            : "Entrar"}
        </button>

        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop:
              "1px solid #eaecf0",
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
