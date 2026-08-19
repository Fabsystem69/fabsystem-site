import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest } from "@/lib/http-errors";
import { toErrorResponse } from "@/lib/server/error-response";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { getProject } from "@/lib/services/project";
import { getEngineRegistry } from "@/lib/engines/index";
import { createEngineContext } from "@/lib/engines/context";
import { createEngineRunner } from "@/lib/engines/runner";
import { isEngineError } from "@/lib/engines/errors";
import { getEngineInputSchema } from "@/lib/engine-payload";
import { translateEngineError, translateEngineResultError } from "@/lib/engine-error-messages";
import type { BaseEngine, EngineResult } from "@/lib/engines/types";

// UI-9 FINAL §4-5 : aucun message moteur brut (anglais, jargon
// Engine/payload/dependency) n'atteint jamais l'UI cliente — traduit ici,
// une seule fois, avant la réponse JSON. Le code interne est conservé
// (utile aux logs/tests), seul `message` change de langue/registre.
function presentEngineResult<TOutput>(result: EngineResult<TOutput>) {
  return {
    output: result.output,
    warnings: result.warnings ?? [],
    errors: (result.errors ?? []).map((error) => ({
      code: error.code,
      message: translateEngineResultError(error),
    })),
  };
}

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ projectId: string; engineId: string }>;
};

const bodySchema = z.object({
  input: z.unknown(),
  // "Calculer" (retain=false, défaut) exécute le moteur sans rien persister
  // — une simulation (MASTER-06 §25). "Utiliser pour mon projet" (retain=true)
  // est l'action explicite qui déclenche EngineRunner et persiste une
  // décision réelle (mission UI-8 FINAL §1-2) : aucune valeur calculée ne
  // devient retenue sans cette action explicite.
  retain: z.boolean().optional(),
});

// Point d'entrée moteur customer-facing (mission UI-8 FINAL §1). Réutilise
// exclusivement EngineRegistry (lib/engines/index.ts), EngineRunner
// (lib/engines/runner.ts) et les moteurs existants — aucune formule n'est
// réimplémentée ici, aucun nouveau moteur n'est créé.
export async function POST(request: Request, { params }: Params) {
  const { projectId, engineId } = await params;

  try {
    const actor = await requireCustomerActor();

    const inputSchema = getEngineInputSchema(engineId);
    if (!inputSchema) {
      throw badRequest("Unknown engine", { engineId });
    }

    const engine = getEngineRegistry().get(engineId) as BaseEngine<unknown, unknown> | undefined;
    if (!engine) {
      throw badRequest("Unknown engine", { engineId });
    }

    const json = await request.json().catch(() => null);
    const parsedBody = bodySchema.safeParse(json);
    if (!parsedBody.success) {
      throw badRequest("Invalid request body", parsedBody.error.flatten());
    }

    const parsedInput = inputSchema.safeParse(parsedBody.data.input);
    if (!parsedInput.success) {
      throw badRequest("Invalid engine input", parsedInput.error.flatten());
    }

    if (parsedBody.data.retain === true) {
      const runner = createEngineRunner();
      const result = await runner.run(actor, projectId, engine, parsedInput.data);
      return NextResponse.json({ engineId, retained: true, ...presentEngineResult(result) });
    }

    // Aperçu : ownership vérifié comme pour toute lecture de Project
    // (MASTER-10 §40), mais rien n'est écrit — ni retainValue, ni
    // dépendance, ni obsolescence.
    const project = await getProject(actor, projectId);
    const context = createEngineContext(project);
    const result = await engine.run(context, parsedInput.data);

    return NextResponse.json({ engineId, retained: false, ...presentEngineResult(result) });
  } catch (error) {
    if (isEngineError(error)) {
      return toErrorResponse(
        badRequest(translateEngineError(error), { code: error.code, details: error.details }),
        "api.projects.[projectId].engines.[engineId].run.post"
      );
    }
    return toErrorResponse(error, "api.projects.[projectId].engines.[engineId].run.post");
  }
}
