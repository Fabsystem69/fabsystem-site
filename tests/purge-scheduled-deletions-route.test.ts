import assert from "node:assert/strict";
import test from "node:test";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

// UI-8.1 §3/§7 : le déclenchement automatique (Vercel Cron) doit être
// authentifié par CRON_SECRET — jamais une route de purge librement
// accessible. Ce test couvre uniquement la logique d'autorisation ;
// purgeDueScheduledDeletions() elle-même reste couverte par
// tests/project-service.test.ts (source de vérité unique, non dupliquée
// ici).

function withCronSecret(value: string | undefined, fn: () => void) {
  const previous = process.env.CRON_SECRET;
  if (value === undefined) {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = value;
  }
  try {
    fn();
  } finally {
    if (previous === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = previous;
    }
  }
}

test("a cron request with the correct bearer secret is authorized", () => {
  withCronSecret("test-secret-value", () => {
    const request = new Request("http://localhost/api/internal/jobs/purge-scheduled-deletions", {
      headers: { authorization: "Bearer test-secret-value" },
    });
    assert.equal(isAuthorizedCronRequest(request), true);
  });
});

test("a cron request with a wrong secret is rejected", () => {
  withCronSecret("test-secret-value", () => {
    const request = new Request("http://localhost/api/internal/jobs/purge-scheduled-deletions", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    assert.equal(isAuthorizedCronRequest(request), false);
  });
});

test("a request with no Authorization header is rejected", () => {
  withCronSecret("test-secret-value", () => {
    const request = new Request("http://localhost/api/internal/jobs/purge-scheduled-deletions");
    assert.equal(isAuthorizedCronRequest(request), false);
  });
});

test("when CRON_SECRET is not configured, no cron request can ever be authorized", () => {
  withCronSecret(undefined, () => {
    const request = new Request("http://localhost/api/internal/jobs/purge-scheduled-deletions", {
      headers: { authorization: "Bearer anything" },
    });
    assert.equal(isAuthorizedCronRequest(request), false);
  });
});

test("an empty Authorization header is rejected, not treated as a match", () => {
  withCronSecret("", () => {
    const request = new Request("http://localhost/api/internal/jobs/purge-scheduled-deletions", {
      headers: { authorization: "" },
    });
    assert.equal(isAuthorizedCronRequest(request), false);
  });
});
