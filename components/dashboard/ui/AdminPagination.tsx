import Link from "next/link";

// Remplace le pattern "Page précédente / Page suivante" répété sur
// customers/errors : mêmes pages qu'avant, mais avec les numéros visibles
// plutôt qu'une navigation à l'aveugle. buildHref reste à la charge de
// l'appelant (chaque liste a ses propres filtres/recherche à préserver dans
// l'URL).
function getPageWindow(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  const spread = 1;
  const pages = new Set<number>([1, totalPages]);

  for (let page = currentPage - spread; page <= currentPage + spread; page += 1) {
    if (page >= 1 && page <= totalPages) {
      pages.add(page);
    }
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  let previous: number | null = null;

  for (const page of sorted) {
    if (previous !== null && page - previous > 1) {
      result.push("ellipsis");
    }
    result.push(page);
    previous = page;
  }

  return result;
}

function PaginationEdgeLink({
  page,
  buildHref,
  disabled,
  label,
}: {
  page: number;
  buildHref: (page: number) => string;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-9 items-center rounded-lg border border-neutral-800 px-3 text-sm font-medium text-neutral-700">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={buildHref(page)}
      className="inline-flex h-9 items-center rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium text-neutral-200 transition-colors duration-150 hover:bg-neutral-800"
    >
      {label}
    </Link>
  );
}

export function AdminPagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPageWindow(currentPage, totalPages);

  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
      <PaginationEdgeLink page={currentPage - 1} buildHref={buildHref} disabled={currentPage <= 1} label="← Précédent" />

      <ul className="flex items-center gap-1">
        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <li key={`ellipsis-${index}`} className="px-1.5 text-sm text-neutral-600">
              …
            </li>
          ) : (
            <li key={page}>
              <Link
                href={buildHref(page)}
                aria-current={page === currentPage ? "page" : undefined}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-semibold transition-colors duration-150 ${
                  page === currentPage
                    ? "bg-brand-400 text-neutral-950"
                    : "text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                {page}
              </Link>
            </li>
          )
        )}
      </ul>

      <PaginationEdgeLink
        page={currentPage + 1}
        buildHref={buildHref}
        disabled={currentPage >= totalPages}
        label="Suivant →"
      />
    </nav>
  );
}
