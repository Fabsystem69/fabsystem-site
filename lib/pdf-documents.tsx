import { promises as fs } from "node:fs";
import path from "node:path";
import React from "react";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { CGV_PARAGRAPHS, sanitize } from "@/lib/cgv";
import { formatCustomerAssetSummary } from "@/lib/customer-asset";
import { formatAddressLines, formatDate, formatEuroFromCents } from "@/lib/format";
import { site } from "@/lib/site";
import type { AssetType, DeliveryMode, ServiceType } from "@/lib/generated/prisma/client";
import { formatDeliveryMode, formatServiceType } from "@/lib/service-meta";

type CustomerInfo = {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  assetType: AssetType;
  assetBrand: string | null;
  assetModel: string | null;
  registration: string | null;
  odometerKm: number | null;
  engineHours: number | null;
};

type DocumentItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  position: number;
};

type DocumentData = {
  kind: "quote" | "invoice";
  number: string;
  status: string;
  issueDate: Date;
  dueDate: Date | null;
  serviceType: ServiceType;
  deliveryMode: DeliveryMode;
  serviceDate: Date | null;
  notes: string | null;
  subtotal: number;
  tax: number;
  total: number;
  customer: CustomerInfo;
  items: DocumentItem[];
  signedAt?: Date | null;
  signedName?: string | null;
  agreementChecked?: boolean;
  signatureDataUrl?: string | null;
};

const styles = StyleSheet.create({
  pageWithFooter: {
    paddingTop: 18,
    paddingLeft: 18,
    paddingRight: 18,
    paddingBottom: 88,
    fontSize: 10,
    color: "#171717",
    fontFamily: "Helvetica",
  },
  page: {},
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e7e5e4",
  },
  companyWrap: {
    flexDirection: "row",
    gap: 14,
    maxWidth: 320,
    alignItems: "center",
  },
  logo: {
    width: 64,
    height: 64,
    objectFit: "contain",
  },
  footerLogo: {
    width: 16,
    height: 16,
    objectFit: "contain",
    marginRight: 8,
  },
  companyText: {
    gap: 3,
  },
  companyEyebrow: {
    fontSize: 8,
    color: "#78716c",
    letterSpacing: 0.6,
  },
  companyName: {
    fontSize: 19,
    fontWeight: 700,
    color: "#111827",
  },
  companyMeta: {
    color: "#525252",
  },
  titleWrap: {
    alignItems: "flex-end",
    gap: 6,
    minWidth: 170,
  },
  titleBadge: {
    fontSize: 8,
    color: "#0f172a",
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
  },
  titleNumber: {
    fontSize: 11,
    color: "#475569",
  },
  columns: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e7e5e4",
    backgroundColor: "#fcfcfb",
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 4,
    color: "#44403c",
  },
  label: {
    color: "#737373",
    fontSize: 9,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e7e5e4",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e7e5e4",
    fontSize: 9,
    fontWeight: 700,
    color: "#374151",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  cellDescription: {
    flex: 1.8,
    padding: 10,
  },
  cellQty: {
    flex: 0.5,
    padding: 10,
    textAlign: "right",
  },
  cellPrice: {
    flex: 0.8,
    padding: 10,
    textAlign: "right",
  },
  cellTotal: {
    flex: 0.8,
    padding: 10,
    textAlign: "right",
  },
  totalsWrap: {
    marginLeft: "auto",
    width: 220,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalStrong: {
    fontWeight: 700,
    fontSize: 11,
    color: "#0f172a",
  },
  notesWrap: {
    marginTop: 20,
    gap: 6,
  },
  signatureContainer: {
    width: 292,
    alignSelf: "center",
    marginTop: 18,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
  },
  signatureTitle: {
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 4,
    color: "#171717",
  },
  signatureIntro: {
    fontSize: 7.5,
    textAlign: "center",
    marginBottom: 8,
    color: "#525252",
    lineHeight: 1.3,
  },
  signatureMetaRow: {
    flexDirection: "row",
    gap: 12,
  },
  signatureMetaBlock: {
    flex: 1,
    marginBottom: 0,
  },
  signatureMetaLabel: {
    fontSize: 6.5,
    color: "#737373",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  signatureMetaValue: {
    fontSize: 8,
    color: "#171717",
    minHeight: 12,
  },
  signatureImageWrap: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
  },
  signatureImage: {
    width: 128,
    height: 42,
    objectFit: "contain",
  },
  signatureLine: {
    marginTop: 12,
    height: 1,
    backgroundColor: "#999999",
    width: "100%",
  },
  vatNotice: {
    marginTop: 10,
    color: "#525252",
    fontSize: 9,
  },
  mention: {
    color: "#525252",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 18,
    right: 18,
    borderTopWidth: 0.5,
    borderTopColor: "#bdbdbd",
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  footerBody: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
    paddingBottom: 4,
  },
  footerTextWrap: {
    flex: 1,
  },
  footerText: {
    fontSize: 7,
    color: "#444444",
    lineHeight: 1.15,
  },
  footerUrl: {
    marginTop: 2,
    fontSize: 7,
    color: "#444444",
  },
  footerQrWrap: {
    width: 78,
    alignItems: "center",
  },
  footerQr: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  footerQrLabel: {
    fontSize: 7,
    color: "#444444",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 1.15,
  },
  footerQrUrl: {
    fontSize: 6.8,
    color: "#444444",
    marginTop: 2,
    textAlign: "center",
    lineHeight: 1.1,
  },
  cgvPage: {
    paddingTop: 16,
  },
  cgvContainer: {
    width: 408,
    alignSelf: "center",
  },
  cgvTitle: {
    fontSize: 11.4,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 3,
  },
  cgvSubtitle: {
    fontSize: 9.4,
    fontWeight: 500,
    textAlign: "center",
    marginBottom: 8,
    color: "#444444",
  },
  cgvBlock: {
    marginBottom: 4,
  },
  cgvHeading: {
    fontSize: 8.5,
    fontWeight: 600,
    marginBottom: 1.5,
  },
  cgvBody: {
    fontSize: 8.1,
    lineHeight: 1.18,
    textAlign: "justify",
  },
  cgvParagraph: {
    whiteSpace: "pre-wrap",
  },
});

