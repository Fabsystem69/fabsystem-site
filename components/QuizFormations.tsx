"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
  module: string;
  moduleHref: string;
}

const questions: Question[] = [
  {
    id: 1,
    text: "Quelle est la formule de la loi d'Ohm ?",
    options: ["V = R × I", "P = V × I", "I = V × R", "R = I + V"],
    correct: 0,
    explanation: "La loi d'Ohm est V = R × I (Tension = Résistance × Courant). Elle est à la base de tous les calculs électriques.",
    module: "Module 1 — Les bases du 12V",
    moduleHref: "/formations/bases-12v",
  },
  {
    id: 2,
    text: "Un onduleur de 1 200 W est alimenté par une batterie 12V. Quel courant circule dans les câbles de batterie ?",
    options: ["14,4 A", "100 A", "1 200 A", "50 A"],
    correct: 1,
    explanation: "I = P / V = 1 200 / 12 = 100 A. Ce courant élevé exige des câbles épais (≥ 35 mm²). En 24V, le même onduleur ne tirerait que 50 A.",
    module: "Module 1 — Les bases du 12V",
    moduleHref: "/formations/bases-12v",
  },
  {
    id: 3,
    text: "Qu'arrive-t-il à la résistance d'un câble si on double sa longueur ?",
    options: ["Elle est divisée par deux", "Elle reste identique", "Elle double", "Elle quadruple"],
    correct: 2,
    explanation: "La résistance est proportionnelle à la longueur du câble : R = ρ × l / A. Si la longueur double, la résistance double. D'où l'importance de minimiser la longueur des câbles de batterie.",
    module: "Module 1 — Les bases du 12V",
    moduleHref: "/formations/bases-12v",
  },
  {
    id: 4,
    text: "Quelle est la section minimale recommandée pour un courant de 90 A sur un câble court (< 5 m) ?",
    options: ["6 mm²", "16 mm²", "35 mm²", "70 mm²"],
    correct: 2,
    explanation: "Règle empirique : Section (mm²) = Courant (A) ÷ 3 = 90 ÷ 3 = 30 mm². La valeur standard supérieure est 35 mm². On arrondit toujours à la valeur au-dessus.",
    module: "Module 1 — Les bases du 12V",
    moduleHref: "/formations/bases-12v",
  },
  {
    id: 5,
    text: "À quelle distance maximale des bornes de batterie doit être placé le fusible principal ?",
    options: ["30 cm", "1 mètre", "Peu importe, n'importe où sur le circuit", "5 mètres"],
    correct: 0,
    explanation: "Le fusible principal doit être à moins de 30 cm des bornes de la batterie. Au-delà, le tronçon de câble entre la batterie et le fusible est non protégé et peut brûler en cas de court-circuit.",
    module: "Module 2 — Lire un schéma",
    moduleHref: "/formations/lire-schema",
  },
  {
    id: 6,
    text: "Le fusible est calibré pour protéger :",
    options: ["L'équipement connecté", "Le câble qu'il protège", "La batterie", "Le chargeur solaire"],
    correct: 1,
    explanation: "Le fusible protège le câble, pas l'équipement. Son calibre correspond à la capacité maximale du câble. Si un câble supporte 50 A, le fusible doit être ≤ 50 A pour fondre avant que le câble ne surchauffe.",
    module: "Module 2 — Lire un schéma",
    moduleHref: "/formations/lire-schema",
  },
  {
    id: 7,
    text: "Vous connectez deux batteries 12V / 100Ah en série. Quel est le résultat ?",
    options: ["12V / 200Ah", "24V / 200Ah", "24V / 100Ah", "48V / 100Ah"],
    correct: 2,
    explanation: "En série, les tensions s'additionnent mais la capacité reste identique : 12+12 = 24V, la capacité reste 100Ah. Pour augmenter la capacité, il faut connecter en parallèle.",
    module: "Module 3 — Types de batteries",
    moduleHref: "/formations/types-batteries",
  },
  {
    id: 8,
    text: "Quelle technologie de batterie offre la plus grande capacité utile ?",
    options: ["Batterie au plomb ouvert", "AGM", "GEL", "Lithium LiFePO₄"],
    correct: 3,
    explanation: "Le lithium LiFePO₄ offre 80 à 100 % de capacité utile, contre seulement 50 % pour les technologies plomb (AGM, GEL). Pour avoir 100 Ah utiles, une batterie lithium de 100 Ah suffit là où il faudrait une AGM de 200 Ah.",
    module: "Module 3 — Types de batteries",
    moduleHref: "/formations/types-batteries",
  },
  {
    id: 9,
    text: "Quelle est l'erreur de câblage classique sur un banc de batteries en parallèle ?",
    options: [
      "Utiliser des câbles de même longueur",
      "Raccorder toutes les batteries côté positif uniquement",
      "Raccorder le système d'un seul côté du banc",
      "Utiliser une barre omnibus",
    ],
    correct: 2,
    explanation: "Raccorder le système d'un seul côté crée une résistance inégale entre les batteries. La plus proche reçoit plus de courant, s'use prématurément. Le chemin total doit être identique pour chaque batterie.",
    module: "Module 3 — Types de batteries",
    moduleHref: "/formations/types-batteries",
  },
  {
    id: 10,
    text: "Quel matériau est le meilleur conducteur électrique utilisé dans les câbles embarqués ?",
    options: ["Aluminium", "Fer", "Cuivre", "Laiton"],
    correct: 2,
    explanation: "Le cuivre est le meilleur conducteur pratique (conductivité 58,5 × 10⁶ S/m). En milieu marin, on utilise du cuivre étamé pour résister à la corrosion. L'aluminium est utilisé dans certains câbles mais est moins pratique à connecter.",
    module: "Module 1 — Les bases du 12V",
    moduleHref: "/formations/bases-12v",
  },
];

