import type {
  DigitalAsset,
  DownloadGrant,
  DownloadGrantStatus,
  Order,
  OrderItem,
  PrismaClient,
  Product,
} from "@/lib/generated/prisma/client";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  serviceUnavailable,
  unauthorized,
} from "@/lib/http-errors";

type PrismaClientLike = PrismaClient;

type DownloadGrantWithRelations = DownloadGrant & {
  order: Order;
  orderItem: OrderItem;
  product: Product;
  asset: DigitalAsset;
};

type DownloadAccessDb = {
  findDownloadGrantById(grantId: string): Promise<DownloadGrantWithRelations | null>;
  updateDownloadGrant(
    grantId: string,
    data: {
      status?: DownloadGrantStatus;
      revokedAt?: Date | null;
      lastDownloadedAt?: Date | null;
      downloadCountIncrement?: number;
    }
  ): Promise<DownloadGrant>;
};

type DownloadAccessDeps = {
  now?: () => Date;
  createPrivateAssetSignedUrl?: (path: string, expiresInSeconds?: number) => Promise<string>;
  signedUrlTtlSeconds?: number;
  // Accepte une valeur directe (tests) ou une fonction paresseuse (config
  // Supabase reelle) : la resolution paresseuse evite d'echouer sur une
  // config Supabase manquante avant meme d'avoir verifie que le grant est
  // actif (cf. docs/audits/ecommerce-production-readiness-2026-08-06.md).
  expectedBucket?: string | null | (() => string | null);
};

export type DownloadAccessResult = {
  url: string;
  expiresInSeconds: number;
  grant: DownloadGrantWithRelations;
};

export type DownloadAccessCustomerContext = {
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

function assertDownloadGrantIsEligible(
  grant: DownloadGrantWithRelations | null,
  now: Date,
  resolveExpectedBucket?: () => string | null
) {
  if (!grant) {
    throw notFound("Download grant not found");
  }

  if (grant.status !== "ACTIVE") {
    throw conflict("Download grant is not active");
  }

  if (grant.expiresAt && grant.expiresAt <= now) {
    throw conflict("Download grant has expired");
  }

  if (grant.downloadCount >= grant.maxDownloads) {
    throw conflict("Maximum download count reached");
  }

  if (grant.order.status !== "PAID") {
    throw conflict("Order is not eligible for download access");
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
  grant: DownloadGrantWithRelations,
  customer: DownloadAccessCustomerContext | null | undefined
) {
  if (!customer) {
    throw unauthorized("Customer session is required");
  }

  const normalizedCustomerId = assertNonEmptyId(customer.customerId, "Customer id");
  const normalizedCustomerEmail = customer.customerEmail.trim().toLowerCase();

  if (grant.order.customerId === normalizedCustomerId) {
    return;
  }

  if (!grant.order.customerId && grant.order.customerEmail.trim().toLowerCase() === normalizedCustomerEmail) {
    return;
  }

  throw forbidden("Download grant does not belong to the authenticated customer");
}

function createPrismaDownloadAccessDb(client: PrismaClientLike): DownloadAccessDb {
  return {
    async findDownloadGrantById(grantId) {
      return client.downloadGrant.findUnique({
        where: { id: grantId },
        include: {
          order: true,
          orderItem: true,
          product: true,
          asset: true,
        },
      }) as Promise<DownloadGrantWithRelations | null>;
    },
    async updateDownloadGrant(grantId, data) {
      const updateData: {
        status?: DownloadGrantStatus;
        revokedAt?: Date | null;
        lastDownloadedAt?: Date | null;
        downloadCount?: { increment: number };
      } = {
        status: data.status,
        revokedAt: data.revokedAt,
        lastDownloadedAt: data.lastDownloadedAt,
      };

      if (typeof data.downloadCountIncrement === "number") {
        updateData.downloadCount = { increment: data.downloadCountIncrement };
      }

      return client.downloadGrant.update({
        where: { id: grantId },
        data: updateData,
      });
    },
  };
}

async function getDefaultDownloadAccessService() {
  const [{ prisma }, storage] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/server/supabase-storage"),
  ]);

  return createDownloadAccessService(createPrismaDownloadAccessDb(prisma), {
    createPrivateAssetSignedUrl: storage.createPrivateAssetSignedUrl,
    signedUrlTtlSeconds: storage.SUPABASE_STORAGE_SIGNED_URL_DEFAULT_TTL_SECONDS,
    expectedBucket: () => storage.getSupabaseStorageConfig().bucket,
  });
}

export function createDownloadAccessService(
  db: DownloadAccessDb,
  deps?: DownloadAccessDeps
) {
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
    async getDownloadAccessForGrant(
      grantId: string,
      customer?: DownloadAccessCustomerContext | null
    ): Promise<DownloadAccessResult> {
      const normalizedGrantId = assertNonEmptyId(grantId, "Grant id");
      const currentTime = now();
      const grant = assertDownloadGrantIsEligible(
        await db.findDownloadGrantById(normalizedGrantId),
        currentTime,
        resolveExpectedBucket
      );
      assertGrantBelongsToCustomer(grant, customer);

      let url: string;
      try {
        url = await createPrivateAssetSignedUrl(grant.asset.path, signedUrlTtlSeconds);
      } catch {
        throw serviceUnavailable("Download link generation failed");
      }

      return {
        url,
        expiresInSeconds: signedUrlTtlSeconds,
        grant,
      };
    },

    async consumeDownloadGrant(
      grantId: string,
      customer?: DownloadAccessCustomerContext | null
    ) {
      const normalizedGrantId = assertNonEmptyId(grantId, "Grant id");
      const currentTime = now();
      const grant = assertDownloadGrantIsEligible(
        await db.findDownloadGrantById(normalizedGrantId),
        currentTime,
        resolveExpectedBucket
      );
      assertGrantBelongsToCustomer(grant, customer);

      await db.updateDownloadGrant(grant.id, {
        downloadCountIncrement: 1,
        lastDownloadedAt: currentTime,
      });

      return db.findDownloadGrantById(grant.id);
    },
  };
}

export async function getDownloadAccessForGrant(
  grantId: string,
  customer?: DownloadAccessCustomerContext | null
) {
  const service = await getDefaultDownloadAccessService();
  return service.getDownloadAccessForGrant(grantId, customer);
}

export async function consumeDownloadGrant(
  grantId: string,
  customer?: DownloadAccessCustomerContext | null
) {
  const service = await getDefaultDownloadAccessService();
  return service.consumeDownloadGrant(grantId, customer);
}
