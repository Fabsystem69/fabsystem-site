import { verifyEbookToken } from "@/lib/ebook-token";
import { prisma } from "@/lib/prisma";
import { logServerEvent } from "@/lib/server-log";

type Params = {
  params: Promise<{
    token: string;
  }>;
};

export default async function EbookAccessPage({ params }: Params) {
  const { token } = await params;
  const payload = verifyEbookToken(token);

  if (!payload) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">Lien invalide ou expiré</h1>
        <p className="mt-2 text-neutral-600">
          Contactez-nous si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
        </p>
      </main>
    );
  }

  const order = await prisma.ebookOrder.findUnique({ where: { id: payload.sub } });

  if (!order || order.email !== payload.email) {
    logServerEvent("warn", "ebook access: order mismatch", {
      orderId: payload.sub,
      orderFound: Boolean(order),
    });
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">Commande introuvable</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">
        Câbler son van sans se planter
      </h1>

      {order.status === "READY" && (
        <div className="mt-8 flex flex-col gap-4">
          <a
            href={`/api/ebook/download?token=${token}&variant=desktop`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-neutral-900 px-6 py-3 text-white"
          >
            Ouvrir la version bureau
          </a>
          <a
            href={`/api/ebook/download?token=${token}&variant=pocket`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-neutral-300 px-6 py-3"
          >
            Ouvrir la version poche
          </a>
        </div>
      )}

      {(order.status === "PAID" || order.status === "GENERATING") && (
        <p className="mt-8 text-neutral-600">
          Votre exemplaire est en cours de préparation. Réessayez dans quelques
          minutes, ou revenez sur ce lien reçu par email.
        </p>
      )}

      {order.status === "FAILED" && (
        <p className="mt-8 text-neutral-600">
          Une erreur est survenue lors de la préparation de votre exemplaire.
          Contactez-nous à {process.env.MAIL_TO ?? "fabien.lages@fabsystem.fr"}{" "}
          en indiquant votre email d&apos;achat, nous vous l&apos;enverrons
          manuellement.
        </p>
      )}
    </main>
  );
}
