import Link from "next/link";
import CandidateInviteLoader from "@/components/CandidateInviteLoader";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function CandidateCompletionPage({
  params,
}: PageProps) {
  const { token } = await params;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8faf9",
        padding: "40px 18px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 820,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-block",
              textDecoration: "none",
              color: "#157347",
              fontSize: 20,
              fontWeight: 900,
              marginBottom: 12,
            }}
          >
            MFB
          </Link>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "clamp(30px, 5vw, 44px)",
              lineHeight: 1.1,
              color: "#101828",
            }}
          >
            Complete seu cadastro
          </h1>

          <p
            style={{
              margin: "0 auto",
              maxWidth: 650,
              color: "#667085",
              lineHeight: 1.6,
              fontSize: 16,
            }}
          >
            Revise e complemente as informações do cadastro
            utilizando o link recebido.
          </p>
        </header>

        <CandidateInviteLoader token={token} />

        <footer
          style={{
            textAlign: "center",
            marginTop: 28,
            color: "#98a2b3",
            fontSize: 13,
          }}
        >
          Movimento Família Brasileira
        </footer>
      </div>
    </main>
  );
}
