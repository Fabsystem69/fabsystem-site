import type { DeliveryMode, ServiceType } from "@/lib/generated/prisma/client";

export function formatServiceType(serviceType: ServiceType) {
  switch (serviceType) {
    case "FORMATION":
      return "Formation";
    case "AUDIT":
      return "Audit";
    case "CONSEIL":
      return "Conseil";
    default:
      return "Intervention";
  }
}

export function formatDeliveryMode(deliveryMode: DeliveryMode) {
  return deliveryMode === "REMOTE" ? "Visio" : "Sur site";
}

export function formatServiceBadge(serviceType: ServiceType, deliveryMode: DeliveryMode) {
  return `${formatServiceType(serviceType)} • ${formatDeliveryMode(deliveryMode)}`;
}
