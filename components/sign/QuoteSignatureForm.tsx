"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatDate, formatEuroFromCents } from "@/lib/format";

type QuoteViewModel = {
  number: string;
  issueDate: string;
  validUntil: string | null;
  customer: { name: string };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  total: number;
};

type QuoteSignatureFormProps = {
  quoteId: string;
  token: string;
};

export function QuoteSignatureForm({
  quoteId,
  token,
}: QuoteSignatureFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasSignatureRef = useRef(false);
  const [quote, setQuote] = useState<QuoteViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadQuote() {
      try {
        const response = await fetch(
          `/api/public/sign/quotes/${quoteId}?token=${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
          quote?: QuoteViewModel;
        };

        if (!response.ok) {
          throw new Error(body.error || "Lien invalide ou expiré.");
        }

        if (active) {
          setQuote(body.quote ?? null);
          setLoading(false);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "Erreur");
          setLoading(false);
        }
      }
    }

    void loadQuote();

    return () => {
      active = false;
    };
  }, [quoteId, token]);

  function getContext() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";

    return { canvas, context };
  }

  function resizeCanvas(node: HTMLCanvasElement | null) {
    if (!node) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    const rect = node.getBoundingClientRect();
    node.width = Math.floor(rect.width * ratio);
    node.height = Math.floor(rect.height * ratio);

    const context = node.getContext("2d");
    if (!context) {
      return;
    }

    context.scale(ratio, ratio);
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";
  }

  function pointerPosition(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const drawing = getContext();
    const point = pointerPosition(event);

    if (!drawing || !point) {
      return;
    }

    drawingRef.current = true;
    hasSignatureRef.current = true;
    drawing.context.beginPath();
    drawing.context.moveTo(point.x, point.y);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) {
      return;
    }

    const drawing = getContext();
    const point = pointerPosition(event);

    if (!drawing || !point) {
      return;
    }

    drawing.context.lineTo(point.x, point.y);
    drawing.context.stroke();
  }

  function handlePointerUp() {
    drawingRef.current = false;
  }

  function clearSignature() {
    const drawing = getContext();

    if (!drawing) {
      return;
    }

    drawing.context.clearRect(0, 0, drawing.canvas.width, drawing.canvas.height);
    hasSignatureRef.current = false;
  }

  function handleReturn() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!signedName.trim()) {
      setError("Le nom et prénom sont obligatoires.");
      return;
    }

    if (!agreementChecked) {
      setError("La mention Bon pour accord doit être cochée.");
      return;
    }

    if (!hasSignatureRef.current || !canvasRef.current) {
      setError("La signature est obligatoire.");
      return;
    }

    setSubmitting(true);

    try {
      const signatureDataUrl = canvasRef.current.toDataURL("image/png");
      const response = await fetch(`/api/public/sign/quotes/${quoteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          signedName: signedName.trim(),
          agreementChecked: true,
          signatureDataUrl,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Impossible d'enregistrer la signature.");
      }

      setSuccess("Devis signé avec succès.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-neutral-600">Chargement du devis...</p>;
  }

  if (!quote) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || "Lien invalide ou expiré."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-28 md:pb-8">
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 md:hidden">
          <button
            type="button"
            onClick={handleReturn}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-900"
          >
            Retour
          </button>
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900">Signature du devis</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Vérifiez le résumé puis signez pour valider le devis.
        </p>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-neutral-500">Numéro</p>
            <p className="font-medium text-neutral-900">{quote.number}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Client</p>
            <p className="font-medium text-neutral-900">{quote.customer.name}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Date</p>
            <p className="font-medium text-neutral-900">{formatDate(quote.issueDate)}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Validité</p>
            <p className="font-medium text-neutral-900">{formatDate(quote.validUntil)}</p>
          </div>
        </div>

        <div className="mt-5 hidden rounded-lg border border-neutral-200 md:block">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium text-right">Qté</th>
                <th className="px-3 py-2 font-medium text-right">PU</th>
                <th className="px-3 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {quote.items.map((item) => (
                <tr key={`${item.description}-${item.quantity}-${item.lineTotal}`}>
                  <td className="px-3 py-2 text-neutral-700">{item.description}</td>
                  <td className="px-3 py-2 text-right text-neutral-700">{item.quantity}</td>
                  <td className="px-3 py-2 text-right text-neutral-700">
                    {formatEuroFromCents(item.unitPrice)}
                  </td>
                  <td className="px-3 py-2 text-right text-neutral-700">
                    {formatEuroFromCents(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 space-y-3 md:hidden">
          {quote.items.map((item) => (
            <article
              key={`${item.description}-${item.quantity}-${item.lineTotal}`}
              className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
            >
              <h3 className="text-base font-semibold text-neutral-900">{item.description}</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-white px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Qté</p>
                  <p className="mt-1 font-medium text-neutral-900">{item.quantity}</p>
                </div>
                <div className="rounded-lg bg-white px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">PU</p>
                  <p className="mt-1 font-medium text-neutral-900">
                    {formatEuroFromCents(item.unitPrice)}
                  </p>
                </div>
                <div className="col-span-2 rounded-lg bg-white px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Total</p>
                  <p className="mt-1 font-medium text-neutral-900">
                    {formatEuroFromCents(item.lineTotal)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-4 text-right text-lg font-semibold text-neutral-900">
          Total TTC: {formatEuroFromCents(quote.total)}
        </p>
      </section>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-900">
            Nom et prénom
          </label>
          <input
            value={signedName}
            onChange={(event) => setSignedName(event.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-3 text-base"
            placeholder="Votre nom complet"
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={agreementChecked}
            onChange={(event) => setAgreementChecked(event.target.checked)}
            className="mt-1 size-4"
          />
          <span>Bon pour accord</span>
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-neutral-900">Signature</p>
            <button
              type="button"
              onClick={clearSignature}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
            >
              Effacer
            </button>
          </div>
          <canvas
            ref={(node) => {
              canvasRef.current = node;
              if (node) {
                resizeCanvas(node);
              }
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="h-48 w-full touch-none rounded-lg border border-dashed border-neutral-400 bg-white"
          />
        </div>

        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {success ? (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || Boolean(success)}
          className="hidden w-full rounded-md bg-neutral-900 px-4 py-3 text-base font-semibold text-white disabled:opacity-60 md:block"
        >
          {submitting ? "Signature en cours..." : success ? "Devis signé" : "Signer"}
        </button>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 p-4 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => formRef.current?.requestSubmit()}
          disabled={submitting || Boolean(success)}
          className="mx-auto flex h-11 w-full max-w-3xl items-center justify-center rounded-md bg-neutral-900 px-4 text-base font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Signature en cours..." : success ? "Devis signé" : "Signer le devis"}
        </button>
      </div>
    </div>
  );
}
