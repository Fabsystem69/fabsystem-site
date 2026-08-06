"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type RequestLinkResponse = {
  ok?: boolean;
  message?: string;
  magicLink?: string;
  error?: string;
};

export function LoginRequestForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    setMagicLink(null);

    try {
      const response = await fetch("/api/client-auth/request-link", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          name: name.trim() || undefined,
        }),
      });

      const body = (await response.json().catch(() => null)) as RequestLinkResponse | null;

      if (!response.ok) {
        throw new Error(body?.error || "Impossible de demander un lien de connexion.");
      }

      setMessage(
        body?.message ||
          "Si cette adresse peut accéder à un espace client, un lien de connexion sera envoyé."
      );
      setMagicLink(body?.magicLink ?? null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de demander un lien de connexion."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold text-neutral-950">Recevoir un lien de connexion</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-700">
        Saisissez votre email pour recevoir un lien magique de connexion. Aucun mot de passe n’est
        demandé.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="customer-email" className="block text-sm font-medium text-neutral-900">
            Email
          </label>
          <input
            id="customer-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-900"
            placeholder="client@example.com"
          />
        </div>

        <div>
          <label htmlFor="customer-name" className="block text-sm font-medium text-neutral-900">
            Nom
            <span className="ml-2 text-neutral-500">(optionnel)</span>
          </label>
          <input
            id="customer-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-900"
            placeholder="Votre nom"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Envoi..." : "Recevoir mon lien"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {message ? (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <p className="font-medium">{message}</p>
          {magicLink ? (
            <p className="mt-3">
              <Link href={magicLink} className="font-medium underline underline-offset-4">
                Connexion dev
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
