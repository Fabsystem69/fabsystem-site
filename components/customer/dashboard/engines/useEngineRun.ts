"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// UI-8 FINAL — hook partagé par tous les modules moteur de la Vue Project.
// "Calculer" (retain=false) exécute le moteur réel sans rien persister —
// une simulation (MASTER-06 §25). "Utiliser pour mon projet" (retain=true)
// est la décision explicite qui appelle EngineRunner côté serveur et
// persiste réellement la valeur retenue. Aucune formule n'est recalculée
// ici : ce hook ne fait qu'appeler la route serveur qui délègue elle-même
// au moteur réel.
export function useEngineRun(projectId: string, engineId: string) {
  const router = useRouter();
  const [output, setOutput] = useState<unknown>(null);
  const [warnings, setWarnings] = useState<Array<{ code: string; message: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [justRetained, setJustRetained] = useState(false);

  async function run(input: unknown, retain: boolean) {
    setPending(true);
    setError(null);
    setJustRetained(false);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/engines/${engineId}/run`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ input, retain }),
        }
      );

      const data = (await response.json().catch(() => null)) as
        | { output?: unknown; warnings?: Array<{ code: string; message: string }>; error?: string }
        | null;

      if (!response.ok || !data) {
        setError(data?.error || "Ce calcul n'a pas pu être effectué.");
        return null;
      }

      setOutput(data.output);
      setWarnings(data.warnings ?? []);

      if (retain) {
        setJustRetained(true);
        router.refresh();
      }

      return data.output;
    } catch {
      setError("Erreur réseau : le calcul n'a pas pu être effectué.");
      return null;
    } finally {
      setPending(false);
    }
  }

  return { output, warnings, error, pending, justRetained, run };
}
