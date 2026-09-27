import { badRequest, notFound } from "@/lib/http-errors";
import { prisma } from "@/lib/prisma";
import { logCoachingProjectEvent } from "@/lib/services/coaching-project-events";
import type { CoachingCircuitReviewStatus, CoachingDataOrigin } from "@/lib/generated/prisma/client";

// Registre de circuits (étape 5) — EXCLUSIVEMENT réservé au coach (le
// cahier des charges le dit explicitement : "réserve au coach..."). Jamais
// appelé depuis app/mon-compte — pas d'actor client possible ici, l'auteur
// journalisé est toujours "coach".

export type CircuitFields = {
  label: string;
  deviceId?: string | null;
  materialId?: string | null;
  source?: string | null;
  destination?: string | null;
  systemVoltage?: number | null;
  calculatedCurrentA?: number | null;
  outboundLengthM?: number | null;
  outboundLengthOrigin?: CoachingDataOrigin | null;
  returnPathPlanned?: string | null;
  returnLengthM?: number | null;
  electricalLengthM?: number | null;
  installMethod?: string | null;
  section?: string | null;
  voltageDropNotes?: string | null;
  protectionType?: string | null;
  protectionReference?: string | null;
  protectionRatingA?: number | null;
  protectionRatedVoltage?: number | null;
  protectionBreakingCapacityA?: number | null;
  protectionLocation?: string | null;
  justification?: string | null;
  reviewStatus?: CoachingCircuitReviewStatus;
};

export async function listCircuitsForProject(projectId: string) {
  return prisma.coachingCircuit.findMany({ where: { projectId }, orderBy: { createdAt: "asc" }, include: { device: true } });
}

export async function createCircuit(input: { projectId: string } & CircuitFields) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");

  const label = input.label.trim();
  if (!label) throw badRequest("Identifiant de circuit requis.");

  return prisma.$transaction(async (tx) => {
    const circuit = await tx.coachingCircuit.create({
      data: {
        projectId: input.projectId,
        label,
        deviceId: input.deviceId || null,
        materialId: input.materialId || null,
        source: input.source?.trim() || null,
        destination: input.destination?.trim() || null,
        systemVoltage: input.systemVoltage,
        calculatedCurrentA: input.calculatedCurrentA,
        outboundLengthM: input.outboundLengthM,
        outboundLengthOrigin: input.outboundLengthOrigin,
        // Le retour n'est JAMAIS déduit de la longueur aller — reste null
        // tant qu'il n'est pas explicitement renseigné (retour utilisateur
        // explicite : "ne transforme pas une longueur aller en hypothèse de
        // retour silencieuse").
        returnPathPlanned: input.returnPathPlanned?.trim() || null,
        returnLengthM: input.returnLengthM,
        electricalLengthM: input.electricalLengthM,
        installMethod: input.installMethod?.trim() || null,
        section: input.section?.trim() || null,
        voltageDropNotes: input.voltageDropNotes?.trim() || null,
        protectionType: input.protectionType?.trim() || null,
        protectionReference: input.protectionReference?.trim() || null,
        protectionRatingA: input.protectionRatingA,
        protectionRatedVoltage: input.protectionRatedVoltage,
        protectionBreakingCapacityA: input.protectionBreakingCapacityA,
        protectionLocation: input.protectionLocation?.trim() || null,
        justification: input.justification?.trim() || null,
        reviewStatus: input.reviewStatus,
      },
    });
    await logCoachingProjectEvent(tx, input.projectId, "CIRCUIT", { kind: "coach" }, `Circuit créé : ${label}`);
    return circuit;
  });
}

export async function updateCircuit(input: { circuitId: string } & Partial<CircuitFields>) {
  const circuit = await prisma.coachingCircuit.findUnique({ where: { id: input.circuitId }, select: { id: true, projectId: true } });
  if (!circuit) throw notFound("Circuit introuvable.");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coachingCircuit.update({
      where: { id: input.circuitId },
      data: {
        label: input.label?.trim() || undefined,
        deviceId: input.deviceId !== undefined ? input.deviceId || null : undefined,
        materialId: input.materialId !== undefined ? input.materialId || null : undefined,
        source: input.source !== undefined ? input.source?.trim() || null : undefined,
        destination: input.destination !== undefined ? input.destination?.trim() || null : undefined,
        systemVoltage: input.systemVoltage,
        calculatedCurrentA: input.calculatedCurrentA,
        outboundLengthM: input.outboundLengthM,
        outboundLengthOrigin: input.outboundLengthOrigin,
        returnPathPlanned: input.returnPathPlanned !== undefined ? input.returnPathPlanned?.trim() || null : undefined,
        returnLengthM: input.returnLengthM,
        electricalLengthM: input.electricalLengthM,
        installMethod: input.installMethod !== undefined ? input.installMethod?.trim() || null : undefined,
        section: input.section !== undefined ? input.section?.trim() || null : undefined,
        voltageDropNotes: input.voltageDropNotes !== undefined ? input.voltageDropNotes?.trim() || null : undefined,
        protectionType: input.protectionType !== undefined ? input.protectionType?.trim() || null : undefined,
        protectionReference: input.protectionReference !== undefined ? input.protectionReference?.trim() || null : undefined,
        protectionRatingA: input.protectionRatingA,
        protectionRatedVoltage: input.protectionRatedVoltage,
        protectionBreakingCapacityA: input.protectionBreakingCapacityA,
        protectionLocation: input.protectionLocation !== undefined ? input.protectionLocation?.trim() || null : undefined,
        justification: input.justification !== undefined ? input.justification?.trim() || null : undefined,
        reviewStatus: input.reviewStatus,
      },
    });
    await logCoachingProjectEvent(tx, circuit.projectId, "CIRCUIT", { kind: "coach" });
    return updated;
  });
}

export async function deleteCircuit(circuitId: string) {
  const circuit = await prisma.coachingCircuit.findUnique({ where: { id: circuitId }, select: { id: true } });
  if (!circuit) throw notFound("Circuit introuvable.");
  return prisma.coachingCircuit.delete({ where: { id: circuitId } });
}
