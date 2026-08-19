import { NextResponse } from "next/server";
import { badRequest } from "@/lib/http-errors";
import { toErrorResponse } from "@/lib/server/error-response";
import { requireApiSession } from "@/lib/internal-api";
import { parseAdminCreateProjectInput } from "@/lib/project-payload";
import { adminActor } from "@/lib/server/project-actor";
import { createProject, listProjectsForCustomer } from "@/lib/services/project";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId")?.trim();

    if (!customerId) {
      throw badRequest("customerId query parameter is required");
    }

    const projects = await listProjectsForCustomer(adminActor(), customerId);

    return NextResponse.json({ projects });
  } catch (error) {
    return toErrorResponse(error, "api.internal.projects.get");
  }
}

export async function POST(req: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const json = await req.json().catch(() => null);
    const input = parseAdminCreateProjectInput(json);

    const project = await createProject(adminActor(), input);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "api.internal.projects.post");
  }
}
