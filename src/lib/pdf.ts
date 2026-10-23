/**
 * PDF "simples": só texto, sem compressão. Serve ao gerador de pedidos de exemplo e ao extrator.
 * Não lê PDF escaneado, comprimido (FlateDecode) ou com fontes embutidas — ver limitações no README.
 */

function escapePdf(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Converte para Latin-1 aproximado: o PDF usa a codificação WinAnsi, então acentos viram bytes únicos. */
function toLatin1(s: string): Buffer {
  return Buffer.from(s, "latin1");
}

export function createSimplePdf(lines: string[]): Buffer {
  const content =
    "BT\n/F1 11 Tf\n14 TL\n50 780 Td\n" + lines.map((l) => `(${escapePdf(l)}) Tj T*`).join("\n") + "\nET";
  const contentBuf = toLatin1(content);
  const objects: Buffer[] = [
    toLatin1("<< /Type /Catalog /Pages 2 0 R >>"),
    toLatin1("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    toLatin1(
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    ),
    Buffer.concat([toLatin1(`<< /Length ${contentBuf.length} >>\nstream\n`), contentBuf, toLatin1("\nendstream")]),
    toLatin1("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),
  ];

  const parts: Buffer[] = [toLatin1("%PDF-1.4\n")];
  const offsets: number[] = [];
  let pos = parts[0].length;
  objects.forEach((obj, i) => {
    offsets.push(pos);
    const chunk = Buffer.concat([toLatin1(`${i + 1} 0 obj\n`), obj, toLatin1("\nendobj\n")]);
    parts.push(chunk);
    pos += chunk.length;
  });
  const xref =
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("") +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`;
  parts.push(toLatin1(xref));
  return Buffer.concat(parts);
}

/** Extrai o texto dos operadores `(texto) Tj`, uma linha por operador. */
export function extractPdfText(buf: Buffer): string {
  const raw = buf.toString("latin1");
  if (!raw.startsWith("%PDF")) throw new Error("Anexo não é um PDF válido");
  const out: string[] = [];
  const re = /\(((?:\\.|[^\\)])*)\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    out.push(m[1].replace(/\\([()\\])/g, "$1"));
  }
  return out.join("\n");
}
