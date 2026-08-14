import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site FabSystem.",
  alternates: {
    canonical: "/mentions-legales",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Mentions légales</h1>

      <section className="mt-10 space-y-6 text-sm text-neutral-700">
        <div>
          <h2 className="font-semibold text-neutral-900">Éditeur du site</h2>
          <p className="mt-2">
            <strong>FabSystem</strong>
            <br />
            Entrepreneur individuel : <strong>Fabien Lages</strong>
            <br />
            SIREN : <strong>100 271 980</strong>
            <br />
            SIRET : <strong>100 271 980 00011</strong>
            <br />
            Code APE : <strong>4321A</strong> – Travaux d&apos;installation électrique 
            <br />
            Activité principale : Installation d’équipements électriques et électroniques
            <br />
          
          Responsable de la publication : <strong>Fabien Lages</strong>
            <br />
            Email :{" "}
            <a
              href="mailto:contact@fabsystem.fr"
              className="underline"
            >
              contact@fabsystem.fr
            </a>
            <br />
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-900">Activité</h2>
          <p className="mt-2">
            Prestations de services dans le domaine de l’électricité embarquée
            (bateaux, vans, camping-cars), diagnostic technique, mise en conformité,
            conseil et accompagnement à distance.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-900">Hébergement</h2>
          <p className="mt-2">
            Le site est hébergé par :
            <br />
            <strong>Vercel Inc.</strong>
            <br />
            440 N Barranca Ave #4133
            <br />
            Covina, CA 91723
            <br />
            États-Unis
            <br />
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
            © {new Date().getFullYear()} FabSystem — Tous droits réservés.
            L’ensemble des éléments de ce site — textes, images, logos,
            éléments graphiques, mais aussi le code source, les
            fonctionnalités, les outils (dont l’éditeur de schéma
            électrique et son catalogue de composants) et leur mise en
            forme — est la propriété exclusive de FabSystem, sauf mention
            contraire. Toute reproduction, représentation, extraction,
            réutilisation, décompilation, modification ou adaptation,
            totale ou partielle, par quelque procédé que ce soit
            (notamment la copie du code d’une page ou son intégration sur
            un autre site), est interdite sans autorisation écrite
            préalable et pourra faire l’objet de poursuites conformément
            au Code de la propriété intellectuelle.
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
            Conformément à la réglementation en vigueur (RGPD),
            vous pouvez exercer vos droits d’accès, de rectification ou de suppression
            en contactant :
            <br />
            <a
              href="mailto:contact@fabsystem.fr"
              className="underline"
            >
              contact@fabsystem.fr
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
