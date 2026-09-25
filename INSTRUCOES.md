# Ordenação automática por cargo no MFB

Execute `supabase/migrations/20260925_candidates_cargo_order.sql` **apenas no Supabase do MFB**, depois que a tabela `public.candidates` estiver criada. O SQL calcula automaticamente `cargo_rank` para registros existentes e futuros: Presidente (10), Governador (20), Senador (30), Deputado Federal (40), Deputado Estadual (50), Deputado Distrital (60), demais cargos (90). A coluna `display_order` permanece intacta.

Envie ao GitHub do projeto MFB os quatro arquivos de código nos caminhos internos deste ZIP. As páginas públicas passam a ordenar primeiro por cargo, depois pela posição manual, depois pelo nome. O painel mantém as setas para mover candidatos publicados **dentro do grupo do mesmo cargo** e o botão `Salvar ordem`. Cadastros novos entram automaticamente no grupo correspondente ao cargo quando forem publicados.

**Ordem:** 1. Executar SQL; 2. enviar os quatro arquivos ao GitHub; 3. confirmar o deploy e verificar os candidatos por estado e os controles no painel.

Verificação sem alterar dados:

```sql
select cargo, cargo_rank, count(*)
from public.candidates
group by cargo, cargo_rank
order by cargo_rank, cargo;
```

Checagem local: `npm run check` passou. O build completo não foi possível no workspace porque o repositório clonado não contém lockfile e a instalação local provisória de dependências usou um link simbólico rejeitado pelo Turbopack. O SQL ainda não foi executado no Supabase remoto.
