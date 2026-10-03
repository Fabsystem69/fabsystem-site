import type { MeetingCommit } from "@/lib/crm/meeting-notes-contract";

// Fonctions pures de mise en forme : aucune dependance serveur, utilisables
// par l'enregistrement, l'interface et les tests.

const SOURCE_LABELS = { photos: "photos de notes manuscrites", text: "texte saisi", mixed: "photos et texte" } as const;
const RESPONSIBLE_LABELS = { COACH: "Fabien", CLIENT: "Client" } as const;

// Midi UTC : la date calendaire reste la meme a Paris (UTC+1/+2), quel que
// soit le fuseau du serveur.
export function dueDateToDate(value: string | null | undefined) {
  return value ? new Date(`${value}T12:00:00.000Z`) : null;
}

export function formatIsoDateFr(value: string | null | undefined) {
  if (!value) return null;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function referenceMarker(submissionKey: string) {
  return `ref:${submissionKey}`;
}

// Cle d'idempotence portee par le TYPE de l'evenement (comparaison exacte),
// pas par le texte de la note : reformuler la note ne peut plus casser la
// detection d'une soumission deja enregistree. La marque `ref:` reste dans
// la note, uniquement comme trace lisible.
export function importEventType(base: "NOTES_IMPORT" | "NOTE", submissionKey: string) {
  return `${base}:${submissionKey}`;
}

function bulletList(items: readonly string[]) {
  return items.map((item) => `• ${item}`).join("\n");
}

function section(title: string, items: readonly string[]) {
  return items.length > 0 ? `${title} :\n${bulletList(items)}` : null;
}

export function describeAction(action: MeetingCommit["actions"][number]) {
  const when = formatIsoDateFr(action.dueDate);
  const origin = action.origin === "SUGGESTION" ? " (suggestion)" : "";
  return `${RESPONSIBLE_LABELS[action.responsible]} : ${action.label}${when ? ` — pour le ${when}` : ""}${origin}`;
}

// Texte du compte rendu de seance : decisions incluses, sans les
// incertitudes ni la provenance (internes a Fabien).
export function buildSessionReport(commit: Pick<MeetingCommit, "summary" | "decisions">) {
  return [commit.summary, section("Décisions", commit.decisions)].filter(Boolean).join("\n\n");
}

export function buildNextMeetingText(topics: readonly string[]) {
  return topics.length > 0 ? bulletList(topics) : null;
}

// Trace complete et interne (jamais partagee au client) : ce qui a ete
// importe, d'ou ca vient, et la reference d'idempotence.
export function buildImportNote(commit: MeetingCommit) {
  const source = commit.source;
  const header = `Notes importées (${SOURCE_LABELS[source.kind]}${source.photoCount > 0 ? `, ${source.photoCount} photo(s) non conservée(s)` : ""}) — échange du ${formatIsoDateFr(commit.exchangeDate)} — ${referenceMarker(commit.submissionKey)}`;

  return [
    header,
    `Résumé :\n${commit.summary}`,
    section("Informations ajoutées", commit.newInfo),
    section("Décisions", commit.decisions),
    section("Actions", commit.actions.map(describeAction)),
    section("À reprendre au prochain rendez-vous", commit.nextMeetingTopics),
    section("À clarifier", commit.uncertainties),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function nameTokens(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);
}

// Garde-fou : si les notes citent des personnes mais qu'aucune ne ressemble
// au dossier choisi, on previent. Ce n'est jamais un rattachement
// automatique, seulement un avertissement a l'ecran.
export function detectTargetMismatch(targetName: string, mentionedPeople: readonly string[]) {
  if (mentionedPeople.length === 0) return null;

  const targetTokens = new Set(nameTokens(targetName));
  const overlaps = mentionedPeople.some((person) => nameTokens(person).some((token) => targetTokens.has(token)));
  if (overlaps) return null;

  return `Les notes parlent de « ${mentionedPeople.join(", ")} » mais vous avez choisi « ${targetName} ». Vérifiez le dossier avant de valider.`;
}
