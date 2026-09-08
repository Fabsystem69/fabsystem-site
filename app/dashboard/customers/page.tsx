import Link from "next/link";
import { CustomerCreateForm } from "@/components/dashboard/CustomerCreateForm";
import { formatCustomerAssetSummary } from "@/lib/customer-asset";
import { formatCustomerDisplayName, formatDate } from "@/lib/format";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";
import {
  getCustomersPage,
  normalizeCustomerSearchQuery,
  parseCustomerLimitParam,
  parseCustomerPageParam,
  parseCustomerSegmentParam,
} from "@/lib/services/customers";
import { CUSTOMER_SEGMENTS, CUSTOMER_SEGMENT_LABELS, type CustomerSegment } from "@/lib/services/customer-segments";
import { listEditorUsersWithoutSubscription } from "@/lib/services/editor-crm";
import { runEditorCrmAutoRemindersAction, sendCustomerMailingAction } from "./actions";
import {
  DashboardPageShell,
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminSearchInput,
  AdminTable,
  adminTableBodyClass,
  adminTableCellClass,
  adminTableCellStrongClass,
  adminTableHeadCellClass,
  adminTableHeadClass,
  adminTableRowClass,
} from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const EDITEUR_SANS_ABONNEMENT = "editeur-sans-abonnement" as const;
type PageSegment = CustomerSegment | typeof EDITEUR_SANS_ABONNEMENT;

function buildSegmentHref(segment: PageSegment | null, search: string) {
  const params = new URLSearchParams();
  if (segment) params.set("segment", segment);
  if (search) params.set("search", search);
  const query = params.toString();
  return query ? `/dashboard/customers?${query}` : "/dashboard/customers";
}

