import assert from "node:assert/strict";
import test from "node:test";
import {
  createPrivateAssetSignedUrl,
  getSupabaseStorageConfig,
  normalizeSignedUrlExpiry,
} from "@/lib/supabase-storage";

const BASE_ENV: NodeJS.ProcessEnv = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
  SUPABASE_STORAGE_BUCKET_EBOOKS: "ebooks-private",
};

test("supabase storage config throws when a required variable is missing", () => {
  assert.throws(
    () =>
      getSupabaseStorageConfig({
        ...BASE_ENV,
        SUPABASE_SERVICE_ROLE_KEY: "",
      }),
    /Missing SUPABASE_SERVICE_ROLE_KEY/
  );
});

test("signed URL helper rejects an empty path", async () => {
  await assert.rejects(
    () => createPrivateAssetSignedUrl("   "),
    /Asset path is required/
  );
});

test("signed URL helper rejects a path starting with a slash", async () => {
  await assert.rejects(
    () => createPrivateAssetSignedUrl("/ebooks/file.pdf"),
    /must not start with '\/'/
  );
});

test("signed URL expiry is capped at 600 seconds", () => {
  assert.equal(normalizeSignedUrlExpiry(999), 600);
});

test("signed URL helper calls Supabase storage with the configured bucket and capped expiry", async () => {
  const originalEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET_EBOOKS: process.env.SUPABASE_STORAGE_BUCKET_EBOOKS,
  };

  process.env.SUPABASE_URL = BASE_ENV.SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = BASE_ENV.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_STORAGE_BUCKET_EBOOKS = BASE_ENV.SUPABASE_STORAGE_BUCKET_EBOOKS;

  const calls: Array<{ bucket: string; path: string; expiresIn: number }> = [];

  try {
    const signedUrl = await createPrivateAssetSignedUrl("ebooks/file.pdf", 999, {
      getBucketClient: (config) => ({
        createSignedUrl: async (path, expiresIn) => {
          calls.push({
            bucket: config.bucket,
            path,
            expiresIn,
          });

          return {
            data: { signedUrl: "https://signed.example.com/file" },
            error: null,
          };
        },
      }),
    });

    assert.equal(signedUrl, "https://signed.example.com/file");
    assert.deepEqual(calls, [
      {
        bucket: "ebooks-private",
        path: "ebooks/file.pdf",
        expiresIn: 600,
      },
    ]);
  } finally {
    if (originalEnv.SUPABASE_URL === undefined) {
      delete process.env.SUPABASE_URL;
    } else {
      process.env.SUPABASE_URL = originalEnv.SUPABASE_URL;
    }

    if (originalEnv.SUPABASE_SERVICE_ROLE_KEY === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv.SUPABASE_SERVICE_ROLE_KEY;
    }

    if (originalEnv.SUPABASE_STORAGE_BUCKET_EBOOKS === undefined) {
      delete process.env.SUPABASE_STORAGE_BUCKET_EBOOKS;
    } else {
      process.env.SUPABASE_STORAGE_BUCKET_EBOOKS =
        originalEnv.SUPABASE_STORAGE_BUCKET_EBOOKS;
    }
  }
});
