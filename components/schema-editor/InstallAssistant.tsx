"use client";

import { useMemo, useState } from "react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { findBatteryVoltage } from "@/lib/electrical-components/auto-size";
import { buildSolarInstallPlan } from "@/lib/schema-editor/guided-install/solar";
import { VoltaAvatar, type VoltaPose } from "@/components/volta/VoltaAvatar";

// Retour utilisateur : "un module débutant guidé genre chat box où il dit
// ce qu'il veut pour faire son installation et toi tu le guide... je veux
// installer des panneaux solaires sur mon van, tu lui demande ce qu'il a et
// tu viens rajouter les panneaux dans un autre zone" — présenté comme une
// conversation (bulles + avatar Volta, même mascotte que GuidedTutorial),
// mais piloté par boutons plutôt que du texte libre : pas d'IA externe, pas
// de clé API, 100% fiable (choix explicite validé avec l'utilisateur).
// Solaire = premier flux concret ; l'arbre de décision par catégorie
// (batterie, chargeur…) peut s'étendre plus tard sur le même modèle.
type Message = { from: "volta" | "user"; text: string };

type Step = "goal" | "panel-count" | "panel-power" | "system-voltage" | "confirm" | "done";

const PANEL_COUNT_CHOICES = [1, 2, 3, 4];
const PANEL_POWER_CHOICES = [100, 150, 200, 300, 400];

