"use client";

import { Button } from "@/components/ui/Button";

export function ProjectPrintButton({
  label = "Imprimer / PDF",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      className={`print:hidden ${className}`.trim()}
      onClick={() => window.print()}
    >
      {label}
    </Button>
  );
}
