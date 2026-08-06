import assert from "node:assert/strict";
import test from "node:test";
import {
  createPrivateAssetSignedUrl,
  getSupabaseStorageConfig,
  normalizeSignedUrlExpiry,
} from "@/lib/supabase-storage";

const BASE_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
  SUPABASE_STORAGE_BUCKET_EBOOKS: "ebooks-private",
};

async function withSupabaseEnv<T>(run: () => Promise<T>): Promise<T> {
  const originalEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET_EBOOKS: process.env.SUPABASE_STORAGE_BUCKET_EBOOKS,
  };

  process.env.SUPABASE_URL = BASE_ENV.SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = BASE_ENV.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_STORAGE_BUCKET_EBOOKS = BASE_ENV.SUPABASE_STORAGE_BUCKET_EBOOKS;

  try {
    return await run();
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
}

type RecordedCall = {
  bucket: string;
  path: string;
  expiresIn: number;
  download?: string | boolean;
};

function createRecordingSignedUrlDeps(calls: RecordedCall[]) {
  return {
    getBucketClient: (config: { bucket: string }) => ({
      createSignedUrl: async (
        path: string,
        expiresIn: number,
        options?: { download?: string | boolean }
      ) => {
        calls.push({
          bucket: config.bucket,
          path,
          expiresIn,
          download: options?.download,
        });

        return {
          data: { signedUrl: `https://signed.example.com/${path}` },
          error: null,
        };
      },
    }),
  };
}

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
  await withSupabaseEnv(async () => {
    const calls: RecordedCall[] = [];

    const signedUrl = await createPrivateAssetSignedUrl(
      "ebooks/file.pdf",
      999,
      undefined,
      createRecordingSignedUrlDeps(calls)
    );

    assert.equal(signedUrl, "https://signed.example.com/ebooks/file.pdf");
    assert.deepEqual(calls, [
      {
        bucket: "ebooks-private",
        path: "ebooks/file.pdf",
        expiresIn: 600,
        download: true,
      },
    ]);
  });
});

test("signed URL helper forces download with the given filename for a ZIP asset", async () => {
  await withSupabaseEnv(async () => {
    const calls: RecordedCall[] = [];

    await createPrivateAssetSignedUrl(
      "ebooks/pack.zip",
      300,
      "Guide complet.zip",
      createRecordingSignedUrlDeps(calls)
    );

    assert.equal(calls[0]?.download, "Guide complet.zip");
  });
});

test("signed URL helper forces download with the given filename for an EPUB asset", async () => {
  await withSupabaseEnv(async () => {
    const calls: RecordedCall[] = [];

    await createPrivateAssetSignedUrl(
      "ebooks/guide.epub",
      300,
      "Câbler son van.epub",
      createRecordingSignedUrlDeps(calls)
    );

    assert.equal(calls[0]?.download, "Câbler son van.epub");
  });
});

test("signed URL helper forces download for an HTML asset instead of letting the browser open it inline", async () => {
  await withSupabaseEnv(async () => {
    const calls: RecordedCall[] = [];

    await createPrivateAssetSignedUrl(
      "ebooks/guide.html",
      300,
      "Câbler son van.html",
      createRecordingSignedUrlDeps(calls)
    );

    assert.equal(calls[0]?.download, "Câbler son van.html");
  });
});

test("signed URL helper forces download for the mobile HTML variant", async () => {
  await withSupabaseEnv(async () => {
    const calls: RecordedCall[] = [];

    await createPrivateAssetSignedUrl(
      "ebooks/guide-mobile.html",
      300,
      "Câbler son van - mobile.html",
      createRecordingSignedUrlDeps(calls)
    );

    assert.equal(calls[0]?.download, "Câbler son van - mobile.html");
  });
});

test("signed URL helper falls back to forcing the original filename when none is provided", async () => {
  await withSupabaseEnv(async () => {
    const calls: RecordedCall[] = [];

    await createPrivateAssetSignedUrl(
      "ebooks/guide.html",
      300,
      undefined,
      createRecordingSignedUrlDeps(calls)
    );

    assert.equal(calls[0]?.download, true);
  });
});
