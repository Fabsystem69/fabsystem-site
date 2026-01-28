export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Contact
      </h1>

      <p className="mt-4 max-w-3xl text-neutral-700">
        Décris ton besoin en quelques lignes : type de véhicule,
        état de l’installation, objectif (sécurité, autonomie,
        remise à niveau).
      </p>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        {/* Infos contact */}
        <div className="rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold">Coordonnées</h2>

          <p className="mt-4 text-sm text-neutral-700">
            📞 06 98 24 77 22
          </p>
          <p className="text-sm text-neutral-700">
            ✉️ fabien.lages@gmail.com
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Neuville-sur-Saône (69) — interventions selon projet
          </p>
        </div>

        {/* Formulaire (non connecté pour l’instant) */}
        <form className="rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold">Demande de diagnostic</h2>

          <div className="mt-4 space-y-4">
            <input
              type="text"
              placeholder="Nom"
              className="w-full rounded-lg border border-neutral-300 px-4 py-2"
            />

            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-lg border border-neutral-300 px-4 py-2"
            />

            <textarea
              placeholder="Explique ton besoin…"
              rows={4}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2"
            />

            <button
              type="button"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Envoyer la demande
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}