"use client";

import { useEffect, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { z } from "zod";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import type { SchemaAiChatMessage } from "@/lib/services/schema-ai-chat";
// Import type-only depuis lib/services/schema-ai-generate.ts (jamais une
// valeur) : ce fichier importe (transitivement) lib/server/anthropic.ts,
// marqué "server-only" — un import de *valeur* ferait échouer le build
// production, exactement comme le bug réel corrigé le 29/09/2026 pour
// SCHEMA_AI_MODELS (voir lib/ai/schema-ai-models.ts). `import type` est
// entièrement effacé à la compilation, donc sans risque ici.
import type { SchemaAiGenerateMessage, SchemaGenerationResult } from "@/lib/services/schema-ai-generate";
// generatedSchemaPlanSchema importé en VALEUR (pas seulement le type) :
// lib/schema-editor/generated-plan.ts est pur zod, sans dépendance serveur,
// donc sans risque ici — nécessaire pour revalider l'historique relu depuis
// localStorage (voir loadStoredGenerateHistory plus bas).
import { generatedSchemaPlanSchema, type GeneratedSchemaPlan } from "@/lib/schema-editor/generated-plan";
// Import depuis lib/ai/schema-ai-models.ts, jamais depuis
// lib/services/schema-ai-chat.ts : ce dernier importe (transitivement)
// lib/server/anthropic.ts, marqué "server-only" — un import de *valeur*
// depuis ce fichier dans ce composant client ferait échouer le build
// production (webpack inclurait tout le graphe serveur dans le bundle
// client). Voir l'échec réel corrigé le 29/09/2026.
import { SCHEMA_AI_MODELS, type SchemaAiModelId } from "@/lib/ai/schema-ai-models";

// Retour utilisateur : "je veux que la chatbox garde en mémoire la
// discussion sur chaque projet" — historique persisté dans localStorage,
// une clé par projet (schema.projectId), jamais côté serveur : c'est une
// commodité pour un seul admin sur son propre navigateur, pas une donnée
// partagée. Un schéma pas encore enregistré (projectId null) n'a pas
// d'identité stable : son historique reste seulement en mémoire (perdu au
// rechargement), comme avant.
function chatHistoryStorageKey(projectId: string) {
  return `fabsystem:schema-ai-chat:${projectId}`;
}

function loadStoredHistory(projectId: string | null): SchemaAiChatMessage[] {
  if (!projectId || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(chatHistoryStorageKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SchemaAiChatMessage[]) : [];
  } catch {
    return [];
  }
}

// Mode "Générer" (30/09/2026) : contrairement à l'évaluation, l'IA peut soit
// poser une question en texte (capacité batterie, ampérage DC-DC...) soit
// proposer un plan structuré à valider — jamais les deux mélangés. Un
// message assistant de type "plan" garde son statut (pending/applied/
// dismissed) pour ne jamais pouvoir être appliqué deux fois par erreur après
// un rechargement de la page.
type GenerateUiMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; kind: "message"; content: string }
  | { role: "assistant"; kind: "plan"; intro: string; plan: GeneratedSchemaPlan; status: "pending" | "applied" | "dismissed" };

function generateHistoryStorageKey(projectId: string) {
  return `fabsystem:schema-ai-generate:${projectId}`;
}

// Revalide chaque message au rechargement (pas un simple cast) : un
// message "plan" invalide ou d'un format antérieur ferait planter le rendu
// de la carte de proposition (message.plan.components.map...) et, plus
// grave, pourrait être appliqué au canevas sans repasser par la validation
// catalogue faite côté service au moment de la génération. Revue de
// sécurité du 30/09/2026.
const generateUiMessageSchema = z.union([
  z.object({ role: z.literal("user"), content: z.string() }),
  z.object({ role: z.literal("assistant"), kind: z.literal("message"), content: z.string() }),
  z.object({
    role: z.literal("assistant"),
    kind: z.literal("plan"),
    intro: z.string(),
    plan: generatedSchemaPlanSchema,
    status: z.enum(["pending", "applied", "dismissed"]),
  }),
]);

