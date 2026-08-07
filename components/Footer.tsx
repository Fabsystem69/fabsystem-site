import Link from "next/link";
import Image from "next/image";
import TrackedLink from "@/components/TrackedLink";
import RevealPhone from "@/components/RevealPhone";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          {/* Bloc 1 */}
          <div>
            <Image
              src="/FabSystem-Logo.svg"
              alt="FabSystem"
              width={160}
              height={48}
              className="h-12 w-auto max-w-[160px]"
            />
            <p className="mt-4 text-sm text-neutral-600">
              Électricité et systèmes embarqués pour bateaux, vans et camping-cars.
            </p>
          </div>

          {/* Bloc 2 */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Navigation</h3>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              <li><Link className="hover:text-neutral-900" href="/">Accueil</Link></li>
              <li><Link className="hover:text-neutral-900" href="/prestations">Prestations</Link></li>
              <li><Link className="hover:text-neutral-900" href="/realisations">Réalisations</Link></li>
              <li><Link className="hover:text-neutral-900" href="/prestations#accompagnement-distance">Accompagnement à distance</Link></li>
              <li><Link className="hover:text-neutral-900" href="/a-propos">À propos</Link></li>
              <li><Link className="hover:text-neutral-900" href="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Bloc 3 */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Contact</h3>
            <TrackedLink
              href="mailto:contact@fabsystem.fr"
              event="click_email"
              className="mt-3 block text-sm font-medium text-neutral-900 hover:text-neutral-700"
            >
              contact@fabsystem.fr
            </TrackedLink>
            <RevealPhone className="mt-1 block text-left text-sm font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-700" />

            <div className="mt-4 grid gap-2">
              {/* CTA 1 : email en priorité */}
              <TrackedLink
                href="mailto:contact@fabsystem.fr?subject=Demande%20d%27information%20FabSystem"
                event="click_email"
                className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
              >
                Écrire un message
              </TrackedLink>
              <RevealPhone
                hiddenLabel="Voir le numéro de téléphone"
                className="inline-flex w-full items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
              />

              {/* CTA 2 */}
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
              >
                Demander un diagnostic
              </Link>
            </div>

            <p className="mt-3 text-xs text-neutral-500">
              Accompagnement à distance : voir les paliers sur la page Services.
            </p>
          </div>
        </div>

        {/* Bas footer */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} FabSystem — Tous droits réservés</p>
          <div className="flex items-center gap-4">
            <Link className="hover:text-neutral-700" href="/mentions-legales">
              Mentions légales
            </Link>
            <Link className="hover:text-neutral-700" href="/confidentialite">
              Confidentialité
            </Link>
            <Link
              href="/login"
              className="text-xs text-neutral-400 transition-colors hover:text-neutral-600"
            >
              Accès interne
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
