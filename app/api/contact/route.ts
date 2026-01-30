import nodemailer from "nodemailer";

export const runtime = "nodejs"; // important pour nodemailer sur Vercel

function pick(obj: Record<string, any>, keys: string[]) {
  const out: Record<string, any> = {};
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") {
      out[k] = obj[k];
    }
  }
  return out;
}

function safeText(v: any) {
  return typeof v === "string" ? v : v === undefined || v === null ? "" : String(v);
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // ✅ Anti-spam honeypot
    // (on checkera "company" quelle que soit la forme)
    let payload: Record<string, any> = {};
    let attachments: { filename: string; content: Buffer; contentType?: string }[] = [];

    // 1) JSON (ancien comportement : ContactForm)
    if (contentType.includes("application/json")) {
      payload = await req.json().catch(() => ({}));
      if (payload.company) {
        return Response.json({ ok: true }, { status: 200 }); // spam silencieux
      }
    } else {
      // 2) multipart/form-data (nouveau : VisioForm + fichiers)
      const fd = await req.formData();

      // honeypot
      const company = safeText(fd.get("company"));
      if (company) {
        return Response.json({ ok: true }, { status: 200 }); // spam silencieux
      }

      // champs texte
      for (const [k, v] of fd.entries()) {
        if (v instanceof File) continue;
        payload[k] = safeText(v);
      }

      // fichiers: input name="photos" multiple
      const files = fd.getAll("photos").filter((x) => x instanceof File) as File[];

      // limites simples (évite les gros envois)
      const MAX_FILES = 3;
      const MAX_TOTAL_BYTES = 7 * 1024 * 1024; // 7 MB total (safe)

      const sliced = files.slice(0, MAX_FILES);
      let total = 0;

      for (const f of sliced) {
        total += f.size;
      }
      if (total > MAX_TOTAL_BYTES) {
        return Response.json(
          { ok: false, error: "Fichiers trop lourds. Réduis la taille ou envoie un lien (Drive/iCloud)." },
          { status: 413 }
        );
      }

      for (const f of sliced) {
        const ab = await f.arrayBuffer();
        attachments.push({
          filename: f.name || "photo.jpg",
          content: Buffer.from(ab),
          contentType: f.type || undefined,
        });
      }
    }

    // champs minimaux
    const name = safeText(payload.name);
    const email = safeText(payload.email);
    const message = safeText(payload.message);
    const source = safeText(payload.source || "contact");

    if (!name || !email || !message) {
      return Response.json(
        { ok: false, error: "Champs obligatoires manquants." },
        { status: 400 }
      );
    }

    // ✅ Config SMTP via variables d’environnement (déjà en place chez toi normalement)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true si 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const to = process.env.CONTACT_TO || "fabien.lages@fabsystem.fr";
    const from = process.env.CONTACT_FROM || process.env.SMTP_USER || to;

    const common = pick(payload, [
      "name",
      "email",
      "phone",
      "bookingDate",
      "supportType",
      "supportModel",
      "goal",
      "currentProblems",
      "batteryCount",
      "batteryType",
      "batteryCapacity",
      "chargingSources",
      "shorePower",
      "inverterPresent",
      "solarPresent",
      "equipmentList",
      "deadline",
      "budgetRange",
      "priorityQ1",
      "priorityQ2",
      "priorityQ3",
      "photosLink",
      "source",
    ]);

    const lines: string[] = [];
    lines.push(`Source: ${source}`);
    lines.push("");
    for (const [k, v] of Object.entries(common)) {
      lines.push(`${k}: ${safeText(v)}`);
    }
    lines.push("");
    lines.push("Message:");
    lines.push(message);

    const subject =
      source === "visio"
        ? `FabSystem — Demande VISIO (${name})`
        : `FabSystem — Contact (${name})`;

    await transporter.sendMail({
      to,
      from,
      replyTo: email,
      subject,
      text: lines.join("\n"),
      attachments: attachments.length ? attachments : undefined,
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("API CONTACT ERROR:", err);
    return Response.json(
      { ok: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}