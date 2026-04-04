import type { Machine } from "./types";

export function sortedUniqueLots(machines: Machine[]): string[] {
  return [...new Set(machines.map((m) => m.lot))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
}
