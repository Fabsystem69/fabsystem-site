import Link from "next/link";

type Cta = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
  external?: boolean;
};

export default function PageHero({
  title,
  subtitle,
  micro,
  background = "/hero-fabsystem.png",
  overlay = "bg-black/55",
  ctas = [],
}: {
  title: string;
  subtitle: string;
  micro?: string;
  background?: string;
  overlay?: string;
  ctas?: Cta[];
}) {
  return (
    <section
      className="relative min-h-[56vh] bg-cover bg-center"
      style={{ backgroundImage: `url('${background}')` }}
    >
      <div className={`absolute inset-0 ${overlay}`} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 text-white sm:py-24">
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
          {title}
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
          {subtitle}
        </p>

        {micro && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80">
            {micro}
          </p>
        )}

        {ctas.length > 0 && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {ctas.map((cta) => {
              const base =
                "inline-flex w-full items-center justify-center rounded-md px-5 py-3 text-sm font-semibold sm:w-auto";
              const primary =
                "bg-white text-black hover:bg-white/90";
              const secondary =
                "border border-white/70 text-white hover:bg-white/10";

              const className =
                base + " " + (cta.variant === "secondary" ? secondary : primary);

              if (cta.external) {
                return (
                  <a
                    key={cta.href}
                    href={cta.href}
                    target="_blank"
                    rel="noreferrer"
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
      </div>
    </section>
  );
}