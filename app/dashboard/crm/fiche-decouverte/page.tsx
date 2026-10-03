import Link from "next/link";
import { PrintButton } from "@/components/dashboard/crm/PrintButton";
import {
  DISCOVERY_SHEET_VERSION,
  UNKNOWN_OPTION,
  getSheetPageGroups,
  type DiscoveryField,
  type DiscoverySection,
} from "@/lib/crm/discovery-sheet-spec";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ projectId?: string | string[] }> };

// Masque le shell du dashboard (sidebar, barre mobile, fil d'Ariane) à
// l'impression, via la structure de components/dashboard/shell/DashboardShell.tsx
// et Sidebar.tsx : div[data-theme] > aside | div > header | div.h-11.
const PRINT_STYLE = `
@page { size: A4; margin: 12mm; }
@media print {
  div[data-theme] > aside,
  div[data-theme] > div > header,
  div[data-theme] > div > div.h-11 { display: none !important; }
  html, body, div[data-theme], main { background: #fff !important; }
}
`;

async function loadProjectRef(rawId: string | string[] | undefined): Promise<string> {
  const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!projectId) return "";
  try {
    const project = await prisma.coachingProject.findUnique({
      where: { id: projectId },
      select: { id: true, title: true, customer: { select: { name: true } } },
    });
    if (!project) return "";
    return `${project.customer.name} — ${project.title} (${project.id})`;
  } catch {
    return "";
  }
}

const Box = () => <span aria-hidden="true" className="mr-1.5 text-lg leading-none">☐</span>;

function WritingLines({ count }: { count: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-9 border-b border-black" />
      ))}
    </div>
  );
}

function Choices({ options }: { options: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2">
      {options.map((option) => (
        <li key={option} className="flex items-center text-sm">
          <Box />
          {option}
        </li>
      ))}
    </ul>
  );
}

function FieldTable({ field }: { field: DiscoveryField }) {
  const columns = field.columns ?? [];
  const rows = Array.from({ length: field.lines ?? 5 }, (_, index) => index);
  return (
    <table className="w-full table-fixed border-collapse text-sm">
      <caption className="sr-only">{field.label}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} scope="col" className="border border-black px-2 py-1 text-left font-semibold">
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row} className="h-11 break-inside-avoid">
            {columns.map((column) => (
              <td key={column.key} className="border border-black px-2 align-middle">
                {column.options ? (
                  <span className="flex flex-wrap gap-x-3">
                    {column.options.map((option) => (
                      <span key={option} className="whitespace-nowrap">
                        <Box />
                        {option}
                      </span>
                    ))}
                  </span>
                ) : null}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FieldBlock({ field }: { field: DiscoveryField }) {
  const labelId = `lbl-${field.key}`;
  return (
    <div className="break-inside-avoid" role="group" aria-labelledby={labelId}>
      <p id={labelId} className="mb-1 text-sm font-semibold">
        {field.label}
        {field.hint ? <span className="ml-2 text-xs font-normal">({field.hint})</span> : null}
      </p>
      {field.kind === "text" ? <WritingLines count={1} /> : null}
      {field.kind === "longtext" ? <WritingLines count={field.lines ?? 3} /> : null}
      {field.kind === "checkbox-group" ? <Choices options={field.options ?? []} /> : null}
      {field.kind === "yesno-unknown" ? <Choices options={["Oui", "Non", UNKNOWN_OPTION]} /> : null}
      {field.kind === "table" ? <FieldTable field={field} /> : null}
    </div>
  );
}

function SheetSection({ section }: { section: DiscoverySection }) {
  const headingId = `sec-${section.id}`;
  return (
    <section
      aria-labelledby={headingId}
      className={`break-inside-avoid-page ${section.coachOnly ? "border-4 border-double border-black p-4" : ""}`}
    >
      <h2 id={headingId} className="mb-3 border-b-2 border-black pb-1 text-lg font-bold uppercase">
        {section.number}. {section.title}
      </h2>
      <div className="space-y-4">
        {section.fields.map((field) => (
          <FieldBlock key={field.key} field={field} />
        ))}
      </div>
    </section>
  );
}

export default async function DiscoverySheetPage({ searchParams }: PageProps) {
  const { projectId } = await searchParams;
  const reference = await loadProjectRef(projectId);
  const groups = getSheetPageGroups();

  return (
    <div className="bg-white text-black">
      <style>{PRINT_STYLE}</style>
      <div className="mx-auto max-w-4xl px-6 py-6 print:max-w-none print:p-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href="/dashboard/crm" className="min-h-11 content-center text-sm font-medium underline">
            Retour au CRM
          </Link>
          <PrintButton />
        </div>

        {groups.map((group, groupIndex) => (
          <div
            key={group[0].id}
            className={`space-y-8 pb-10 ${groupIndex < groups.length - 1 ? "print:break-after-page" : ""}`}
          >
            <header className="border-b-4 border-black pb-3">
              {groupIndex === 0 ? (
                <h1 className="text-2xl font-bold">FabSystem — Fiche de découverte</h1>
              ) : (
                <p className="text-lg font-bold">FabSystem — Fiche de découverte</p>
              )}
              <p className="text-sm">Version {DISCOVERY_SHEET_VERSION} — page {groupIndex + 1}/{groups.length}</p>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <p>Date de l&apos;échange : __ / __ / ____</p>
                <p>Référence dossier : {reference || "______________________"}</p>
              </div>
            </header>
            {group.map((section) => (
              <SheetSection key={section.id} section={section} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
