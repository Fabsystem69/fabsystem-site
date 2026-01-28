import Link from "next/link";
import { site } from "../lib/site";

export default function Navbar() {
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold text-neutral-900">
          {site.name}
        </Link>

        <nav className="flex gap-6 text-sm">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-neutral-700 hover:text-neutral-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}