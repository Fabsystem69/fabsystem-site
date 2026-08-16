"use client";

import { startTransition, useEffect, useEffectEvent, useState } from "react";

export type HomeTestimonialSlide = {
  id: string;
  displayName: string;
  quote: string;
  rating: number;
  context: string;
  isVerifiedPurchase: boolean;
};

const AUTOPLAY_DELAY_MS = 7000;

function Stars({ rating }: { rating: number }) {
  const safeRating = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <div
      className="flex items-center gap-1 text-sm font-semibold"
      aria-label={`${safeRating} sur 5`}
    >
      <span className="tracking-[0.18em] text-brand-700">{Array.from({ length: safeRating }, () => "★").join("")}</span>
      <span className="tracking-[0.18em] text-neutral-300">
        {Array.from({ length: 5 - safeRating }, () => "★").join("")}
      </span>
    </div>
  );
}

function clampIndex(index: number, length: number) {
  if (length === 0) {
    return 0;
  }

  return (index + length) % length;
}

export function ConfianceCarousel({
  testimonials,
}: {
  testimonials: HomeTestimonialSlide[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const hasMultipleTestimonials = testimonials.length > 1;
  const current = testimonials[currentIndex];

  const goToIndex = (nextIndex: number) => {
    startTransition(() => {
      setCurrentIndex(clampIndex(nextIndex, testimonials.length));
    });
  };

  const advanceToNext = useEffectEvent(() => {
    if (!hasMultipleTestimonials || isPaused) {
      return;
    }

    startTransition(() => {
      setCurrentIndex((index) => clampIndex(index + 1, testimonials.length));
    });
  });

  useEffect(() => {
    if (!hasMultipleTestimonials || isPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      advanceToNext();
    }, AUTOPLAY_DELAY_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [hasMultipleTestimonials, isPaused]);

  if (!current) {
    return null;
  }

  return (
    <div
      className="relative overflow-hidden rounded-[1.7rem] border border-neutral-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,213,79,0.2),_transparent_32%),linear-gradient(180deg,_rgba(250,250,250,0.96),_rgba(255,255,255,1))] p-3 shadow-card sm:p-4"
      aria-label="Carrousel de témoignages clients"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) {
          return;
        }

        setIsPaused(false);
      }}
      onKeyDown={(event) => {
        if (!hasMultipleTestimonials) {
          return;
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goToIndex(currentIndex - 1);
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          goToIndex(currentIndex + 1);
        }
      }}
      tabIndex={hasMultipleTestimonials ? 0 : -1}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-5 h-[82%] rounded-[1.4rem] border border-neutral-200/80 bg-white/70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-9 top-8 h-[76%] rounded-[1.2rem] border border-neutral-200/70 bg-white/55"
      />

      <article className="relative z-10 rounded-[1.35rem] border border-white/90 bg-white/95 p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1">
              <Stars rating={current.rating} />
              <span className="text-xs font-semibold text-brand-700">{current.rating}/5</span>
            </div>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Témoignage {currentIndex + 1}
              {hasMultipleTestimonials ? ` / ${testimonials.length}` : ""}
            </p>
          </div>

          {hasMultipleTestimonials ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToIndex(currentIndex - 1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-base text-neutral-700 transition-colors duration-150 hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                aria-label="Voir le témoignage précédent"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => goToIndex(currentIndex + 1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-base text-neutral-700 transition-colors duration-150 hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                aria-label="Voir le témoignage suivant"
              >
                →
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-4" aria-live={isPaused ? "polite" : "off"}>
          <blockquote className="border-l-2 border-brand-300 pl-3 text-sm leading-7 text-neutral-800 sm:text-[15px]">
            {current.quote}
          </blockquote>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
          <span className="text-sm font-semibold text-neutral-950">{current.displayName}</span>

          {current.context ? (
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
              {current.context}
            </span>
          ) : null}

          {current.isVerifiedPurchase ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Avis vérifié
            </span>
          ) : null}
        </div>

        {hasMultipleTestimonials ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {testimonials.map((testimonial, index) => {
              const isActive = index === currentIndex;

              return (
                <button
                  key={testimonial.id}
                  type="button"
                  onClick={() => goToIndex(index)}
                  className={`h-2.5 rounded-full transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                    isActive ? "w-8 bg-neutral-950" : "w-2.5 bg-neutral-300 hover:bg-neutral-500"
                  }`}
                  aria-label={`Afficher le témoignage ${index + 1}`}
                  aria-current={isActive ? "true" : undefined}
                />
              );
            })}
          </div>
        ) : null}
      </article>
    </div>
  );
}
