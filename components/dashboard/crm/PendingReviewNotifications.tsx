import Link from "next/link";
import { AdminBadge, AdminButton, AdminCard } from "@/components/dashboard/ui";
import { resendReviewNotificationAction } from "@/app/dashboard/crm/review-notification-actions";
import { formatDateTime } from "@/lib/format";
import { listPendingReviewNotifications } from "@/lib/services/coaching-review-submission";

// Projets transmis dont l'e-mail de notification n'est pas parti : rien n'est
// perdu (le projet est enregistré), mais Fabien doit pouvoir relancer l'envoi.
export async function PendingReviewNotifications() {
  const pending = await listPendingReviewNotifications();
  if (pending.length === 0) return null;

  return (
    <AdminCard title="Notifications à renvoyer" description="Ces projets sont bien enregistrés, mais l'e-mail de notification n'est pas parti.">
      <ul className="divide-y divide-neutral-800/80">
        {pending.map((item) => (
          <li key={item.projectId} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <span>
              <Link href={`/dashboard/crm/projects/${item.projectId}`} className="block text-base font-semibold text-white">
                {item.customerLabel}
              </Link>
              <span className="mt-0.5 block text-sm text-neutral-500">
                {item.title} · transmis le {formatDateTime(item.submittedAt)}
              </span>
              <AdminBadge tone="warning">E-mail non envoyé</AdminBadge>
            </span>
            <form action={resendReviewNotificationAction}>
              <input type="hidden" name="projectId" value={item.projectId} />
              <AdminButton type="submit" variant="primary">
                Renvoyer la notification
              </AdminButton>
            </form>
          </li>
        ))}
      </ul>
    </AdminCard>
  );
}
