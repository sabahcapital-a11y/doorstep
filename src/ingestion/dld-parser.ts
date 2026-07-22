/**
 * DLD CSV Parser
 * Parses Dubai Land Department transaction CSV files from Dubai Pulse
 * (dubaipulse.gov.ae) or manually downloaded exports.
 *
 * Expected CSV columns (order-insensitive, case-insensitive header matching):
 *   - Transaction Date / transaction_date
 *   - Transaction Type / transaction_type  (sale, mortgage, grant, etc.)
 *   - Property Type / property_type        (Apartment, Villa, Plot, Office, etc.)
 *   - Area / Community / area
 *   - Size (sqft) / size_sqft
 *   - Price (AED) / price_aed
 *   - Project Name / project_name
 *   - Developer Name / developer_name
 *   - Buyer Nationality / buyer_nationality
 *   - Unit Number / unit_number
 *   - Floor / floor
 *   - Rooms / bedrooms
 *
 * The parser is tolerant: missing columns are ignored; mismatched types are coerced.
 * Arabic + English mixed content is handled — BOM and bidirectional text markers are stripped.
 */

/** Raw row as parsed from CSV — arbitrary string-keyed record. */
export type RawDLDRow = Record<string, string>;

/** Structured row after parsing and cleaning. */
export interface ParsedDLDTransaction {
  transactionDate: string;       // YYYY-MM-DD or original string if unparseable
  transactionType: string;       // "sale", "mortgage", "grant", etc.
  propertyType: string;          // "Apartment", "Villa", "Plot", "Office", etc.
  area: string;                  // Community / area name
  sizeSqft: number | null;       // null if missing or unparseable
  priceAed: number;              // 0 if missing
  projectName: string | null;    // null if empty/missing
  developerName: string | null;  // null if empty/missing
  buyerNationality: string | null;
  unitNumber: string | null;
  floor: number | null;
  rooms: string | null;          // bed count as string ("1", "2", "studio", etc.)
  raw: RawDLDRow;                // Original row for debugging
}

/** Header name aliases: all map to the canonical key. */
const HEADER_ALIASES: Record<string, string> = {
  "transaction date": "transactionDate",
  "transaction_date": "transactionDate",
  date: "transactionDate",

  "transaction type": "transactionType",
  "transaction_type": "transactionType",
  type: "transactionType",

  "property type": "propertyType",
  "property_type": "propertyType",
  "property subtype": "propertyType",
  usage: "propertyType",

  area: "area",
  community: "area",
  "community name": "area",
  "area name": "area",
  "master community": "area",
  "master project": "area",

  "size (sqft)": "sizeSqft",
  size_sqft: "sizeSqft",
  "area (sqft)": "sizeSqft",
  "built up area": "sizeSqft",
  "plot area": "sizeSqft",
  sqft: "sizeSqft",

  "price (aed)": "priceAed",
  price_aed: "priceAed",
  price: "priceAed",
  "transaction amount": "priceAed",
  amount: "priceAed",

  "project name": "projectName",
  project_name: "projectName",
  project: "projectName",

  "developer name": "developerName",
  developer_name: "developerName",
  developer: "developerName",

  "buyer nationality": "buyerNationality",
  buyer_nationality: "buyerNationality",
  nationality: "buyerNationality",

  "unit number": "unitNumber",
  unit_number: "unitNumber",
  "unit no": "unitNumber",

  floor: "floor",

  rooms: "rooms",
  bedrooms: "rooms",
  "no. of bedrooms": "rooms",
  beds: "rooms",
};

/** Parse a CSV file and return an array of ParsedDLDTransaction objects. */
export async function parseDLDCSV(
  source: string | Uint8Array,
  filename?: string
): Promise<ParsedDLDTransaction[]> {
  const text =
    typeof source === "string" ? source : new TextDecoder("utf-8").decode(source);

  // Strip BOM and bidirectional text markers common in Arabic CSVs
  const cleaned = text
    .replace(/^\uFEFF/, "")
    .replace(/\u200E/g, "")
    .replace(/\u200F/g, "")
    .replace(/\u202A/g, "")
    .replace(/\u202C/g, "");

  const lines = splitCSVLines(cleaned);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const columnMap = buildColumnMap(headers);

  const rows: ParsedDLDTransaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);
    if (fields.length === 0) continue;

    const raw: RawDLDRow = {};
    const mapped: Record<string, string> = {};

    for (let j = 0; j < headers.length && j < fields.length; j++) {
      const rawHeader = headers[j].trim();
      raw[rawHeader] = fields[j];
      const canonical = columnMap[j];
      if (canonical) {
        mapped[canonical] = fields[j].trim();
      }
    }

    rows.push({
      transactionDate: parseDate(mapped["transactionDate"]),
      transactionType: normalizeTransactionType(mapped["transactionType"] || ""),
      propertyType: normalizePropertyType(mapped["propertyType"] || ""),
      area: normalizeArea(mapped["area"] || ""),
      sizeSqft: parseNumericOrNull(mapped["sizeSqft"]),
      priceAed: parseNumeric(mapped["priceAed"]),
      projectName: mapped["projectName"] || null,
      developerName: mapped["developerName"] || null,
      buyerNationality: mapped["buyerNationality"] || null,
      unitNumber: mapped["unitNumber"] || null,
      floor: parseNumericOrNull(mapped["floor"]),
      rooms: mapped["rooms"] || null,
      raw,
    });
  }

  return rows;
}

// ─── CSV line splitting (handles quoted fields with commas) ────────────────

function splitCSVLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === "\n" && !inQuotes) {
      lines.push(current);
      current = "";
    } else if (ch === "\r" && !inQuotes) {
      // skip \r
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// ─── Header mapping ─────────────────────────────────────────────────────────

function buildColumnMap(headers: string[]): (string | null)[] {
  return headers.map((h) => {
    const key = h.toLowerCase().trim().replace(/^"+|"+$/g, "");
    return HEADER_ALIASES[key] || null;
  });
}

// ─── Normalization helpers ──────────────────────────────────────────────────

function parseDate(raw: string | undefined): string {
  if (!raw) return "";
  // Try common formats: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, MM/DD/YYYY
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  // Try DD/MM/YYYY
  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    const [_, day, month, year] = dmy;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return raw;
}

function normalizeTransactionType(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (lower.includes("sale") || lower.includes("sell") || lower.includes("بيع")) return "sale";
  if (lower.includes("mortgage") || lower.includes("رهن")) return "mortgage";
  if (lower.includes("grant") || lower.includes("gift") || lower.includes("هبة")) return "grant";
  if (lower.includes("rent") || lower.includes("lease") || lower.includes("إيجار")) return "rent";
  return raw || "unknown";
}

function normalizePropertyType(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (lower.includes("apartment") || lower.includes("flat") || lower.includes("شقة")) return "Apartment";
  if (lower.includes("villa") || lower.includes("في??ا")) return "Villa";
  if (lower.includes("townhouse") || lower.includes("town house")) return "Townhouse";
  if (lower.includes("plot") || lower.includes("land") || lower.includes("أرض")) return "Plot";
  if (lower.includes("office") || lower.includes("مكتب")) return "Office";
  if (lower.includes("building") || lower.includes("مبنى")) return "Building";
  if (lower.includes("hotel") || lower.includes("فندق")) return "Hotel Apartment";
  if (lower.includes("warehouse") || lower.includes("مستودع")) return "Warehouse";
  return raw || "Unknown";
}

function normalizeArea(raw: string): string {
  // Common normalization: strip trailing " - Marsa" type suffixes
  let cleaned = raw.trim();
  // Remove directional suffixes: " - North", " - East", " - Phase 1", etc.
  cleaned = cleaned
    .replace(/\s*-\s*(Phase|Ph)\s*\d+$/i, "")
    .replace(/\s*-\s*(North|South|East|West)$/i, "")
    .replace(/\s*-\s*Marsa$/i, "")
    .trim();
  return cleaned || raw.trim();
}

function parseNumericOrNull(raw: string | undefined): number | null {
  if (!raw) return null;
  // Remove commas, spaces, AED prefix/suffix
  const cleaned = raw.replace(/[,\s]/g, "").replace(/^AED/i, "").replace(/AED$/i, "");
  const n = parseFloat(cleaned);
  return isNaN(n) || n <= 0 ? null : n;
}

function parseNumeric(raw: string | undefined): number {
  return parseNumericOrNull(raw) ?? 0;
}

// ─── Filtering helpers ──────────────────────────────────────────────────────

/** Price below this threshold (AED) is considered an outlier (AED 1 transfers, etc.). */
const PRICE_OUTLIER_THRESHOLD = 5000;

/** Filter out obvious data-quality issues before loading. */
export function filterDLDRows(rows: ParsedDLDTransaction[]): {
  valid: ParsedDLDTransaction[];
  skipped: { reason: string; count: number }[];
} {
  const valid: ParsedDLDTransaction[] = [];
  const skippedMap = new Map<string, number>();

  for (const row of rows) {
    let reason: string | null = null;

    if (!row.area || row.area === "Unknown") {
      reason = "missing area";
    } else if (row.priceAed <= 0) {
      reason = "zero or negative price";
    } else if (row.priceAed < PRICE_OUTLIER_THRESHOLD && row.transactionType === "sale") {
      reason = "below price outlier threshold";
    } else if (!row.transactionDate) {
      reason = "missing transaction date";
    }

    if (reason) {
      skippedMap.set(reason, (skippedMap.get(reason) || 0) + 1);
    } else {
      valid.push(row);
    }
  }

  const skipped = Array.from(skippedMap.entries()).map(([reason, count]) => ({
    reason,
    count,
  }));

  return { valid, skipped };
}

/** Extract the year-quarter period from a date string. */
export function dateToPeriod(dateStr: string): string {
  if (!dateStr) return "Unknown";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Unknown";
    const q = Math.floor(d.getMonth() / 3) + 1;
    return `Q${q} ${d.getFullYear()}`;
  } catch {
    return "Unknown";
  }
}

/** Map DLD property type + rooms to our UnitType enum. */
export function mapToUnitType(propertyType: string, rooms: string | null): string {
  const pt = propertyType.toLowerCase();
  if (pt.includes("villa")) return "villa";
  if (pt.includes("townhouse")) return "townhouse";
  if (pt.includes("penthouse")) return "penthouse";

  if (rooms) {
    const r = rooms.toLowerCase().trim();
    if (r === "studio" || r === "0") return "studio";
    if (r === "1") return "1br";
    if (r === "2") return "2br";
    if (r === "3") return "3br";
    if (r === "4") return "4br";
    if (r === "5") return "5br";
    if (r === "6" || r === "7") return "penthouse";
    // Try to parse numeric
    const num = parseInt(r, 10);
    if (!isNaN(num)) {
      if (num === 0) return "studio";
      if (num >= 1 && num <= 5) return `${num}br`;
      if (num >= 6) return "penthouse";
    }
  }

  // Fallback based on property type
  if (pt.includes("apartment") || pt.includes("flat")) return "1br";
  if (pt.includes("studio")) return "studio";
  if (pt.includes("office")) return "studio"; // offices mapped to studio for size estimates
  return "1br";
}
