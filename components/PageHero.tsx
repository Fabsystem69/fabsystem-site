import Link from "next/link";
import type { ReactNode } from "react";

type Cta = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
  external?: boolean;
};

function getMimeType(assetPath: string) {
  if (assetPath.endsWith(".avif")) return "image/avif";
  if (assetPath.endsWith(".webp")) return "image/webp";
  if (assetPath.endsWith(".png")) return "image/png";
  if (assetPath.endsWith(".jpg") || assetPath.endsWith(".jpeg")) return "image/jpeg";
  return "image/*";
}

function resolveBackgroundImage(background: string) {
  if (background.startsWith("image-set(")) return background;

  if (!background.startsWith("/")) {
    return `url('${background}')`;
  }

  const match = background.match(/^(.+)\.(png|jpe?g)$/i);
  if (!match) {
    return `url('${background}')`;
  }

  const basePath = match[1];
  return `image-set(url('${basePath}.avif') type('image/avif'), url('${basePath}.webp') type('image/webp'), url('${background}') type('${getMimeType(background)}'))`;
}

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
      className="relative min-h-[44vh] bg-cover bg-center sm:min-h-[50vh]"
      style={{ backgroundImage: resolvedBackground }}
    >
      <div className={`absolute inset-0 ${overlay}`} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-14 text-white sm:py-16 lg:py-20">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
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
                "inline-flex min-h-10 w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold sm:w-auto";
              const primary = "bg-white text-black hover:bg-white/90";
              const secondary = "border border-white/70 text-white hover:bg-white/10";

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
