import Image from "next/image";

// UI-14 §9 — 4 poses seulement (neutre/confiante/perplexe/action), pas une
// par micro-message : moins de poses = une mascotte cohérente plutôt qu'un
// clipart qui change de tête à chaque phrase. Assets réutilisés depuis la
// planche maître (docs/branding/), aucune nouvelle pose générée.
//
// Cadrage buste (tête + haut des épaules) plutôt que corps entier : à la
// taille d'affichage réelle (~48-64px de haut), un portrait plein pied
// réduit le visage à quelques pixels illisibles — le buste reste
// reconnaissable et donne l'impression que le personnage s'adresse
// réellement à l'utilisateur plutôt que d'être un pictogramme générique.
const POSE_SRC = {
  neutre: { src: "/volta/volta-buste-neutre.png", w: 284, h: 163 },
  confiante: { src: "/volta/volta-confiant-pince.png", w: 187, h: 163 },
  perplexe: { src: "/volta/volta-perplexe.png", w: 232, h: 163 },
  action: { src: "/volta/volta-actif-tournevis.png", w: 336, h: 163 },
} as const;

export type VoltaPose = keyof typeof POSE_SRC;

export function VoltaAvatar({ pose, size = 56 }: { pose: VoltaPose; size?: number }) {
  const { src, w, h } = POSE_SRC[pose];
  return (
    <Image
      src={src}
      alt=""
      width={w}
      height={h}
      className="shrink-0 object-contain"
      style={{ height: size, width: "auto" }}
    />
  );
}
