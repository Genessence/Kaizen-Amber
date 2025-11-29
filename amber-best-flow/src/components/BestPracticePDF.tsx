/**
 * PDF Export Component for Best Practice Form
 * Lightweight implementation using jsPDF + html2canvas
 * Replaces heavy @react-pdf/renderer (saved ~100KB)
 */

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface BestPracticeData {
  title: string;
  category: string;
  plant: string;
  problemStatement: string;
  solution: string;
  benefits?: string[];
  metrics?: string;
  investment?: string;
  beforeImage?: string;
  afterImage?: string;
  savingsAmount?: string;
  savingsCurrency?: string;
}

/**
 * Generates and downloads a PDF from the Best Practice data
 */
export async function generateBestPracticePDF(
  data: BestPracticeData,
  filename: string = "best-practice.pdf"
): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    pdf.setFont("helvetica", isBold ? "bold" : "normal");
    const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
    
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
    yPosition += 3;
  };

  // Header with blue background
  pdf.setFillColor(30, 64, 175); // Blue
  pdf.rect(0, 0, pageWidth, 30, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text("Best Practice Form", margin, 20);
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);
  yPosition = 40;

  // Basic Information
  addText("BASIC INFORMATION", 14, true);
  addText(`Title: ${data.title}`, 11);
  addText(`Category: ${data.category}`, 11);
  addText(`Plant: ${data.plant}`, 11);
  yPosition += 5;

  // Problem Statement
  addText("PROBLEM STATEMENT", 14, true);
  addText(data.problemStatement);
  yPosition += 5;

  // Solution
  addText("SOLUTION", 14, true);
  addText(data.solution);
  yPosition += 5;

  // Benefits
  if (data.benefits && data.benefits.length > 0) {
    addText("KEY BENEFITS", 14, true);
    data.benefits.forEach((benefit, idx) => {
      addText(`${idx + 1}. ${benefit}`);
    });
    yPosition += 5;
  }

  // Metrics
  if (data.metrics) {
    addText("METRICS", 14, true);
    addText(data.metrics);
    yPosition += 5;
  }

  // Investment
  if (data.investment) {
    addText("INVESTMENT", 14, true);
    addText(data.investment);
    yPosition += 5;
  }

  // Savings
  if (data.savingsAmount) {
    addText("SAVINGS", 14, true);
    addText(`${data.savingsAmount} ${data.savingsCurrency || "lakhs"} per month`);
    yPosition += 5;
  }

  // Images (if provided)
  if (data.beforeImage || data.afterImage) {
    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = margin;
    }

    addText("BEFORE & AFTER IMAGES", 14, true);
    
    const imgWidth = (pageWidth - 3 * margin) / 2;
    const imgHeight = 60;

    if (data.beforeImage) {
      try {
        pdf.addImage(data.beforeImage, "JPEG", margin, yPosition, imgWidth, imgHeight);
        pdf.setFontSize(10);
        pdf.text("Before", margin, yPosition + imgHeight + 5);
      } catch (error) {
        console.warn("Failed to add before image:", error);
      }
    }

    if (data.afterImage) {
      try {
        pdf.addImage(data.afterImage, "JPEG", margin + imgWidth + margin, yPosition, imgWidth, imgHeight);
        pdf.setFontSize(10);
        pdf.text("After", margin + imgWidth + margin, yPosition + imgHeight + 5);
      } catch (error) {
        console.warn("Failed to add after image:", error);
      }
    }
  }

  // Save the PDF
  pdf.save(filename);
}

/**
 * Generates PDF from HTML element
 * Useful for capturing the exact form layout
 */
export async function generatePDFFromElement(
  elementId: string,
  filename: string = "best-practice.pdf"
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID "${elementId}" not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.8);
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pageWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    throw error;
  }
}

// Export for backwards compatibility
export default {
  generateBestPracticePDF,
  generatePDFFromElement,
};
