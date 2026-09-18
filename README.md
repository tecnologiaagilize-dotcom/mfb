# MFB Plataforma — V5 Consolidada

Base consolidada da plataforma MFB, construída em Next.js 16 + React 19 + TypeScript + Supabase.

## Ambientes
- Portal público
- Cadastro/Login e Comunidade MFB
- MFB Academy: cursos, módulos, aulas, avaliações e certificados
- Eventos, inscrições, QR Code e check-in
- Pesquisas/enquetes voluntárias
- Biblioteca de conteúdo
- Central de notificações e preferências
- Central administrativa: apoiados, membros, território, cursos, eventos, pesquisas, conteúdo e notificações

## Antes de publicar
1. Crie um projeto Supabase de homologação.
2. Execute `supabase/schema.sql` em banco vazio e depois `supabase/seed.sql` se desejar dados de exemplo.
3. Copie `.env.example` para `.env.local` e informe as chaves do Supabase.
4. Rode `npm install`.
5. Rode `npm run check` e `npm run build`.
6. Crie um usuário no Supabase Auth e promova-o em `admin_profiles` conforme instrução do schema.
7. Teste cadastro, login, RLS, cursos, avaliações, certificados, eventos/check-in, pesquisas, conteúdo e notificações antes de apontar para produção.

## Observações de consolidação
- Rotas administrativas que existiam apenas no menu agora possuem páginas-reserva, evitando links 404.
- O script `lint` antigo (`next lint`, removido nas versões atuais do Next) foi substituído por checagem TypeScript.
- Foi acrescentada a estrutura `audit_logs`; a escrita do log deve ocorrer por funções administrativas controladas, não por INSERT direto do navegador.
- Não execute este schema diretamente sobre um banco de produção já preenchido sem revisar/migrar as alterações incrementalmente.
- A instalação das dependências não concluiu dentro do limite de tempo do ambiente de montagem; por isso o build final deve ser validado localmente/CI antes do deploy.

## Próximo marco recomendado
Homologação técnica: Supabase de teste -> validação de RLS -> build -> GitHub -> preview Vercel -> testes de usuário -> produção.
