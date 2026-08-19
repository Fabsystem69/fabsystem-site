import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/server/error-response";
import { parseCreateProjectInput } from "@/lib/project-payload";
import { logServerEvent } from "@/lib/server-log";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { createProject, deleteProject, listProjectsForCustomer } from "@/lib/services/project";
import { applyProjectStarter } from "@/lib/project-starters";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireCustomerActor();
    const projects = await listProjectsForCustomer(
      actor,
      actor.role === "customer" ? actor.customerId : ""
    );

    return NextResponse.json({ projects });
  } catch (error) {
    return toErrorResponse(error, "api.projects.get");
  }
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, {
      name: "projects-create",
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });

    const actor = await requireCustomerActor();

    if (actor.role !== "customer") {
      throw new Error("Unexpected actor role");
    }

    const json = await request.json().catch(() => null);
    const input = parseCreateProjectInput(json);

    const project = await createProject(actor, {
      customerId: actor.customerId,
      name: input.name,
      assetType: input.assetType,
      voltage: input.voltage,
    });

    if (input.starter) {
      try {
        await applyProjectStarter(actor, project, input.starter);
      } catch (error) {
        try {
          await deleteProject(actor, project.id, { confirm: true });
        } catch (rollbackError) {
          logServerEvent("error", "api.projects.post: starter rollback failed", {
            projectId: project.id,
            starter: input.starter,
            error: rollbackError,
          });
        }
        throw error;
      }
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "api.projects.post");
  }
}
