import Link from "next/link";
import type { ReactNode } from "react";
import TrackedLink from "@/components/TrackedLink";
import { resolveBackgroundImage } from "@/lib/background-image";

type Cta = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
  external?: boolean;
  event?: string;
};

export default function PageHero({
  title,
  subtitle,
  micro,
  background = "/hero-fabsystem.png",
  overlay = "bg-black/55",
  ctas = [],
  assurance,
}: {
  title: string;
  subtitle: string;
  micro?: string;
  background?: string;
  overlay?: string;
  ctas?: Cta[];
  assurance?: ReactNode;
}) {
  const resolvedBackground = resolveBackgroundImage(background);

  return (
    <section
      className="relative bg-cover bg-center"
      style={{ backgroundImage: resolvedBackground }}
    >
      <div className={`absolute inset-0 ${overlay}`} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 text-white sm:py-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          {title}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
          {subtitle}
        </p>

        {micro && (
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/75 sm:text-sm">
            {micro}
          </p>
        )}

        {ctas.length > 0 && (
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {ctas.map((cta) => {
              const base =
                "inline-flex min-h-10 w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition-colors duration-150 sm:w-auto";
              const primary = "bg-brand-400 text-neutral-900 hover:bg-brand-300 shadow-sm";
              const secondary = "border border-white/50 text-white hover:bg-white/10";

              const className =
                base + " " + (cta.variant === "secondary" ? secondary : primary);

              if (cta.external) {
                return (
                  <a
                    key={cta.href}
                    href={cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {cta.label}
                  </a>
                );
              }

              if (cta.event) {
                return (
                  <TrackedLink
                    key={cta.href}
                    href={cta.href}
                    event={cta.event}
                    className={className}
                  >
                    {cta.label}
                  </TrackedLink>
                );
              }

              return (
                <Link key={cta.href} href={cta.href} className={className}>
                  {cta.label}
                </Link>
              );
            })}
          </div>
        )}

        {assurance && <div className="mt-4">{assurance}</div>}
      </div>
    </section>
  );
}
