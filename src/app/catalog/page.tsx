import { prisma } from "@/lib/db";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const [customers, products] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { sku: "asc" } }),
  ]);

  return (
    <>
      <h1>Cadastros</h1>
      <p className="sub">Clientes e produtos fictícios (seed). Estoque e crédito usado representam a exportação diária do ERP, que aqui é uma premissa.</p>

      <section className="card">
        <h2>Clientes ({customers.length})</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>CNPJ (fictício)</th><th>E-mail</th><th className="num">Limite</th><th className="num">Usado</th><th>Ativo</th></tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.cnpj}</td>
                  <td>{c.email}</td>
                  <td className="num">{brl(c.creditLimit)}</td>
                  <td className="num">{brl(c.creditUsed)}</td>
                  <td>{c.active ? "Sim" : "Não"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2>Produtos ({products.length})</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>SKU</th><th>Produto</th><th>Un.</th><th className="num">Preço</th><th className="num">Estoque</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.sku}>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.unit}</td>
                  <td className="num">{brl(p.price)}</td>
                  <td className="num">{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
