import { QuoteSignatureForm } from "@/components/sign/QuoteSignatureForm";

type Params = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function SignQuotePage({ params, searchParams }: Params) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Lien invalide ou incomplet.
        </div>
      </main>
    );
  }

  return <QuoteSignatureForm quoteId={id} token={token} />;
}
