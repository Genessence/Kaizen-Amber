/**
 * PDF Template Component for Best Practice Form
 * Matches the format shown in the reference image
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts if needed (optional - can use default fonts)
// Font.register({ family: 'Roboto', src: '/fonts/Roboto-Regular.ttf' });

// Define styles matching the reference image
const styles = StyleSheet.create({
  page: {
    padding: 15,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    backgroundColor: "#1e40af", // Blue header
    padding: 15,
    paddingRight: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  logo: {
    width: 100,
    height: 35,
    backgroundColor: "#ffffff",
    padding: 2,
    borderRadius: 4,
  },
  section: {
    margin: 0,
    padding: 10,
  },
  gridRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  gridCell: {
    flex: 1,
    padding: 5,
    paddingRight: 10,
  },
  label: {
    fontSize: 9,
    color: "#666",
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    color: "#000",
    fontWeight: "normal",
  },
  beforeAfterContainer: {
    flexDirection: "row",
    marginTop: 10,
    marginHorizontal: 10,
  },
  beforeAfterBox: {
    flex: 1,
    border: "1px solid #ddd",
    padding: 10,
    minHeight: 150,
    marginRight: 6,
  },
  beforeAfterBoxLast: {
    flex: 1,
    border: "1px solid #ddd",
    padding: 10,
    minHeight: 150,
    marginLeft: 6,
  },
  beforeAfterTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  imagePlaceholder: {
    border: "1px dashed #999",
    padding: 20,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
    minHeight: 100,
  },
  issuesImprovementsContainer: {
    flexDirection: "row",
    marginTop: 10,
    marginHorizontal: 10,
  },
  issuesImprovementsBox: {
    flex: 1,
    border: "1px solid #ddd",
    padding: 10,
    minHeight: 100,
    marginRight: 6,
  },
  issuesImprovementsBoxLast: {
    flex: 1,
    border: "1px solid #ddd",
    padding: 10,
    minHeight: 100,
    marginLeft: 6,
  },
  issuesImprovementsTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
  },
  resultContainer: {
    marginTop: 0,
    marginHorizontal: 0,
    border: "1px solid #ddd",
    padding: 10,
    minHeight: 80,
  },
  resultTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
  },
  effectivenessPanel: {
    width: "38%",
    border: "1px solid #ddd",
    padding: 10,
    backgroundColor: "#f9fafb",
  },
  effectivenessTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
  },
  benefitsList: {
    marginBottom: 10,
  },
  benefitItem: {
    fontSize: 9,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  chartContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 5,
  },
  chartBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  chartBarLabel: {
    fontSize: 8,
    width: 60,
  },
  chartBarVisual: {
    height: 15,
    backgroundColor: "#3f0000",
    marginLeft: 5,
  },
  financialIndicator: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#fff",
    border: "1px solid #ddd",
  },
  financialValue: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 3,
    lineHeight: 1.3,
  },
  financialNote: {
    fontSize: 7,
    color: "#666",
    fontStyle: "italic",
    lineHeight: 1.3,
  },
});

interface BestPracticePDFProps {
  practice: {
    id: string;
    title: string;
    category: string;
    plant: string;
    submittedDate: string;
    areaImplemented?: string;
    problemStatement: string;
    solution: string;
    benefits?: string[];
    metrics?: string;
    savings_amount?: number;
    savings_currency?: string;
    savings_period?: string;
    beforeImageUrl?: string;
    afterImageUrl?: string;
  };
}

const BestPracticePDF: React.FC<BestPracticePDFProps> = ({ practice }) => {
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Calculate savings with comprehensive validation
  const calculateSavings = (): { monthly: number; yearly: number } => {
    try {
      // Log incoming data for debugging
      console.log("PDF savings calculation:", {
        savings_amount: practice.savings_amount,
        savings_currency: practice.savings_currency,
        savings_period: practice.savings_period,
      });

      if (!practice.savings_amount || isNaN(Number(practice.savings_amount))) {
        console.log("No valid savings amount, returning 0");
        return { monthly: 0, yearly: 0 };
      }

      let amountInLakhs = Number(practice.savings_amount);
      if (isNaN(amountInLakhs) || !isFinite(amountInLakhs)) {
        console.log("Invalid lakhs amount, returning 0");
        return { monthly: 0, yearly: 0 };
      }

      if (practice.savings_currency === "crores") {
        amountInLakhs = amountInLakhs * 100;
      }

      let monthly: number;
      let yearly: number;

      if (practice.savings_period === "annually") {
        monthly = amountInLakhs / 12;
        yearly = amountInLakhs;
      } else {
        monthly = amountInLakhs;
        yearly = amountInLakhs * 12;
      }

      // Ensure the values are valid numbers
      const result = {
        monthly: Number(monthly) || 0,
        yearly: Number(yearly) || 0,
      };

      console.log("Calculated savings:", result);
      return result;
    } catch (error) {
      console.error("Error calculating savings:", error);
      return { monthly: 0, yearly: 0 };
    }
  };

  const savings = calculateSavings();

  // Defensive check to ensure values are numbers before rendering
  const monthlyValue =
    typeof savings.monthly === "number" && isFinite(savings.monthly)
      ? savings.monthly
      : 0;
  const yearlyValue =
    typeof savings.yearly === "number" && isFinite(savings.yearly)
      ? savings.yearly
      : 0;

  return (
    <Document>
      <Page size="A3" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Best Practices</Text>
          <View
            style={{ backgroundColor: "#ffffff", padding: 5, borderRadius: 4 }}
          >
            <Image
              src="/images/amberlogo.png"
              style={{ width: 100, height: 35 }}
              cache={false}
            />
          </View>
        </View>

        {/* General Information */}
        <View style={styles.section}>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.label}>Best Practice No.:</Text>
              <Text style={styles.value}>{practice.id}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.label}>Department:</Text>
              <Text style={styles.value}>Production</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.label}>Area:</Text>
              <Text style={styles.value}>
                {practice.areaImplemented || "-"}
              </Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.label}>Start Date:</Text>
              <Text style={styles.value}>
                {formatDate(practice.submittedDate)}
              </Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.label}>Category:</Text>
              <Text style={styles.value}>{practice.category}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.label}>Plant:</Text>
              <Text style={styles.value}>{practice.plant}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.label}>End Date:</Text>
              <Text style={styles.value}>-</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.label}>Best Practice Name:</Text>
              <Text style={styles.value}>{practice.title}</Text>
            </View>
          </View>
        </View>

        {/* Before/After Images */}
        <View style={styles.beforeAfterContainer}>
          <View style={styles.beforeAfterBox}>
            <Text style={styles.beforeAfterTitle}>Before</Text>
            {practice.beforeImageUrl ? (
              <Image
                src={practice.beforeImageUrl}
                style={{ width: "100%", maxHeight: 150, objectFit: "contain" }}
                cache={false}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text>Click on the image icon to add 'Before' image</Text>
              </View>
            )}
          </View>

          <View style={styles.beforeAfterBoxLast}>
            <Text style={styles.beforeAfterTitle}>After</Text>
            {practice.afterImageUrl ? (
              <Image
                src={practice.afterImageUrl}
                style={{ width: "100%", maxHeight: 150, objectFit: "contain" }}
                cache={false}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text>Click on the image icon to add 'After' image</Text>
              </View>
            )}
          </View>
        </View>

        {/* Issues and Improvements */}
        <View style={styles.issuesImprovementsContainer}>
          <View style={styles.issuesImprovementsBox}>
            <Text style={styles.issuesImprovementsTitle}>Issues</Text>
            <Text style={styles.value}>{practice.problemStatement || "-"}</Text>
          </View>

          <View style={styles.issuesImprovementsBoxLast}>
            <Text style={styles.issuesImprovementsTitle}>Improvements</Text>
            <Text style={styles.value}>{practice.solution || "-"}</Text>
          </View>
        </View>

        {/* Result and Effectiveness Container */}
        <View
          style={{ flexDirection: "row", marginTop: 10, marginHorizontal: 10 }}
        >
          <View style={[styles.resultContainer, { flex: 1, marginRight: 6 }]}>
            <Text style={styles.resultTitle}>Result</Text>
            {practice.benefits && practice.benefits.length > 0 ? (
              practice.benefits.map((benefit, index) => (
                <Text key={index} style={styles.value}>
                  • {benefit}
                </Text>
              ))
            ) : practice.metrics ? (
              <Text style={styles.value}>{practice.metrics}</Text>
            ) : (
              <Text style={styles.value}>-</Text>
            )}
          </View>

          {/* Effectiveness Panel */}
          <View style={[styles.effectivenessPanel, { marginLeft: 6 }]}>
            <Text style={styles.effectivenessTitle}>Effectiveness</Text>

            {/* Benefits */}
            <View style={styles.benefitsList}>
              <Text style={styles.benefitItem}>
                Plan of {monthlyValue.toFixed(0)} per month
              </Text>
              <Text style={styles.benefitItem}>1 saving per stroke</Text>
              <Text style={styles.benefitItem}>
                Monthly saving = {monthlyValue.toFixed(0)} × 1 ={" "}
                {monthlyValue.toFixed(0)} INR
              </Text>
              <Text style={styles.benefitItem}>
                Yearly saving = {yearlyValue.toFixed(0)} INR
              </Text>
            </View>

            {/* Process Saving Chart */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Unit no's:- Process saving:</Text>
              <View style={styles.chartBar}>
                <Text style={styles.chartBarLabel}>Before</Text>
                <View
                  style={[
                    styles.chartBarVisual,
                    { width: 60, backgroundColor: "#3b82f6" },
                  ]}
                />
                <Text style={{ fontSize: 8, marginLeft: 5 }}>3</Text>
              </View>
              <View style={styles.chartBar}>
                <Text style={styles.chartBarLabel}>After</Text>
                <View
                  style={[
                    styles.chartBarVisual,
                    { width: 40, backgroundColor: "#10b981" },
                  ]}
                />
                <Text style={{ fontSize: 8, marginLeft: 5 }}>2</Text>
              </View>
            </View>

            {/* Financial Indicator */}
            <View style={styles.financialIndicator}>
              <Text style={styles.financialValue}>
                FY2024-25 CI - {yearlyValue.toFixed(2)} Lakhs
              </Text>
              <Text style={styles.financialNote}>
                Note* - Value should be mentioned in Lakhs
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default BestPracticePDF;
