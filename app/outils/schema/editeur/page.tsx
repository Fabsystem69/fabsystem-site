import type { Metadata } from "next";
import { SchemaEditorRuntime } from "@/components/schema-editor/SchemaEditorRuntime";

const description =
  "Acces direct a l'editeur de schema electrique FabSystem pour bateau, van et camping-car.";

export const metadata: Metadata = {
  title: "Editeur de schema electrique",
  description,
  alternates: { canonical: "/outils/schema" },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SchemaEditorStandalonePage() {
  return <SchemaEditorRuntime />;
}
