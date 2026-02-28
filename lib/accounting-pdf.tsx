import React from "react";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { UrssafSummary } from "@/lib/accounting";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { site } from "@/lib/site";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    color: "#171717",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10,
    color: "#525252",
    marginBottom: 18,
  },
  kpiWrap: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  kpi: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 12,
  },
  kpiLabel: {
    fontSize: 8,
    color: "#737373",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 13,
    fontWeight: 700,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  head: {
    backgroundColor: "#f5f5f5",
    fontWeight: 700,
  },
  cellMonth: {
    flex: 1,
    padding: 8,
  },
  cellValue: {
    flex: 1,
    padding: 8,
    textAlign: "right",
  },
  note: {
    fontSize: 9,
    color: "#525252",
    marginTop: 4,
  },
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 10,
    fontSize: 8,
    color: "#525252",
  },
});

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export async function renderUrssafPdf(summary: UrssafSummary) {
  const buffer = await renderToBuffer(
    <Document title={`Récapitulatif URSSAF ${summary.year}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Récapitulatif URSSAF – Année {summary.year}</Text>
        <Text style={styles.subtitle}>FabSystem • Chiffre d&apos;affaires encaissé micro-entreprise</Text>

        <View style={styles.kpiWrap}>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>CA encaissé</Text>
            <Text style={styles.kpiValue}>{formatEuroFromCents(summary.totals.paidCents)}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Nb encaissements</Text>
            <Text style={styles.kpiValue}>{summary.totals.paidCount}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>CA facturé</Text>
            <Text style={styles.kpiValue}>{formatEuroFromCents(summary.totals.billedCents)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>CA encaissé par mois</Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.head]}>
            <Text style={styles.cellMonth}>Mois</Text>
            <Text style={styles.cellValue}>CA encaissé</Text>
            <Text style={styles.cellValue}>Nb encaissements</Text>
          </View>
          {summary.months.map((month, index) => (
            <View key={month.month} style={styles.row}>
              <Text style={styles.cellMonth}>{MONTH_LABELS[index]}</Text>
              <Text style={styles.cellValue}>{formatEuroFromCents(month.paidCents)}</Text>
              <Text style={styles.cellValue}>{month.paidCount}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>CA encaissé (URSSAF) par trimestre</Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.head]}>
            <Text style={styles.cellMonth}>Trimestre</Text>
            <Text style={styles.cellValue}>CA encaissé</Text>
            <Text style={styles.cellValue}>Nb encaissements</Text>
          </View>
          {summary.quarters.map((quarter) => (
            <View key={quarter.quarter} style={styles.row}>
              <Text style={styles.cellMonth}>T{quarter.quarter}</Text>
              <Text style={styles.cellValue}>{formatEuroFromCents(quarter.paidCents)}</Text>
              <Text style={styles.cellValue}>{quarter.paidCount}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Extrait du livre des recettes</Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.head]}>
            <Text style={styles.cellMonth}>Date</Text>
            <Text style={styles.cellMonth}>Client</Text>
            <Text style={styles.cellValue}>Montant</Text>
          </View>
          {summary.receipts.slice(0, 20).map((receipt) => (
            <View key={`${receipt.invoiceNumber}-${receipt.paidAt.toISOString()}`} style={styles.row}>
              <Text style={styles.cellMonth}>{formatDate(receipt.paidAt)}</Text>
              <Text style={styles.cellMonth}>{receipt.customerName}</Text>
              <Text style={styles.cellValue}>{formatEuroFromCents(receipt.totalCents)}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.note}>Voir CSV complet pour le livre des recettes intégral.</Text>

        <Text style={styles.footer}>
          {site.name} • {site.location} • {site.email} • {site.phone}
        </Text>
      </Page>
    </Document>
  );

  return buffer;
}
