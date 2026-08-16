import { z } from "zod";

export const PROJECT_STARTER_IDS = ["aferiy-p280-guide", "victron-light-guide"] as const;

export const projectStarterSchema = z.enum(PROJECT_STARTER_IDS);

export type ProjectStarterId = (typeof PROJECT_STARTER_IDS)[number];

export function isProjectStarterId(value: string | undefined | null): value is ProjectStarterId {
  return typeof value === "string" && PROJECT_STARTER_IDS.includes(value as ProjectStarterId);
}
