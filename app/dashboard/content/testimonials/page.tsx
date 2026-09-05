import Link from "next/link";
import { formatDate } from "@/lib/format";
import { listAdminTestimonials } from "@/lib/services/testimonials";
import {
  deleteTestimonialAction,
  setTestimonialDisplayOrderAction,
  setTestimonialFeaturedAction,
  setTestimonialPublishedAction,
} from "./actions";
import {
  DashboardPageShell,
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminPageHeader,
  AdminTable,
  adminTableBodyClass,
  adminTableCellClass,
  adminTableHeadCellClass,
  adminTableHeadClass,
  adminTableRowClass,
} from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const customerTypeLabels: Record<string, string> = {
  VAN: "Van & Fourgon",
  CAMPING_CAR: "Camping-car",
  BOAT: "Bateau",
  OTHER: "Autre",
};

export default async function DashboardTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const testimonials = await listAdminTestimonials();
  const { error, success } = await searchParams;

  return (
    <DashboardPageShell>
        <AdminPageHeader
          title="Témoignages clients"
          backHref="/dashboard"
          backLabel="Retour au dashboard"
          description="Modération des avis clients affichés sur le site. Les témoignages soumis depuis la page publique arrivent ici non publiés, puis sont relus avant mise en ligne."
          actions={
            <AdminButton variant="primary" href="/dashboard/content/testimonials/new">
              Ajouter un témoignage
            </AdminButton>
          }
        />

        {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}
        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

        {testimonials.length === 0 ? (
          <AdminEmptyState
            title="Aucun témoignage enregistré pour le moment."
            description="Aucun avis n'est inventé ici : ajoutez uniquement de vrais retours clients."
          />
        ) : (
          <AdminTable>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeadCellClass}>Auteur / contenu</th>
                <th className={adminTableHeadCellClass}>Type</th>
                <th className={adminTableHeadCellClass}>Véhicule / bateau</th>
                <th className={adminTableHeadCellClass}>Région</th>
                <th className={adminTableHeadCellClass}>Note</th>
                <th className={adminTableHeadCellClass}>Statut</th>
                <th className={adminTableHeadCellClass}>Ordre</th>
                <th className={adminTableHeadCellClass}>Actions</th>
              </tr>
            </thead>
            <tbody className={adminTableBodyClass}>
              {testimonials.map((testimonial) => (
                <tr key={testimonial.id} className={adminTableRowClass}>
                  <td className={`${adminTableCellClass} max-w-xs`}>
                    <div className="font-medium text-white">{testimonial.displayName}</div>
                    <div className="mt-1 text-xs text-neutral-400">
                      {testimonial.quote.length > 80 ? `${testimonial.quote.slice(0, 80)}…` : testimonial.quote}
                    </div>
                    <div className="mt-1 text-xs text-neutral-600">Créé le {formatDate(testimonial.createdAt)}</div>
                  </td>
                  <td className={adminTableCellClass}>
                    {customerTypeLabels[testimonial.customerType] ?? testimonial.customerType}
                  </td>
                  <td className={adminTableCellClass}>{testimonial.vehicleModel || "—"}</td>
                  <td className={adminTableCellClass}>{testimonial.region || "—"}</td>
                  <td className={adminTableCellClass}>{testimonial.rating} / 5</td>
                  <td className={adminTableCellClass}>
                    <div className="flex flex-col gap-1">
                      <AdminBadge tone={testimonial.isPublished ? "success" : "warning"}>
                        {testimonial.isPublished ? "Publié" : "Non publié"}
                      </AdminBadge>
                      {testimonial.isFeatured ? <AdminBadge tone="info">Mis en avant</AdminBadge> : null}
                      {testimonial.isVerifiedPurchase ? <AdminBadge tone="neutral">Achat vérifié</AdminBadge> : null}
                    </div>
                  </td>
                  <td className={adminTableCellClass}>
                    <form action={setTestimonialDisplayOrderAction} className="flex items-center gap-1.5">
                      <input type="hidden" name="id" value={testimonial.id} />
                      <input
                        type="number"
                        name="displayOrder"
                        defaultValue={testimonial.displayOrder}
                        className="h-8 w-16 rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                      />
                      <AdminButton type="submit" variant="secondary" size="sm">
                        OK
                      </AdminButton>
                    </form>
                  </td>
                  <td className={adminTableCellClass}>
                    <div className="flex flex-col items-start gap-1.5">
                      <Link
                        href={`/dashboard/content/testimonials/${testimonial.id}/edit`}
                        className="text-xs font-semibold text-brand-300 underline underline-offset-2 hover:text-brand-200"
                      >
                        Modifier
                      </Link>

                      <form action={setTestimonialPublishedAction}>
                        <input type="hidden" name="id" value={testimonial.id} />
                        <input type="hidden" name="isPublished" value={testimonial.isPublished ? "false" : "true"} />
                        <AdminButton type="submit" variant="secondary" size="sm">
                          {testimonial.isPublished ? "Masquer" : "Publier"}
                        </AdminButton>
                      </form>

                      <form action={setTestimonialFeaturedAction}>
                        <input type="hidden" name="id" value={testimonial.id} />
                        <input type="hidden" name="isFeatured" value={testimonial.isFeatured ? "false" : "true"} />
                        <AdminButton type="submit" variant="secondary" size="sm">
                          {testimonial.isFeatured ? "Retirer avant" : "Mettre en avant"}
                        </AdminButton>
                      </form>

                      {!testimonial.isPublished ? (
                        <form action={deleteTestimonialAction}>
                          <input type="hidden" name="id" value={testimonial.id} />
                          <AdminButton type="submit" variant="danger" size="sm">
                            Supprimer
                          </AdminButton>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
  </DashboardPageShell>
  );
}
