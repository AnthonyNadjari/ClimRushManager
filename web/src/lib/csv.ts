import type { ClientRow } from "./types";

export function clientsToCsv(clients: ClientRow[]): string {
  const header = "nom,telephone,email,statut,machines,ca_ht,numeros_unites";
  const lines = clients.map((c) =>
    [
      escapeCsv(c.name),
      escapeCsv(c.phone),
      escapeCsv(c.email),
      c.status,
      c.machines,
      c.caHt,
      escapeCsv(c.machineNumbers?.join(";") ?? ""),
    ].join(","),
  );
  return [header, ...lines].join("\r\n");
}

function escapeCsv(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function triggerDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
