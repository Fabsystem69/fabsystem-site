"use client";

import { useRouter } from "next/navigation";

type QuotePdfButtonProps = {
  quoteId: string;
  className: string;
  children: string;
};

export function QuotePdfButton({
  quoteId,
  className,
  children,
}: QuotePdfButtonProps) {
  const router = useRouter();

  function handleClick() {
    const pdfUrl = `/api/internal/quotes/${quoteId}/pdf`;

    if (window.matchMedia("(max-width: 767px)").matches) {
      router.push(`/dashboard/quotes/${quoteId}/pdf`);
      return;
    }

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
