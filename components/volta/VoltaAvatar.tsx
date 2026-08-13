import Image from "next/image";

// UI-14 §9 — 4 poses seulement (neutre/confiante/perplexe/action), pas une
// par micro-message : moins de poses = une mascotte cohérente plutôt qu'un
// clipart qui change de tête à chaque phrase. Assets réutilisés depuis la
// planche maître (docs/branding/), aucune nouvelle pose générée.
const POSE_SRC = {
  neutre: "/volta/volta-buste-neutre.png",
  confiante: "/volta/volta-confiant-pince.png",
  perplexe: "/volta/volta-perplexe.png",
  action: "/volta/volta-actif-tournevis.png",
} as const;

export type VoltaPose = keyof typeof POSE_SRC;

export function VoltaAvatar({ pose, size = 32 }: { pose: VoltaPose; size?: number }) {
  return (
    <Image
      src={POSE_SRC[pose]}
      alt=""
      width={size}
      height={size}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}
