export default function VisioPage() {
  return (
    <main>
      {/* HERO */}
      <section
        className="relative min-h-[60vh] bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-fabsystem.png')" }}
      >
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-24 text-white sm:py-28">
          <p className="text-sm uppercase tracking-wide text-white/80">
            Visio / Conseil
          </p>

          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            Clarifiez votre installation en 1 heure
          </h1>

          <p className="mt-5 max-w-2xl text-white/90">
            Un échange simple et concret pour éviter les erreurs coûteuses,
            sécuriser vos choix et repartir avec un plan d’action clair.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
              ⏱️ 1h00
            </span>
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
              💶 50 €
            </span>
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
              ⚡ Bateau • Van • Camping-car
            </span>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#reserver"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-black"
            >
              Réserver ma visio
            </a>
            <a
              href="#formulaire"
              className="rounded-md border border-white/70 px-6 py-3 text-sm font-semibold text-white"
            >
              Préparer ma demande
            </a>
          </div>
        </div>
      </section>

      {/* CONTENU */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        {/* Ce qu'on fait */}
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">Ce qu’on traite ensemble</h2>
            <ul className="mt-4 space-y-2 text-sm text-neutral-700">
              <li>• Analyse de ton besoin et de ton usage réel</li>
              <li>• Vérification de la cohérence batteries / charge / distribution</li>
              <li>• Points critiques : protections, sections, sécurités, repérage</li>
              <li>• Priorités : quoi faire maintenant, quoi faire plus tard</li>
            </ul>
          </div>

          <div className="rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">But de la visio</h2>
            <p className="mt-4 text-sm text-neutral-700">
              Te faire gagner du temps et éviter les erreurs : tu repars avec une
              liste claire des actions à réaliser (et dans quel ordre), adaptée à
              ton installation.
            </p>
          </div>
        </div>

        {/* Comment ça se passe */}
        <div className="mt-14">
          <h2 className="text-2xl font-semibold">Comment ça se passe ?</h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 p-6">
              <div className="text-sm font-semibold text-neutral-900">1 — Infos</div>
              <p className="mt-2 text-sm text-neutral-700">
                Tu remplis le formulaire pour que je comprenne ton contexte.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 p-6" id="reserver">
              <div className="text-sm font-semibold text-neutral-900">2 — Réservation</div>
              <p className="mt-2 text-sm text-neutral-700">
                Tu réserves ton créneau (Cal.com) et tu notes la date dans le formulaire.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 p-6">
              <div className="text-sm font-semibold text-neutral-900">3 — Visio</div>
              <p className="mt-2 text-sm text-neutral-700">
                On échange 1 heure, puis tu repars avec un plan d’action clair.
              </p>
            </div>
          </div>

          {/* Bouton réservation (lien à remplacer) */}
          <div className="mt-8">
            <a
              href="https://cal.com/fabien-l-typ79a"
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Réserver mon créneau
            </a>
            <p className="mt-2 text-xs text-neutral-500">
              Remplace ce lien par ton lien Cal.com dès que tu l’as.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="mt-14" id="formulaire">
          <h2 className="text-2xl font-semibold">Ton projet en détails</h2>
          <p className="mt-3 max-w-3xl text-neutral-700">
            Plus tu es précis, plus la visio sera efficace.
          </p>

          <form className="mt-8 space-y-10">
            <section className="rounded-xl border border-neutral-200 p-6">
              <h3 className="font-semibold">1) Infos générales</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <input className="w-full rounded-md border px-4 py-2" placeholder="Nom / Prénom *" />
                <input className="w-full rounded-md border px-4 py-2" placeholder="Email *" />
                <input className="w-full rounded-md border px-4 py-2" placeholder="Téléphone (optionnel)" />
                <input className="w-full rounded-md border px-4 py-2" placeholder="Date / heure de la visio (si connue)" />
              </div>
            </section>

            <section className="rounded-xl border border-neutral-200 p-6">
              <h3 className="font-semibold">2) Support</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <input className="w-full rounded-md border px-4 py-2" placeholder="Bateau / Van / Camping-car ?" />
                <input className="w-full rounded-md border px-4 py-2" placeholder="Modèle (si connu)" />
              </div>
              <textarea
                className="mt-4 w-full rounded-md border px-4 py-2"
                rows={4}
                placeholder="Décris ton installation actuelle (batteries, charge, équipements) — même approximatif."
              />
            </section>

            <section className="rounded-xl border border-neutral-200 p-6">
              <h3 className="font-semibold">3) Objectif</h3>
              <textarea
                className="mt-4 w-full rounded-md border px-4 py-2"
                rows={4}
                placeholder="Qu’est-ce que tu veux obtenir ? (autonomie, sécurité, panne, ajout solaire, etc.)"
              />
              <div className="mt-4">
                <p className="text-sm font-medium text-neutral-900">
                  Tes 3 questions prioritaires
                </p>
                <div className="mt-3 grid gap-3">
                  <input className="w-full rounded-md border px-4 py-2" placeholder="Question 1" />
                  <input className="w-full rounded-md border px-4 py-2" placeholder="Question 2" />
                  <input className="w-full rounded-md border px-4 py-2" placeholder="Question 3" />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-neutral-200 p-6">
              <h3 className="font-semibold">4) Infos utiles</h3>
              <textarea
                className="mt-4 w-full rounded-md border px-4 py-2"
                rows={5}
                placeholder="Contraintes, échéance, photos/plan (tu pourras les envoyer par mail ensuite), etc."
              />
            </section>

            <div className="rounded-xl bg-neutral-900 p-6 text-white">
              <p className="text-sm text-white/90">
                En envoyant ce formulaire, tu acceptes que ces informations soient utilisées
                uniquement pour préparer notre rendez-vous.
              </p>

              {/* Pour l’instant: bouton non connecté */}
              <button
                type="button"
                className="mt-4 rounded-md bg-white px-6 py-3 text-sm font-semibold text-black"
              >
                Envoyer le formulaire
              </button>

              <p className="mt-2 text-xs text-white/70">
                (On branchera l’envoi email quand tu voudras.)
              </p>
            </div>
          </form>

          <div className="mt-8 text-sm text-neutral-600">
            Contact direct :{" "}
            <a className="font-semibold text-neutral-900 underline" href="mailto:fabien.lages@fabsystem.fr">
              fabien.lages@fabsystem.fr
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}