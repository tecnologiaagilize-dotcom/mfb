import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container" style={{padding:"90px 0",display:"grid",gridTemplateColumns:"1.15fr .85fr",gap:50,alignItems:"center"}}>
            <div>
              <span style={{display:"inline-block",padding:"7px 11px",border:"1px solid rgba(255,255,255,.25)",borderRadius:999,fontSize:12,fontWeight:800,letterSpacing:.6}}>
                PORTAL INSTITUCIONAL · DESDE 2013
              </span>
              <h1 style={{fontSize:"clamp(42px,7vw,76px)",lineHeight:.98,margin:"18px 0",letterSpacing:-2}}>
                Movimento Família Brasileira
              </h1>
              <p style={{fontSize:20,lineHeight:1.65,color:"#d9f4e7",maxWidth:680}}>
                Portal para apresentar a história, as ações e as informações públicas do MFB, com consulta organizada por Estado e cargo.
              </p>
              <div style={{display:"flex",gap:12,marginTop:28,flexWrap:"wrap"}}>
                <Link href="/#quem-somos" className="btn btn-primary">Conheça o MFB</Link>
                <Link href="/candidatos" className="btn btn-secondary">Candidatos 2026</Link>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"center"}}>
              <Image src="/logo-mfb.png" alt="MFB" width={430} height={430} style={{objectFit:"contain"}} priority />
            </div>
          </div>
        </section>

        <section id="quem-somos" className="section">
          <div className="container">
            <div style={{maxWidth:850}}>
              <span className="badge">QUEM SOMOS</span>
              <h2 style={{fontSize:42,margin:"14px 0"}}>Uma história construída ao longo dos anos</h2>
              <p style={{fontSize:18,lineHeight:1.8,color:"#475467"}}>
                Nossa história teve seu início em meados de março de 2013, quando nascia o Projeto Família Brasileira. Com o principal objetivo de agregar conservadores em todo o País, na intenção de promover discussões sobre o cenário político da atualidade, foram criados mecanismos estratégicos para atuar em diferentes frentes da sociedade.
              </p>
              <p style={{fontSize:18,lineHeight:1.8,color:"#475467"}}>
                Tendo como idealizadores Frederico Niemann, Helen Pontes e Luiz Henrique, outros integrantes se uniram à caminhada, como Alex Canuto e Rodrigues.
              </p>
              <p style={{fontSize:18,lineHeight:1.8,color:"#475467"}}>
                O grupo vinha atuando antes dessa data em manifestações e iniciativas relacionadas a pautas como defesa da vida e oposição à legalização da maconha, orientado por princípios cristãos e conservadores.
              </p>
            </div>
          </div>
        </section>

        <section id="historia" className="section" style={{background:"#fff"}}>
          <div className="container">
            <span className="badge">NOSSA HISTÓRIA</span>
            <h2 style={{fontSize:42,margin:"14px 0 42px"}}>Linha do tempo</h2>
            <div className="timeline" style={{maxWidth:850}}>
              {[
                ["2013","Nasce o Projeto Família Brasileira, com atuação voltada à organização e participação de conservadores em diferentes frentes."],
                ["2015","O grupo passa a representar a Central Brasileira dos Trabalhadores para fins de estudos, coordenação e representação de profissionais, associações, sindicatos e federações."],
                ["2017","A área esportiva passa a integrar as iniciativas, com foco na formação integral de crianças e adolescentes por meio do esporte."],
                ["2020","É incorporado o movimento Brasil Feminino, reunindo mulheres de diferentes Estados para apoio mútuo durante o período da pandemia."],
                ["2021","O movimento subscreve a Marcha da Família Cristã pela Liberdade e o Foro Conservador e inicia o projeto de comunicação Tribuna5/T5."],
                ["2024","Instituto Fiscaliza."],
                ["2025","Instituto Parceiros do Meio Ambiente."]
              ].map(([year,text]) => (
                <div className="timeline-item" key={year}>
                  <div style={{fontWeight:900,color:"#006c40",fontSize:20}}>{year}</div>
                  <p style={{margin:"8px 0",lineHeight:1.7,color:"#475467"}}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="acoes" className="section">
          <div className="container">
            <span className="badge">NOSSAS AÇÕES</span>
            <h2 style={{fontSize:42,margin:"14px 0 34px"}}>Frentes de atuação</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:18}}>
              {[
                ["Família","Iniciativas relacionadas à participação e fortalecimento das famílias."],
                ["Esporte","Projetos esportivos e formação de crianças e adolescentes."],
                ["Brasil Feminino","Rede e iniciativas de apoio mútuo entre mulheres."],
                ["Comunicação","Tribuna5/T5 e espaço para comunicação independente."],
                ["Fiscalização","Instituto Fiscaliza."],
                ["Meio Ambiente","Instituto Parceiros do Meio Ambiente."]
              ].map(([title,text]) => (
                <div className="card" style={{padding:24}} key={title}>
                  <h3 style={{fontSize:20,margin:"0 0 10px"}}>{title}</h3>
                  <p style={{margin:0,color:"#667085",lineHeight:1.6}}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" style={{background:"#edf8f2"}}>
          <div className="container" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:24,flexWrap:"wrap"}}>
            <div>
              <span className="badge">ELEIÇÕES 2026</span>
              <h2 style={{fontSize:36,margin:"12px 0"}}>Candidatos indicados pelo MFB</h2>
              <p style={{margin:0,color:"#475467",maxWidth:700}}>Consulte por estado, cargo ou nome.</p>
            </div>
            <Link href="/candidatos" className="btn btn-primary">Consultar candidatos</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
