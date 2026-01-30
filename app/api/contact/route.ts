import nodemailer from "nodemailer";

function pick(obj: Record<string, any>, keys: string[]) {
  const out: Record<string, any> = {};
  for (const k of keys) out[k] = obj?.[k] ?? "";
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Champs communs
    const {
      name,
      email,
      phone,
      message,
      source,
      company, // honeypot
    } = body ?? {};

    // ✅ Honeypot anti-spam : si rempli => bot (on répond ok pour éviter l’acharnement)
    if (company && String(company).trim().length > 0) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ ok: false, error: "Champs manquants." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    const to = process.env.MAIL_TO || process.env.SMTP_USER;

    const isVisio = source === "visio";
    const subject = isVisio
      ? "FabSystem — Demande VISIO (site)"
      : "FabSystem — Nouveau message (Contact)";

    // ✅ Si Visio : on extrait les champs de préparation (même si certains sont vides)
    const visioFields = pick(body, [
      "supportType",
      "supportModel",
      "homePortOrCity",
      "currentProblems",
      "batteryCount",
      "batteryType",
      "batteryCapacity",
      "chargingSources",
      "inverterPresent",
      "solarPresent",
      "shorePower",
      "equipmentList",
      "goal",
      "deadline",
      "budgetRange",
      "priorityQ1",
      "priorityQ2",
      "priorityQ3",
      "photosLink",
      "bookingDate",
    ]);

    const lines: string[] = [];
    lines.push(`Source: ${source || "contact"}`);
    lines.push("");
    lines.push(`Nom: ${name}`);
    lines.push(`Email: ${email}`);
    if (phone) lines.push(`Téléphone: ${phone}`);

    if (isVisio) {
      lines.push("");
      lines.push("=== PRÉPARATION VISIO ===");
      const labelMap: Record<string, string> = {
        supportType: "Support",
        supportModel: "Modèle / Référence",
        homePortOrCity: "Port / Ville",
        bookingDate: "Date / heure réservation (si connue)",
        currentProblems: "Problème / contexte actuel",
        batteryCount: "Nombre de batteries",
        batteryType: "Type de batteries",
        batteryCapacity: "Capacité (Ah / Wh) si connue",
        chargingSources: "Sources de charge",
        inverterPresent: "Convertisseur 230V (oui/non)",
        solarPresent: "Solaire (oui/non)",
        shorePower: "Branchement quai/secteur (oui/non)",
        equipmentList: "Équipements à alimenter",
        goal: "Objectif principal",
        deadline: "Échéance",
        budgetRange: "Budget (optionnel)",
        priorityQ1: "Question prioritaire 1",
        priorityQ2: "Question prioritaire 2",
        priorityQ3: "Question prioritaire 3",
        photosLink: "Lien photos / schéma",
      };

      for (const [k, v] of Object.entries(visioFields)) {
        if (String(v).trim().length > 0) {
          lines.push(`${labelMap[k] || k}: ${v}`);
        }
      }
    }

    lines.push("");
    lines.push("=== MESSAGE ===");
    lines.push(message);

    const text = lines.join("\n");

    await transporter.sendMail({
      from: `FabSystem <${process.env.SMTP_USER}>`,
      to,
      replyTo: email,
      subject,
      text,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("CONTACT API ERROR:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Erreur d’envoi." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}