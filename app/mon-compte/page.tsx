import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomerAccountShell } from "@/components/customer/CustomerAccountShell";
import { getCustomerSessionFromCookie } from "@/lib/server/customer-session";
import { getCustomerAccountOverview } from "@/lib/services/customer-account";

export const metadata: Metadata = {
  title: "Mon compte",
  description: "Consultez votre espace client FabSystem.",
  alternates: {
    canonical: "/mon-compte",
  },
};

export const dynamic = "force-dynamic";

export default async function MonComptePage() {
  const session = await getCustomerSessionFromCookie();

  if (!session) {
    redirect("/connexion-client");
  }

  const overview = await getCustomerAccountOverview(session.customer.id);

  return <CustomerAccountShell overview={overview} />;
}
