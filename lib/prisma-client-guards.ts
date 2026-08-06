import type { PrismaClient } from "@/lib/generated/prisma/client";

export function hasRequiredCommerceDelegates(
  client: PrismaClient | undefined
): client is PrismaClient {
  return Boolean(
    client?.product &&
      client?.productPrice &&
      client?.cart &&
      client?.cartItem &&
      client?.downloadGrant &&
      client?.customer &&
      client?.magicLoginToken &&
      client?.customerSession
  );
}