async function loadPdfLogo() {
  const filePath = path.join(process.cwd(), "public", "logo.png");

  try {
    const buffer = await fs.readFile(filePath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function buildMentions(data: DocumentData) {
  if (data.kind === "quote") {
    return [
      data.dueDate
        ? `Devis valable jusqu'au ${formatDate(data.dueDate)}.`
        : "Devis valable 30 jours à compter de sa date d'émission.",
    ];
  }

  return [
    data.dueDate
      ? `Facture payable au plus tard le ${formatDate(data.dueDate)}.`
      : "Facture payable à réception.",
  ];
}

function buildFilename(kind: DocumentData["kind"], number: string) {
  const normalizedPrefix =
    kind === "quote" ? number.replace(/^QUO-/, "DEV-") : number.replace(/^INV-/, "FAC-");

  return `${normalizedPrefix}.pdf`;
}

function PdfFooter({
  logoSrc,
  qrDataUrl,
}: {
  logoSrc: string | null;
  qrDataUrl: string;
}) {
  const footerText = sanitize(
    "FabSystem — 48 rue Rey Loras, Bât. E, 69250 Neuville-sur-Saône — SIRET 100 271 980 00011 — TVA non applicable (293 B CGI) — fabien.lages@fabsystem.fr — 06 98 24 77 22"
  );

  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerBody}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        {logoSrc ? <Image src={logoSrc} style={styles.footerLogo} /> : null}
        <View style={styles.footerTextWrap}>
          <Text style={styles.footerText}>{footerText}</Text>
          <Text style={styles.footerUrl}>{sanitize("www.fabsystem.fr")}</Text>
        </View>
      </View>
      <View style={styles.footerQrWrap}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={qrDataUrl} style={styles.footerQr} />
        <Text style={styles.footerQrLabel}>{sanitize("Ajouter au contact")}</Text>
        <Text style={styles.footerQrUrl}>{sanitize("www.fabsystem.fr")}</Text>
      </View>
    </View>
  );
}

function splitCgvParagraph(paragraph: string) {
  const [heading, ...bodyLines] = paragraph.split("\n");

  return {
    heading,
    body: bodyLines.join("\n"),
  };
}

export function getPdfTotals(data: Pick<DocumentData, "subtotal" | "total">) {
  return {
    totalHt: data.subtotal,
    totalTtc: data.total,
  };
}

function PdfDocument({
  data,
  logoSrc,
  qrDataUrl,
}: {
  data: DocumentData;
  logoSrc: string | null;
  qrDataUrl: string;
}) {
  const mentions = buildMentions(data);
  const title = data.kind === "quote" ? "DEVIS" : "FACTURE";
  const { totalHt, totalTtc } = getPdfTotals(data);
  const cgvBlocks = CGV_PARAGRAPHS.map(splitCgvParagraph);
  const customerAssetSummary = formatCustomerAssetSummary(data.customer);

  return (
    <Document title={`${title} ${data.number}`}>
      <Page size="A4" style={[styles.pageWithFooter, styles.page]}>
        <View style={styles.header}>
          <View style={styles.companyWrap}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {logoSrc ? <Image src={logoSrc} style={styles.logo} /> : null}
            <View style={styles.companyText}>
              <Text style={styles.companyEyebrow}>DOCUMENT COMMERCIAL</Text>
              <Text style={styles.companyName}>{sanitize(site.name)}</Text>
              <Text style={styles.companyMeta}>{sanitize(site.tagline)}</Text>
              <Text style={styles.companyMeta}>{sanitize(site.location)}</Text>
              <Text style={styles.companyMeta}>{sanitize(site.email)}</Text>
              <Text style={styles.companyMeta}>{sanitize(site.phone)}</Text>
            </View>
          </View>

          <View style={styles.titleWrap}>
            <Text style={styles.titleBadge}>
              {data.kind === "quote" ? "Édition devis" : "Édition facture"}
            </Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.titleNumber}>{data.number}</Text>
          </View>
        </View>

        <View style={styles.columns}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Client</Text>
            <Text>{data.customer.name}</Text>
            {formatAddressLines(data.customer.address).map((line) => (
              <Text key={line}>{line}</Text>
            ))}
            {data.customer.email ? <Text>{data.customer.email}</Text> : null}
            {data.customer.phone ? <Text>{data.customer.phone}</Text> : null}
            {customerAssetSummary ? <Text>{sanitize(customerAssetSummary)}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Prestation</Text>
            <Text>
              <Text style={styles.label}>Type: </Text>
              {formatServiceType(data.serviceType)}
            </Text>
            <Text>
              <Text style={styles.label}>Mode: </Text>
              {formatDeliveryMode(data.deliveryMode)}
            </Text>
            {data.serviceDate ? (
              <Text>
                <Text style={styles.label}>Date: </Text>
                {formatDate(data.serviceDate)}
              </Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informations</Text>
            <Text>
              <Text style={styles.label}>Date d&apos;émission: </Text>
              {formatDate(data.issueDate)}
            </Text>
            <Text>
              <Text style={styles.label}>
                {data.kind === "quote" ? "Validité: " : "Échéance: "}
              </Text>
              {formatDate(data.dueDate)}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellDescription}>Description</Text>
            <Text style={styles.cellQty}>Qté</Text>
            <Text style={styles.cellPrice}>PU HT</Text>
            <Text style={styles.cellTotal}>Total HT</Text>
          </View>

          {data.items.map((item, index) => (
            <View
              key={`${item.position}-${item.description}`}
              style={[
                styles.row,
                ...(index === data.items.length - 1 ? [styles.lastRow] : []),
              ]}
            >
              <Text style={styles.cellDescription}>{item.description}</Text>
              <Text style={styles.cellQty}>{item.quantity}</Text>
              <Text style={styles.cellPrice}>{formatEuroFromCents(item.unitPrice)}</Text>
              <Text style={styles.cellTotal}>{formatEuroFromCents(item.lineTotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsWrap}>
          <View style={styles.totalRow}>
            <Text>Total HT</Text>
            <Text>{formatEuroFromCents(totalHt)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalStrong}>Total TTC</Text>
            <Text style={styles.totalStrong}>{formatEuroFromCents(totalTtc)}</Text>
          </View>
          <Text style={styles.vatNotice}>TVA non applicable – article 293 B du CGI</Text>
        </View>

        <View style={styles.notesWrap}>
          {data.notes ? (
            <>
              <Text style={styles.cardTitle}>Notes</Text>
              <Text style={styles.mention}>{data.notes}</Text>
            </>
          ) : null}

          <Text style={styles.cardTitle}>Mentions</Text>
          {mentions.map((mention) => (
            <Text key={mention} style={styles.mention}>
              {mention}
            </Text>
          ))}
        </View>

        {data.kind === "quote" ? (
          <View style={styles.signatureContainer}>
            <Text style={styles.signatureTitle}>BON POUR ACCORD</Text>
            <Text style={styles.signatureIntro}>
              Je reconnais avoir pris connaissance du présent devis et des
              conditions générales de vente.
            </Text>

            <View style={styles.signatureMetaRow}>
              <View style={styles.signatureMetaBlock}>
                <Text style={styles.signatureMetaLabel}>Nom</Text>
                <Text style={styles.signatureMetaValue}>
                  {data.signedName || " "}
                </Text>
              </View>

              <View style={styles.signatureMetaBlock}>
                <Text style={styles.signatureMetaLabel}>Date</Text>
                <Text style={styles.signatureMetaValue}>
                  {data.signedAt ? formatDate(data.signedAt) : " "}
                </Text>
              </View>
            </View>

            <View style={styles.signatureImageWrap}>
              {data.signatureDataUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={data.signatureDataUrl} style={styles.signatureImage} />
              ) : (
                <View style={styles.signatureLine} />
              )}
            </View>
          </View>
        ) : null}

        <PdfFooter logoSrc={logoSrc} qrDataUrl={qrDataUrl} />
      </Page>

      <Page size="A4" style={[styles.pageWithFooter, styles.cgvPage]}>
        <View style={styles.cgvContainer}>
          <Text style={styles.cgvTitle}>CONDITIONS GÉNÉRALES DE VENTE</Text>
          <Text style={styles.cgvSubtitle}>FabSystem</Text>
          {cgvBlocks.map((paragraph) => (
            <View key={paragraph.heading} style={styles.cgvBlock}>
              <Text style={styles.cgvHeading}>{paragraph.heading}</Text>
              <Text style={[styles.cgvBody, styles.cgvParagraph]}>{paragraph.body}</Text>
            </View>
          ))}
        </View>
        <PdfFooter logoSrc={logoSrc} qrDataUrl={qrDataUrl} />
      </Page>
    </Document>
  );
}

export async function renderDocumentPdf(data: DocumentData, qrDataUrl: string) {
  const logoSrc = await loadPdfLogo();
  const buffer = await renderToBuffer(
    <PdfDocument data={data} logoSrc={logoSrc} qrDataUrl={qrDataUrl} />
  );

  return {
    buffer,
    filename: buildFilename(data.kind, data.number),
  };
}
