import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import TrackedLink from "@/components/TrackedLink";

// Footer public définitif (UI-2), conforme à
// docs/refonte-site-public/home/11-FOOTER.md : fond sombre et sobre, quatre
// zones desktop (marque / Explorer / FabSystem / Informations), ligne basse
// avec copyright et réseaux sociaux officiels uniquement. Aucun nouveau CTA
// commercial, aucune newsletter.
//
// UI-14 (suite) : signature Volta ajoutée dans la colonne Marque, sur
// décision explicite — présence de marque (pas de message, pas de CTA),
// volontairement plus grande qu'une icône pour être identifiable et
// mémorisable, contrairement aux apparitions fonctionnelles de VoltaGuide
// ailleurs sur le site (voir docs/audits/UI-14-VOLTA-INTEGRATION.md).

// "Explorer" reprend les quatre piliers publics validés
// (00-CAHIER-DES-CHARGES-GLOBAL.md §12) — le CDC Footer utilise encore le
// libellé de travail "Apprendre" pour cette rubrique ; "Les bases" est repris
// ici pour rester cohérent avec le Header et MASTER-12 §134 (un même concept
// utilise toujours le même nom). Voir UI-2-LAYOUT-PUBLIC.md, Arbitrages.
const EXPLORE_LINKS = [
  { href: "/prestations", label: "Services" },
  { href: "/outils", label: "Outils" },
  { href: "/formations", label: "Les bases" },
  { href: "/boutique", label: "Boutique" },
];

const COMPANY_LINKS = [
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
  { href: "/mon-compte", label: "Mon compte" },
];

// Uniquement des pages légales réellement présentes sur le site (CDC §19 :
// "ne pas inventer de page légale vide") — pas de CGV, la page n'existe pas.
const LEGAL_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Politique de confidentialité" },
];

function FooterLinkGroup({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm text-neutral-400">
        {links.map((link) => (
          <li key={link.href}>
            <Link className="transition-colors duration-150 hover:text-white" href={link.href}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-900 bg-neutral-950 text-neutral-300">
      <Container className="py-section">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Marque — logo officiel sur un fond clair dédié (voir
              UI-2-LAYOUT-PUBLIC.md, Visuels à produire : aucune variante
              officielle du logo pour fond sombre n'existe aujourd'hui ; le
              fichier /FabSystem-Logo.svg n'est ni recoloré ni redessiné). */}
          <div>
            <div className="flex items-center gap-3">
              {/* Détourage non parfait sur fond sombre (léger liseré clair
                  visible sur la fourrure) : posé sur un badge clair, comme
                  le logo juste en dessous, plutôt que sur le fond noir. */}
              <span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-neutral-100 p-1.5">
                <Image
                  src="/volta/volta-confiant-pince.png"
                  alt="Volta, l'assistante technique FabSystem"
                  width={187}
                  height={163}
                  className="h-14 w-auto object-contain"
                />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Volta</p>
                <p className="text-xs text-neutral-400">Assistante technique FabSystem</p>
              </div>
            </div>

            <span className="mt-5 inline-flex items-center rounded-lg bg-white px-3 py-2">
              <Image src="/FabSystem-Logo.svg" alt="FabSystem" width={140} height={66} className="h-8 w-auto" />
            </span>
            <p className="mt-4 text-sm leading-relaxed text-neutral-400">
              Électricité embarquée pour bateaux, vans et camping-cars.
            </p>
            <TrackedLink
              href="mailto:contact@fabsystem.fr"
              event="click_email"
              className="mt-3 inline-block text-sm text-neutral-400 transition-colors duration-150 hover:text-white"
            >
              contact@fabsystem.fr
            </TrackedLink>
          </div>

          <FooterLinkGroup title="Explorer" links={EXPLORE_LINKS} />
          <FooterLinkGroup title="FabSystem" links={COMPANY_LINKS} />
          <FooterLinkGroup title="Informations" links={LEGAL_LINKS} />
        </div>

        {/* Ligne basse */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 border-t border-neutral-900 pt-6 text-xs text-neutral-500 sm:flex-row">
          <p>
            © {year} FabSystem — Tous droits réservés
            <span className="mx-2 text-neutral-700">·</span>
            <Link href="/login" className="text-neutral-600 transition-colors duration-150 hover:text-neutral-300">
              Accès interne
            </Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}
