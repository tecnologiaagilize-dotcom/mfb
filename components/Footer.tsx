export function Footer() {
  return (
    <footer style={{background:"#071b2b",color:"#d0d5dd",padding:"40px 0"}}>
      <div className="container" style={{display:"flex",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}>
        <div>
          <strong style={{color:"white"}}>MFB — Movimento Família Brasileira</strong>
          <div style={{marginTop:8,fontSize:14}}>Portal institucional</div>
        </div>
        <div style={{fontSize:13,maxWidth:520}}>
          As informações sobre candidaturas devem ser conferidas e mantidas atualizadas pelos responsáveis pela plataforma.
        </div>
      </div>
    </footer>
  );
}
