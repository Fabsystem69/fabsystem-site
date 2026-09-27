import { prisma } from "@/lib/prisma";
import { buildProjectSnapshot } from "@/lib/services/coaching-dossier-snapshot";
import {
  getCoachingCircuitReviewStatusLabel,
  getCoachingMaterialCategoryLabel,
  getCoachingPowerSupplyLabel,
} from "@/lib/dashboard-status-labels";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
}

// Export imprimable du dossier (espace admin uniquement — retour
// utilisateur : "export imprimable propre ou PDF du dossier complet...
// les notes privées sont exclues de l'export client"). includePrivateNotes
// contrôle uniquement la présence du registre de circuits et des notes
// internes ; le reste (véhicule, usages, appareils, bilan, matériel) est
// déjà la version partagée avec le client, donc toujours inclus.
export async function buildPrintableVanDossierHtml(projectId: string, includePrivateNotes: boolean): Promise<string> {
  const snapshot = await buildProjectSnapshot(projectId);
  const dateStr = new Date().toLocaleDateString("fr-FR");
  const title = escapeHtml(snapshot.project.title);

  const scenarioSections = snapshot.scenarios
    .map(({ scenarioName, bilan }) => {
      const rows = bilan.perDevice
        .map((d) => {
          const device = snapshot.devices.find((x) => x.id === d.deviceId);
          if (!device) return "";
          return `<tr><td>${escapeHtml(device.name)}</td><td>${escapeHtml(device.category)}</td><td>${escapeHtml(getCoachingPowerSupplyLabel(device.powerSupply))}</td><td>${d.energyWh != null ? Math.round(d.energyWh) : "Inconnu"}</td></tr>`;
        })
        .join("");
      return `
        <h3>Scénario : ${escapeHtml(scenarioName)}</h3>
        <table><thead><tr><th>Appareil</th><th>Catégorie</th><th>Alimentation</th><th>Wh/j</th></tr></thead><tbody>${rows}</tbody></table>
        <p>${bilan.isIncomplete ? `Bilan incomplet (${bilan.incompleteCount} appareil(s) manquant de données)` : "Bilan complet"} — Total connu : <strong>${Math.round(bilan.totalWhPerDay)} Wh/j</strong>. Hors pertes et marge de dimensionnement.</p>
      `;
    })
    .join("");

  const materialsRows = snapshot.materials
    .map((m) => `<tr><td>${escapeHtml(getCoachingMaterialCategoryLabel(m.category))}</td><td>${escapeHtml(m.brand ?? "—")}</td><td>${escapeHtml(m.reference ?? "—")}</td><td>${m.quantity}</td><td>${escapeHtml(m.state)}</td></tr>`)
    .join("");

  let privateSection = "";
  if (includePrivateNotes) {
    const [circuits, project] = await Promise.all([
      prisma.coachingCircuit.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
      prisma.coachingProject.findUnique({ where: { id: projectId }, select: { notesInternes: true } }),
    ]);
    const circuitRows = circuits
      .map(
        (c) =>
          `<tr><td>${escapeHtml(c.label)}</td><td>${escapeHtml(c.source ?? "—")}</td><td>${escapeHtml(c.destination ?? "—")}</td><td>${escapeHtml(c.section ?? "—")}</td><td>${escapeHtml(c.protectionReference ?? "—")}</td><td>${escapeHtml(getCoachingCircuitReviewStatusLabel(c.reviewStatus))}</td></tr>`
      )
      .join("");
    privateSection = `
      <h2>Registre de circuits (usage interne)</h2>
      <table><thead><tr><th>Circuit</th><th>Source</th><th>Destination</th><th>Section</th><th>Protection</th><th>Statut</th></tr></thead><tbody>${circuitRows}</tbody></table>
      ${project?.notesInternes ? `<h2>Notes internes</h2><p>${escapeHtml(project.notesInternes)}</p>` : ""}
    `;
  }

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: -apple-system, sans-serif; color: #111; padding: 2rem; }
  h1 { font-size: 1.5rem; } h2 { font-size: 1.2rem; margin-top: 2rem; } h3 { font-size: 1rem; margin-top: 1.2rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
  th, td { border: 1px solid #ccc; padding: 0.4rem 0.6rem; text-align: left; font-size: 0.85rem; }
  .meta { color: #666; font-size: 0.85rem; }
  .disclaimer { margin-top: 2rem; padding: 0.75rem; border: 1px solid #e0a000; background: #fff8e1; font-size: 0.8rem; }
</style></head>
<body>
  <h1>${title}</h1>
  <p class="meta">Client : ${escapeHtml(snapshot.project.customerName ?? snapshot.project.customerEmail)} — Généré le ${dateStr}</p>

  <h2>Véhicule</h2>
  <p>${escapeHtml(snapshot.project.vehicleBrand ?? "—")} ${escapeHtml(snapshot.project.vehicleModel ?? "")} ${escapeHtml(snapshot.project.vehicleYear ?? "")} — ${escapeHtml(snapshot.project.projectStage ?? "Avancement non précisé")}</p>

  <h2>Bilan de consommation</h2>
  ${scenarioSections}

  <h2>Matériel</h2>
  <table><thead><tr><th>Catégorie</th><th>Marque</th><th>Référence</th><th>Qté</th><th>État</th></tr></thead><tbody>${materialsRows}</tbody></table>

  ${privateSection}

  <p class="disclaimer">Ce document est une aide au dimensionnement à revoir par votre coach FabSystem. Il ne constitue ni un schéma validé, ni une certification de conformité réglementaire.</p>
</body></html>`;
}
