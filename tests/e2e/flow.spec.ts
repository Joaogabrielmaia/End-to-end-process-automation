import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import { seedDatabase } from "../../src/lib/seed-data";

const KEY = process.env.INBOUND_API_KEY ?? "chave-local-de-exemplo";
const headers = { "x-api-key": KEY, "content-type": "application/json" };

test.beforeAll(async () => {
  const prisma = new PrismaClient();
  await seedDatabase(prisma);
  await prisma.$disconnect();
});

const table = (rows: string) => `| SKU | Descrição | Qtd |\n|---|---|---|\n${rows}`;

test("fluxo completo: registrado, exceção, duplicata, correção e reprocessamento", async ({ page, request }) => {
  // 1. pedido bem formatado -> registrado
  const ok = await request.post("/api/inbound", {
    headers,
    data: { messageId: "<e2e-1@pinheiro-eletrica.example>", from: "compras@pinheiro-eletrica.example", subject: "Pedido", body: table("| DJM-020 | Disjuntor | 10 |") },
  });
  expect(ok.status()).toBe(201);
  expect((await ok.json()).status).toBe("registered");

  // 2. texto livre -> extraído e registrado
  const free = await request.post("/api/inbound", {
    headers,
    data: { messageId: "<e2e-2@silvaefilhos.example>", from: "pedidos@silvaefilhos.example", subject: "Material", body: "Bom dia, preciso de 20 disjuntor 20A, 5 rolos de cabo 2,5mm e 10 tomadas 20A." },
  });
  expect((await free.json()).status).toBe("registered");

  // 3. item inexistente -> exceção
  const bad = await request.post("/api/inbound", {
    headers,
    data: { messageId: "<e2e-3@rocha.example>", from: "rocha@casadoeletricista.example", subject: "Pedido", body: table("| TOM-099 | Tomada inexistente | 8 |") },
  });
  const badBody = await bad.json();
  expect(badBody).toMatchObject({ status: "exception", reasons: ["UNKNOWN_SKU"] });

  // 4. mesmo e-mail duas vezes -> ignorado
  const dup = await request.post("/api/inbound", {
    headers,
    data: { messageId: "<e2e-1@pinheiro-eletrica.example>", from: "compras@pinheiro-eletrica.example", subject: "Pedido", body: table("| DJM-020 | Disjuntor | 10 |") },
  });
  expect(dup.status()).toBe(200);
  expect((await dup.json()).status).toBe("duplicate");

  // 5. painel reflete os números
  await page.goto("/");
  await expect(page.getByTestId("kpi-total")).toContainText("3");
  await expect(page.getByTestId("kpi-registered")).toContainText("2");
  await expect(page.getByTestId("kpi-open")).toContainText("1");
  await expect(page.getByTestId("kpi-total")).toContainText("1 reenvio(s) ignorado(s)");

  // 6. fila de exceções mostra o motivo
  await page.goto("/exceptions");
  await expect(page.getByTestId("open-count")).toHaveText("Abertas (1)");
  await expect(page.getByRole("row", { name: /Item não reconhecido/ })).toBeVisible();

  // 7. corrigir com SKU ainda inválido: continua na fila
  await page.getByRole("link", { name: "Corrigir" }).click();
  await page.getByLabel("SKU do item 1").fill("TOM-098");
  await page.getByRole("button", { name: "Corrigir e reprocessar" }).click();
  await expect(page.getByRole("status")).toContainText("Continua na fila");

  // 8. corrigir de verdade: registra
  await page.getByLabel("SKU do item 1").fill("TOM-010");
  await page.getByRole("button", { name: "Corrigir e reprocessar" }).click();
  await expect(page.getByRole("status")).toContainText("registrado");

  // 9. detalhe mostra a trilha de auditoria com a ação da pessoa
  await page.reload();
  const trail = page.getByTestId("audit-trail");
  await expect(trail).toContainText("Ricardo (simulado) corrigiu o rascunho");
  await expect(trail).toContainText("Exceção resolvida");
  await expect(trail).toContainText("Reenvio ignorado");

  // 10. fila vazia e painel atualizado
  await page.goto("/exceptions");
  await expect(page.getByTestId("open-count")).toHaveText("Abertas (0)");
  await page.goto("/");
  await expect(page.getByTestId("kpi-registered")).toContainText("3");
  await expect(page.getByTestId("kpi-review")).toContainText("33,3%");
});

test("aprovação de crédito exige justificativa", async ({ page, request }) => {
  const r = await request.post("/api/inbound", {
    headers,
    data: { messageId: "<e2e-4@bompreco.example>", from: "gerencia@bompreco-mercado.example", subject: "Cabos", body: table("| CAB-025 | Cabo 2,5mm | 3 |") },
  });
  const body = await r.json();
  expect(body.reasons).toEqual(["CREDIT_LIMIT_EXCEEDED"]);

  await page.goto(`/orders/${body.orderId}`);
  await page.getByLabel(/Aprovar excesso de crédito/).fill("abc");
  await page.getByRole("button", { name: "Corrigir e reprocessar" }).click();
  await expect(page.getByRole("status")).toContainText("mínimo 5 caracteres");

  await page.getByLabel(/Aprovar excesso de crédito/).fill("Cliente antigo, liberado pela gerência");
  await page.getByRole("button", { name: "Corrigir e reprocessar" }).click();
  await expect(page.getByRole("status")).toContainText("registrado");
});

test("endpoint de entrada exige chave e valida o formato", async ({ request }) => {
  const noKey = await request.post("/api/inbound", { data: { from: "a@b.example", body: "x" } });
  expect(noKey.status()).toBe(401);
  const invalid = await request.post("/api/inbound", { headers, data: { from: "nao-e-email" } });
  expect(invalid.status()).toBe(400);
});

test("layout móvel sem rolagem horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/exceptions", "/orders", "/generator"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `rolagem horizontal em ${path}`).toBeLessThanOrEqual(0);
  }
});

test("exportação CSV traz cabeçalho e linhas", async ({ request }) => {
  const res = await request.get("/api/export/orders.csv");
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain("order_number,status,customer_cnpj");
  expect(text.split("\r\n").length).toBeGreaterThan(3);
});
