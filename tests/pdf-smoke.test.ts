import assert from "node:assert/strict";
import test from "node:test";
import { renderDocumentPdf, toCustomerInfo } from "@/lib/pdf-documents";

const QR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0WQAAAAASUVORK5CYII=";

test("document PDF renderer returns a non-empty buffer and filename", async () => {
  const result = await renderDocumentPdf(
    {
      kind: "quote",
      number: "QUO-2026-0001",
      status: "DRAFT",
      issueDate: new Date("2026-02-28T10:00:00.000Z"),
      dueDate: new Date("2026-03-15T10:00:00.000Z"),
      serviceType: "AUDIT",
      deliveryMode: "ONSITE",
      serviceDate: new Date("2026-03-05T09:00:00.000Z"),
      notes: "Diagnostic électrique complet.",
      subtotal: 120_000,
      tax: 0,
      total: 120_000,
      customer: {
        name: "Client Test",
        email: "client@example.com",
        phone: "0600000000",
        address: "1 rue du Test\n69000 Lyon",
        assetType: "VEHICLE",
        assetBrand: "Mercedes",
        assetModel: "Sprinter",
        registration: "AB-123-CD",
        odometerKm: 120000,
        engineHours: null,
      },
      items: [
        {
          description: "Audit complet",
          quantity: 1,
          unitPrice: 120_000,
          lineTotal: 120_000,
          position: 0,
        },
      ],
      signedAt: null,
      signedName: null,
      agreementChecked: false,
      signatureDataUrl: null,
    },
    QR_DATA_URL
  );

  assert.ok(result.buffer.length > 0);
  assert.equal(result.filename, "DEV-2026-0001.pdf");
});

test("document PDF renderer handles wrapped description rows", async () => {
  const result = await renderDocumentPdf(
    {
      kind: "quote",
      number: "QUO-2026-0002",
      status: "DRAFT",
      issueDate: new Date("2026-02-28T10:00:00.000Z"),
      dueDate: new Date("2026-03-15T10:00:00.000Z"),
      serviceType: "AUDIT",
      deliveryMode: "ONSITE",
      serviceDate: new Date("2026-03-05T09:00:00.000Z"),
      notes: "Controle detaille du circuit de charge et des equipements auxiliaires.",
      subtotal: 240_000,
      tax: 0,
      total: 240_000,
      customer: {
        name: "Client Test",
        email: "client@example.com",
        phone: "0600000000",
        address: "1 rue du Test\n69000 Lyon",
        assetType: "VEHICLE",
        assetBrand: "Mercedes",
        assetModel: "Sprinter",
        registration: "AB-123-CD",
        odometerKm: 120000,
        engineHours: null,
      },
      items: [
        {
          description:
            "Diagnostic complet du faisceau principal, verification des masses, controle du convertisseur, de la batterie auxiliaire et des protections avec compte rendu detaille.",
          quantity: 1,
          unitPrice: 120_000,
          lineTotal: 120_000,
          position: 0,
        },
        {
          description: "Essais fonctionnels et recommandations de remise en etat.",
          quantity: 1,
          unitPrice: 120_000,
          lineTotal: 120_000,
          position: 1,
        },
      ],
      signedAt: null,
      signedName: null,
      agreementChecked: false,
      signatureDataUrl: null,
    },
    QR_DATA_URL
  );

  assert.ok(result.buffer.length > 0);
  assert.equal(result.filename, "DEV-2026-0002.pdf");
});

test("toCustomerInfo keeps the customer name when present", () => {
  const info = toCustomerInfo({
    name: "Client Test",
    email: "client@example.com",
    phone: null,
    address: null,
    assetType: "VEHICLE",
    assetBrand: null,
    assetModel: null,
    registration: null,
    odometerKm: null,
    engineHours: null,
  });

  assert.equal(info.name, "Client Test");
});

test("toCustomerInfo falls back to the email when the customer name is null", () => {
  const info = toCustomerInfo({
    name: null,
    email: "client@example.com",
    phone: null,
    address: null,
    assetType: "VEHICLE",
    assetBrand: null,
    assetModel: null,
    registration: null,
    odometerKm: null,
    engineHours: null,
  });

  assert.equal(info.name, "client@example.com");
});
