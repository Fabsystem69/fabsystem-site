"use client";

import { useMemo, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { getBrandModelsForType } from "@/lib/electrical-components/brand-models";
import { getVisibleCanvasCenter } from "@/lib/schema-editor/viewport";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";
import { useSchemaStore, type SystemBuilderConfig } from "@/features/schemas/store/useSchemaStore";

type BuilderKind = "solar" | "battery";
type Arrangement = SystemBuilderConfig["arrangement"];

const COPY = {
  solar: {
    title: "Créer un champ solaire",
    item: "panneaux",
    type: "solar-panel",
    all: "Tous",
    filters: ["Rigide", "Flexible"],
    busbar: "Collecteurs PV",
    daisy: "Chaînage direct",
  },
  battery: {
    title: "Créer un parc batteries",
    item: "batteries",
    type: "battery",
    all: "Toutes",
    filters: ["Lithium", "AGM", "GEL"],
    busbar: "Busbars + / −",
    daisy: "Câblage en chaîne",
  },
} as const;

export function SystemBuilderDialog({ kind, onClose }: { kind: BuilderKind; onClose: () => void }) {
  const copy = COPY[kind];
  const buildSystem = useSchemaStore((s) => s.buildSystem);
  const { screenToFlowPosition } = useReactFlow();
  const models = useMemo(() => getBrandModelsForType(copy.type), [copy.type]);
  const brands = useMemo(() => Array.from(new Set(models.map((model) => model.brand))).sort((a, b) => a.localeCompare(b)), [models]);
  const [quantity, setQuantity] = useState(4);
  const [arrangement, setArrangement] = useState<Arrangement>("parallel");
  const [wiring, setWiring] = useState<"busbars" | "daisy-chain">("busbars");
  const [brand, setBrand] = useState("Toutes");
  const [modelId, setModelId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  useEscapeToClose(onClose);

  const filteredModels = models.filter((model) => {
    const haystack = `${model.brand} ${model.model}`.toLocaleLowerCase("fr");
    return (brand === "Toutes" || model.brand === brand) && haystack.includes(query.toLocaleLowerCase("fr"));
  });
  const selected = models.find((model) => model.id === modelId);
  const canUse2s2p = quantity === 4;
  const estimated = selected?.defaults ?? {};
  const voltage = Number(estimated.voltage ?? 12);
  const capacityOrPower = Number(kind === "solar" ? estimated.powerW ?? 100 : estimated.capacityAh ?? 100);
  const total = arrangement === "series" ? capacityOrPower * quantity : capacityOrPower * quantity;
  const systemVoltage = arrangement === "series" ? voltage * quantity : arrangement === "2s2p" ? voltage * 2 : voltage;

  function changeQuantity(next: number) {
    const value = Math.max(2, Math.min(kind === "solar" ? 8 : 6, next));
    setQuantity(value);
    if (arrangement === "2s2p" && value !== 4) setArrangement("parallel");
  }

  function addSystem() {
    const screen = getVisibleCanvasCenter();
    buildSystem({
      kind,
      quantity,
      arrangement,
      wiring,
      brandModelId: modelId,
      position: screenToFlowPosition(screen),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-3" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={copy.title}>
      <div className="flex h-[min(48rem,calc(100vh-1.5rem))] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-amber-500" aria-hidden="true">{kind === "solar" ? "☀" : "▱"}</span>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{copy.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-2xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Fermer">×</button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[52%_48%] lg:overflow-hidden">
          <section className="border-b border-slate-200 p-7 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <ArrayPreview quantity={quantity} arrangement={arrangement} useBusbars={wiring === "busbars"} kind={kind} />
            <p className="mt-4 text-center text-sm text-slate-500">
              {quantity} × {selected ? `${selected.brand} ${selected.model}` : kind === "solar" ? "panneau solaire" : "batterie"} · {arrangement === "parallel" ? "montage parallèle" : arrangement === "series" ? "montage série" : "2S2P"}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <Metric value={kind === "solar" ? `${total} W` : `${systemVoltage} V`} label={kind === "solar" ? "Puissance totale" : "Tension nominale"} />
              <Metric value={kind === "solar" ? `${systemVoltage} V` : `${total} Ah`} label={kind === "solar" ? "Tension de chaîne" : "Capacité totale"} />
              <Metric value={kind === "solar" ? "À vérifier" : `${((systemVoltage * total) / 1000).toFixed(2)} kWh`} label={kind === "solar" ? "Courant PV" : "Énergie"} />
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Quantité</h3>
              <div className="mt-3 flex items-center gap-4">
                <button type="button" className="h-12 w-12 rounded-xl border border-slate-300 text-2xl text-slate-800 hover:bg-slate-50" onClick={() => changeQuantity(quantity - 1)} aria-label={`Retirer un ${kind === "solar" ? "panneau" : "batterie"}`}>−</button>
                <strong className="w-12 text-center text-4xl tabular-nums text-slate-900">{quantity}</strong>
                <button type="button" className="h-12 w-12 rounded-xl border border-slate-300 text-2xl text-slate-800 hover:bg-slate-50" onClick={() => changeQuantity(quantity + 1)} aria-label={`Ajouter un ${kind === "solar" ? "panneau" : "batterie"}`}>+</button>
              </div>
            </div>

            <OptionGroup title="Configuration" value={arrangement} onChange={setArrangement} options={[
              { value: "parallel", label: "Tout parallèle" },
              { value: "series", label: "Tout en série" },
              { value: "2s2p", label: "2S2P", disabled: !canUse2s2p },
            ]} />
            <OptionGroup title={kind === "solar" ? "Raccordement" : "Câblage parallèle"} value={wiring} onChange={setWiring} disabled={arrangement !== "parallel"} options={[
              { value: "busbars", label: copy.busbar },
              { value: "daisy-chain", label: copy.daisy },
            ]} />
            <p className="mt-3 text-sm leading-5 text-slate-500">
              {arrangement === "parallel" && wiring === "busbars" ? "Deux collecteurs sont ajoutés et chaque élément reçoit sa propre liaison + et −." : arrangement === "series" ? "Les éléments sont reliés en série; les deux bornes libres restent disponibles pour le raccordement au système." : "Les liaisons sont créées automatiquement et restent entièrement modifiables."}
            </p>
          </section>

          <section className="flex min-h-0 flex-col p-7 lg:overflow-hidden">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{kind === "solar" ? "Panneau" : "Batterie"}</h3>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={kind === "solar" ? "Rechercher un panneau..." : "Rechercher une batterie..."} className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            <div className="mt-3 flex flex-wrap gap-2">
              <FilterButton active={brand === "Toutes"} onClick={() => setBrand("Toutes")}>{copy.all}</FilterButton>
              {brands.map((item) => <FilterButton key={item} active={brand === item} onClick={() => setBrand(item)}>{item}</FilterButton>)}
            </div>
            <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200">
              <ModelRow active={modelId === null} title={kind === "solar" ? "Panneau solaire générique" : "Batterie générique"} detail="Valeurs typiques, à renseigner ensuite" onClick={() => setModelId(null)} />
              {filteredModels.map((model) => <ModelRow key={model.id} active={modelId === model.id} title={model.model} detail={model.brand} onClick={() => setModelId(model.id)} />)}
              {filteredModels.length === 0 ? <p className="p-4 text-sm text-slate-500">Aucun modèle ne correspond à cette recherche.</p> : null}
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-medium text-slate-900">{selected ? `${selected.brand} ${selected.model}` : kind === "solar" ? "Panneau solaire générique" : "Batterie générique"}</p>
              <p className="mt-1 text-sm text-slate-500">{selected ? "Les caractéristiques cataloguées seront appliquées à chaque élément." : "Vous pourrez compléter les caractéristiques dans le panneau de propriétés."}</p>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-end gap-4 border-t border-slate-200 px-7 py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-5 py-3 font-medium text-slate-700 hover:bg-slate-100">Annuler</button>
          <button type="button" onClick={addSystem} className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-amber-600">Ajouter {quantity} {copy.item}</button>
        </footer>
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center"><strong className="block text-xl tabular-nums text-slate-900">{value}</strong><span className="mt-1 block text-xs text-slate-500">{label}</span></div>;
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${active ? "border-amber-500 bg-amber-500 text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>{children}</button>;
}

function ModelRow({ active, title, detail, onClick }: { active: boolean; title: string; detail: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 ${active ? "bg-amber-50" : "hover:bg-slate-50"}`}><span><span className="block font-medium text-slate-800">{title}</span><span className="block text-sm text-slate-500">{detail}</span></span>{active ? <span className="text-sm font-semibold text-amber-600">Choisi</span> : null}</button>;
}

function OptionGroup<T extends string>({ title, value, onChange, options, disabled }: { title: string; value: T; onChange: (value: T) => void; options: { value: T; label: string; disabled?: boolean }[]; disabled?: boolean }) {
  return <div className="mt-7"><h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3><div className="mt-3 flex flex-wrap gap-2">{options.map((option) => <button key={option.value} type="button" disabled={disabled || option.disabled} onClick={() => onChange(option.value)} className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${value === option.value ? "border-amber-500 bg-amber-500 text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:opacity-40`}>{option.label}</button>)}</div></div>;
}

function ArrayPreview({ kind, quantity, arrangement, useBusbars }: { kind: BuilderKind; quantity: number; arrangement: Arrangement; useBusbars: boolean }) {
  const nodes = Array.from({ length: quantity });
  const columns = quantity > 4 ? 2 : 1;
  return <div className="relative flex min-h-56 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{nodes.map((_, index) => <div key={index} className={`flex h-12 w-20 items-center justify-center rounded-lg border-2 text-xs font-semibold ${kind === "solar" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-sky-300 bg-sky-50 text-sky-700"}`}>{kind === "solar" ? "PV" : "12V"} {index + 1}</div>)}</div>{arrangement === "parallel" && useBusbars ? <><span className="absolute left-[12%] h-28 w-2 rounded-full bg-slate-700" /><span className="absolute right-[12%] h-28 w-2 rounded-full bg-red-400" /></> : null}<span className="absolute bottom-3 text-xs text-slate-400">{arrangement === "parallel" ? "Branches en parallèle" : arrangement === "series" ? "Chaîne en série" : "Deux chaînes 2S en parallèle"}</span></div>;
}
