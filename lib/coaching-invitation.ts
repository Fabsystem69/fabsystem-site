export type CoachingInvitationState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "created"; magicLink: string; expiresAt: string };
