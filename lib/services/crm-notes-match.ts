import type { ExtractedEntry } from "@/lib/crm/notes-contract";

export type ProspectMatch = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
};

type MatchCandidate = ProspectMatch;

export function digitsOnly(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

// Deux numeros designent la meme ligne si leurs 9 derniers chiffres
// coincident (+33 6 12... / 06 12... / 0033 6 12...).
function samePhone(a: string | null | undefined, b: string | null | undefined) {
  const left = digitsOnly(a);
  const right = digitsOnly(b);
  return left.length >= 9 && right.length >= 9 && left.slice(-9) === right.slice(-9);
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

// Priorite : telephone ou e-mail identiques (quasi certain), puis meme nom
// normalise (plausible, a confirmer par Fabien dans l'interface).
export function findMatchesForEntry(entry: Pick<ExtractedEntry, "name" | "phone" | "email">, candidates: MatchCandidate[]) {
  const entryName = normalizeName(entry.name);

  return candidates
    .map((candidate) => {
      const strong =
        samePhone(entry.phone, candidate.phone) ||
        Boolean(entry.email && candidate.email && entry.email === candidate.email.toLowerCase());
      const weak = entryName.length > 0 && normalizeName(candidate.name) === entryName;
      return { candidate, score: strong ? 2 : weak ? 1 : 0 };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.candidate);
}

export async function findProspectMatches(entries: ExtractedEntry[]) {
  const { prisma } = await import("@/lib/prisma");
  const candidates = await prisma.prospect.findMany({
    select: { id: true, name: true, phone: true, email: true, status: true },
    orderBy: { derniereActivite: "desc" },
    take: 1000,
  });

  return entries.map((entry) => findMatchesForEntry(entry, candidates));
}
