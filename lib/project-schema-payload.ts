import { badRequest } from "@/lib/http-errors";
import {
  validateSaveProjectSchemaPayload,
  type SaveProjectSchemaPayload,
} from "@/lib/project-schema-contract";

export type { SaveProjectSchemaPayload } from "@/lib/project-schema-contract";

export function parseSaveProjectSchemaInput(input: unknown): SaveProjectSchemaPayload {
  const result = validateSaveProjectSchemaPayload(input);
  if (!result.success) {
    throw badRequest("Invalid schema payload", result.details);
  }
  return result.data;
}
