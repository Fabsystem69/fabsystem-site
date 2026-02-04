export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Mentions légales</h1>

      <section className="mt-10 space-y-6 text-sm text-neutral-700">
        <div>
          <h2 className="font-semibold text-neutral-900">Éditeur du site</h2>
          <p className="mt-2">
            <strong>FabSystem</strong><br />
            Responsable de la publication : Fabien Lages<br />
            Email :{" "}
            <a
              href="mailto:fabien.lages@fabsystem.fr"
              className="underline"
            >
              fabien.lages@fabsystem.fr
            </a>
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-900">Activité</h2>
          <p className="mt-2">
            Prestations de services dans le domaine de l’électricité embarquée
            (bateaux, vans, camping-cars), conseil technique et accompagnement à distance.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-900">Hébergement</h2>
          <p className="mt-2">
            Le site est hébergé par :<br />
            <strong>Vercel Inc.</strong><br />
            440 N Barranca Ave #4133<br />
            Covina, CA 91723<br />
            États-Unis<br />
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              https://vercel.com
            </a>
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-900">
            Propriété intellectuelle
          </h2>
          <p className="mt-2">
            L’ensemble des contenus présents sur ce site (textes, images, logos,
            éléments graphiques) est la propriété exclusive de FabSystem,
            sauf mention contraire. Toute reproduction, représentation,
            modification ou adaptation, totale ou partielle, est interdite
            sans autorisation préalable.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-900">
            Responsabilité
          </h2>
          <p className="mt-2">
            Les informations fournies sur ce site le sont à titre indicatif.
            FabSystem ne saurait être tenu responsable des erreurs,
            omissions ou des résultats pouvant être obtenus par un mauvais
            usage de ces informations.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-900">
            Données personnelles
          </h2>
          <p className="mt-2">
            Les données personnelles collectées via les formulaires sont utilisées
            uniquement pour répondre aux demandes et ne sont jamais cédées à des tiers.
            Conformément à la réglementation en vigueur, vous pouvez exercer vos droits
            d’accès, de rectification ou de suppression en contactant :
            <br />
            <a
              href="mailto:fabien.lages@fabsystem.fr"
              className="underline"
            >
              fabien.lages@fabsystem.fr
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}