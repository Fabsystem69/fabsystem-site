import assert from "node:assert/strict";
import test from "node:test";
import { parseContactPayload } from "@/lib/contact-request";
import { buildContactMessage, buildProspectIntakeFromContactRequest } from "@/lib/contact-message";

test("contact details survive validation and email construction", async () => {
  const { data } = await parseContactPayload(new Request("http://localhost/api/contact", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Client test", email: "test@example.invalid", message: "Mon projet de van", startedAt: Date.now() - 5000,
      requestType: "Coaching", urgency: "Ce mois-ci", context: "Installation commencée", supportType: "Van" }),
  }));
  const message = buildContactMessage(data);
  for (const detail of ["Coaching", "Ce mois-ci", "Installation commencée", "Van", "Mon projet de van"]) {
    assert.ok(message.text.includes(detail));
  }
  assert.equal(message.subject, "FabSystem — Contact (Client test)");
});

test("visio-specific details remain in the email", async () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ source: "visio", name: "Client test", email: "test@example.invalid", message: "Mon projet de van", startedAt: String(Date.now() - 5000), batteryCapacity: "200 Ah", priorityQ1: "Vérifier le montage", photosLink: "https://example.invalid/photos" })) form.set(key, value);
  const { data } = await parseContactPayload(new Request("http://localhost/api/contact", { method: "POST", body: form }));
  const message = buildContactMessage(data);
  assert.match(message.subject, /VISIO/);
  for (const detail of ["200 Ah", "Vérifier le montage", "https://example.invalid/photos"]) assert.ok(message.text.includes(detail));
});

test("buildProspectIntakeFromContactRequest mappe la demande vers un prospect exploitable immédiatement", async () => {
  const { data } = await parseContactPayload(new Request("http://localhost/api/contact", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Client test", email: "test@example.invalid", phone: "0600000000", message: "Mon projet de van", startedAt: Date.now() - 5000,
      requestType: "Coaching" }),
  }));
  const before = Date.now();
  const intake = buildProspectIntakeFromContactRequest(data);

  assert.equal(intake.name, "Client test");
  assert.equal(intake.email, "test@example.invalid");
  assert.equal(intake.phone, "0600000000");
  assert.match(intake.besoinElectricite, /Coaching/);
  assert.match(intake.besoinElectricite, /Mon projet de van/);
  assert.match(intake.nextAction, /Répondre/);
  // nextActionAt = maintenant, pour apparaitre immediatement dans "Prospects
  // a relancer" sur le tableau de bord (pas une nouvelle carte dediee).
  assert.ok(intake.nextActionAt.getTime() >= before);
});

test("buildProspectIntakeFromContactRequest distingue la demande de visio dans la prochaine action", async () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ source: "visio", name: "Client test", email: "test@example.invalid", message: "Mon projet de van", startedAt: String(Date.now() - 5000) })) form.set(key, value);
  const { data } = await parseContactPayload(new Request("http://localhost/api/contact", { method: "POST", body: form }));
  const intake = buildProspectIntakeFromContactRequest(data);

  assert.match(intake.nextAction, /visio/);
});
