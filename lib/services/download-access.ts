import type {
  DigitalAsset,
  DownloadGrant,
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
import type { AssetDownloadResolution } from "@/lib/server/asset-download";

type PrismaClientLike = PrismaClient;

type DownloadGrantWithRelations = DownloadGrant & {
  order: Order;
  orderItem: OrderItem;
  product: Product;
  asset: DigitalAsset;
};

type DownloadAccessDb = {
  findDownloadGrantById(grantId: string): Promise<DownloadGrantWithRelations | null>;
  // Incremente downloadCount de maniere atomique et conditionnelle
  // (status ACTIVE, downloadCount < maxDownloads, non expire) en une seule
  // operation DB : evite qu'une paire de requetes concurrentes ne depasse
  // maxDownloads (cf. cahier des charges espace client, section 17).
  // Retourne le grant a jour si la condition etait satisfaite, sinon null.
  tryConsumeDownloadGrant(grantId: string, now: Date): Promise<DownloadGrant | null>;
};

type DownloadAccessDeps = {
  now?: () => Date;
  resolveAssetDownload?: (asset: {
    provider: string;
    path: string;
    filename: string;
  }) => Promise<AssetDownloadResolution>;
  // Accepte une valeur directe (tests) ou une fonction paresseuse (config
  // Supabase reelle) : la resolution paresseuse evite d'echouer sur une
  // config Supabase manquante avant meme d'avoir verifie que le grant est
  // actif (cf. docs/audits/ecommerce-production-readiness-2026-08-06.md).
  // Ne s'applique qu'aux assets provider=SUPABASE — un bucket Vercel Blob
  // n'a pas d'equivalent (voir assertDownloadGrantIsEligible).
  expectedBucket?: string | null | (() => string | null);
};

export type DownloadAccessResult = AssetDownloadResolution & {
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

  if (grant.asset.provider !== "SUPABASE" && grant.asset.provider !== "VERCEL_BLOB") {
    throw conflict("Digital asset provider is not supported for signed downloads");
  }

  if (!grant.asset.bucket.trim() || !grant.asset.path.trim()) {
    throw conflict("Digital asset storage metadata is incomplete");
  }

  // Le controle de bucket n'a de sens que pour Supabase (config a bucket
  // unique) — un DigitalAsset Vercel Blob utilise "vercel-blob" comme simple
  // marqueur, jamais un vrai nom de bucket a comparer.
  if (grant.asset.provider === "SUPABASE") {
    const expectedBucket = resolveExpectedBucket?.() ?? null;

    if (expectedBucket && grant.asset.bucket !== expectedBucket) {
      throw conflict("Digital asset bucket does not match the configured private bucket");
    }
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
    async tryConsumeDownloadGrant(grantId, now) {
      const rows = await client.$queryRaw<DownloadGrant[]>`
        UPDATE "DownloadGrant"
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

async function getDefaultDownloadAccessService() {
  const [{ prisma }, storage, assetDownload] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/server/supabase-storage"),
    import("@/lib/server/asset-download"),
  ]);

  return createDownloadAccessService(createPrismaDownloadAccessDb(prisma), {
    resolveAssetDownload: assetDownload.resolveAssetDownload,
    expectedBucket: () => storage.getSupabaseStorageConfig().bucket,
  });
}

export function createDownloadAccessService(
  db: DownloadAccessDb,
  deps?: DownloadAccessDeps
) {
  const now = deps?.now ?? (() => new Date());
  const resolveAssetDownload =
    deps?.resolveAssetDownload ??
    (async () => {
      throw serviceUnavailable("Download link generation is not configured");
    });
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

      let resolution: AssetDownloadResolution;
      try {
        resolution = await resolveAssetDownload(grant.asset);
      } catch {
        throw serviceUnavailable("Download link generation failed");
      }

      return {
        ...resolution,
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

      const consumed = await db.tryConsumeDownloadGrant(grant.id, currentTime);

      if (!consumed) {
        // La condition atomique a echoue entre la lecture et l'ecriture
        // (concurrence, expiration, revocation...) : on relit l'etat frais
        // pour renvoyer l'erreur la plus precise possible.
        assertDownloadGrantIsEligible(
          await db.findDownloadGrantById(grant.id),
          currentTime,
          resolveExpectedBucket
        );
        throw conflict("Maximum download count reached");
      }

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
