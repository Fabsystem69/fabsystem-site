import type {
  Customer,
  CustomerResourceGrant,
  DigitalAsset,
  PrismaClient,
  Product,
} from "@/lib/generated/prisma/client";
import { badRequest, conflict, forbidden, notFound, serviceUnavailable } from "@/lib/http-errors";

type PrismaClientLike = PrismaClient;

type ResourceGrantWithRelations = CustomerResourceGrant & {
  customer: Customer;
  product: Product;
  asset: DigitalAsset;
};

type ResourceAccessDb = {
  findResourceGrantById(grantId: string): Promise<ResourceGrantWithRelations | null>;
  // Même garantie atomique que tryConsumeDownloadGrant (lib/services/download-access.ts) :
  // évite qu'une paire de requêtes concurrentes ne dépasse maxDownloads.
  tryConsumeResourceGrant(grantId: string, now: Date): Promise<CustomerResourceGrant | null>;
};

type ResourceAccessDeps = {
  now?: () => Date;
  createPrivateAssetSignedUrl?: (
    path: string,
    expiresInSeconds?: number,
    downloadFilename?: string
  ) => Promise<string>;
  signedUrlTtlSeconds?: number;
  expectedBucket?: string | null | (() => string | null);
};

export type ResourceAccessResult = {
  url: string;
  expiresInSeconds: number;
  grant: ResourceGrantWithRelations;
};

export type ResourceAccessCustomerContext = {
  customerId: string;
  customerEmail: string;
};

function assertNonEmptyId(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw badRequest(`${label} is required`);
  }

  return normalized;
}

function assertResourceGrantIsEligible(
  grant: ResourceGrantWithRelations | null,
  now: Date,
  resolveExpectedBucket?: () => string | null
) {
  if (!grant) {
    throw notFound("Resource grant not found");
  }

  if (grant.status !== "ACTIVE") {
    throw conflict("Resource grant is not active");
  }

  if (grant.expiresAt && grant.expiresAt <= now) {
    throw conflict("Resource grant has expired");
  }

  if (grant.downloadCount >= grant.maxDownloads) {
    throw conflict("Maximum download count reached");
  }

  if (grant.asset.status !== "ACTIVE") {
    throw conflict("Digital asset is not active");
  }

  if (grant.asset.provider !== "SUPABASE") {
    throw conflict("Digital asset provider is not supported for signed downloads");
  }

  if (!grant.asset.bucket.trim() || !grant.asset.path.trim()) {
    throw conflict("Digital asset storage metadata is incomplete");
  }

  const expectedBucket = resolveExpectedBucket?.() ?? null;

  if (expectedBucket && grant.asset.bucket !== expectedBucket) {
    throw conflict("Digital asset bucket does not match the configured private bucket");
  }

  return grant;
}

function assertGrantBelongsToCustomer(
  grant: ResourceGrantWithRelations,
  customer: ResourceAccessCustomerContext | null | undefined
) {
  if (!customer) {
    throw forbidden("Customer session is required");
  }

  const normalizedCustomerId = assertNonEmptyId(customer.customerId, "Customer id");

  if (grant.customerId !== normalizedCustomerId) {
    throw forbidden("Resource grant does not belong to the authenticated customer");
  }
}

function createPrismaResourceAccessDb(client: PrismaClientLike): ResourceAccessDb {
  return {
    async findResourceGrantById(grantId) {
      return client.customerResourceGrant.findUnique({
        where: { id: grantId },
        include: { customer: true, product: true, asset: true },
      }) as Promise<ResourceGrantWithRelations | null>;
    },
    async tryConsumeResourceGrant(grantId, now) {
      const rows = await client.$queryRaw<CustomerResourceGrant[]>`
        UPDATE "CustomerResourceGrant"
        SET "downloadCount" = "downloadCount" + 1,
            "lastDownloadedAt" = ${now}
        WHERE "id" = ${grantId}
          AND "status" = 'ACTIVE'
          AND "downloadCount" < "maxDownloads"
          AND ("expiresAt" IS NULL OR "expiresAt" > ${now})
        RETURNING *
      `;

      return rows[0] ?? null;
    },
  };
}

async function getDefaultResourceAccessService() {
  const [{ prisma }, storage] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/server/supabase-storage"),
  ]);

  return createResourceAccessService(createPrismaResourceAccessDb(prisma), {
    createPrivateAssetSignedUrl: storage.createPrivateAssetSignedUrl,
    signedUrlTtlSeconds: storage.SUPABASE_STORAGE_SIGNED_URL_DEFAULT_TTL_SECONDS,
    expectedBucket: () => storage.getSupabaseStorageConfig().bucket,
  });
}

export function createResourceAccessService(db: ResourceAccessDb, deps?: ResourceAccessDeps) {
  const now = deps?.now ?? (() => new Date());
  const createPrivateAssetSignedUrl =
    deps?.createPrivateAssetSignedUrl ??
    (async () => {
      throw serviceUnavailable("Download link generation is not configured");
    });
  const signedUrlTtlSeconds = deps?.signedUrlTtlSeconds ?? 300;
  const expectedBucketDep = deps?.expectedBucket ?? null;
  const resolveExpectedBucket = () =>
    typeof expectedBucketDep === "function" ? expectedBucketDep() : expectedBucketDep;

  return {
    async getResourceAccessForGrant(
      grantId: string,
      customer?: ResourceAccessCustomerContext | null
    ): Promise<ResourceAccessResult> {
      const normalizedGrantId = assertNonEmptyId(grantId, "Grant id");
      const currentTime = now();
      const grant = assertResourceGrantIsEligible(
        await db.findResourceGrantById(normalizedGrantId),
        currentTime,
        resolveExpectedBucket
      );
      assertGrantBelongsToCustomer(grant, customer);

      let url: string;
      try {
        url = await createPrivateAssetSignedUrl(
          grant.asset.path,
          signedUrlTtlSeconds,
          grant.asset.filename
        );
      } catch {
        throw serviceUnavailable("Download link generation failed");
      }

      return { url, expiresInSeconds: signedUrlTtlSeconds, grant };
    },

    async consumeResourceGrant(grantId: string, customer?: ResourceAccessCustomerContext | null) {
      const normalizedGrantId = assertNonEmptyId(grantId, "Grant id");
      const currentTime = now();
      const grant = assertResourceGrantIsEligible(
        await db.findResourceGrantById(normalizedGrantId),
        currentTime,
        resolveExpectedBucket
      );
      assertGrantBelongsToCustomer(grant, customer);

      const consumed = await db.tryConsumeResourceGrant(grant.id, currentTime);

      if (!consumed) {
        assertResourceGrantIsEligible(
          await db.findResourceGrantById(grant.id),
          currentTime,
          resolveExpectedBucket
        );
        throw conflict("Maximum download count reached");
      }

      return db.findResourceGrantById(grant.id);
    },
  };
}

export async function getResourceAccessForGrant(
  grantId: string,
  customer?: ResourceAccessCustomerContext | null
) {
  const service = await getDefaultResourceAccessService();
  return service.getResourceAccessForGrant(grantId, customer);
}

export async function consumeResourceGrant(
  grantId: string,
  customer?: ResourceAccessCustomerContext | null
) {
  const service = await getDefaultResourceAccessService();
  return service.consumeResourceGrant(grantId, customer);
}
