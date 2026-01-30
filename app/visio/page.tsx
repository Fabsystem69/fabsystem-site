import VisioForm from "../../components/VisioForm";

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
              href="https://cal.com/fabien-l-typ79a"
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
            >
              Réserver mon créneau
            </a>

            <a
              href="#demande"
              className="rounded-md border border-white/70 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Préparer ma demande
            </a>
          </div>
        </div>
      </section>

      {/* CONTENU */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-2">
          {/* Texte explicatif */}
          <div>
            <h2 className="text-2xl font-semibold">Préparer la visio</h2>
            <p className="mt-4 text-neutral-700">
              Plus vous êtes précis, plus la visio est efficace. Ce formulaire me
              permet de préparer votre séance et d’aller droit au but.
            </p>

            <ul className="mt-6 space-y-2 text-neutral-700">
              <li>• Contexte + objectifs</li>
              <li>• Installation actuelle (batteries, charge, 230V…)</li>
              <li>• Vos questions prioritaires</li>
              <li>• Lien photos/schéma (recommandé)</li>
            </ul>

            <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-sm text-neutral-700">
                Vous pouvez <strong>réserver sur Cal.com</strong> avant ou après
                avoir rempli le formulaire.
              </p>

              <a
                href="https://cal.com/fabien-l-typ79a"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-md bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Réserver mon créneau
              </a>

              <p className="mt-3 text-xs text-neutral-500">
                Si vous avez déjà réservé, indiquez la date/heure dans le formulaire.
              </p>
            </div>
          </div>

          {/* Formulaire */}
          <div id="demande" className="rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold">Brief de préparation</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Remplissez ce brief. Je vous réponds par email si un point manque.
            </p>

            <VisioForm />
          </div>
        </div>
      </section>
    </main>
  );
}