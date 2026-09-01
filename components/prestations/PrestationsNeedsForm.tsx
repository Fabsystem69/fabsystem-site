"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCheckoutFromCart } from "@/lib/checkout-flow";
import {
  readPendingCheckoutInputs,
  storeNeedsAnswers,
} from "@/lib/client/prestations-needs-storage";
import { isPrestationsPackSlug } from "@/lib/prestations-packs";
import {
  PRESTATIONS_NEEDS_PROGRESS_LABELS,
  PRESTATIONS_NEEDS_PROGRESS_VALUES,
  type PrestationsNeedsProgress,
} from "@/lib/prestations-needs";

type CartApiResponse = {
  cart?: {
    cartId?: string | null;
    lines?: { slug?: string }[];
  };
};

type LoadState = "loading" | "ready" | "no-pack" | "no-pending-inputs";

export function PrestationsNeedsForm() {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [cartId, setCartId] = useState<string | null>(null);

  const [vehicle, setVehicle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState<PrestationsNeedsProgress>("not_started");
  const [deadline, setDeadline] = useState("");
  const [other, setOther] = useState("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      try {
        const response = await fetch("/api/cart", { cache: "no-store" });
        const body = (await response.json().catch(() => null)) as CartApiResponse | null;
        const cart = body?.cart;

        if (cancelled) return;

        if (!cart?.cartId || !cart.lines?.some((line) => isPrestationsPackSlug(line.slug ?? ""))) {
          setLoadState("no-pack");
          return;
        }

        if (!readPendingCheckoutInputs(cart.cartId)) {
          setLoadState("no-pending-inputs");
          return;
        }

        setCartId(cart.cartId);
        setLoadState("ready");
      } catch {
        if (!cancelled) {
          setLoadState("no-pack");
        }
      }
    }

    loadCart();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loadState === "no-pack" || loadState === "no-pending-inputs") {
      router.replace("/panier");
    }
  }, [loadState, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!cartId) return;

    const pendingInputs = readPendingCheckoutInputs(cartId);

    if (!pendingInputs) {
      router.replace("/panier");
      return;
    }

    if (!pendingInputs.acceptsCgv || !pendingInputs.acknowledgesImmediateDigitalDelivery) {
      router.replace("/panier");
      return;
    }

    if (!vehicle.trim() || !description.trim()) {
      setError("Merci de compléter au minimum le véhicule et la description du projet.");
      return;
    }

    const answers = {
      vehicle: vehicle.trim(),
      description: description.trim(),
      progress,
      deadline: deadline.trim() || undefined,
      other: other.trim() || undefined,
    };

    storeNeedsAnswers(cartId, answers);
    setPending(true);

    try {
      const result = await createCheckoutFromCart(fetch, {
        customerEmail: pendingInputs.customerEmail,
        customerName: pendingInputs.customerName,
        discountCode: pendingInputs.discountCode,
        needsAnswers: answers,
        acceptsCgv: true,
        acknowledgesImmediateDigitalDelivery: true,
      });

      if (result.requiresPayment && result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }

      window.location.assign(result.redirectUrl);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de continuer vers le paiement."
      );
      setPending(false);
    }
  }

  if (loadState === "loading") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
        Chargement de votre panier...
      </div>
    );
  }

  if (loadState !== "ready") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
        Redirection vers le panier...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <label className="block space-y-2">
        <span className="text-sm font-medium text-neutral-900">
          Type de véhicule / bateau (marque, modèle si connu)
        </span>
        <input
          type="text"
          required
          value={vehicle}
          onChange={(event) => setVehicle(event.target.value)}
          disabled={pending}
          className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-100"
          placeholder="Ex. Van Fiat Ducato 2019, aménagement en cours"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-neutral-900">
          Description du projet en quelques lignes
        </span>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={pending}
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-100"
          placeholder="Ce que vous voulez faire, où vous en êtes aujourd'hui..."
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-neutral-900">Niveau d&apos;avancement</legend>
        <div className="flex flex-col gap-2 sm:flex-row">
          {PRESTATIONS_NEEDS_PROGRESS_VALUES.map((value) => (
            <label
              key={value}
              className={`flex-1 cursor-pointer rounded-md border px-3 py-2 text-center text-sm font-medium transition ${
                progress === value
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              <input
                type="radio"
                name="progress"
                value={value}
                checked={progress === value}
                onChange={() => setProgress(value)}
                disabled={pending}
                className="sr-only"
              />
              {PRESTATIONS_NEEDS_PROGRESS_LABELS[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-neutral-900">
          Contrainte de délai <span className="text-neutral-500">(optionnel)</span>
        </span>
        <input
          type="text"
          value={deadline}
          onChange={(event) => setDeadline(event.target.value)}
          disabled={pending}
          className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-100"
          placeholder="Ex. départ prévu fin du mois"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-neutral-900">
          Autre chose à préciser <span className="text-neutral-500">(optionnel)</span>
        </span>
        <textarea
          rows={2}
          value={other}
          onChange={(event) => setOther(event.target.value)}
          disabled={pending}
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-100"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-400 px-4 py-2.5 text-sm font-bold text-neutral-900 hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Redirection vers le paiement..." : "Continuer vers le paiement"}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
