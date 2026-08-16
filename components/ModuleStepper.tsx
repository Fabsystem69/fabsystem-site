"use client";

import Link from "next/link";
import { useState } from "react";
import { VoltaGuide, type VoltaGuideVariant } from "@/components/volta/VoltaGuide";
import type { VoltaPose } from "@/components/volta/VoltaAvatar";

export interface ModuleStep {
  title: string;
  content: React.ReactNode;
}

interface ModuleVoltaNote {
  title?: string;
  message: string;
  variant?: VoltaGuideVariant;
  pose?: VoltaPose;
}

interface ModuleStepperProps {
  moduleNum: number;
  moduleTitle: string;
  tag?: string;
  duration?: string;
  level?: string;
  steps: ModuleStep[];
  voltaNote?: ModuleVoltaNote;
  prevModule?: { href: string; label: string };
  nextModule?: { href: string; label: string };
}

export default function ModuleStepper({
  moduleNum,
  moduleTitle,
  tag = "Gratuit",
  duration,
  level,
  steps,
  voltaNote,
  prevModule,
  nextModule,
}: ModuleStepperProps) {
  const [current, setCurrent] = useState(0);
  const total = steps.length;
  const isFirst = current === 0;
  const isLast = current === total - 1;
  const progress = Math.round(((current + 1) / total) * 100);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* ── Breadcrumb ── */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-neutral-500">
        <Link href="/formations" className="hover:text-neutral-800">
          Formations
        </Link>
        <span>/</span>
        <span className="text-neutral-800">
          Module {moduleNum} — {moduleTitle}
        </span>
      </nav>

      {/* ── Header ── */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
          {tag}
        </span>
        {level && (
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
            {level}
          </span>
        )}
        {duration && (
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
            {duration}
          </span>
        )}
      </div>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-neutral-900">{moduleTitle}</h1>

      {voltaNote ? (
        <VoltaGuide
          variant={voltaNote.variant ?? "info"}
          pose={voltaNote.pose ?? "neutre"}
          title={voltaNote.title}
          className="mt-5"
        >
          {voltaNote.message}
        </VoltaGuide>
      ) : null}

      {/* ── Barre de progression ── */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>
            Étape {current + 1} sur {total}
          </span>
          <span>{progress} % complété</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-neutral-900 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Navigation étapes (pills) ── */}
      <div className="mt-4 flex flex-wrap gap-2">
        {steps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              idx === current
                ? "bg-neutral-900 text-white"
                : idx < current
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            }`}
          >
            {idx < current ? "✓ " : ""}
            {step.title}
          </button>
        ))}
      </div>

      {/* ── Contenu de l'étape courante ── */}
      <div className="mt-8 min-h-[300px]">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
            {current + 1}
          </span>
          <h2 className="text-base font-semibold text-neutral-900">{steps[current].title}</h2>
        </div>
        {steps[current].content}
      </div>

      {/* ── Navigation Précédent / Suivant ── */}
      <div className="mt-10 flex items-center justify-between border-t border-neutral-200 pt-6">
        {!isFirst ? (
          <button
            onClick={() => {
              setCurrent((c) => c - 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            ← {steps[current - 1].title}
          </button>
        ) : prevModule ? (
          <Link
            href={prevModule.href}
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900"
          >
            ← {prevModule.label}
          </Link>
        ) : (
          <div />
        )}

        {!isLast ? (
          <button
            onClick={() => {
              setCurrent((c) => c + 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            {steps[current + 1].title} →
          </button>
        ) : nextModule ? (
          <Link
            href={nextModule.href}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Module suivant : {nextModule.label} →
          </Link>
        ) : (
          <Link
            href="/formations"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Voir tous les modules →
          </Link>
        )}
      </div>

      <p className="mt-6 text-xs text-neutral-400">
        Contenu pédagogique inspiré de <em>Wiring Unlimited</em> (Margreet Leeftink / Victron
        Energy) — adapté et mis en forme par FabSystem.
      </p>
    </main>
  );
}
