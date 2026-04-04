import { MACHINES } from "./data";
import type { Machine } from "./types";

export function getMachineById(id: string): Machine | undefined {
  const normalized = id.replace(/^#/, "").trim();
  return MACHINES.find((m) => m.id === normalized);
}
