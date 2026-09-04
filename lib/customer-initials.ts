// Calcule 2 lettres d'initiales pour le badge compte (Ribbon.tsx) —
// jamais le nom ou l'email complet n'est renvoyé au client pour cet usage.
export function computeAccountInitials(name: string | null, email: string): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts[0]?.length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }
  return email.slice(0, 2).toUpperCase();
}
