import {
  getFormationToolGenericSearchUrl,
  getFormationToolProSearchUrl,
  listFormationEssentialTools,
} from "@/lib/formations-tools";

const LINK_CLASS =
  "inline-flex items-center rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50";

const PLACEHOLDER_CLASS =
  "inline-flex items-center rounded-md border border-dashed border-neutral-300 px-2.5 py-1.5 text-xs font-medium italic text-neutral-400";

export function FormationsEssentialTools() {
  const tools = listFormationEssentialTools();

  return (
    <div>
      <p className="text-xs leading-relaxed text-neutral-500">
        Aucun lien affilié pour l&apos;instant — juste des repères pour ne pas partir sur le
        mauvais matériel.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {tools.map((tool) => {
          const genericUrl = getFormationToolGenericSearchUrl(tool);
          const proUrl = getFormationToolProSearchUrl(tool);

          return (
            <div key={tool.id} className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-neutral-950">{tool.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">{tool.usage}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={genericUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={LINK_CLASS}
                >
                  Suffisant pour un usage ponctuel
                </a>
                {proUrl ? (
                  <a
                    href={proUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className={LINK_CLASS}
                  >
                    Le choix pro FabSystem
                  </a>
                ) : (
                  <span className={PLACEHOLDER_CLASS}>
                    Le choix pro FabSystem — [MODÈLE À PRÉCISER PAR FABIEN]
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
