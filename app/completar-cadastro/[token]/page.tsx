import Link from "next/link";

export const dynamic =
  "force-dynamic";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function Page({
  params,
}: PageProps) {
  const { token } =
    await params;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "#f8faf9",
        padding:
          "40px 18px",
      }}
    >
      <div
        style={{
          maxWidth: 820,
          margin:
            "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: 24,
            textAlign:
              "center",
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration:
                "none",
              color:
                "#157347",
              fontWeight: 900,
            }}
          >
            MFB
          </Link>

          <h1
            style={{
              margin:
                "12px 0 8px",
              fontSize:
                "clamp(30px, 5vw, 44px)",
            }}
          >
            Complete seu cadastro
          </h1>

          <p
            style={{
              margin:
                "0 auto",
              maxWidth: 650,
              color:
                "#667085",
              lineHeight: 1.6,
            }}
          >
            Utilize o link recebido
            para revisar e complementar
            as informações do cadastro.
          </p>
        </div>

        <CandidateInviteLoader
          token={token}
        />
      </div>
    </main>
  );
}

/*
 * Componente interno responsável
 * apenas por entregar o token ao
 * componente cliente.
 */
import CandidateInviteLoader
  from "@/components/CandidateInviteLoader";
