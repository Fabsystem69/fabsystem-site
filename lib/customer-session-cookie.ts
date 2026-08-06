export const CUSTOMER_SESSION_COOKIE_NAME = "fabsystem_customer_session";
export const CUSTOMER_SESSION_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function getCustomerSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CUSTOMER_SESSION_COOKIE_MAX_AGE_SECONDS,
  };
}
