import { getBrandModelsForType } from "@/lib/electrical-components/brand-models";
import { AVAILABLE_FUSES_A } from "@/lib/calc/section-cable";

// Retour utilisateur : "un module débutant guidé genre chat box... je veux
// installer des panneaux solaires sur mon van, tu lui demande ce qu'il a et
// tu viens rajouter les panneaux dans une autre zone" — logique pure
// (aucun id, aucune position absolue, aucun accès au store) pour rester
// testable isolément ; voir InstallAssistant.tsx pour la conversation et
// useSchemaStore.ts (`insertGuidedInstall`) pour la pose réelle sur le
// canvas.

export interface SolarInstallAnswers {
  panelCount: number;
  panelPowerW: number;
  systemVoltage: 12 | 24;
}

export interface PlannedComponent {
  key: string;
  type: string;
  label: string;
  dataOverride: Record<string, unknown>;
  offsetX: number;
  offsetY: number;
}

export interface PlannedEdge {
  sourceKey: string;
  sourceHandle: string;
  targetKey: string;
  targetHandle: string;
}

export interface SolarInstallPlan {
  totalW: number;
  requiredAmps: number;
  systemVoltage: 12 | 24;
  mpptLabel: string;
  mpptAmperage: number;
  /** Absent si aucun modèle du catalogue ne couvre la puissance demandée —
   * le plan reste construit avec le calibre le plus proche disponible, mais
   * le chat doit avertir l'utilisateur. */
  mpptOversized: boolean;
  fuseAmperage: number;
  zoneWidth: number;
  zoneHeight: number;
  components: PlannedComponent[];
  edges: PlannedEdge[];
}

const PANEL_ROW_HEIGHT = 90;
const ZONE_PADDING = 40;
const MPPT_COLUMN_X = 260;
const FUSE_COLUMN_X = 480;

// Marge de 25% entre le courant nominal d'une source et le calibre de la
// protection en aval — même convention que fusibleRecommande
// (lib/calc/section-cable.ts) et que PROTECTION_OVERSIZE_RATIO côté audit
// (lib/electrical-components/checks.ts), pour rester cohérent avec ce que
// le contrôle "protection surdimensionnée" accepterait sans avertir.
const FUSE_SAFETY_MARGIN = 1.25;

export function buildSolarInstallPlan(answers: SolarInstallAnswers): SolarInstallPlan {
  const totalW = answers.panelCount * answers.panelPowerW;
  const requiredAmps = totalW / answers.systemVoltage;

  const mpptCandidates = getBrandModelsForType("mppt")
    .filter((m) => typeof m.defaults.amperage === "number")
    .sort((a, b) => (a.defaults.amperage as number) - (b.defaults.amperage as number));
  const fittingModel = mpptCandidates.find((m) => (m.defaults.amperage as number) >= requiredAmps);
  const chosenModel = fittingModel ?? mpptCandidates[mpptCandidates.length - 1];
  const mpptAmperage = chosenModel ? (chosenModel.defaults.amperage as number) : Math.ceil(requiredAmps);
  const mpptOversized = !fittingModel;

  const fuseAmperage = AVAILABLE_FUSES_A.find((f) => f >= mpptAmperage * FUSE_SAFETY_MARGIN) ?? AVAILABLE_FUSES_A[AVAILABLE_FUSES_A.length - 1];

  const components: PlannedComponent[] = [];
  const edges: PlannedEdge[] = [];

  for (let i = 0; i < answers.panelCount; i++) {
    const key = `panel-${i}`;
    components.push({
      key,
      type: "solar-panel",
      label: answers.panelCount > 1 ? `Panneau solaire ${i + 1}` : "Panneau solaire",
      dataOverride: { powerW: answers.panelPowerW },
      offsetX: 0,
      offsetY: ZONE_PADDING + i * PANEL_ROW_HEIGHT,
    });
    edges.push({ sourceKey: key, sourceHandle: "positive", targetKey: "mppt", targetHandle: "pv-positive" });
    edges.push({ sourceKey: key, sourceHandle: "negative", targetKey: "mppt", targetHandle: "pv-negative" });
  }

  const mpptOverride: Record<string, unknown> = { amperage: mpptAmperage, systemVoltage: answers.systemVoltage };
  if (chosenModel) {
    mpptOverride.brandModelId = chosenModel.id;
    mpptOverride.brand = chosenModel.brand;
    mpptOverride.model = chosenModel.model;
    Object.assign(mpptOverride, chosenModel.defaults, { amperage: mpptAmperage, systemVoltage: answers.systemVoltage });
  }
  const mpptCenterY = ZONE_PADDING + ((answers.panelCount - 1) * PANEL_ROW_HEIGHT) / 2;
  components.push({
    key: "mppt",
    type: "mppt",
    label: chosenModel ? `SmartSolar ${chosenModel.model}`.replace("SmartSolar SmartSolar", "SmartSolar") : "Régulateur MPPT",
    dataOverride: mpptOverride,
    offsetX: MPPT_COLUMN_X,
    offsetY: mpptCenterY,
  });
  edges.push({ sourceKey: "mppt", sourceHandle: "bat-positive", targetKey: "fuse", targetHandle: "input" });

  components.push({
    key: "fuse",
    type: "fuse",
    label: "Fusible MPPT",
    dataOverride: { fuseType: "midi", amperage: fuseAmperage },
    offsetX: FUSE_COLUMN_X,
    offsetY: mpptCenterY,
  });

  const zoneHeight = Math.max(260, ZONE_PADDING * 2 + answers.panelCount * PANEL_ROW_HEIGHT);
  const zoneWidth = FUSE_COLUMN_X + 220;

  return {
    totalW,
    requiredAmps,
    systemVoltage: answers.systemVoltage,
    mpptLabel: chosenModel ? `${chosenModel.brand} ${chosenModel.model}` : `Régulateur MPPT ${mpptAmperage}A`,
    mpptAmperage,
    mpptOversized,
    fuseAmperage,
    zoneWidth,
    zoneHeight,
    components,
    edges,
  };
}
