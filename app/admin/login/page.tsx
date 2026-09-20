"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const router =
    useRouter();

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase =
        createClient();

      /*
       * 1. AUTENTICAÇÃO
       */
      const {
        data: loginData,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError(
          loginError.message
        );

        return;
      }

      if (!loginData.user) {
        setError(
          "Não foi possível identificar o usuário autenticado."
        );

        return;
      }

      /*
       * 2. CONFIRMA A SESSÃO
       */
      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !userData.user
      ) {
        await supabase.auth.signOut();

        setError(
          "A sessão não pôde ser confirmada. Tente novamente."
        );

        return;
      }

      /*
       * 3. CONFIRMA O PERFIL ADMINISTRATIVO
       *
       * Não usamos e-mail fixo.
       * A autorização é feita pelo UUID
       * existente em admin_profiles.
       */
      const {
        data: adminProfile,
        error: profileError,
      } = await supabase
        .from("admin_profiles")
        .select("role")
        .eq(
          "id",
          userData.user.id
        )
        .maybeSingle();

      if (profileError) {
        console.error(
          "Erro admin_profiles:",
          profileError
        );

        await supabase.auth.signOut();

        setError(
          "Não foi possível verificar a autorização administrativa."
        );

        return;
      }

      if (
        adminProfile?.role !==
          "admin" &&
        adminProfile?.role !==
          "editor"
      ) {
        await supabase.auth.signOut();

        setError(
          "Esta conta não possui acesso ao painel administrativo."
        );

        return;
      }

      /*
       * 4. SESSÃO CONFIRMADA
       *
       * refresh antes da navegação
       * permite que os Server Components
       * recebam o estado atualizado.
       */
      router.refresh();
      router.replace("/admin");
    } catch (err) {
      console.error(
        "Admin login:",
        err
      );

      setError(
        "Ocorreu um erro ao realizar o acesso. Tente novamente."
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
        className="card"
        onSubmit={submit}
        style={{
          width:
            "min(430px, 100%)",
          padding: 30,
        }}
      >
        <Link
          href="/"
          style={{
            color: "#006c40",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          ← MFB
        </Link>

        <h1
          style={{
            fontSize: 32,
            margin:
              "18px 0 6px",
          }}
        >
          Painel administrativo
        </h1>

        <p
          style={{
            color: "#667085",
            lineHeight: 1.5,
          }}
        >
          Entre com sua conta
          autorizada de administrador
          ou editor.
        </p>

        <label
          htmlFor="admin-email"
          style={{
            display: "block",
            marginTop: 20,
            fontWeight: 700,
          }}
        >
          E-mail
        </label>

        <input
          id="admin-email"
          className="field"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value
            )
          }
        />

        <label
          htmlFor="admin-password"
          style={{
            display: "block",
            marginTop: 16,
            fontWeight: 700,
          }}
        >
          Senha
        </label>

        <input
          id="admin-password"
          className="field"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) =>
            setPassword(
              event.target.value
            )
          }
        />

        {error && (
          <div
            style={{
              color: "#b42318",
              background:
                "#fef3f2",
              border:
                "1px solid #fecdca",
              padding: 12,
              borderRadius: 8,
              marginTop: 14,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 20,
            opacity:
              loading
                ? 0.7
                : 1,
            cursor:
              loading
                ? "wait"
                : "pointer",
          }}
        >
          {loading
            ? "Entrando..."
            : "Entrar"}
        </button>
      </form>
    </main>
  );
}
