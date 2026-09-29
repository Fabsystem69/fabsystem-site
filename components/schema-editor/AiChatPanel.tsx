"use client";

import { useEffect, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import type { SchemaAiChatMessage } from "@/lib/services/schema-ai-chat";
// Import depuis lib/ai/schema-ai-models.ts, jamais depuis
// lib/services/schema-ai-chat.ts : ce dernier importe (transitivement)
// lib/server/anthropic.ts, marqué "server-only" — un import de *valeur*
// depuis ce fichier dans ce composant client ferait échouer le build
// production (webpack inclurait tout le graphe serveur dans le bundle
// client). Voir l'échec réel corrigé le 29/09/2026.
import { SCHEMA_AI_MODELS, type SchemaAiModelId } from "@/lib/ai/schema-ai-models";

// Retour utilisateur : "je le veux vraiment mode chat box quand je suis sur
// mon éditeur en mode admin, pour créer ou évaluer les schémas, me faire
// gagner du temps". Panneau flottant, replié par défaut (n'empiète jamais
// sur le canevas tant qu'on ne l'ouvre pas), réservé admin — affiché
// uniquement si `adminMode` côté appelant (Ribbon.tsx), mais la vraie garde
// vit côté route (/api/schema-editor/ai-chat, getSessionFromCookies()).
// L'état du schéma (nœuds/câbles) est renvoyé à CHAQUE message, jamais
// figé au premier tour — voir lib/services/schema-ai-chat.ts.
export function AiChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SchemaAiChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<SchemaAiModelId>("claude-opus-5");
  const projectName = useSchemaStore((s) => s.projectName);
  const { getNodes, getEdges } = useReactFlow();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const nextMessages: SchemaAiChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
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
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "La réponse a échoué.");
    } finally {
      setLoading(false);
    }
  }

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
          <p className="text-xs text-slate-500">Avis et pistes, jamais une certification.</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-2xl text-slate-500" aria-label="Fermer l'assistant">
          ×
        </button>
      </div>

      <div className="border-b border-slate-200 px-4 py-2">
        <label className="flex items-center gap-2 text-xs text-slate-500">
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
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Posez une question sur ce schéma, ou demandez un avis global.</p>
            <button
              type="button"
              onClick={() => send("Évalue ce schéma : qu'est-ce qui mérite une vérification avant de le montrer au client ?")}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Évaluer ce schéma
            </button>
          </div>
        ) : null}
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                message.role === "user" ? "bg-slate-900 text-white" : "border border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
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
          placeholder="Votre question…"
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
