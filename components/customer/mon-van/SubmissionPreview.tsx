import Link from "next/link";
import type { SheetAnswer } from "@/lib/crm/discovery-sheet-values";

// Etape de « Mon van » ou le client peut completer chaque section de la fiche.
const SECTION_STEP: Record<string, number> = {
  identity: 1,
  vehicle: 1,
  project_nature: 1,
  usage: 2,
  goals: 1,
  devices: 3,
  existing_install: 5,
  autonomy: 2,
  budget: 1,
  constraints: 5,
  documents: 4,
  questions: 1,
};

type Group = { sectionId: string; title: string; answers: SheetAnswer[] };

function groupBySection(answers: SheetAnswer[]): Group[] {
  return answers.reduce<Group[]>((groups, answer) => {
    const last = groups[groups.length - 1];
    if (last && last.sectionId === answer.sectionId) {
      return [...groups.slice(0, -1), { ...last, answers: [...last.answers, answer] }];
    }
    return [...groups, { sectionId: answer.sectionId, title: answer.sectionTitle, answers: [answer] }];
  }, []);
}

function AnswerValue({ answer, completeHref }: { answer: SheetAnswer; completeHref: string }) {
  if (answer.isUnknown) {
    return (
      <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-sm font-medium text-neutral-700">
        Je ne sais pas
      </span>
    );
  }
  if (answer.display === null) {
    return (
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-sm font-medium text-amber-900">
          Pas encore répondu
        </span>
        <Link href={completeHref} className="text-sm font-semibold text-neutral-900 underline underline-offset-2">
          Compléter
        </Link>
      </span>
    );
  }
  return <span className="whitespace-pre-line text-base text-neutral-900">{answer.display}</span>;
}

export function SubmissionPreview({ projectId, answers }: { projectId: string; answers: SheetAnswer[] }) {
  return (
    <div className="space-y-4">
      {groupBySection(answers).map((group) => {
        const completeHref = `/mon-compte/mon-van/${projectId}?step=${SECTION_STEP[group.sectionId] ?? 1}`;
        return (
          <section
            key={group.sectionId}
            aria-labelledby={`preview-${group.sectionId}`}
            className="rounded-card border border-neutral-200 bg-white p-4 shadow-card sm:p-5"
          >
            <h3 id={`preview-${group.sectionId}`} className="text-base font-semibold text-neutral-900">
              {group.title}
            </h3>
            <dl className="mt-3 space-y-3">
              {group.answers.map((answer) => (
                <div key={answer.fieldKey}>
                  <dt className="text-sm text-neutral-500">{answer.label}</dt>
                  <dd className="mt-0.5">
                    <AnswerValue answer={answer} completeHref={completeHref} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
