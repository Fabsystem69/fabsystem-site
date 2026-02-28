type ProcessStepsProps = {
  tone?: "default" | "inverse";
  className?: string;
  title?: string;
  subtitle?: string;
};

const defaultTitle = "Process simple, résultats clairs";
const defaultSubtitle =
  "En 4 étapes, vous obtenez une installation comprise, sécurisée et documentée.";

const steps = [
  {
    number: "1",
    title: "Diagnostic",
    description:
      "On clarifie votre usage, votre installation et vos priorités de sécurité.",
  },
  {
    number: "2",
    title: "Plan d’action",
    description:
      "Vous recevez une recommandation structurée, réaliste et chiffrable.",
  },
  {
    number: "3",
    title: "Visio ou intervention",
    description: "On valide, corrige ou sécurise selon le périmètre.",
  },
  {
    number: "4",
    title: "Validation & suite",
    description:
      "Contrôles, documentation, et conseils pour la durabilité.",
  },
];

export default function ProcessSteps({
  tone = "default",
  className = "",
  title = defaultTitle,
  subtitle = defaultSubtitle,
}: ProcessStepsProps) {
  const wrapperClass =
    tone === "inverse"
      ? "border-white/15 bg-white/10 text-white backdrop-blur"
      : "border-neutral-200 bg-white text-neutral-900 shadow-sm";

  const subtitleClass = tone === "inverse" ? "text-white/80" : "text-neutral-600";
  const cardClass =
    tone === "inverse"
      ? "border-white/15 bg-white/10"
      : "border-neutral-200 bg-neutral-50";
  const stepIndexClass =
    tone === "inverse"
      ? "border-white/15 bg-white/10 text-white"
      : "border-neutral-200 bg-white text-neutral-900";
  const stepTitleClass = tone === "inverse" ? "text-white" : "text-neutral-900";
  const stepDescriptionClass =
    tone === "inverse" ? "text-white/80" : "text-neutral-700";

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${wrapperClass} ${className}`.trim()}
    >
      <div className="max-w-3xl">
        <h2 className="text-base font-semibold tracking-tight sm:text-lg lg:text-xl">
          {title}
        </h2>
        <p className={`mt-2 text-sm leading-relaxed ${subtitleClass}`}>
          {subtitle}
        </p>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`min-w-[220px] flex-none rounded-2xl border p-4 sm:min-w-0 ${cardClass}`}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${stepIndexClass}`}
            >
              {step.number}
            </div>
            <h3 className={`mt-3 text-sm font-semibold ${stepTitleClass}`}>
              {step.title}
            </h3>
            <p className={`mt-2 text-xs leading-relaxed sm:text-sm ${stepDescriptionClass}`}>
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
