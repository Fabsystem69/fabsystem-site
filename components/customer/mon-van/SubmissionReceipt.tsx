// Confirmation de reception d'un projet transmis. Composant serveur pur :
// affiche l'horodatage en heure de Paris, jamais l'heure UTC brute.

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatReceiptMoment(value: Date): string {
  return `${dateFormatter.format(value)} à ${timeFormatter.format(value)}`;
}

export function SubmissionReceipt({
  readyForReviewAt,
  inReview,
}: {
  readyForReviewAt: Date | null;
  inReview: boolean;
}) {
  if (!readyForReviewAt) return null;
  const moment = formatReceiptMoment(readyForReviewAt);

  return (
    <section
      aria-labelledby="submission-receipt-title"
      className="rounded-card border border-emerald-200 bg-emerald-50 p-4 sm:p-5"
    >
      <h2 id="submission-receipt-title" className="text-base font-semibold text-emerald-900">
        {inReview ? `Projet reçu le ${moment}` : `Dernière transmission reçue le ${moment}`}
      </h2>
      <p className="mt-1 text-sm text-emerald-900">
        {inReview
          ? "Fabien l'étudie et revient vers vous."
          : "Fabien l'a étudiée. Vous pouvez compléter votre fiche et la transmettre à nouveau si besoin."}
      </p>
      <p className="mt-2 text-sm text-emerald-800">Rien n&apos;est facturé : cette transmission n&apos;est ni une commande ni un paiement.</p>
    </section>
  );
}
