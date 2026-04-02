import { createWorker } from "tesseract.js";
import type { OCRData } from "../store/data";

export interface OCRProgress {
  status: string;
  progress: number;
}

export async function processReceiptOCR(
  imageFile: File,
  onProgress?: (p: OCRProgress) => void
): Promise<OCRData> {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    worker = await createWorker("eng", 1, {
      logger: (m: { status: string; progress: number }) => {
        if (onProgress) {
          onProgress({ status: m.status, progress: m.progress });
        }
      },
    });

    const { data } = await worker.recognize(imageFile);
    const rawText = data.text;

    return parseReceiptText(rawText);
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

function parseReceiptText(text: string): OCRData {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  // --- Merchant Name: first substantial text line ---
  const merchantName = lines[0] || undefined;

  // --- Total Amount ---
  const totalPatterns = [
    /(?:total|amount due|amount|grand total|subtotal|charged|payment)[:\s]*[^\d]*([\d,]+\.?\d*)/i,
    /[£$€₹¥₩₫₽]\s*([\d,]+\.?\d*)/i,
    /([\d,]+\.\d{2})\s*(?:USD|EUR|GBP|INR|JPY|CAD|AUD)?/i,
  ];

  let amount: number | undefined;
  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) {
      const numStr = match[1].replace(/,/g, "");
      const parsed = parseFloat(numStr);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }

  // --- Date ---
  const datePatterns = [
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})/,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,]+(\d{1,2})[\s,]+(\d{4})/i,
  ];

  let date: string | undefined;
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        let dateObj: Date | null = null;
        if (pattern.source.startsWith("(\\d{4})")) {
          // YYYY-MM-DD
          dateObj = new Date(`${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`);
        } else if (pattern.source.includes("jan|feb")) {
          const months: Record<string, string> = {
            jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
            jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
          };
          const month = months[match[1].toLowerCase().substring(0, 3)];
          dateObj = new Date(`${match[3]}-${month}-${match[2].padStart(2, "0")}`);
        } else {
          // Try MM/DD/YYYY or DD/MM/YYYY
          const a = parseInt(match[1]);
          const b = parseInt(match[2]);
          const y = match[3].length === 2 ? `20${match[3]}` : match[3];
          // Heuristic: if a > 12, it's day first
          if (a > 12) {
            dateObj = new Date(`${y}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`);
          } else {
            dateObj = new Date(`${y}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`);
          }
        }
        if (dateObj && !isNaN(dateObj.getTime())) {
          date = dateObj.toISOString().split("T")[0];
          break;
        }
      } catch {
        // continue
      }
    }
  }

  // --- Description: look for item lines ---
  const descLines = lines
    .slice(1, 6)
    .filter(
      (l) =>
        !/^(total|tax|tip|subtotal|receipt|thank|welcome|server|table|check)/i.test(l) &&
        !/^\d+$/.test(l)
    )
    .slice(0, 3);
  const description = descLines.join(", ") || undefined;

  return {
    rawText: text,
    merchantName,
    amount,
    date,
    description,
  };
}
