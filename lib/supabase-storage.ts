/**
 * Pure, testable Supabase Storage logic only.
 *
 * Application code must import the server-only wrapper from
 * `@/lib/server/supabase-storage`.
 *
 * Never import this module from a Client Component.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SIGNED_URL_TTL_SECONDS = 300;
const MAX_SIGNED_URL_TTL_SECONDS = 600;

export type SupabaseStorageConfig = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
};

type SignedUrlData = {
  signedUrl: string;
};

type SignedUrlResult = {
  data: SignedUrlData | null;
  error: { message: string } | null;
};

export type SupabaseBucketClient = {
  createSignedUrl: (path: string, expiresIn: number) => Promise<SignedUrlResult>;
};

type SignedUrlDeps = {
  getBucketClient?: (config: SupabaseStorageConfig) => SupabaseBucketClient;
};

function requireEnv(name: string, value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`Missing ${name}`);
  }
  return normalized;
}

export function getSupabaseStorageConfig(
  env: NodeJS.ProcessEnv = process.env
): SupabaseStorageConfig {
  return {
    url: requireEnv("SUPABASE_URL", env.SUPABASE_URL),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY),
    bucket: requireEnv(
      "SUPABASE_STORAGE_BUCKET_EBOOKS",
      env.SUPABASE_STORAGE_BUCKET_EBOOKS
    ),
  };
}

export function normalizeSignedUrlExpiry(expiresInSeconds = DEFAULT_SIGNED_URL_TTL_SECONDS) {
  if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    return DEFAULT_SIGNED_URL_TTL_SECONDS;
  }

  return Math.min(Math.floor(expiresInSeconds), MAX_SIGNED_URL_TTL_SECONDS);
}

export function createSupabaseServerClient(
  config: SupabaseStorageConfig = getSupabaseStorageConfig()
) {
  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseBucketClient(
  config: SupabaseStorageConfig = getSupabaseStorageConfig(),
  client: SupabaseClient = createSupabaseServerClient(config)
) {
  return client.storage.from(config.bucket);
}

export async function createPrivateAssetSignedUrl(
  path: string,
  expiresInSeconds = DEFAULT_SIGNED_URL_TTL_SECONDS,
  deps: SignedUrlDeps = {}
) {
  const normalizedPath = path.trim();
  if (!normalizedPath) {
    throw new Error("Asset path is required");
  }

  if (normalizedPath.startsWith("/")) {
    throw new Error("Asset path must be relative and must not start with '/'");
  }

  const config = getSupabaseStorageConfig();
  const bucketClient =
    deps.getBucketClient?.(config) ?? getSupabaseBucketClient(config);
  const expiresIn = normalizeSignedUrlExpiry(expiresInSeconds);

  const { data, error } = await bucketClient.createSignedUrl(normalizedPath, expiresIn);

  if (error) {
    throw new Error(`Supabase signed URL generation failed: ${error.message}`);
  }

  if (!data?.signedUrl) {
    throw new Error("Supabase signed URL generation failed: missing signed URL");
  }

  return data.signedUrl;
}

export const SUPABASE_STORAGE_SIGNED_URL_DEFAULT_TTL_SECONDS =
  DEFAULT_SIGNED_URL_TTL_SECONDS;
export const SUPABASE_STORAGE_SIGNED_URL_MAX_TTL_SECONDS = MAX_SIGNED_URL_TTL_SECONDS;
