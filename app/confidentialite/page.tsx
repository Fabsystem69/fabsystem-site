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
            que l’utilisateur choisit de transmettre volontairement via les formulaires
            de contact ou de demande de visio.
          </p>
          <p className="mt-2">
            Les données susceptibles d’être collectées sont notamment :
            nom, prénom, adresse email, numéro de téléphone et le contenu du message.
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
            <li>organiser des échanges par email ou visioconférence,</li>
            <li>assurer le suivi des demandes clients.</li>
          </ul>
          <p className="mt-2">
            Aucune donnée personnelle n’est vendue, cédée ou transmise à des tiers.
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
              href="mailto:fabien.lages@fabsystem.fr"
              className="underline"
            >
              fabien.lages@fabsystem.fr
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