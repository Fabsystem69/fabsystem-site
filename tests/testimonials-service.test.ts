import assert from "node:assert/strict";
import test from "node:test";
import type { Testimonial } from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import { createTestimonialsService, type TestimonialsDb } from "@/lib/services/testimonials";

function createTestimonialRecord(overrides: Partial<Testimonial> = {}): Testimonial {
  const now = new Date("2026-08-07T00:00:00.000Z");

  return {
    id: overrides.id ?? "testimonial_1",
    displayName: overrides.displayName ?? "Pascal M.",
    customerType: overrides.customerType ?? "BOAT",
    vehicleModel: overrides.vehicleModel ?? null,
    region: overrides.region ?? null,
    rating: overrides.rating ?? 5,
    quote: overrides.quote ?? "Intervention claire et efficace.",
    relatedOffer: overrides.relatedOffer ?? null,
    isVerifiedPurchase: overrides.isVerifiedPurchase ?? false,
    isPublished: overrides.isPublished ?? false,
    isFeatured: overrides.isFeatured ?? false,
    displayOrder: overrides.displayOrder ?? 0,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createMockTestimonialsDb(seed?: { testimonials?: Testimonial[] }) {
  const state = {
    testimonials: [...(seed?.testimonials ?? [])],
  };

  const db: TestimonialsDb = {
    async findAllTestimonials() {
      return [...state.testimonials].sort((a, b) => a.displayOrder - b.displayOrder);
    },
    async findPublishedTestimonials() {
      return state.testimonials
        .filter((item) => item.isPublished)
        .sort((a, b) => {
          if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
          if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
    },
    async findTestimonialById(id) {
      return state.testimonials.find((item) => item.id === id) ?? null;
    },
    async createTestimonial(data) {
      const testimonial = createTestimonialRecord({
        id: `testimonial_${state.testimonials.length + 1}`,
        ...data,
      });
      state.testimonials.push(testimonial);
      return testimonial;
    },
    async updateTestimonial(id, data) {
      const testimonial = state.testimonials.find((item) => item.id === id);
      if (!testimonial) {
        throw new Error("Testimonial not found in mock");
      }
      Object.assign(testimonial, data);
      testimonial.updatedAt = new Date("2026-08-07T01:00:00.000Z");
      return testimonial;
    },
    async deleteTestimonial(id) {
      state.testimonials = state.testimonials.filter((item) => item.id !== id);
    },
  };

  return { db, state };
}

test("createTestimonial rejects an empty displayName", async () => {
  const { db } = createMockTestimonialsDb();
  const service = createTestimonialsService(db);

  await assert.rejects(() =>
    service.createTestimonial({
      displayName: "",
      customerType: "VAN",
      rating: 5,
      quote: "Top",
    })
  );
});

test("createTestimonial rejects an empty quote", async () => {
  const { db } = createMockTestimonialsDb();
  const service = createTestimonialsService(db);

  await assert.rejects(() =>
    service.createTestimonial({
      displayName: "Pascal M.",
      customerType: "VAN",
      rating: 5,
      quote: "",
    })
  );
});

test("createTestimonial rejects a rating above 5", async () => {
  const { db } = createMockTestimonialsDb();
  const service = createTestimonialsService(db);

  await assert.rejects(() =>
    service.createTestimonial({
      displayName: "Pascal M.",
      customerType: "VAN",
      rating: 6,
      quote: "Top",
    })
  );
});

test("createTestimonial rejects a rating below 1", async () => {
  const { db } = createMockTestimonialsDb();
  const service = createTestimonialsService(db);

  await assert.rejects(() =>
    service.createTestimonial({
      displayName: "Pascal M.",
      customerType: "VAN",
      rating: 0,
      quote: "Top",
    })
  );
});

test("createTestimonial defaults to unpublished and not featured", async () => {
  const { db, state } = createMockTestimonialsDb();
  const service = createTestimonialsService(db);

  const testimonial = await service.createTestimonial({
    displayName: "Isabelle & François",
    customerType: "VAN",
    rating: 5,
    quote: "Accompagnement clair.",
  });

  assert.equal(testimonial.isPublished, false);
  assert.equal(testimonial.isFeatured, false);
  assert.equal(state.testimonials.length, 1);
});

test("listPublishedTestimonials only returns published testimonials", async () => {
  const { db } = createMockTestimonialsDb({
    testimonials: [
      createTestimonialRecord({ id: "t1", isPublished: true, displayOrder: 1 }),
      createTestimonialRecord({ id: "t2", isPublished: false, displayOrder: 0 }),
    ],
  });
  const service = createTestimonialsService(db);

  const published = await service.listPublishedTestimonials();

  assert.equal(published.length, 1);
  assert.equal(published[0]?.id, "t1");
});

test("listPublishedTestimonials prioritizes featured testimonials", async () => {
  const { db } = createMockTestimonialsDb({
    testimonials: [
      createTestimonialRecord({ id: "t1", isPublished: true, isFeatured: false, displayOrder: 0 }),
      createTestimonialRecord({ id: "t2", isPublished: true, isFeatured: true, displayOrder: 5 }),
    ],
  });
  const service = createTestimonialsService(db);

  const published = await service.listPublishedTestimonials();

  assert.equal(published[0]?.id, "t2");
});

test("setTestimonialPublished publishes a testimonial", async () => {
  const { db } = createMockTestimonialsDb({
    testimonials: [createTestimonialRecord({ id: "t1", isPublished: false })],
  });
  const service = createTestimonialsService(db);

  const updated = await service.setTestimonialPublished("t1", true);

  assert.equal(updated.isPublished, true);
});

test("setTestimonialPublished refuses a missing testimonial", async () => {
  const { db } = createMockTestimonialsDb();
  const service = createTestimonialsService(db);

  await assert.rejects(
    () => service.setTestimonialPublished("missing", true),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("setTestimonialFeatured toggles featured status", async () => {
  const { db } = createMockTestimonialsDb({
    testimonials: [createTestimonialRecord({ id: "t1", isFeatured: false })],
  });
  const service = createTestimonialsService(db);

  const updated = await service.setTestimonialFeatured("t1", true);

  assert.equal(updated.isFeatured, true);
});

test("setTestimonialDisplayOrder updates the ordering value", async () => {
  const { db } = createMockTestimonialsDb({
    testimonials: [createTestimonialRecord({ id: "t1", displayOrder: 0 })],
  });
  const service = createTestimonialsService(db);

  const updated = await service.setTestimonialDisplayOrder("t1", 3);

  assert.equal(updated.displayOrder, 3);
});

test("deleteTestimonial refuses to delete a published testimonial", async () => {
  const { db, state } = createMockTestimonialsDb({
    testimonials: [createTestimonialRecord({ id: "t1", isPublished: true })],
  });
  const service = createTestimonialsService(db);

  await assert.rejects(
    () => service.deleteTestimonial("t1"),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
  assert.equal(state.testimonials.length, 1);
});

test("deleteTestimonial deletes an unpublished testimonial", async () => {
  const { db, state } = createMockTestimonialsDb({
    testimonials: [createTestimonialRecord({ id: "t1", isPublished: false })],
  });
  const service = createTestimonialsService(db);

  await service.deleteTestimonial("t1");

  assert.equal(state.testimonials.length, 0);
});

test("updateTestimonial refuses a missing testimonial", async () => {
  const { db } = createMockTestimonialsDb();
  const service = createTestimonialsService(db);

  await assert.rejects(
    () => service.updateTestimonial("missing", { displayName: "New name" }),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("updateTestimonial updates only provided fields", async () => {
  const { db } = createMockTestimonialsDb({
    testimonials: [
      createTestimonialRecord({ id: "t1", displayName: "Old name", rating: 4 }),
    ],
  });
  const service = createTestimonialsService(db);

  const updated = await service.updateTestimonial("t1", { displayName: "New name" });

  assert.equal(updated.displayName, "New name");
  assert.equal(updated.rating, 4);
});
