import type { PrismaClient } from "@prisma/client";

/**
 * Dados 100% fictícios. CNPJs seguem a série 00.100.000/00NN-NN (zeros evidentes, sem dígito verificador real),
 * telefones usam (31) 90000-00NN e e-mails usam o TLD reservado ".example".
 */
export interface SeedCustomer {
  cnpj: string;
  name: string;
  email: string;
  phone: string;
  creditLimit: number;
  creditUsed: number;
  active: boolean;
}

export interface SeedProduct {
  sku: string;
  name: string;
  aliases: string[];
  unit: string;
  price: number;
  stock: number;
}

const c = (
  n: number,
  name: string,
  email: string,
  creditLimit: number,
  creditUsed: number,
  active = true,
): SeedCustomer => ({
  cnpj: `00.100.000/${String(n).padStart(4, "0")}-${String(n).padStart(2, "0")}`,
  name,
  email,
  phone: `(31) 90000-${String(n).padStart(4, "0")}`,
  creditLimit,
  creditUsed,
  active,
});

export const SEED_CUSTOMERS: SeedCustomer[] = [
  c(1, "Elétrica Pinheiro Ltda", "compras@pinheiro-eletrica.example", 80000, 14000),
  c(2, "Instalações Silva & Filhos", "pedidos@silvaefilhos.example", 60000, 9000),
  c(3, "Construtora Alvorada", "suprimentos@alvorada-obras.example", 150000, 40000),
  c(4, "Mercado Bom Preço", "gerencia@bompreco-mercado.example", 800, 300),
  c(5, "Casa do Eletricista Rocha", "rocha@casadoeletricista.example", 45000, 6000),
  c(6, "Obras e Reformas Mendes", "mendes@obrasereformas.example", 70000, 21000),
  c(7, "Eletro Vale Comércio", "vendas@eletrovale.example", 120000, 30000),
  c(8, "Predial Souza Manutenção", "souza@predialmanutencao.example", 50000, 8000),
  c(9, "Instaladora Nogueira", "nogueira@instaladora-nogueira.example", 40000, 4000),
  c(10, "Material de Construção Ferraz", "compras@ferraz-materiais.example", 100000, 25000),
  c(11, "Condomínio Jardim das Acácias", "sindico@jardimdasacacias.example", 30000, 2000),
  c(12, "Carlos Araújo Eletricista ME", "carlos@araujo-eletricista.example", 25000, 3500),
  c(13, "Comercial Duarte (inativo)", "duarte@comercialduarte.example", 20000, 0, false),
];

/** Cliente com crédito curto, usado nos cenários de limite excedido. */
export const CREDIT_TIGHT_CUSTOMER_CNPJ = SEED_CUSTOMERS[3].cnpj;
/** Produto de estoque baixo, usado nos cenários de falta de estoque. */
export const LOW_STOCK_SKU = "LAM-015";

const p = (
  sku: string,
  name: string,
  aliases: string[],
  unit: string,
  price: number,
  stock: number,
): SeedProduct => ({ sku, name, aliases, unit, price, stock });

