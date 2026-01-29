import Link from "next/link";

const nav = [
  { href: "/", label: "Accueil" },
  { href: "/prestations", label: "Prestations" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/contact", label: "Contact" },
  { href: "/visio", label: "Visio" },
];

export default function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/FabSystem-Logo.svg"
            alt="FabSystem"
            className="h-15 w-auto max-w-[160px] invert"
          />
        </Link>

        {/* Menu */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-white sm:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white/70">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden sm:block">
          <Link
            href="/contact"
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
          >
            Diagnostic
          </Link>
        </div>
      </div>
    </header>
  );
}