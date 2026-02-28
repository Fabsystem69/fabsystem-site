import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visio conseil en électricité embarquée",
  description:
    "Visio individuelle pour analyser votre installation électrique embarquée. Diagnostic clair, recommandations et plan d'action en 1 heure.",
  alternates: {
    canonical: "/visio",
  },
};

export default function VisioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
