import { z } from "zod";

// Échec de build réel corrigé : lib/services/schema-ai-chat.ts importe
// lib/server/anthropic.ts, marqué "server-only" — un simple import de
// *valeur* (SCHEMA_AI_MODELS) depuis ce fichier dans un composant client
// (AiChatPanel.tsx) force webpack à inclure tout le graphe de modules dans
// le bundle client, ce qui fait échouer le build production. Ce fichier
// séparé n'a aucune dépendance serveur : il peut être importé sans risque
// aussi bien depuis le service, la route API que le composant client.
export const SCHEMA_AI_MODELS = {
  "claude-opus-5": "Opus 5 (plus précis)",
  "claude-sonnet-5": "Sonnet 5 (plus rapide, moins cher)",
} as const;

export type SchemaAiModelId = keyof typeof SCHEMA_AI_MODELS;

export const schemaAiModelSchema = z.enum(Object.keys(SCHEMA_AI_MODELS) as [SchemaAiModelId, ...SchemaAiModelId[]]);
