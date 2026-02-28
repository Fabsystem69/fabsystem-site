import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "@/lib/http-errors";
import { assertHumanDelay, parseContactPayload } from "@/lib/contact-request";

test("contact request parser accepts valid JSON payloads", async () => {
  const startedAt = String(Date.now() - 5_000);
  const request = new Request("http://localhost/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: "Fabien Lages",
      email: "fabien.lages@fabsystem.fr",
      message: "Bonjour FabSystem",
      startedAt,
    }),
  });

  const { data, attachments } = await parseContactPayload(request);

  assert.equal(data.name, "Fabien Lages");
  assert.equal(data.email, "fabien.lages@fabsystem.fr");
  assert.equal(attachments.length, 0);
  assert.doesNotThrow(() => assertHumanDelay(data.startedAt));
});

test("contact request parser rejects disallowed attachment types", async () => {
  const formData = new FormData();
  formData.set("name", "Fabien Lages");
  formData.set("email", "fabien.lages@fabsystem.fr");
  formData.set("message", "Bonjour FabSystem");
  formData.set("startedAt", String(Date.now() - 5_000));
  formData.append(
    "photos",
    new File(["not allowed"], "note.txt", { type: "text/plain" })
  );

  const request = new Request("http://localhost/api/contact", {
    method: "POST",
    body: formData,
  });

  await assert.rejects(
    () => parseContactPayload(request),
    (error: unknown) =>
      error instanceof HttpError &&
      error.status === 415 &&
      error.message === "Unsupported attachment type: text/plain"
  );
});
