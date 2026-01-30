import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Bloc 1 */}
          <div>
            <img
              src="/FabSystem-Logo.svg"
              alt="FabSystem"
              className="h-15 w-auto max-w-[160px]"
            />
            <p className="mt-4 text-sm text-neutral-600">
              Électricité et systèmes embarqués pour bateaux, vans et camping-cars.
            </p>
          </div>

          {/* Bloc 2 */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Navigation</h3>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              <li>
                <Link href="/">Accueil</Link>
              </li>
              <li>
                <Link href="/prestations">Prestations</Link>
              </li>
              <li>
                <Link href="/realisations">Réalisations</Link>
              </li>
              <li>
                <Link href="/visio">Visio</Link>
              </li>
              <li>
                <Link href="/a-propos">À propos</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Bloc 3 */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Contact</h3>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              <li>
                📧{" "}
                <a href="mailto:fabien.lages@fabsystem.fr" className="underline">
                  fabien.lages@fabsystem.fr
                </a>
              </li>
              <li>
                📞{" "}
                <a href="tel:+33698247722" className="underline">
                  06 98 24 77 22
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bas footer */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} FabSystem — Tous droits réservés</p>

          <div className="flex flex-wrap gap-4">
            <Link href="/a-propos">À propos</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/confidentialite">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}