export default async function DashboardCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    new?: string;
    search?: string;
    page?: string;
    limit?: string;
    segment?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const search = normalizeCustomerSearchQuery(params.search);
  const requestedPage = parseCustomerPageParam(params.page);
  const requestedLimit = parseCustomerLimitParam(params.limit);
  const segment = parseCustomerSegmentParam(params.segment);
  const isEditeurSansAbonnement = params.segment === EDITEUR_SANS_ABONNEMENT;

  let databaseError: string | null = null;

  // Vue standard : liste de clients paginée, filtrée par segment.
  let customers: Awaited<ReturnType<typeof getCustomersPage>>["customers"] = [];
  let totalCount = 0;
  let totalPages = 1;
  let currentPage = 1;
  let pageSize = 20;
  let segmentCounts: Record<CustomerSegment, number> = {
    "editeur-plus": 0,
    accompagnement: 0,
    ebook: 0,
    "juste-inscrit": 0,
  };

  // Vue spécialisée : candidats à la relance Éditeur Plus (a utilisé
  // l'éditeur, aucun accès actif, aucun dossier d'accompagnement en cours —
  // voir lib/services/editor-crm.ts). Colonnes différentes (activité,
  // dernier contact) d'une liste de clients classique, jamais mélangées.
  let editeurSansAbonnementUsers: Awaited<ReturnType<typeof listEditorUsersWithoutSubscription>> = [];

  try {
    if (isEditeurSansAbonnement) {
      [editeurSansAbonnementUsers, { totalCount, segmentCounts }] = await Promise.all([
        listEditorUsersWithoutSubscription(),
        getCustomersPage({ limit: 1 }),
      ]);
    } else {
      ({ customers, totalCount, totalPages, currentPage, pageSize, segmentCounts } = await getCustomersPage({
        search,
        page: requestedPage,
        limit: requestedLimit,
        segment,
      }));
    }
  } catch (error) {
    databaseError = getDatabaseErrorMessage(error);
  }

  const activeSegment: PageSegment | null = isEditeurSansAbonnement ? EDITEUR_SANS_ABONNEMENT : segment;

  return (
    <DashboardPageShell>
        <AdminPageHeader
          title="Clients"
          backHref="/dashboard"
          backLabel="Retour au dashboard"
          description={
            search
              ? `Résultats pour "${search}".`
              : "Tous les clients — filtrez par segment pour cibler un mailing ou une relance."
          }
          actions={
            <>
              <form className="flex items-center gap-2" method="get">
                {segment ? <input type="hidden" name="segment" value={segment} /> : null}
                <input type="hidden" name="limit" value={String(pageSize)} />
                <AdminSearchInput type="search" name="search" defaultValue={search} placeholder="Rechercher un client" />
                <AdminButton type="submit">Rechercher</AdminButton>
              </form>
              <AdminButton
                variant="primary"
                href={`/dashboard/customers?new=1${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              >
                Nouveau client
              </AdminButton>
            </>
          }
        />

        {databaseError ? <AdminAlert tone="warning">{databaseError}</AdminAlert> : null}
        {params.error ? <AdminAlert tone="danger">{params.error}</AdminAlert> : null}
        {params.success ? <AdminAlert tone="success">{params.success}</AdminAlert> : null}

        {params.new === "1" && !databaseError ? <CustomerCreateForm /> : null}

        {!databaseError ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Segment :</span>
            <Link
              href={buildSegmentHref(null, search)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                !activeSegment ? "border-brand-400 bg-brand-400/10 text-brand-300" : "border-neutral-700 text-neutral-400 hover:border-neutral-600"
              }`}
            >
              Tous ({totalCount})
            </Link>
            {CUSTOMER_SEGMENTS.map((value) => (
              <Link
                key={value}
                href={buildSegmentHref(value, search)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  activeSegment === value ? "border-brand-400 bg-brand-400/10 text-brand-300" : "border-neutral-700 text-neutral-400 hover:border-neutral-600"
                }`}
              >
                {CUSTOMER_SEGMENT_LABELS[value]} ({segmentCounts[value]})
              </Link>
            ))}
            <Link
              href={buildSegmentHref(EDITEUR_SANS_ABONNEMENT, search)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                activeSegment === EDITEUR_SANS_ABONNEMENT ? "border-amber-400 bg-amber-400/10 text-amber-300" : "border-neutral-700 text-neutral-400 hover:border-neutral-600"
              }`}
              title="A utilisé l'éditeur, aucun accès actif — candidats à une relance"
            >
              Éditeur sans abonnement
            </Link>
          </div>
        ) : null}

        {isEditeurSansAbonnement ? (
          <EditeurSansAbonnementView users={editeurSansAbonnementUsers} search={search} />
        ) : (
          <>
            {!databaseError ? (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-500">
                <p>
                  {totalCount} client{totalCount > 1 ? "s" : ""} au total
                  {search ? ` pour "${search}"` : ""}.
                </p>
                <div className="flex items-center gap-2">
                  <span>Page</span>
                  <span className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-200">
                    {currentPage} / {totalPages}
                  </span>
                </div>
              </div>
            ) : null}

            {customers.length === 0 && !databaseError ? (
              <AdminEmptyState title="Aucun client pour l'instant." />
            ) : !databaseError ? (
              <form action={sendCustomerMailingAction} className="space-y-4">
                {segment ? <input type="hidden" name="segment" value={segment} /> : null}
                <AdminTable>
                  <thead className={adminTableHeadClass}>
                    <tr>
                      <th className={adminTableHeadCellClass}></th>
                      <th className={adminTableHeadCellClass}>Nom</th>
                      <th className={adminTableHeadCellClass}>Email</th>
                      <th className={adminTableHeadCellClass}>Téléphone</th>
                      <th className={adminTableHeadCellClass}>Équipement</th>
                      <th className={adminTableHeadCellClass}>Segments</th>
                      <th className={adminTableHeadCellClass}>Créé le</th>
                      <th className={adminTableHeadCellClass}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={adminTableBodyClass}>
                    {customers.map((customer) => (
                      <tr key={customer.id} className={adminTableRowClass}>
                        <td className={adminTableCellClass}>
                          <input type="checkbox" name="customerIds" value={customer.id} className="h-4 w-4 rounded border-neutral-600 bg-neutral-900" />
                        </td>
                        <td className={adminTableCellStrongClass}>
                          <Link
                            href={`/dashboard/customers/${customer.id}`}
                            className="underline underline-offset-2 hover:text-brand-300"
                          >
                            {formatCustomerDisplayName(customer)}
                          </Link>
                        </td>
                        <td className={adminTableCellClass}>{customer.email || "-"}</td>
                        <td className={adminTableCellClass}>{customer.phone || "-"}</td>
                        <td className={adminTableCellClass}>{formatCustomerAssetSummary(customer) || "-"}</td>
                        <td className={adminTableCellClass}>
                          <div className="flex flex-wrap gap-1">
                            {customer.segments.map((customerSegment) => (
                              <AdminBadge key={customerSegment} tone={customerSegment === "juste-inscrit" ? "neutral" : "info"}>
                                {CUSTOMER_SEGMENT_LABELS[customerSegment]}
                              </AdminBadge>
                            ))}
                          </div>
                        </td>
                        <td className={adminTableCellClass}>{new Intl.DateTimeFormat("fr-FR").format(customer.createdAt)}</td>
                        <td className={adminTableCellClass}>
                          <Link
                            href={`/dashboard/customers/${customer.id}/edit`}
                            className="underline underline-offset-2 hover:text-brand-300"
                          >
                            Modifier
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>

                <MailingForm />
              </form>
            ) : null}

            {!databaseError ? (
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                buildHref={(page) =>
                  `/dashboard/customers?page=${page}&limit=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ""}${
                    segment ? `&segment=${segment}` : ""
                  }`
                }
              />
            ) : null}
          </>
        )}
  </DashboardPageShell>
  );
}

function MailingForm() {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
      <p className="mb-3 text-sm font-semibold text-white">Mailing vers les cases cochées ci-dessus</p>
      <div className="grid gap-3">
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Objet
          <input
            name="subject"
            type="text"
            required
            placeholder="Ex. Une nouveauté qui pourrait vous intéresser"
            className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400"
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Message
          <textarea
            name="message"
            rows={5}
            required
            placeholder="Bonjour, ..."
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400"
          />
        </label>
        <div>
          <AdminButton type="submit" variant="primary">Envoyer aux destinataires sélectionnés</AdminButton>
        </div>
      </div>
    </div>
  );
}

function EditeurSansAbonnementView({
  users,
  search: _search,
}: {
  users: Awaited<ReturnType<typeof listEditorUsersWithoutSubscription>>;
  search: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-sm text-amber-200">
          Comptes ayant créé au moins un projet dans l&apos;éditeur de schéma, sans abonnement Éditeur Plus actif ni
          dossier d&apos;accompagnement en cours. La relance automatique respecte 14 jours d&apos;inactivité et jamais
          plus d&apos;un contact tous les 60 jours.
        </p>
        <form action={runEditorCrmAutoRemindersAction}>
          <AdminButton type="submit" variant="secondary">Lancer la relance automatique maintenant</AdminButton>
        </form>
      </div>

      {users.length === 0 ? (
        <AdminEmptyState
          title="Aucun compte dans ce segment pour l'instant."
          description="Tous les utilisateurs de l'éditeur ont un accès actif ou un dossier en cours, ou personne n'a encore créé de projet."
        />
      ) : (
        <form action={sendCustomerMailingAction} className="space-y-4">
          <input type="hidden" name="segment" value={EDITEUR_SANS_ABONNEMENT} />
          <AdminTable>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeadCellClass}></th>
                <th className={adminTableHeadCellClass}>Client</th>
                <th className={adminTableHeadCellClass}>Projets</th>
                <th className={adminTableHeadCellClass}>Dernière activité</th>
                <th className={adminTableHeadCellClass}>Dernier contact</th>
                <th className={adminTableHeadCellClass}>Compte créé</th>
              </tr>
            </thead>
            <tbody className={adminTableBodyClass}>
              {users.map((user) => (
                <tr key={user.id} className={adminTableRowClass}>
                  <td className={adminTableCellClass}>
                    <input type="checkbox" name="customerIds" value={user.id} className="h-4 w-4 rounded border-neutral-600 bg-neutral-900" />
                  </td>
                  <td className={adminTableCellStrongClass}>
                    <Link href={`/dashboard/customers/${user.id}`} className="underline underline-offset-2 hover:text-brand-300">
                      {formatCustomerDisplayName(user)}
                    </Link>
                    <div className="text-xs font-normal text-neutral-500">{user.email}</div>
                  </td>
                  <td className={adminTableCellClass}>{user.projectCount}</td>
                  <td className={adminTableCellClass}>{formatDate(user.lastActivityAt)}</td>
                  <td className={adminTableCellClass}>{user.lastContactedAt ? formatDate(user.lastContactedAt) : "Jamais"}</td>
                  <td className={adminTableCellClass}>{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>

          <MailingForm />
        </form>
      )}
    </div>
  );
}
