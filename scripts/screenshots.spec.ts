import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const OUT = path.join(__dirname, "..", "docs", "screenshots");
const N8N_URL = process.env.N8N_URL ?? "http://localhost:5678";

const shot = (page: Page, name: string, fullPage = true) =>
  page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage });

/** Abre o pedido da fila cujo motivo contém o texto informado. */
async function openExceptionWith(page: Page, reason: string) {
  await page.goto("/exceptions");
  const row = page.locator("tbody tr", { hasText: reason }).first();
  await expect(row, `nenhuma exceção aberta com o motivo "${reason}"`).toBeVisible();
  await row.getByRole("link", { name: "Corrigir" }).click();
  await expect(page.getByTestId("order-title")).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  // Dados de demonstração vêm do gerador do produto (mesma semente = mesmo lote; reexecutar só gera duplicatas).
  const res = await request.post("/api/generator", { data: { count: 60, seed: 11 } });
  expect(res.ok()).toBeTruthy();
});

test("01 painel", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
  await shot(page, "01-painel");
});

test("02 pedidos", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible();
  await shot(page, "02-pedidos");
});

test("03 detalhe de pedido com exceção", async ({ page }) => {
  await openExceptionWith(page, "Item não reconhecido");
  await shot(page, "03-detalhe-pedido-com-excecao");
});

test("04 fila de exceções", async ({ page }) => {
  await page.goto("/exceptions");
  await expect(page.getByTestId("open-count")).toBeVisible();
  await shot(page, "04-fila-de-excecoes");
});

test("05 correção (formulário preenchido, sem enviar)", async ({ page }) => {
  await openExceptionWith(page, "Item não reconhecido");
  await page.getByLabel("SKU do item 1").fill("DJM-020");
  await shot(page, "05-correcao");
});

test("06 aprovação humana (justificativa preenchida, sem enviar)", async ({ page }) => {
  await openExceptionWith(page, "Valor acima da alçada");
  await page.getByLabel(/Aprovar valor acima da alçada/).fill("aprovado pela gerente comercial");
  await shot(page, "06-aprovacao-humana");
});

test("07 gerador", async ({ page }) => {
  await page.goto("/generator");
  await expect(page.getByRole("heading", { name: /Gerador de pedidos/ })).toBeVisible();
  await shot(page, "07-gerador");
});

test("08 cadastros", async ({ page }) => {
  await page.goto("/catalog");
  await expect(page.getByRole("heading", { name: "Cadastros" })).toBeVisible();
  await shot(page, "08-cadastros", false);
});

test("09 medição", async ({ page }) => {
  await page.goto("/measurement");
  await expect(page.getByRole("heading", { name: "Relatório de medição" })).toBeVisible();
  await shot(page, "09-medicao");
});

test("10 notificações", async ({ page }) => {
  await page.goto("/notifications");
  await expect(page.getByRole("heading", { name: /Notificações/ })).toBeVisible();
  await shot(page, "10-notificacoes");
});

test("11 canvas do fluxo no n8n (opcional)", async ({ page, request }) => {
  const up = await request.get(`${N8N_URL}/healthz`).then((r) => r.ok(), () => false);
  test.skip(!up, "n8n não está no ar; ver docs/04-processo/n8n-como-rodar.md");
  const email = process.env.N8N_EMAIL;
  const password = process.env.N8N_PASSWORD;
  test.skip(!email || !password, "defina N8N_EMAIL e N8N_PASSWORD (usuário dono local do n8n)");
  await page.goto(`${N8N_URL}/signin`);
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password|senha/i).fill(password!);
  await page.getByRole("button", { name: /sign in|entrar/i }).click();
  await page.waitForURL(/home|workflows/);
  await page.getByText("Fluxo", { exact: false }).first().click();
  await page.waitForSelector(".canvas-node, [data-test-id='canvas-node']", { timeout: 30000 });
  await shot(page, "11-n8n-canvas", false);
});
