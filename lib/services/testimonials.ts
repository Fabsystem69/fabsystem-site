import { z } from "zod";
import type {
  PrismaClient,
  Testimonial,
  TestimonialCustomerType,
} from "@/lib/generated/prisma/client";
import { badRequest, notFound } from "@/lib/http-errors";

type PrismaClientLike = PrismaClient;

const createTestimonialInputSchema = z.object({
  displayName: z.string().trim().min(1, "Le nom est requis"),
  customerType: z.enum(["VAN", "CAMPING_CAR", "BOAT", "OTHER"]),
  vehicleModel: z.string().trim().min(1).optional(),
  region: z.string().trim().min(1).optional(),
  rating: z.number().int().min(1, "La note doit être comprise entre 1 et 5").max(5, "La note doit être comprise entre 1 et 5"),
  quote: z.string().trim().min(1, "Le témoignage ne peut pas être vide"),
  relatedOffer: z.string().trim().min(1).optional(),
  isVerifiedPurchase: z.boolean().optional(),
});

const updateTestimonialInputSchema = createTestimonialInputSchema.partial();

export type CreateTestimonialInput = z.infer<typeof createTestimonialInputSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialInputSchema>;

type TestimonialCreateData = {
  displayName: string;
  customerType: TestimonialCustomerType;
  vehicleModel: string | null;
  region: string | null;
  rating: number;
  quote: string;
  relatedOffer: string | null;
  isVerifiedPurchase: boolean;
};

type TestimonialUpdateData = Partial<TestimonialCreateData> & {
  isPublished?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
};

export type TestimonialsDb = {
  findAllTestimonials(): Promise<Testimonial[]>;
  findPublishedTestimonials(): Promise<Testimonial[]>;
  findTestimonialById(id: string): Promise<Testimonial | null>;
  createTestimonial(data: TestimonialCreateData): Promise<Testimonial>;
  updateTestimonial(id: string, data: TestimonialUpdateData): Promise<Testimonial>;
  deleteTestimonial(id: string): Promise<void>;
};

function createPrismaTestimonialsDb(client: PrismaClientLike): TestimonialsDb {
  return {
    async findAllTestimonials() {
      return client.testimonial.findMany({
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      });
    },
    async findPublishedTestimonials() {
      return client.testimonial.findMany({
        where: { isPublished: true },
        orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
      });
    },
    async findTestimonialById(id) {
      return client.testimonial.findUnique({ where: { id } });
    },
    async createTestimonial(data) {
      return client.testimonial.create({ data });
    },
    async updateTestimonial(id, data) {
      return client.testimonial.update({ where: { id }, data });
    },
    async deleteTestimonial(id) {
      await client.testimonial.delete({ where: { id } });
    },
  };
}

async function getDefaultTestimonialsService() {
  const { prisma } = await import("@/lib/prisma");
  return createTestimonialsService(createPrismaTestimonialsDb(prisma));
}

function assertNonEmptyId(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw badRequest(`${label} is required`);
  }

  return normalized;
}

function normalizeCreateData(parsed: CreateTestimonialInput): TestimonialCreateData {
  return {
    displayName: parsed.displayName,
    customerType: parsed.customerType,
    vehicleModel: parsed.vehicleModel ?? null,
    region: parsed.region ?? null,
    rating: parsed.rating,
    quote: parsed.quote,
    relatedOffer: parsed.relatedOffer ?? null,
    isVerifiedPurchase: parsed.isVerifiedPurchase ?? false,
  };
}

