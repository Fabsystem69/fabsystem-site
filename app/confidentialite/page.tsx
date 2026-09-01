import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité et traitement des données — FabSystem.",
  alternates: {
    canonical: "/confidentialite",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ConfidentialitePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Politique de confidentialité</h1>

      <section className="mt-10 space-y-6 text-sm text-neutral-700">
        <div>
          <h2 className="font-semibold text-neutral-900">
            Collecte des données personnelles
          </h2>
          <p className="mt-2">
            Les données personnelles collectées sur le site FabSystem sont celles
            que l’utilisateur choisit de transmettre via un formulaire, lors de la
            création d’un compte, de l’utilisation de l’éditeur ou d’un achat dans la boutique.
          </p>
          <p className="mt-2">
            Les données susceptibles d’être collectées sont notamment :
            nom, prénom, adresse email, numéro de téléphone, données de connexion,
            projets et schémas sauvegardés, commandes, téléchargements et contenu des messages.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-900">
            Utilisation des données
          </h2>
          <p className="mt-2">
            Les données collectées sont utilisées exclusivement pour :
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>répondre aux demandes envoyées via les formulaires,</li>
            <li>créer et sécuriser l’espace client,</li>
            <li>sauvegarder les projets et fournir les fonctionnalités demandées,</li>
            <li>traiter les commandes, téléchargements, devis et factures,</li>
            <li>organiser les échanges et assurer le suivi des demandes clients.</li>
          </ul>
          <p className="mt-2">
            Aucune donnée personnelle n’est vendue ni louée. Certaines données sont
            toutefois transmises aux prestataires techniques strictement nécessaires
            au fonctionnement du service, au paiement ou à l’hébergement.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-900">Choix marketing et partage de projet</h2>
          <p className="mt-2">
            Les messages marketing par email sont envoyés uniquement si vous avez donné
            votre accord. Vous pouvez le retirer à tout moment depuis votre compte ou via
            le lien de désinscription présent dans les emails concernés.
          </p>
          <p className="mt-2">
            Le partage d’un dossier projet avec FabSystem dans le cadre d’un accompagnement
            fait l’objet d’un choix distinct. Il peut être retiré depuis votre profil.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-900">
            Durée de conservation
          </h2>
          <p className="mt-2">
            Les données personnelles sont conservées uniquement pendant la durée
            nécessaire au traitement des demandes et à la relation commerciale,
            puis supprimées ou archivées conformément aux obligations légales.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-900">
            Sécurité des données
          </h2>
          <p className="mt-2">
            FabSystem met en œuvre les mesures techniques et organisationnelles
            appropriées afin de garantir la sécurité et la confidentialité
            des données personnelles et d’empêcher leur accès non autorisé.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-900">
            Droits des utilisateurs
          </h2>
          <p className="mt-2">
            Conformément à la réglementation en vigueur (RGPD),
            vous disposez des droits suivants concernant vos données personnelles :
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>droit d’accès,</li>
            <li>droit de rectification,</li>
            <li>droit à l’effacement,</li>
            <li>droit à la limitation du traitement.</li>
          </ul>
          <p className="mt-2">
            Pour exercer ces droits, il suffit de contacter :
            <br />
            <a
              href="mailto:contact@fabsystem.fr"
              className="underline"
            >
              contact@fabsystem.fr
            </a>
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-900">
            Cookies
          </h2>
          <p className="mt-2">
            Le site FabSystem n’utilise pas de cookies de suivi ou de cookies publicitaires.
            Des cookies techniques strictement nécessaires au bon fonctionnement
            du site peuvent être utilisés.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-900">
            Modification de la politique
          </h2>
          <p className="mt-2">
            FabSystem se réserve le droit de modifier la présente politique
            de confidentialité à tout moment afin de l’adapter aux évolutions
            légales ou techniques. La version en vigueur est celle publiée
            sur le site.
          </p>
        </div>
      </section>
    </main>
  );
}
