import { prisma } from "@/lib/prisma";

type TemplateSourceItem = {
  description: string;
  unitPrice?: number | null;
  unit?: string | null;
};

function normalizeLabel(label: string) {
  return label.trim().replace(/\s+/g, " ");
}

export async function rememberItemTemplates(items: TemplateSourceItem[]) {
  const prepared = items
    .map((item) => ({
      label: normalizeLabel(item.description),
      unit: item.unit?.trim() || null,
      defaultUnitPriceCents:
        typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice)
          ? item.unitPrice
          : null,
    }))
    .filter((item) => item.label.length > 0);

  const uniqueItems = Array.from(
    new Map(prepared.map((item) => [item.label.toLocaleLowerCase("fr-FR"), item])).values()
  );

  await Promise.all(
    uniqueItems.map((item) =>
      prisma.itemTemplate.upsert({
        where: { label: item.label },
        create: {
          label: item.label,
          unit: item.unit,
          defaultUnitPriceCents: item.defaultUnitPriceCents,
          lastUsedAt: new Date(),
          useCount: 1,
        },
        update: {
          unit: item.unit ?? undefined,
          defaultUnitPriceCents: item.defaultUnitPriceCents ?? undefined,
          lastUsedAt: new Date(),
          useCount: {
            increment: 1,
          },
        },
      })
    )
  );
}

export async function searchItemTemplates(query: string) {
  const normalizedQuery = query.trim();

  return prisma.itemTemplate.findMany({
    where: normalizedQuery
      ? {
          label: {
            contains: normalizedQuery,
            mode: "insensitive",
          },
        }
      : undefined,
    orderBy: [{ useCount: "desc" }, { lastUsedAt: "desc" }],
    take: 10,
  });
}
