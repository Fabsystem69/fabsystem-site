export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-neutral-900">Dashboard</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Étape 1 OK : page protégée + session active.
      </p>

      <form action="/api/auth/logout" method="post" className="mt-8">
        <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800">
          Se déconnecter
        </button>
      </form>
    </main>
  );
}