type QuizState = "idle" | "running" | "finished";

// Persistance locale du résultat réel (docs/refonte-site-public/les-bases/
// 02-QUIZ.md §10 : une persistance locale peut être utilisée pour un
// visiteur non connecté ; jamais de compte, de synchronisation serveur ou
// de progression inventée). Stocke uniquement les réponses réellement
// données, pour pouvoir réafficher le vrai score sans le recalculer.
const QUIZ_STORAGE_KEY = "fabsystem-les-bases-quiz-result";

type StoredQuizResult = { answers: (number | null)[] };

function readStoredResult(): StoredQuizResult | null {
  try {
    const raw = window.localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredQuizResult;
    if (!Array.isArray(parsed.answers) || parsed.answers.length !== questions.length) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredResult(answers: (number | null)[]) {
  try {
    window.localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify({ answers }));
  } catch {
    // Stockage indisponible (navigation privée, quota…) : le quiz reste
    // utilisable, seule la reprise au prochain chargement est perdue.
  }
}

function clearStoredResult() {
  try {
    window.localStorage.removeItem(QUIZ_STORAGE_KEY);
  } catch {
    // Rien à faire si le stockage est indisponible.
  }
}

// Même seuil que celui déjà utilisé plus bas dans ce composant pour décider
// d'afficher "Revoir les modules →" : un résultat >= 80 % est considéré
// satisfaisant (le bloc peut devenir compact) ; en dessous, le résultat
// reste pleinement affiché conformément à 02-QUIZ.md §8.
const SATISFACTORY_THRESHOLD_PCT = 80;

export default function QuizFormations() {
  const [state, setState] = useState<QuizState>("idle");
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [showExplanation, setShowExplanation] = useState(false);
  // "compact" = résultat satisfaisant déjà obtenu lors d'une visite
  // précédente : le bloc se réduit (02-QUIZ.md §9) tant que le visiteur n'a
  // pas cliqué sur "Voir le résultat".
  const [viewMode, setViewMode] = useState<"full" | "compact">("full");

  // Hydratation après montage uniquement (localStorage indisponible côté
  // serveur) : évite tout mismatch de rendu SSR/client.
  useEffect(() => {
    const stored = readStoredResult();
    if (!stored) return;

    const restoredScore = stored.answers.filter((a, i) => a === questions[i].correct).length;
    const restoredPct = Math.round((restoredScore / questions.length) * 100);

    startTransition(() => {
      setAnswers(stored.answers);
      setState("finished");
      setViewMode(restoredPct >= SATISFACTORY_THRESHOLD_PCT ? "compact" : "full");
    });
  }, []);

  const q = questions[currentQ];
  const isLast = currentQ === questions.length - 1;
  const score = answers.filter((a, i) => a === questions[i].correct).length;

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplanation(true);
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (isLast) {
      writeStoredResult(answers);
      const finalPct = Math.round((score / questions.length) * 100);
      setViewMode(finalPct >= SATISFACTORY_THRESHOLD_PCT ? "compact" : "full");
      setState("finished");
    } else {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  };

  const handleReset = () => {
    clearStoredResult();
    setState("idle");
    setCurrentQ(0);
    setSelected(null);
    setAnswers(Array(questions.length).fill(null));
    setShowExplanation(false);
    setViewMode("full");
  };

  const pct = Math.round((score / questions.length) * 100);
  const resultLevel =
    pct >= 90 ? { label: "Excellent !", color: "text-green-700", bg: "bg-green-50 border-green-200" } :
    pct >= 70 ? { label: "Bien joué !", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" } :
    pct >= 50 ? { label: "Pas mal — quelques révisions s'imposent", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" } :
                { label: "Retournez sur les modules avant de recommencer", color: "text-red-700", bg: "bg-red-50 border-red-200" };

  if (state === "idle") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
              ⚡ Quiz
            </div>
            <h3 className="mt-3 text-lg font-bold text-neutral-900">
              Testez vos connaissances
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              {questions.length} questions sur les 3 premiers modules — loi d&apos;Ohm, schémas
              électriques, types de batteries. Comptez environ 5–10 minutes.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-3xl font-bold text-neutral-900">{questions.length}</p>
            <p className="text-xs text-neutral-500">questions</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-500">
          {["Module 1 — Bases 12V", "Module 2 — Schémas", "Module 3 — Batteries"].map((m) => (
            <span key={m} className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1">
              {m}
            </span>
          ))}
        </div>

        <button
          onClick={() => setState("running")}
          className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
        >
          Commencer le quiz →
        </button>
      </div>
    );
  }

  if (state === "finished" && viewMode === "compact") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-neutral-900">
            <span className="text-green-600" aria-hidden="true">✓</span> Quiz terminé — {score}/{questions.length}{" "}
            ({pct}%)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("full")}
              className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-neutral-50"
            >
              Voir le résultat
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-neutral-50"
            >
              Refaire le quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "finished") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Résultat
        </p>
        <div className="mt-3 flex items-center gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke={pct >= 70 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626"}
                strokeWidth="8"
                strokeDasharray={`${(pct / 100) * 213.6} 213.6`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-lg font-bold text-neutral-900">{pct}%</span>
          </div>
          <div>
            <p className={`text-base font-bold ${resultLevel.color}`}>{resultLevel.label}</p>
            <p className="mt-1 text-sm text-neutral-600">
              {score} bonne{score > 1 ? "s" : ""} réponse{score > 1 ? "s" : ""} sur{" "}
              {questions.length}
            </p>
          </div>
        </div>

        {/* Détail par question */}
        <div className="mt-5 space-y-2">
          {questions.map((q, i) => {
            const ans = answers[i];
            const isCorrect = ans === q.correct;
            return (
              <div
                key={q.id}
                className={`flex items-start gap-3 rounded-lg border p-3 text-xs ${
                  isCorrect
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <span className={`shrink-0 font-bold ${isCorrect ? "text-green-600" : "text-red-500"}`}>
                  {isCorrect ? "✓" : "✗"}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-neutral-800">{q.text}</p>
                  {!isCorrect && (
                    <p className="mt-0.5 text-neutral-600">
                      Bonne réponse : <strong>{q.options[q.correct]}</strong>
                    </p>
                  )}
                </div>
                <Link
                  href={q.moduleHref}
                  className="shrink-0 text-neutral-500 underline hover:text-neutral-800"
                >
                  Revoir
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleReset}
            className="inline-flex w-full items-center justify-center rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 sm:w-auto"
          >
            Recommencer
          </button>
          {pct < 80 && (
            <Link
              href="/formations"
              className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
            >
              Revoir les modules →
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Running
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>Question {currentQ + 1} / {questions.length}</span>
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
          {q.module}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-neutral-900 transition-all duration-300"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <p className="mt-5 text-base font-semibold text-neutral-900">{q.text}</p>

      {/* Options */}
      <div className="mt-4 space-y-2">
        {q.options.map((opt, idx) => {
          const isSelected = selected === idx;
          const isCorrect = idx === q.correct;
          const revealed = selected !== null;

          let style = "border-neutral-200 bg-neutral-50 hover:bg-neutral-100";
          if (revealed) {
            if (isCorrect) style = "border-green-300 bg-green-50";
            else if (isSelected && !isCorrect) style = "border-red-300 bg-red-50";
            else style = "border-neutral-100 bg-neutral-50 opacity-60";
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={revealed}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${style}`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                revealed && isCorrect
                  ? "border-green-500 bg-green-500 text-white"
                  : revealed && isSelected && !isCorrect
                  ? "border-red-500 bg-red-500 text-white"
                  : "border-neutral-300 bg-white text-neutral-600"
              }`}>
                {revealed && isCorrect ? "✓" : revealed && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + idx)}
              </span>
              <span className="text-neutral-800">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Explication */}
      {showExplanation && (
        <div className={`mt-4 rounded-xl border p-4 text-sm ${selected === q.correct ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${selected === q.correct ? "text-green-700" : "text-red-600"}`}>
            {selected === q.correct ? "✓ Bonne réponse !" : "✗ Pas tout à fait…"}
          </p>
          <p className="mt-1.5 text-neutral-700">{q.explanation}</p>
        </div>
      )}

      {/* Bouton suivant */}
      {showExplanation && (
        <button
          onClick={handleNext}
          className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          {isLast ? "Voir mes résultats →" : "Question suivante →"}
        </button>
      )}
    </div>
  );
}
