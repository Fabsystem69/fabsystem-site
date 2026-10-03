// Verrou advisory transactionnel (libere au commit/rollback) : serialise les
// requetes portant sur la meme cle (double clic, nouvelle tentative).
//
// $executeRaw et non $queryRaw : pg_advisory_xact_lock renvoie une colonne de
// type `void` que $queryRaw ne sait pas decoder sur un vrai Postgres
// (« Failed to deserialize column of type 'void' ») — constate en test
// navigateur, invisible avec une fausse base.
type RawExecutor = {
  $executeRaw: (query: TemplateStringsArray, ...values: unknown[]) => PromiseLike<unknown>;
};

export async function advisoryXactLock(tx: RawExecutor, key: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}
