import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fluxo — Distribuidora Santa Clara (estudo de caso fictício)",
  description: "Automação de pedidos por e-mail: painel, fila de exceções e trilha de auditoria.",
};

const links = [
  { href: "/", label: "Painel" },
  { href: "/orders", label: "Pedidos" },
  { href: "/exceptions", label: "Fila de exceções" },
  { href: "/generator", label: "Gerador" },
  { href: "/catalog", label: "Cadastros" },
  { href: "/notifications", label: "Notificações" },
  { href: "/measurement", label: "Medição" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="topbar">
          <div className="shell">
            <span className="brand">
              Fluxo<small>Distribuidora Santa Clara · estudo fictício</small>
            </span>
            <nav className="nav" aria-label="Navegação principal">
              {links.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
