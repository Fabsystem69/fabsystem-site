"use client";

import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function EngineActionBar({
  pending,
  hasOutput,
  justRetained,
  error,
  warnings,
  notices,
  onCalculate,
  onRetain,
}: {
  pending: boolean;
  hasOutput: boolean;
  justRetained: boolean;
  error: string | null;
  warnings: Array<{ code: string; message: string }>;
  notices?: Array<{ code: string; message: string }>;
  onCalculate: () => void;
  onRetain: () => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onCalculate} disabled={pending}>
          {pending ? "Calcul en cours..." : "Calculer"}
        </Button>
        {hasOutput ? (
          <Button type="button" variant="primary" onClick={onRetain} disabled={pending}>
            Utiliser pour mon projet
          </Button>
        ) : null}
      </div>

      {justRetained ? (
        <Alert tone="success" title="Retenu">
          Cette valeur est maintenant retenue pour votre projet.
        </Alert>
      ) : null}

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {warnings.length > 0 ? (
        <Alert tone="warning">
          <ul className="list-disc space-y-1 pl-4">
            {warnings.map((warning, index) => (
              <li key={`${warning.code}-${index}`}>{warning.message}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {/* Remarques non bloquantes du moteur (ex. donnée manquante pour un
          seul appareil) : ton neutre, jamais un panneau rouge dramatique
          pour une information qui n'empêche pas le calcul (mission §5). */}
      {notices && notices.length > 0 ? (
        <Alert tone="info">
          <ul className="list-disc space-y-1 pl-4">
            {notices.map((notice, index) => (
              <li key={`${notice.code}-${index}`}>{notice.message}</li>
            ))}
          </ul>
        </Alert>
      ) : null}
    </div>
  );
}