export function InstallAssistant() {
  const darkMode = useSchemaStore((s) => s.darkMode);
  const open = useSchemaStore((s) => s.installAssistantOpen);
  const closeInstallAssistant = useSchemaStore((s) => s.closeInstallAssistant);
  const nodes = useSchemaStore((s) => s.nodes);
  const insertGuidedInstall = useSchemaStore((s) => s.insertGuidedInstall);
  const select = useSchemaStore((s) => s.select);

  const detectedVoltage = useMemo(() => {
    const hasBattery = nodes.some((n) => n.data.componentType === "battery");
    return hasBattery ? (findBatteryVoltage(nodes) as 12 | 24) : null;
  }, [nodes]);

  const [step, setStep] = useState<Step>("goal");
  const [messages, setMessages] = useState<Message[]>([
    { from: "volta", text: "Salut ! Qu'est-ce que tu veux installer ?" },
  ]);
  const [panelCount, setPanelCount] = useState<number | null>(null);
  const [panelPower, setPanelPower] = useState<number | null>(null);
  const [systemVoltage, setSystemVoltage] = useState<12 | 24 | null>(null);
  const [customCount, setCustomCount] = useState("");
  const [customPower, setCustomPower] = useState("");
  const [pose, setPose] = useState<VoltaPose>("neutre");

  if (!open) return null;

  function say(text: string, nextPose: VoltaPose = "neutre") {
    setMessages((prev) => [...prev, { from: "volta", text }]);
    setPose(nextPose);
  }

  function reply(text: string) {
    setMessages((prev) => [...prev, { from: "user", text }]);
  }

  function handleChooseGoal() {
    reply("Panneaux solaires");
    say("Combien de panneaux veux-tu installer ?");
    setStep("panel-count");
  }

  function handlePanelCount(count: number) {
    if (!count || count < 1) return;
    setPanelCount(count);
    reply(`${count} panneau${count > 1 ? "x" : ""}`);
    say("Quelle puissance par panneau (en W) ?");
    setStep("panel-power");
  }

  function handlePanelPower(power: number) {
    if (!power || power < 1) return;
    setPanelPower(power);
    reply(`${power} W`);
    if (detectedVoltage) {
      say(`J'ai vu que ton système est en ${detectedVoltage}V (d'après ta batterie déjà présente), je pars sur cette base.`, "confiante");
      setSystemVoltage(detectedVoltage);
      setStep("confirm");
    } else {
      say("Quelle est la tension de ton système ?");
      setStep("system-voltage");
    }
  }

  function handleSystemVoltage(voltage: 12 | 24) {
    setSystemVoltage(voltage);
    reply(`${voltage}V`);
    setStep("confirm");
  }

  const plan = panelCount && panelPower && systemVoltage ? buildSolarInstallPlan({ panelCount, panelPowerW: panelPower, systemVoltage }) : null;

  function handleConfirm() {
    if (!plan) return;
    reply("Ajoute-les à mon schéma");
    const zoneId = insertGuidedInstall(plan);
    select("node", zoneId);
    const oversizedNote = plan.mpptOversized
      ? " ⚠️ Cette puissance dépasse ce qu'un seul régulateur du catalogue peut gérer confortablement — j'ai posé le plus gros disponible, mais il faudra sans doute répartir sur plusieurs régulateurs."
      : "";
    say(
      `C'est fait — ${plan.components.filter((c) => c.type === "solar-panel").length} panneau(x), un ${plan.mpptLabel} et son fusible (${plan.fuseAmperage}A), dans une nouvelle zone "Panneaux solaires".${oversizedNote} Il ne te reste qu'à relier la sortie du fusible et le − du régulateur à ta batterie/busbar existante.`,
      "action",
    );
    setStep("done");
  }

  function handleRestart() {
    setPanelCount(null);
    setPanelPower(null);
    setSystemVoltage(null);
    setCustomCount("");
    setCustomPower("");
    setMessages([{ from: "volta", text: "Autre chose à installer ?" }]);
    setStep("goal");
  }

  const bubbleClass = (from: Message["from"]) =>
    `max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
      from === "user"
        ? darkMode
          ? "self-end bg-brand-500/20 text-brand-100"
          : "self-end bg-brand-50 text-brand-900"
        : darkMode
          ? "self-start bg-neutral-800 text-neutral-100"
          : "self-start bg-neutral-100 text-neutral-800"
    }`;

  const choiceButtonClass = `rounded-lg border px-3 py-1.5 text-sm font-medium transition-base ${
    darkMode ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800" : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
  }`;

  const primaryButtonClass = `rounded-lg px-3.5 py-2 text-sm font-semibold transition-base ${
    darkMode ? "bg-emerald-500 text-neutral-950 hover:bg-emerald-400" : "bg-emerald-600 text-white hover:bg-emerald-700"
  }`;

  const inputClass = `w-20 rounded-md border px-2 py-1 text-sm focus:outline-none ${
    darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-100" : "border-neutral-300 bg-white"
  }`;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex justify-end">
      <div
        className={`pointer-events-auto flex max-h-[70vh] w-full max-w-sm flex-col overflow-hidden rounded-xl border shadow-lg ${
          darkMode ? "border-neutral-700 bg-neutral-900" : "border-neutral-200 bg-white"
        }`}
      >
        <div className={`flex items-center justify-between gap-2 border-b px-3 py-2.5 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
          <div className="flex items-center gap-2">
            <VoltaAvatar pose={pose} size={36} />
            <span className={`text-sm font-semibold ${darkMode ? "text-neutral-100" : "text-neutral-900"}`}>Assistant débutant</span>
          </div>
          <button
            type="button"
            onClick={closeInstallAssistant}
            title="Fermer"
            className={`rounded-md p-1 text-xs ${darkMode ? "text-neutral-400 hover:bg-neutral-800" : "text-neutral-500 hover:bg-neutral-100"}`}
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <p className={bubbleClass(m.from)}>{m.text}</p>
            </div>
          ))}

          {step === "confirm" && plan ? (
            <div className={`self-start rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${darkMode ? "border-neutral-700 bg-neutral-800 text-neutral-300" : "border-neutral-200 bg-neutral-50 text-neutral-600"}`}>
              <p className="font-semibold">Récap :</p>
              <p>{plan.components.filter((c) => c.type === "solar-panel").length} × {panelPower}W = {plan.totalW}W total</p>
              <p>Régulateur : {plan.mpptLabel} ({plan.mpptAmperage}A)</p>
              <p>Fusible : {plan.fuseAmperage}A (MIDI)</p>
            </div>
          ) : null}
        </div>

        <div className={`flex flex-wrap gap-1.5 border-t px-3 py-2.5 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
          {step === "goal" ? (
            <>
              <button type="button" onClick={handleChooseGoal} className={choiceButtonClass}>
                ☀️ Panneaux solaires
              </button>
              <button type="button" disabled title="Bientôt disponible" className={`${choiceButtonClass} cursor-not-allowed opacity-40`}>
                🔋 Batterie
              </button>
              <button type="button" disabled title="Bientôt disponible" className={`${choiceButtonClass} cursor-not-allowed opacity-40`}>
                ⚡ Chargeur
              </button>
            </>
          ) : null}

          {step === "panel-count" ? (
            <>
              {PANEL_COUNT_CHOICES.map((n) => (
                <button key={n} type="button" onClick={() => handlePanelCount(n)} className={choiceButtonClass}>
                  {n}
                </button>
              ))}
              <input
                type="number"
                min={1}
                placeholder="Autre"
                value={customCount}
                onChange={(e) => setCustomCount(e.target.value)}
                className={inputClass}
              />
              <button type="button" onClick={() => handlePanelCount(Number(customCount))} className={choiceButtonClass}>
                OK
              </button>
            </>
          ) : null}

          {step === "panel-power" ? (
            <>
              {PANEL_POWER_CHOICES.map((w) => (
                <button key={w} type="button" onClick={() => handlePanelPower(w)} className={choiceButtonClass}>
                  {w}W
                </button>
              ))}
              <input
                type="number"
                min={1}
                placeholder="Autre"
                value={customPower}
                onChange={(e) => setCustomPower(e.target.value)}
                className={inputClass}
              />
              <button type="button" onClick={() => handlePanelPower(Number(customPower))} className={choiceButtonClass}>
                OK
              </button>
            </>
          ) : null}

          {step === "system-voltage" ? (
            <>
              <button type="button" onClick={() => handleSystemVoltage(12)} className={choiceButtonClass}>
                12V
              </button>
              <button type="button" onClick={() => handleSystemVoltage(24)} className={choiceButtonClass}>
                24V
              </button>
            </>
          ) : null}

          {step === "confirm" ? (
            <button type="button" onClick={handleConfirm} className={primaryButtonClass}>
              Ajouter à mon schéma
            </button>
          ) : null}

          {step === "done" ? (
            <>
              <button type="button" onClick={handleRestart} className={choiceButtonClass}>
                Ajouter autre chose
              </button>
              <button type="button" onClick={closeInstallAssistant} className={primaryButtonClass}>
                Terminé
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