function loadStoredGenerateHistory(projectId: string | null): GenerateUiMessage[] {
  if (!projectId || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(generateHistoryStorageKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is GenerateUiMessage => generateUiMessageSchema.safeParse(item).success);
  } catch {
    return [];
  }
}

// Historique envoyé à l'API : une proposition de plan déjà faite redescend
// en simple texte (son intro + un résumé) pour les tours suivants — le
// service ne rejoue jamais un tool_use passé, seulement du texte (même
// contrat que schemaAiGenerateMessagesSchema).
function toApiHistory(messages: GenerateUiMessage[]): SchemaAiGenerateMessage[] {
  return messages.map((message) => {
    if (message.role === "user") return { role: "user", content: message.content };
    if (message.kind === "message") return { role: "assistant", content: message.content };
    const count = message.plan.components.length;
    return {
      role: "assistant",
      content: `${message.intro} (proposition : "${message.plan.zoneLabel}", ${count} composant${count > 1 ? "s" : ""})`,
    };
  });
}

type ChatMode = "chat" | "generate";

// Retour utilisateur : "je le veux vraiment mode chat box quand je suis sur
// mon éditeur en mode admin, pour créer ou évaluer les schémas, me faire
// gagner du temps". Panneau flottant, replié par défaut (n'empiète jamais
// sur le canevas tant qu'on ne l'ouvre pas), réservé admin — affiché
// uniquement si `adminMode` côté appelant (Ribbon.tsx), mais la vraie garde
// vit côté route (/api/schema-editor/ai-chat et /ai-generate,
// getSessionFromCookies()). L'état du schéma (nœuds/câbles) est renvoyé à
// CHAQUE message, jamais figé au premier tour.
//
// Bascule explicite "Discuter / Générer" plutôt qu'une détection automatique
// de l'intention : un message ambigu ne doit jamais pouvoir déclencher une
// proposition de composants non voulue — l'admin choisit toujours le mode
// avant d'écrire.
export function AiChatPanel() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("chat");
  const projectId = useSchemaStore((s) => s.projectId);
  const [chatMessages, setChatMessages] = useState<SchemaAiChatMessage[]>(() => loadStoredHistory(projectId));
  const [generateMessages, setGenerateMessages] = useState<GenerateUiMessage[]>(() => loadStoredGenerateHistory(projectId));
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<SchemaAiModelId>("claude-opus-5");
  const projectName = useSchemaStore((s) => s.projectName);
  const insertGeneratedPlan = useSchemaStore((s) => s.insertGeneratedPlan);
  const select = useSchemaStore((s) => s.select);
  const { getNodes, getEdges } = useReactFlow();
  const listRef = useRef<HTMLDivElement>(null);

  // Recharge l'historique quand on change de projet (le composant, lui, ne
  // démonte pas forcément entre deux schémas dans la même session éditeur).
  useEffect(() => {
    setChatMessages(loadStoredHistory(projectId));
    setGenerateMessages(loadStoredGenerateHistory(projectId));
  }, [projectId]);

  useEffect(() => {
    if (!projectId || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(chatHistoryStorageKey(projectId), JSON.stringify(chatMessages));
    } catch {
      // Stockage indisponible (navigation privée, quota, etc.) — l'historique
      // reste utilisable en mémoire pour la session en cours, silencieusement.
    }
  }, [projectId, chatMessages]);

  useEffect(() => {
    if (!projectId || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(generateHistoryStorageKey(projectId), JSON.stringify(generateMessages));
    } catch {
      // Idem : commodité locale, jamais bloquant.
    }
  }, [projectId, generateMessages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [chatMessages, generateMessages, loading, mode]);

  async function sendChat(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    // .slice(-40) : même borne que schemaAiChatMessagesSchema côté serveur
    // (max 40 messages) — sans ce plafond côté client, un historique plus
    // long que la limite serveur ferait échouer TOUT envoi suivant avec
    // "Messages invalides", sans autre recours que "Effacer" pour s'en sortir.
    const nextMessages: SchemaAiChatMessage[] = [...chatMessages, { role: "user" as const, content: trimmed }].slice(-40);
    setChatMessages(nextMessages);
    setDraft("");
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/schema-editor/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, nodes: getNodes(), edges: getEdges(), projectName, model }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(typeof body?.error === "string" ? body.error : "La réponse a échoué.");
      }
      const { reply } = (await response.json()) as { reply: string };
      setChatMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "La réponse a échoué.");
      // Retire le message utilisateur qui vient d'échouer plutôt que de le
      // garder bloqué dans l'historique pour toujours (sinon tout envoi
      // suivant rejoue le même échec) ; le texte est restitué dans le
      // brouillon pour ne pas le faire retaper.
      setChatMessages((current) => current.slice(0, -1));
      setDraft(trimmed);
    } finally {
      setLoading(false);
    }
  }

  async function sendGenerate(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    // .slice(-40) : même borne que schemaAiGenerateMessagesSchema côté
    // serveur — voir le commentaire équivalent dans sendChat.
    const nextMessages: GenerateUiMessage[] = [...generateMessages, { role: "user" as const, content: trimmed }].slice(-40);
    setGenerateMessages(nextMessages);
    setDraft("");
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/schema-editor/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toApiHistory(nextMessages), nodes: getNodes(), edges: getEdges(), projectName, model }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(typeof body?.error === "string" ? body.error : "La réponse a échoué.");
      }
      const result = (await response.json()) as SchemaGenerationResult;
      if (result.kind === "plan") {
        setGenerateMessages((current) => [...current, { role: "assistant", kind: "plan", intro: result.intro, plan: result.plan, status: "pending" }]);
      } else {
        setGenerateMessages((current) => [...current, { role: "assistant", kind: "message", content: result.text }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "La réponse a échoué.");
      setGenerateMessages((current) => current.slice(0, -1));
      setDraft(trimmed);
    } finally {
      setLoading(false);
    }
  }

  function send(text: string) {
    if (mode === "chat") void sendChat(text);
    else void sendGenerate(text);
  }

  function applyPlan(index: number, message: { status: "pending" | "applied" | "dismissed"; plan: GeneratedSchemaPlan }) {
    // Garde-fou contre un double-clic (l'état pending -> applied passe par
    // un rendu asynchrone) : sans ce contrôle, un clic très rapide pourrait
    // poser la même zone deux fois sur le canevas.
    if (message.status !== "pending") return;
    const zoneId = insertGeneratedPlan(message.plan);
    select("node", zoneId);
    setGenerateMessages((current) => current.map((m, i) => (i === index && m.role === "assistant" && m.kind === "plan" ? { ...m, status: "applied" } : m)));
  }

  function dismissPlan(index: number) {
    setGenerateMessages((current) => current.map((m, i) => (i === index && m.role === "assistant" && m.kind === "plan" ? { ...m, status: "dismissed" } : m)));
  }

  const activeMessages = mode === "chat" ? chatMessages : generateMessages;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir l'assistant IA"
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-2xl text-white shadow-xl transition-base hover:bg-amber-600"
      >
        💬
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex h-[32rem] w-96 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Assistant IA — schéma</p>
          <p className="text-xs text-slate-500">
            {mode === "chat" ? "Avis et pistes, jamais une certification." : "Propose un ajout à valider, jamais appliqué directement."}
          </p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-2xl text-slate-500" aria-label="Fermer l'assistant">
          ×
        </button>
      </div>

      <div className="flex border-b border-slate-200 px-4 pt-2">
        {(["chat", "generate"] as const).map((candidate) => (
          <button
            key={candidate}
            type="button"
            onClick={() => {
              setMode(candidate);
              setError(null);
              // Un brouillon tapé dans un mode ne doit jamais pouvoir être
              // envoyé par erreur dans l'autre après une bascule.
              setDraft("");
            }}
            className={`-mb-px rounded-t-lg border border-b-0 px-3 py-1.5 text-xs font-medium ${
              mode === candidate ? "border-slate-200 bg-white text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {candidate === "chat" ? "Discuter" : "Générer"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2">
        <label className="flex flex-1 items-center gap-2 text-xs text-slate-500">
          Modèle
          <select
            value={model}
            onChange={(event) => setModel(event.target.value as SchemaAiModelId)}
            className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-amber-500"
          >
            {Object.entries(SCHEMA_AI_MODELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {activeMessages.length > 0 ? (
          <button
            type="button"
            onClick={() => (mode === "chat" ? setChatMessages([]) : setGenerateMessages([]))}
            className="whitespace-nowrap text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
          >
            Effacer
          </button>
        ) : null}
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {activeMessages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">
              {mode === "chat" ? "Posez une question sur ce schéma, ou demandez un avis global." : "Décrivez ce que vous voulez ajouter au schéma."}
            </p>
            {mode === "chat" ? (
              <button
                type="button"
                onClick={() => send("Évalue ce schéma : qu'est-ce qui mérite une vérification avant de le montrer au client ?")}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Évaluer ce schéma
              </button>
            ) : null}
          </div>
        ) : null}

        {mode === "chat"
          ? chatMessages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                    message.role === "user" ? "bg-slate-900 text-white" : "border border-slate-200 bg-slate-50 text-slate-800"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))
          : generateMessages.map((message, index) => {
              if (message.role === "user") {
                return (
                  <div key={index} className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap rounded-xl bg-slate-900 px-3 py-2 text-sm text-white">{message.content}</p>
                  </div>
                );
              }
              if (message.kind === "message") {
                return (
                  <div key={index} className="flex justify-start">
                    <p className="max-w-[85%] whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                      {message.content}
                    </p>
                  </div>
                );
              }
              return (
                <div key={index} className="flex justify-start">
                  <div className="max-w-[90%] space-y-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-slate-800">
                    <p className="whitespace-pre-wrap">{message.intro}</p>
                    <div className="rounded-lg border border-amber-200 bg-white px-2.5 py-2">
                      <p className="text-xs font-semibold text-slate-700">Zone « {message.plan.zoneLabel} »</p>
                      <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                        {message.plan.components.map((component) => (
                          <li key={component.key}>• {component.label}</li>
                        ))}
                      </ul>
                      <p className="mt-1 text-xs text-slate-500">
                        {message.plan.edges.length} câble{message.plan.edges.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    {message.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => applyPlan(index, message)}
                          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                        >
                          Appliquer au schéma
                        </button>
                        <button
                          type="button"
                          onClick={() => dismissPlan(index)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Ignorer
                        </button>
                      </div>
                    ) : message.status === "applied" ? (
                      <p className="text-xs font-medium text-emerald-700">✓ Appliqué — vérifiez le panneau « À vérifier ».</p>
                    ) : (
                      <p className="text-xs text-slate-400">Ignoré.</p>
                    )}
                  </div>
                </div>
              );
            })}

        {loading ? <p className="text-sm text-slate-400">…</p> : null}
        {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
        className="flex items-end gap-2 border-t border-slate-200 p-3"
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send(draft);
            }
          }}
          rows={2}
          // 4000 : même borne que chatMessageSchema/toolInputSchema côté
          // serveur — sans ce plafond côté client, un message plus long
          // serait rejeté après l'envoi plutôt qu'empêché à la saisie.
          maxLength={4000}
          placeholder={mode === "chat" ? "Votre question…" : "Ex. : un van T2 avec solaire et DC-DC…"}
          className="min-h-11 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={loading || !draft.trim()}
          className="flex h-11 items-center justify-center rounded-lg bg-amber-500 px-4 text-sm font-semibold text-white transition-base hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
