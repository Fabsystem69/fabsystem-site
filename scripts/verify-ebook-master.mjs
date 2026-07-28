// Vérifie que les fichiers HTML maîtres de l'ebook sont au bon endroit dans
// Vercel Blob et contiennent bien les marqueurs de filigrane attendus.
//
// Usage :
//   node --env-file=.env scripts/verify-ebook-master.mjs

import { get, list } from "@vercel/blob";

const EXPECTED_PATHNAMES = ["ebooks/_master/bureau.html", "ebooks/_master/poche.html"];
const PLACEHOLDERS = ["{{EBOOK_BUYER_NAME}}", "{{EBOOK_BUYER_EMAIL}}"];

function countOccurrences(text, needle) {
  return text.split(needle).length - 1;
}

console.log("Recherche des blobs sous le préfixe ebooks/_master/ ...\n");

const { blobs } = await list({ prefix: "ebooks/_master/" });

if (blobs.length === 0) {
  console.log("Aucun blob trouvé sous ce préfixe.");
  console.log(
    "Si tu as uploadé depuis le dashboard Vercel, vérifie que le store connecté à ce token est bien le bon (BLOB_READ_WRITE_TOKEN)."
  );
  process.exit(1);
}

console.log("Blobs trouvés sous ebooks/_master/ :");
for (const blob of blobs) {
  console.log(`  - ${blob.pathname}  (${(blob.size / 1024 / 1024).toFixed(2)} Mo)`);
}
console.log("");

let allGood = true;

for (const pathname of EXPECTED_PATHNAMES) {
  const match = blobs.find((b) => b.pathname === pathname);

  if (!match) {
    allGood = false;
    console.log(`❌ Chemin attendu absent : ${pathname}`);
    console.log(
      "   → Le code (lib/ebook-html.ts) lit ce chemin EXACT. Si le dashboard a ajouté un suffixe aléatoire au nom, il faut soit renommer le blob, soit re-uploader avec ce nom précis."
    );
    continue;
  }

  console.log(`✔ Trouvé : ${pathname}`);

  const result = await get(pathname, { access: "private" });
  const content = await new Response(result.stream).text();

  for (const placeholder of PLACEHOLDERS) {
    const count = countOccurrences(content, placeholder);
    if (count === 2) {
      console.log(`   ✔ ${placeholder} présent (${count} occurrences)`);
    } else {
      allGood = false;
      console.log(`   ❌ ${placeholder} : ${count} occurrence(s) trouvée(s), 2 attendues`);
    }
  }
}

console.log("");
console.log(allGood ? "Tout est en ordre." : "Des corrections sont nécessaires (voir ci-dessus).");
process.exit(allGood ? 0 : 1);