export function createTestimonialsService(db: TestimonialsDb) {
  return {
    async listAdminTestimonials() {
      return db.findAllTestimonials();
    },

    async listPublishedTestimonials() {
      return db.findPublishedTestimonials();
    },

    async createTestimonial(input: CreateTestimonialInput) {
      const parsed = createTestimonialInputSchema.parse(input);
      // Nouveau témoignage jamais publié par défaut : évite toute mise en
      // ligne accidentelle avant relecture manuelle par l'admin.
      return db.createTestimonial(normalizeCreateData(parsed));
    },

    async updateTestimonial(id: string, input: UpdateTestimonialInput) {
      const normalizedId = assertNonEmptyId(id, "Testimonial id");
      const parsed = updateTestimonialInputSchema.parse(input);

      const existing = await db.findTestimonialById(normalizedId);
      if (!existing) {
        throw notFound("Testimonial not found");
      }

      const data: TestimonialUpdateData = {};
      if (parsed.displayName !== undefined) data.displayName = parsed.displayName;
      if (parsed.customerType !== undefined) data.customerType = parsed.customerType;
      if (parsed.vehicleModel !== undefined) data.vehicleModel = parsed.vehicleModel ?? null;
      if (parsed.region !== undefined) data.region = parsed.region ?? null;
      if (parsed.rating !== undefined) data.rating = parsed.rating;
      if (parsed.quote !== undefined) data.quote = parsed.quote;
      if (parsed.relatedOffer !== undefined) data.relatedOffer = parsed.relatedOffer ?? null;
      if (parsed.isVerifiedPurchase !== undefined) {
        data.isVerifiedPurchase = parsed.isVerifiedPurchase;
      }

      return db.updateTestimonial(normalizedId, data);
    },

    async setTestimonialPublished(id: string, isPublished: boolean) {
      const normalizedId = assertNonEmptyId(id, "Testimonial id");
      const existing = await db.findTestimonialById(normalizedId);
      if (!existing) {
        throw notFound("Testimonial not found");
      }

      return db.updateTestimonial(normalizedId, { isPublished });
    },

    async setTestimonialFeatured(id: string, isFeatured: boolean) {
      const normalizedId = assertNonEmptyId(id, "Testimonial id");
      const existing = await db.findTestimonialById(normalizedId);
      if (!existing) {
        throw notFound("Testimonial not found");
      }

      return db.updateTestimonial(normalizedId, { isFeatured });
    },

    async setTestimonialDisplayOrder(id: string, displayOrder: number) {
      const normalizedId = assertNonEmptyId(id, "Testimonial id");

      if (!Number.isInteger(displayOrder)) {
        throw badRequest("displayOrder must be an integer");
      }

      const existing = await db.findTestimonialById(normalizedId);
      if (!existing) {
        throw notFound("Testimonial not found");
      }

      return db.updateTestimonial(normalizedId, { displayOrder });
    },

    // Suppression definitive : reservee aux temoignages jamais publies, pour
    // eviter de perdre un avis deja mis en ligne. Preferer setTestimonialPublished
    // (false) pour masquer un avis publie.
    async deleteTestimonial(id: string) {
      const normalizedId = assertNonEmptyId(id, "Testimonial id");
      const existing = await db.findTestimonialById(normalizedId);
      if (!existing) {
        throw notFound("Testimonial not found");
      }

      if (existing.isPublished) {
        throw badRequest(
          "Un temoignage publie ne peut pas etre supprime : masquez-le d'abord (isPublished = false)."
        );
      }

      await db.deleteTestimonial(normalizedId);
    },
  };
}

export async function listAdminTestimonials() {
  const service = await getDefaultTestimonialsService();
  return service.listAdminTestimonials();
}

export async function listPublishedTestimonials() {
  const service = await getDefaultTestimonialsService();
  return service.listPublishedTestimonials();
}

export async function createTestimonial(input: CreateTestimonialInput) {
  const service = await getDefaultTestimonialsService();
  return service.createTestimonial(input);
}

export async function updateTestimonial(id: string, input: UpdateTestimonialInput) {
  const service = await getDefaultTestimonialsService();
  return service.updateTestimonial(id, input);
}

export async function setTestimonialPublished(id: string, isPublished: boolean) {
  const service = await getDefaultTestimonialsService();
  return service.setTestimonialPublished(id, isPublished);
}

export async function setTestimonialFeatured(id: string, isFeatured: boolean) {
  const service = await getDefaultTestimonialsService();
  return service.setTestimonialFeatured(id, isFeatured);
}

export async function setTestimonialDisplayOrder(id: string, displayOrder: number) {
  const service = await getDefaultTestimonialsService();
  return service.setTestimonialDisplayOrder(id, displayOrder);
}

export async function deleteTestimonial(id: string) {
  const service = await getDefaultTestimonialsService();
  return service.deleteTestimonial(id);
}
