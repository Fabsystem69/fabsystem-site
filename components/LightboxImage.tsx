"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type LightboxImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  quality?: number;
};

export default function LightboxImage({
  src,
  alt,
  width,
  height,
  className = "",
  sizes,
  quality,
}: LightboxImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label={`${alt} - cliquer pour agrandir`}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
        className="group relative block w-full overflow-hidden rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          quality={quality}
          className={className}
        />
        <span className="pointer-events-none absolute inset-x-2 bottom-2 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white">
          Cliquer pour agrandir
        </span>
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-50 bg-black/80"
          onClick={() => setIsOpen(false)}
        >
          <div className="mx-auto flex min-h-full max-w-5xl items-center px-4 py-6">
            <div
              className="w-full"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-white/80">
                  Cliquer pour fermer
                </p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
                  aria-label="Fermer l'image"
                >
                  ×
                </button>
              </div>

              <div className="overflow-hidden rounded-xl">
                <Image
                  src={src}
                  alt={alt}
                  width={width}
                  height={height}
                  quality={quality}
                  sizes="100vw"
                  className="max-h-[85vh] w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
