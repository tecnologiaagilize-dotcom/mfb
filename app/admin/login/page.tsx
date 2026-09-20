export const dynamic = "force-dynamic";

export default function AdminLoginDiagnosticPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f8faf9",
      }}
    >
      <div
        style={{
          width: "min(500px, 100%)",
          background: "#ffffff",
          border: "1px solid #e4e7ec",
          borderRadius: 16,
          padding: 32,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: "0 0 12px",
            color: "#101828",
          }}
        >
          Administração MFB
        </h1>

        <p
          style={{
            margin: 0,
            color: "#667085",
            lineHeight: 1.6,
          }}
        >
          Página administrativa carregada com sucesso.
        </p>

        <div
          style={{
            marginTop: 24,
            padding: 14,
            borderRadius: 10,
            background: "#ecfdf3",
            color: "#027a48",
            fontWeight: 800,
          }}
        >
          ✓ Teste de renderização concluído
        </div>
      </div>
    </main>
  );
}
