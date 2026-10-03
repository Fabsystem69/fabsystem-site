"use client";

import { DEVICE_POWER_SUPPLIES } from "@/lib/crm/sheet-import-contract";
import { POWER_LABELS, type DeviceLine } from "./sheet-review-state";

const fieldClass =
  "h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-white outline-none focus:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400";
const labelClass = "grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500";

function DeviceRow({ device, onChange }: { device: DeviceLine; onChange: (next: DeviceLine) => void }) {
  const patch = (changes: Partial<DeviceLine>) => onChange({ ...device, ...changes });
  return (
    <li className={`grid gap-3 rounded-xl border border-neutral-700 bg-neutral-900/60 p-3 ${device.include ? "" : "opacity-70"}`}>
      <div className="flex items-center gap-2">
        <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            checked={device.include}
            onChange={(event) => patch({ include: event.target.checked })}
            aria-label={`Ajouter l'appareil : ${device.name || "sans nom"}`}
            className="h-5 w-5 accent-brand-400"
          />
        </label>
        {device.alreadyExists ? <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-semibold text-neutral-300">déjà présent</span> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Nom
          <input className={fieldClass} value={device.name} onChange={(event) => patch({ name: event.target.value })} />
        </label>
        <label className={labelClass}>
          Quantité
          <input className={fieldClass} inputMode="numeric" value={device.quantity} onChange={(event) => patch({ quantity: event.target.value })} />
        </label>
        <label className={labelClass}>
          Alimentation
          <select className={fieldClass} value={device.powerSupply} onChange={(event) => patch({ powerSupply: event.target.value as DeviceLine["powerSupply"] })}>
            {DEVICE_POWER_SUPPLIES.map((supply) => (
              <option key={supply} value={supply}>
                {POWER_LABELS[supply]}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Durée d&apos;usage
          <input className={fieldClass} value={device.duration} onChange={(event) => patch({ duration: event.target.value })} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Remarque
          <input className={fieldClass} value={device.remark} onChange={(event) => patch({ remark: event.target.value })} />
        </label>
      </div>
    </li>
  );
}

export function SheetDevicesTable({ devices, onChange }: { devices: readonly DeviceLine[]; onChange: (next: DeviceLine[]) => void }) {
  if (devices.length === 0) return <p className="text-sm text-neutral-400">Aucun appareil lu sur la fiche.</p>;
  return (
    <ul className="grid gap-2">
      {devices.map((device) => (
        <DeviceRow key={device.id} device={device} onChange={(next) => onChange(devices.map((item) => (item.id === next.id ? next : item)))} />
      ))}
    </ul>
  );
}
