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

const MIN_EMPTY_DESIGNATION_ROWS = 0;
const TABLE_QTY_WIDTH = 44;
const TABLE_AMOUNT_WIDTH = 82;
const TABLE_CELL_VERTICAL_PADDING = 6;
const TABLE_CELL_HORIZONTAL_PADDING = 8;

const styles = StyleSheet.create({
  pageWithFooter: {
    paddingTop: 18,
    paddingLeft: 18,
    paddingRight: 18,
    paddingBottom: 88,
    fontSize: 9,
    color: "#171717",
    fontFamily: "Helvetica",
  },
  page: {
    fontSize: 9,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e7e5e4",
  },
  companyWrap: {
    flexDirection: "row",
    gap: 12,
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
    fontSize: 7,
    color: "#78716c",
    letterSpacing: 0.6,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
  },
  companyMeta: {
    color: "#525252",
    fontSize: 7.5,
  },
  titleWrap: {
    alignItems: "flex-end",
    gap: 6,
    minWidth: 170,
  },
  titleBadge: {
    fontSize: 6.8,
    color: "#0f172a",
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 8,
    paddingRight: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: 700,
    color: "#0f172a",
  },
  titleNumber: {
    fontSize: 9,
    color: "#475569",
  },
  continuationHeader: {
    position: "absolute",
    top: 8,
    left: 18,
    right: 18,
    alignItems: "center",
  },
  continuationTitle: {
    fontSize: 7.2,
    fontWeight: 700,
    color: "#374151",
  },
  continuationMeta: {
    marginTop: 1,
    fontSize: 6.6,
    color: "#6b7280",
  },
  columns: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e7e5e4",
    backgroundColor: "#fcfcfb",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  cardTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    marginBottom: 4,
    color: "#44403c",
  },
  label: {
    color: "#737373",
    fontSize: 7.2,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e7e5e4",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e7e5e4",
    fontSize: 7.6,
    fontWeight: 700,
    color: "#374151",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    alignItems: "stretch",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  cellDescription: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    paddingTop: TABLE_CELL_VERTICAL_PADDING,
    paddingBottom: TABLE_CELL_VERTICAL_PADDING,
    paddingLeft: TABLE_CELL_HORIZONTAL_PADDING,
    paddingRight: TABLE_CELL_HORIZONTAL_PADDING,
    lineHeight: 1.18,
  },
  cellQty: {
    width: TABLE_QTY_WIDTH,
    flexShrink: 0,
    paddingTop: TABLE_CELL_VERTICAL_PADDING,
    paddingBottom: TABLE_CELL_VERTICAL_PADDING,
    paddingLeft: 6,
    paddingRight: TABLE_CELL_HORIZONTAL_PADDING,
    textAlign: "right",
  },
  cellPrice: {
    width: TABLE_AMOUNT_WIDTH,
    flexShrink: 0,
    paddingTop: TABLE_CELL_VERTICAL_PADDING,
    paddingBottom: TABLE_CELL_VERTICAL_PADDING,
    paddingLeft: 6,
    paddingRight: TABLE_CELL_HORIZONTAL_PADDING,
    textAlign: "right",
  },
  cellTotal: {
    width: TABLE_AMOUNT_WIDTH,
    flexShrink: 0,
    paddingTop: TABLE_CELL_VERTICAL_PADDING,
    paddingBottom: TABLE_CELL_VERTICAL_PADDING,
    paddingLeft: 6,
    paddingRight: TABLE_CELL_HORIZONTAL_PADDING,
    textAlign: "right",
  },
  totalsWrap: {
    width: 220,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 12,
  },
  mentionsBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafaf9",
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalStrong: {
    fontWeight: 700,
    fontSize: 10,
    color: "#0f172a",
  },
  notesWrap: {
    marginTop: 12,
    gap: 4,
  },
  signatureContainer: {
    width: 292,
    alignSelf: "flex-end",
    marginTop: 14,
    marginBottom: 12,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
  },
  signatureTitle: {
    fontSize: 9,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 3,
    color: "#171717",
  },
  signatureIntro: {
    fontSize: 7,
    textAlign: "center",
    marginBottom: 6,
    color: "#525252",
    lineHeight: 1.25,
  },
  signatureMetaRow: {
    flexDirection: "row",
    gap: 8,
  },
  signatureMetaBlock: {
    flex: 1,
    marginBottom: 0,
  },
  signatureMetaLabel: {
    fontSize: 6,
    color: "#737373",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  signatureMetaValue: {
    fontSize: 7.5,
    color: "#171717",
    minHeight: 10,
  },
  signatureImageWrap: {
    marginTop: 6,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  signatureImage: {
    width: 128,
    height: 42,
    objectFit: "contain",
  },
  signatureLine: {
    marginTop: 8,
    height: 1,
    backgroundColor: "#999999",
    width: "100%",
  },
  vatNotice: {
    marginTop: 6,
    color: "#525252",
    fontSize: 7.5,
  },
  mention: {
    color: "#525252",
    fontSize: 7.8,
    lineHeight: 1.35,
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 18,
    right: 18,
    borderTopWidth: 0.5,
    borderTopColor: "#bdbdbd",
    paddingTop: 6,
    paddingBottom: 8,
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
    width: 70,
    alignItems: "center",
  },
  footerQr: {
    width: 48,
    height: 48,
    objectFit: "contain",
  },
  footerPageNumber: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    fontSize: 6.6,
    color: "#444444",
    textAlign: "center",
  },
  cgvPage: {
    paddingTop: 12,
  },
  cgvContainer: {
    width: 442,
    alignSelf: "center",
  },
  cgvTitle: {
    fontSize: 10.6,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 3,
  },
  cgvSubtitle: {
    fontSize: 8.6,
    fontWeight: 500,
    textAlign: "center",
    marginBottom: 6,
    color: "#444444",
  },
  cgvBlock: {
    marginBottom: 4,
  },
  cgvHeading: {
    fontSize: 7.8,
    fontWeight: 600,
    marginBottom: 1,
  },
  cgvBody: {
    fontSize: 7.7,
    lineHeight: 1.13,
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
    return ["Devis valable 30 jours à compter de sa date d'émission."];
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
      </View>
      <Text
        style={styles.footerPageNumber}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
        fixed
      />
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
  const fillerRowCount = data.items.length <= 2 ? MIN_EMPTY_DESIGNATION_ROWS : 0;
  const fillerRows = Array.from({ length: fillerRowCount }, (_, index) => index);
  const continuationTitle = sanitize(`${title} ${data.number}`);
  const continuationMeta = sanitize(data.customer.name);

  return (
    <Document title={`${title} ${data.number}`}>
      <Page size="A4" style={[styles.pageWithFooter, styles.page]}>
        <View style={styles.continuationHeader} fixed>
          <Text
            style={styles.continuationTitle}
            render={({ pageNumber }) =>
              pageNumber && pageNumber > 1 ? continuationTitle : ""
            }
          />
          <Text
            style={styles.continuationMeta}
            render={({ pageNumber }) =>
              pageNumber && pageNumber > 1 ? continuationMeta : ""
            }
          />
        </View>

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
              {data.kind === "quote"
                ? "30 jours à compter de la date d'émission"
                : data.dueDate
                  ? formatDate(data.dueDate)
                  : "À réception"}
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
                ...(index === data.items.length - 1 && fillerRows.length === 0
                  ? [styles.lastRow]
                  : []),
              ]}
            >
              <Text style={styles.cellDescription}>{item.description}</Text>
              <Text style={styles.cellQty}>{item.quantity}</Text>
              <Text style={styles.cellPrice}>{formatEuroFromCents(item.unitPrice)}</Text>
              <Text style={styles.cellTotal}>{formatEuroFromCents(item.lineTotal)}</Text>
            </View>
          ))}

          {fillerRows.map((rowIndex) => (
            <View
              key={`empty-row-${rowIndex}`}
              style={[
                styles.row,
                ...(rowIndex === fillerRows.length - 1 ? [styles.lastRow] : []),
              ]}
            >
              <Text style={styles.cellDescription}> </Text>
              <Text style={styles.cellQty}> </Text>
              <Text style={styles.cellPrice}> </Text>
              <Text style={styles.cellTotal}> </Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.mentionsBox}>
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
        </View>

        {data.kind === "quote" ? (
          <View style={{ flexGrow: 1 }} />
        ) : null}

        {data.kind === "quote" ? (
          <View wrap={false}>
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
