"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Mode =
  | "login"
  | "signup";

export function MemberAuthForm({
  mode,
}: {
  mode: Mode;
}) {
  const signup =
    mode === "signup";

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function submit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const form =
      new FormData(
        e.currentTarget
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

    const supabase =
      createClient();

    try {
      /*
       * CADASTRO
       */
      if (signup) {
        const fullName =
          String(
            form.get(
              "full_name"
            ) || ""
          ).trim();

        const whatsapp =
          String(
            form.get(
              "whatsapp"
            ) || ""
          ).trim();

        const stateUf =
          String(
            form.get(
              "state_uf"
            ) || ""
          )
            .trim()
            .toUpperCase();

        const city =
          String(
            form.get(
              "city"
            ) || ""
          ).trim();

        const {
          data,
          error:
            signupError,
        } =
          await supabase.auth.signUp(
            {
              email,
              password,

              options: {
                data: {
                  full_name:
                    fullName,
                  whatsapp,
                  state_uf:
                    stateUf,
                  city,
                },
              },
            }
          );

        if (signupError) {
          setError(
            signupError.message
          );
          return;
        }

        /*
         * Se o Supabase já criou
         * uma sessão, seguimos para
         * o servidor decidir o
         * destino.
         */
        if (
          data.session &&
          data.user
        ) {
          window.location.assign(
            "/acesso"
          );

          return;
        }

        setMessage(
          "Cadastro realizado. Confira seu e-mail para confirmar a conta e depois faça login."
        );

        return;
      }

      /*
       * LOGIN
       */
      const {
        data,
        error:
          loginError,
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
          "Não foi possível criar uma sessão válida."
        );
        return;
      }

      /*
       * IMPORTANTE:
       *
       * Não consultamos
       * admin_profiles aqui.
       *
       * A sessão já foi criada.
       * Agora fazemos uma nova
       * requisição completa ao
       * servidor.
       */
      window.location.assign(
        "/acesso"
      );
    } catch (err) {
      console.error(
        "Erro de autenticação:",
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
    <main className="member-auth-page">
      <section className="member-auth-brand">
        <div className="member-auth-copy">
          <Link
            href="/"
            className="member-back"
          >
            ← Voltar ao MFB
          </Link>

          <div className="member-kicker">
            COMUNIDADE MFB
          </div>

          <h1>
            {signup
              ? "Faça parte do Movimento Família Brasileira"
              : "Bem-vindo de volta"}
          </h1>

          <p>
            {signup
              ? "Crie sua conta para acessar cursos, conteúdos, eventos, pesquisas e as próximas funcionalidades da comunidade MFB."
              : "Acesse seu ambiente exclusivo, continue seus cursos e acompanhe as atividades da comunidade."}
          </p>

          <div className="member-benefits">
            <span>
              ✓ Cursos e trilhas
            </span>

            <span>
              ✓ Conteúdo exclusivo
            </span>

            <span>
              ✓ Eventos e pesquisas
            </span>

            <span>
              ✓ Perfil e certificados
            </span>
          </div>
        </div>
      </section>

      <section className="member-auth-form-wrap">
        <form
          className="member-auth-card"
          onSubmit={submit}
        >
          <div className="member-auth-title">
            <div className="member-mark">
              MFB
            </div>

            <h2>
              {signup
                ? "Criar minha conta"
                : "Entrar na minha conta"}
            </h2>

            <p>
              {signup
                ? "Leva menos de dois minutos."
                : "Informe seus dados de acesso."}
            </p>
          </div>

          {signup && (
            <>
              <label>
                Nome completo
              </label>

              <input
                className="field"
                name="full_name"
                required
                autoComplete="name"
              />

              <label>
                WhatsApp
              </label>

              <input
                className="field"
                name="whatsapp"
                type="tel"
                autoComplete="tel"
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "110px 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label>
                    UF
                  </label>

                  <input
                    className="field"
                    name="state_uf"
                    maxLength={2}
                    placeholder="DF"
                  />
                </div>

                <div>
                  <label>
                    Cidade
                  </label>

                  <input
                    className="field"
                    name="city"
                  />
                </div>
              </div>
            </>
          )}

          <label>
            E-mail
          </label>

          <input
            className="field"
            name="email"
            type="email"
            required
            autoComplete="email"
          />

          <label>
            Senha
          </label>

          <input
            className="field"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={
              signup
                ? "new-password"
                : "current-password"
            }
          />

          {error && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 8,
                background:
                  "#fef3f2",
                border:
                  "1px solid #fecdca",
                color:
                  "#b42318",
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 8,
                background:
                  "#ecfdf3",
                border:
                  "1px solid #abefc6",
                color:
                  "#027a48",
              }}
            >
              {message}
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 20,
              opacity:
                loading
                  ? 0.7
                  : 1,
            }}
          >
            {loading
              ? signup
                ? "Criando conta..."
                : "Entrando..."
              : signup
                ? "Criar conta"
                : "Entrar"}
          </button>

          <div
            className="member-auth-switch"
            style={{
              marginTop: 20,
              textAlign:
                "center",
            }}
          >
            {signup ? (
              <>
                Já possui uma
                conta?{" "}
                <Link href="/entrar">
                  Entrar
                </Link>
              </>
            ) : (
              <>
                Ainda não possui
                conta?{" "}
                <Link href="/cadastro">
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