export const SEED_PRODUCTS: SeedProduct[] = [
  p("DJM-020", "Disjuntor monopolar 20A", ["disjuntor 20a", "disj 20a"], "un", 14.9, 20000),
  p("DJM-025", "Disjuntor monopolar 25A", ["disjuntor 25a", "disj 25a"], "un", 15.5, 20000),
  p("DJM-032", "Disjuntor monopolar 32A", ["disjuntor 32a", "disj 32a"], "un", 16.9, 20000),
  p("DJB-040", "Disjuntor bipolar 40A", ["disjuntor bipolar 40a"], "un", 38.0, 8000),
  p("DRR-040", "Interruptor diferencial DR 40A", ["dr 40a", "interruptor dr 40a"], "un", 189.0, 1500),
  p("CAB-015", "Cabo flexível 1,5mm (rolo 100m)", ["cabo 1,5mm", "fio 1,5mm"], "rolo", 189.9, 2000),
  p("CAB-025", "Cabo flexível 2,5mm (rolo 100m)", ["cabo 2,5mm", "fio 2,5mm"], "rolo", 289.9, 2000),
  p("CAB-040", "Cabo flexível 4mm (rolo 100m)", ["cabo 4mm", "fio 4mm"], "rolo", 459.0, 1500),
  p("CAB-100", "Cabo flexível 10mm (rolo 100m)", ["cabo 10mm", "fio 10mm"], "rolo", 1190.0, 400),
  p("TOM-010", "Tomada 10A", ["tomada 10a"], "un", 9.9, 20000),
  p("TOM-020", "Tomada 20A", ["tomada 20a"], "un", 12.5, 20000),
  p("INT-001", "Interruptor simples", [], "un", 8.9, 20000),
  p("INT-002", "Interruptor duplo", [], "un", 14.9, 15000),
  p("LAM-009", "Lâmpada LED 9W", ["lampada 9w"], "un", 7.5, 30000),
  p(LOW_STOCK_SKU, "Lâmpada LED 15W", ["lampada 15w"], "un", 12.9, 5),
  p("FIT-019", "Fita isolante 19mm", ["fita isolante"], "un", 5.9, 30000),
  p("ELT-025", "Eletroduto flexível 25mm (rolo 50m)", ["eletroduto 25mm", "conduite 25mm"], "rolo", 94.0, 3000),
  p("CXE-042", "Caixa de embutir 4x2", ["caixa 4x2"], "un", 3.2, 40000),
  p("CXE-044", "Caixa de embutir 4x4", ["caixa 4x4"], "un", 4.6, 40000),
  p("QDD-012", "Quadro de distribuição 12 disjuntores", ["quadro 12 disjuntores", "quadro de distribuicao 12"], "un", 119.0, 800),
  p("QDD-024", "Quadro de distribuição 24 disjuntores", ["quadro 24 disjuntores", "quadro de distribuicao 24"], "un", 189.0, 600),
  p("PLG-010", "Plugue macho 10A", ["plugue 10a"], "un", 4.5, 25000),
  p("PLG-020", "Plugue macho 20A", ["plugue 20a"], "un", 5.9, 25000),
  p("PAR-006", "Parafuso com bucha 6mm (cento)", ["bucha 6mm"], "cento", 12.0, 9000),
  p("ABR-020", "Abraçadeira de nylon 20cm (pacote 100)", ["abracadeira 20cm"], "pacote", 14.5, 9000),
  p("LUV-025", "Luva de emenda 25mm", ["luva 25mm"], "un", 3.8, 25000),
  p("ELC-050", "Eletrocalha perfurada 50x50 (barra 3m)", ["eletrocalha 50x50"], "barra", 38.0, 2500),
];

/** SKUs usados em pedidos "limpos" dos cenários de exemplo: baratos e com estoque farto. */
export const EVERYDAY_SKUS = SEED_PRODUCTS.filter(
  (x) => !["CAB-100", "DRR-040", "QDD-012", "QDD-024", "ELC-050", LOW_STOCK_SKU].includes(x.sku),
);

/**
 * Recarrega os cadastros e ZERA os dados transacionais (pedidos, mensagens, auditoria, notificações).
 * Uso: `npm run db:seed` e preparação dos testes.
 */
export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.auditEvent.deleteMany(),
    prisma.exceptionCase.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.inboundMessage.deleteMany(),
  ]);
  for (const x of SEED_CUSTOMERS) {
    await prisma.customer.upsert({ where: { cnpj: x.cnpj }, update: x, create: x });
  }
  for (const x of SEED_PRODUCTS) {
    await prisma.product.upsert({ where: { sku: x.sku }, update: { ...x, active: true }, create: x });
  }
}
