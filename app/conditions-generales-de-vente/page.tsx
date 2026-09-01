import type { Metadata } from "next";
import { CGV_PARAGRAPHS, CGV_TITLE, CGV_VERSION_LABEL } from "@/lib/cgv";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: "Conditions générales de vente des prestations FabSystem.",
  alternates: {
    canonical: "/conditions-generales-de-vente",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function splitArticle(article: string) {
  const [heading, ...body] = article.split("\n");

  return { heading, body };
}

export default function ConditionsGeneralesDeVentePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-neutral-950">{CGV_TITLE}</h1>
      <p className="mt-4 text-sm leading-6 text-neutral-600">
        Version en vigueur au {CGV_VERSION_LABEL}.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-6 text-neutral-700">
        {CGV_PARAGRAPHS.map((article) => {
          const { heading, body } = splitArticle(article);

          return (
            <section key={heading}>
              <h2 className="font-semibold text-neutral-950">{heading}</h2>
              <div className="mt-2 space-y-3 whitespace-pre-line">
                {body.map((paragraph, index) => (
                  <p key={`${heading}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
