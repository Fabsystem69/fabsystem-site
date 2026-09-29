import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Retour utilisateur : "moteur IA pour créer ou évaluer les schémas, pour
// moi uniquement" — même principe que lib/server/nodemailer.ts (client
// server-only, instancié une seule fois). La clé ne doit jamais atteindre
// le navigateur : ce module est marqué "server-only" pour empêcher un
// import accidentel côté client.
const globalForAnthropic = globalThis as { anthropic?: Anthropic };

function createAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
  return new Anthropic({ apiKey });
}

export function getAnthropicClient() {
  const client = globalForAnthropic.anthropic ?? createAnthropicClient();
  if (process.env.NODE_ENV !== "production") {
    globalForAnthropic.anthropic = client;
  }
  return client;
}
