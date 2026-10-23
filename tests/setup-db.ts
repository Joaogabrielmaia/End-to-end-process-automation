// Os testes de integração usam um banco separado para nunca apagar os dados do painel.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://fluxo:fluxo_local@localhost:5436/fluxo_test?schema=public";
