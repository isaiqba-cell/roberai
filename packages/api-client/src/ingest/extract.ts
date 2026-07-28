import type { GarmentSpec, SilhouetteCut } from "@rober/fit-engine";
import { load } from "cheerio";

import { parseLlmExtraction } from "./schema";
import type {
  ChartExtraction,
  ExtractedChartRow,
  LlmExtractor,
  MeasurementBasis,
  MeasurementUnit,
  ObservedMeasurements,
  ProductPageMetadata,
} from "./types";

type MeasurementKey = keyof ObservedMeasurements;
type TableRow = {
  sizeLabel: string;
  observed: ObservedMeasurements;
  evidence: string[];
  cut: SilhouetteCut;
  stretchPct: number;
};

const INCHES_TO_CM = 2.54;
const measurementHeaders: Array<{
  key: MeasurementKey;
  matches: RegExp;
}> = [
  {
    key: "waistCm",
    matches: /^(body |natural |low )?waist( circumference)?$/,
  },
  { key: "hipCm", matches: /^(low )?(hip|hips|seat)( circumference)?$/ },
  { key: "inseamCm", matches: /^(inseam|inside leg|inner leg)( length)?$/ },
  { key: "thighCm", matches: /^(thigh)( circumference)?$/ },
  { key: "riseCm", matches: /^(front )?rise$/ },
  { key: "legOpeningCm", matches: /^(leg )?opening$/ },
  { key: "hemCm", matches: /^(hem)( width| opening)?$/ },
  { key: "kneeCm", matches: /^(knee)( width)?$/ },
];

function compact(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeader(value: string) {
  return compact(value)
    .toLowerCase()
    .replace(/[():/]/g, " ")
    .replace(/\b(?:cm|centimeters?|inches?|inch|in)\b/g, " ")
    .replace(/["″]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSizeHeader(value: string) {
  return /^(size|jean size|denim size|waist size|alpha size|numeric size|w)$/i.test(
    value,
  );
}

function measurementKeyForHeader(value: string) {
  const normalized = normalizeHeader(value);
  return measurementHeaders.find(({ matches }) => matches.test(normalized))
    ?.key;
}

function replaceFractions(value: string) {
  const unicodeFractions: Record<string, number> = {
    "¼": 0.25,
    "½": 0.5,
    "¾": 0.75,
    "⅛": 0.125,
    "⅜": 0.375,
    "⅝": 0.625,
    "⅞": 0.875,
  };
  let normalized = value.replace(
    /(\d+)\s*([¼½¾⅛⅜⅝⅞])/g,
    (_, whole: string, fraction: string) =>
      String(Number(whole) + (unicodeFractions[fraction] ?? 0)),
  );
  normalized = normalized.replace(/[¼½¾⅛⅜⅝⅞]/g, (fraction) =>
    String(unicodeFractions[fraction] ?? 0),
  );
  normalized = normalized.replace(
    /(\d+)\s+(\d+)\s*\/\s*(2|4|8|16)\b/g,
    (_, whole: string, numerator: string, denominator: string) =>
      String(Number(whole) + Number(numerator) / Number(denominator)),
  );
  return normalized.replace(
    /(\d+)\s*\/\s*(2|4|8|16)\b/g,
    (_, numerator: string, denominator: string) =>
      String(Number(numerator) / Number(denominator)),
  );
}

function unitsIn(value: string) {
  const units = new Set<"cm" | "in">();
  if (/\bcm\b|centimeter/i.test(value)) units.add("cm");
  if (/\bin(?:ch|ches)?\b|["″]/i.test(value)) units.add("in");
  return units;
}

function inferUnit(key: MeasurementKey, amount: number): "cm" | "in" {
  if (key === "riseCm" || key === "legOpeningCm" || key === "hemCm") {
    return amount <= 24 ? "in" : "cm";
  }
  if (key === "thighCm" || key === "kneeCm") {
    return amount <= 38 ? "in" : "cm";
  }
  if (key === "inseamCm") return amount <= 48 ? "in" : "cm";
  return amount <= 60 ? "in" : "cm";
}

function roundCm(value: number) {
  return Math.round(value * 10) / 10;
}

export function parseMeasurementToCm(
  rawValue: string,
  key: MeasurementKey,
  assumedUnit: "cm" | "in" | "unknown" = "unknown",
) {
  const normalized = replaceFractions(compact(rawValue).replace(/,/g, "."));
  const values = [...normalized.matchAll(/\d+(?:\.\d+)?/g)].map((match) =>
    Number(match[0]),
  );
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    return null;
  }

  const isRange = /\d\s*(?:-|–|—|to)\s*\d/i.test(normalized);
  const amount =
    isRange && values.length >= 2 ? (values[0]! + values[1]!) / 2 : values[0]!;
  const explicitUnits = unitsIn(normalized);
  const unit = explicitUnits.has("cm")
    ? "cm"
    : explicitUnits.has("in")
      ? "in"
      : assumedUnit === "unknown"
        ? inferUnit(key, amount)
        : assumedUnit;
  return roundCm(unit === "in" ? amount * INCHES_TO_CM : amount);
}

function inferCut(value: string): SilhouetteCut {
  const normalized = value.toLowerCase();
  if (/skinny|spray[- ]?on/.test(normalized)) return "skinny";
  if (/slim|taper/.test(normalized)) return "slim";
  if (/baggy|loose|wide leg|wide-leg/.test(normalized)) return "baggy";
  if (/relaxed|athletic/.test(normalized)) return "relaxed";
  return "straight";
}

function inferStretch(value: string) {
  if (/rigid|non[- ]?stretch|100%\s*(?:cotton|denim)/i.test(value)) return 0;
  const explicit = value.match(
    /(\d+(?:\.\d+)?)\s*%\s*(?:elastane|spandex|elastomultiester|stretch)/i,
  );
  if (explicit) return Math.min(40, Number(explicit[1]));
  return /stretch|flex|elastane|spandex/i.test(value) ? 2 : 0;
}

function basisFrom(value: string): MeasurementBasis {
  if (
    /garment measurements?|actual garment|product measurements?|measurements? (?:are )?based on size/i.test(
      value,
    )
  ) {
    return "garment";
  }
  if (
    /body measurements?|measure (?:around|your body)|body size|body waist/i.test(
      value,
    )
  ) {
    return "body";
  }
  return "unknown";
}

function unitFrom(value: string): MeasurementUnit {
  const units = unitsIn(value);
  if (units.size === 2) return "mixed";
  if (units.has("cm")) return "cm";
  if (units.has("in")) return "in";
  return "unknown";
}

function assumedUnitFrom(value: string): "cm" | "in" | "unknown" {
  const detected = unitFrom(value);
  return detected === "mixed" ? "unknown" : detected;
}

function makeSpec(
  observed: ObservedMeasurements,
  cut: SilhouetteCut,
  stretchPct: number,
): GarmentSpec {
  return {
    ...(observed.waistCm === undefined ? {} : { waistCm: observed.waistCm }),
    ...(observed.inseamCm === undefined ? {} : { inseamCm: observed.inseamCm }),
    ...(observed.thighCm === undefined ? {} : { thighCm: observed.thighCm }),
    ...(observed.riseCm === undefined ? {} : { riseCm: observed.riseCm }),
    ...(observed.legOpeningCm === undefined
      ? {}
      : { legOpeningCm: observed.legOpeningCm }),
    ...(observed.hemCm === undefined ? {} : { hemCm: observed.hemCm }),
    ...(observed.kneeCm === undefined ? {} : { kneeCm: observed.kneeCm }),
    stretchPct,
    cut,
  };
}

function rowFromTable(
  headers: string[],
  cells: string[],
  pageText: string,
  preferredCut: SilhouetteCut | null,
): TableRow | null {
  const sizeIndex = headers.findIndex((header) =>
    isSizeHeader(normalizeHeader(header)),
  );
  if (sizeIndex < 0 || !cells[sizeIndex]) return null;

  const tableUnit = assumedUnitFrom(headers.join(" "));
  const observed: ObservedMeasurements = {};
  const evidence: string[] = [];

  headers.forEach((header, index) => {
    const key = measurementKeyForHeader(header);
    const value = cells[index];
    if (!key || !value) return;
    const measurement = parseMeasurementToCm(
      value,
      key,
      assumedUnitFrom(`${header} ${value}`) === "unknown"
        ? tableUnit
        : assumedUnitFrom(`${header} ${value}`),
    );
    if (measurement === null) return;
    observed[key] = measurement;
    evidence.push(`${compact(header)}: ${compact(value)}`);
  });

  if (Object.keys(observed).length === 0) return null;
  const rowText = cells.join(" ");
  return {
    sizeLabel: compact(cells[sizeIndex]!),
    observed,
    evidence,
    cut: preferredCut ?? inferCut(`${rowText} ${pageText}`),
    stretchPct: inferStretch(`${rowText} ${pageText}`),
  };
}

function extractTables(
  html: string,
  pageText: string,
  preferredCut: SilhouetteCut | null,
) {
  const $ = load(html);
  const rows: TableRow[] = [];

  $("table").each((_, table) => {
    const rawRows: string[][] = [];
    $(table)
      .find("tr")
      .each((__, row) => {
        const cells = $(row)
          .find("th,td")
          .map((___, cell) => compact($(cell).text()))
          .get();
        if (cells.length >= 2) rawRows.push(cells);
      });
    const headerIndex = rawRows.findIndex((cells) => {
      const normalized = cells.map(normalizeHeader);
      return (
        normalized.some(isSizeHeader) &&
        normalized.some((header) => measurementKeyForHeader(header))
      );
    });
    if (headerIndex < 0) return;
    const headers = rawRows[headerIndex]!;
    for (const cells of rawRows.slice(headerIndex + 1)) {
      const row = rowFromTable(headers, cells, pageText, preferredCut);
      if (row) rows.push(row);
    }
  });

  return rows;
}

function extractProseMeasurements(pageText: string) {
  const observed: ObservedMeasurements = {};
  const evidence: string[] = [];
  const patterns: Array<[MeasurementKey, RegExp]> = [
    [
      "riseCm",
      /\b(?:front )?rise\s*[:\-]?\s*([\d\s./¼½¾⅛⅜⅝⅞–—-]+\s*(?:cm|inches?|in\b|["″])?)/i,
    ],
    [
      "thighCm",
      /\bthigh\s*[:\-]?\s*([\d\s./¼½¾⅛⅜⅝⅞–—-]+\s*(?:cm|inches?|in\b|["″])?)/i,
    ],
    [
      "kneeCm",
      /\bknee\s*[:\-]?\s*([\d\s./¼½¾⅛⅜⅝⅞–—-]+\s*(?:cm|inches?|in\b|["″])?)/i,
    ],
    [
      "legOpeningCm",
      /\bleg opening\s*[:\-]?\s*([\d\s./¼½¾⅛⅜⅝⅞–—-]+\s*(?:cm|inches?|in\b|["″])?)/i,
    ],
    [
      "hemCm",
      /\bhem(?: width| opening)?\s*[:\-]?\s*([\d\s./¼½¾⅛⅜⅝⅞–—-]+\s*(?:cm|inches?|in\b|["″])?)/i,
    ],
    [
      "inseamCm",
      /\binseam\s*[:\-]?\s*([\d\s./¼½¾⅛⅜⅝⅞–—-]+\s*(?:cm|inches?|in\b|["″])?)/i,
    ],
  ];
  for (const [key, pattern] of patterns) {
    const match = pageText.match(pattern);
    if (!match?.[1]) continue;
    const parsed = parseMeasurementToCm(match[1], key);
    if (parsed === null) continue;
    observed[key] = parsed;
    evidence.push(`${key.replace(/Cm$/, "")}: ${compact(match[1])}`);
  }
  const sampleSize = pageText.match(
    /measurements? (?:are )?based on (?:a )?size\s+(?:w)?([\d]+(?:x[\d]+)?)/i,
  )?.[1];
  return { evidence, observed, sampleSize };
}

function baseSizeLabel(label: string) {
  return label.toLowerCase().replace(/\s/g, "").replace(/^w/, "").split("x")[0];
}

function combineSplitInseams(rows: TableRow[]) {
  const inseamRows = rows.filter(
    (row) =>
      row.observed.inseamCm !== undefined &&
      Object.keys(row.observed).length === 1,
  );
  const baseRows = rows.filter(
    (row) =>
      row.observed.waistCm !== undefined && row.observed.inseamCm === undefined,
  );
  if (inseamRows.length === 0 || baseRows.length === 0) return rows;

  const inseams = [
    ...new Map(
      inseamRows.map((row) => [row.observed.inseamCm, row.observed.inseamCm!]),
    ).values(),
  ].slice(0, 8);
  const combined = baseRows.flatMap((row) =>
    inseams.map((inseamCm) => {
      const inseamInches = Math.round(inseamCm / INCHES_TO_CM);
      return {
        ...row,
        sizeLabel: `${baseSizeLabel(row.sizeLabel)}x${inseamInches}`,
        observed: { ...row.observed, inseamCm },
        evidence: [...row.evidence, `inseam option: ${inseamInches} in`],
      };
    }),
  );
  return [
    ...rows.filter(
      (row) => !baseRows.includes(row) && !inseamRows.includes(row),
    ),
    ...combined,
  ];
}

function mergeRows(rows: TableRow[]) {
  const merged = new Map<string, TableRow>();
  for (const row of rows) {
    const key = row.sizeLabel.toLowerCase().replace(/\s+/g, "");
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, row);
      continue;
    }
    merged.set(key, {
      ...existing,
      observed: { ...existing.observed, ...row.observed },
      evidence: [...new Set([...existing.evidence, ...row.evidence])],
      stretchPct: Math.max(existing.stretchPct, row.stretchPct),
      cut: row.cut === "straight" ? existing.cut : row.cut,
    });
  }
  return [...merged.values()];
}

function toExtractedRow(row: TableRow): ExtractedChartRow {
  return {
    sizeLabel: row.sizeLabel,
    observed: row.observed,
    spec: makeSpec(row.observed, row.cut, row.stretchPct),
    evidence: row.evidence,
  };
}

function extractionUnit(html: string, pageText: string): MeasurementUnit {
  const tableText = load(html)("table").text();
  return unitFrom(tableText || pageText);
}

function explicitCut(value: string | undefined) {
  if (
    !value ||
    !/skinny|slim|taper|straight|regular|relaxed|athletic|baggy|loose|wide[- ]leg/i.test(
      value,
    )
  ) {
    return null;
  }
  return inferCut(value);
}

function deterministicExtraction(
  html: string,
  modelName?: string,
): ChartExtraction {
  const $ = load(html);
  $("script,style,noscript,svg").remove();
  const pageTitle = compact($("title").first().text()) || null;
  const pageText = compact($("body").text());
  const basis = basisFrom(pageText);
  const prose = extractProseMeasurements(pageText);
  const preferredCut = explicitCut(modelName);
  let tableRows = combineSplitInseams(
    extractTables(html, pageText, preferredCut),
  );

  if (Object.keys(prose.observed).length > 0) {
    const targets = prose.sampleSize
      ? tableRows.filter(
          (row) =>
            baseSizeLabel(row.sizeLabel) === baseSizeLabel(prose.sampleSize!),
        )
      : [];
    if (targets.length > 0) {
      for (const target of targets) {
        target.observed = { ...target.observed, ...prose.observed };
        target.evidence = [...target.evidence, ...prose.evidence];
      }
    } else if (prose.sampleSize) {
      tableRows.push({
        sizeLabel: prose.sampleSize,
        observed: prose.observed,
        evidence: prose.evidence,
        cut: preferredCut ?? inferCut(pageText),
        stretchPct: inferStretch(pageText),
      });
    }
  }

  tableRows = mergeRows(tableRows);
  const warnings: string[] = [];
  if (tableRows.length === 0)
    warnings.push("no deterministic measurement rows");
  if (basis === "unknown")
    warnings.push("measurement basis could not be verified");
  const detectedUnit = extractionUnit(html, pageText);
  if (detectedUnit === "mixed")
    warnings.push("multiple measurement units detected");

  return {
    method: "deterministic",
    measurementBasis: basis,
    detectedUnit,
    rows: tableRows.map(toExtractedRow),
    warnings,
    pageTitle,
  };
}

export async function extractSizeChart({
  html,
  sourceUrl,
  brandName,
  modelName,
  llmExtractor,
}: {
  html: string;
  sourceUrl: string;
  brandName: string;
  modelName?: string;
  llmExtractor?: LlmExtractor;
}): Promise<ChartExtraction> {
  const deterministic = deterministicExtraction(html, modelName);
  if (deterministic.rows.length > 0 || !llmExtractor) return deterministic;

  const $ = load(html);
  $("script,style,noscript,svg").remove();
  const pageText = compact($("body").text()).slice(0, 24_000);
  const parsed = parseLlmExtraction(
    await llmExtractor({
      brandName,
      pageText,
      sourceUrl,
      ...(modelName ? { modelName } : {}),
    }),
  );
  const rows: ExtractedChartRow[] = parsed.rows.map((row) => {
    const observed: ObservedMeasurements = {
      ...(row.waistCm === null ? {} : { waistCm: row.waistCm }),
      ...(row.hipCm === null ? {} : { hipCm: row.hipCm }),
      ...(row.inseamCm === null ? {} : { inseamCm: row.inseamCm }),
      ...(row.thighCm === null ? {} : { thighCm: row.thighCm }),
      ...(row.riseCm === null ? {} : { riseCm: row.riseCm }),
      ...(row.legOpeningCm === null ? {} : { legOpeningCm: row.legOpeningCm }),
      ...(row.hemCm === null ? {} : { hemCm: row.hemCm }),
      ...(row.kneeCm === null ? {} : { kneeCm: row.kneeCm }),
    };
    return {
      sizeLabel: row.sizeLabel,
      observed,
      spec: makeSpec(observed, row.cut, row.stretchPct),
      evidence: row.evidence,
    };
  });

  return {
    method: "llm",
    measurementBasis: parsed.measurementBasis,
    detectedUnit: parsed.detectedUnit,
    rows,
    warnings: parsed.warnings,
    pageTitle: deterministic.pageTitle,
  };
}

function structuredNodes(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value.flatMap(structuredNodes);
  if (!value || typeof value !== "object") return [];
  const node = value as Record<string, unknown>;
  return [node, ...structuredNodes(node["@graph"])];
}

function isProductNode(node: Record<string, unknown>) {
  const type = node["@type"];
  return Array.isArray(type)
    ? type.some((value) => String(value).toLowerCase() === "product")
    : String(type).toLowerCase() === "product";
}

function parsePrice(value: unknown) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const cleaned = String(value).replace(/[^\d.,]/g, "");
  const normalized =
    cleaned.includes(",") && !cleaned.includes(".")
      ? cleaned.replace(",", ".")
      : cleaned.replace(/,/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0
    ? Math.round(amount * 100)
    : null;
}

export function extractProductPageMetadata(
  html: string,
  sourceUrl: string,
): ProductPageMetadata {
  const $ = load(html);
  const nodes: Array<Record<string, unknown>> = [];
  $('script[type="application/ld+json"]').each((_, script) => {
    try {
      nodes.push(...structuredNodes(JSON.parse($(script).text())));
    } catch {
      // Invalid retailer JSON-LD should not prevent chart extraction.
    }
  });
  const product = nodes.find(isProductNode);
  const offersValue = product?.offers;
  const offers = Array.isArray(offersValue)
    ? offersValue.find(
        (value): value is Record<string, unknown> =>
          Boolean(value) && typeof value === "object",
      )
    : offersValue && typeof offersValue === "object"
      ? (offersValue as Record<string, unknown>)
      : null;
  const canonicalHref = $('link[rel="canonical"]').attr("href");
  const canonicalUrl = new URL(
    canonicalHref || sourceUrl,
    sourceUrl,
  ).toString();
  const title = compact(
    String(product?.name ?? "") ||
      ($('meta[property="og:title"]').attr("content") ?? "") ||
      $("h1").first().text() ||
      $("title").text(),
  );
  const metaPrice =
    $('meta[property="product:price:amount"]').attr("content") ??
    $('[itemprop="price"]').attr("content");
  const priceCents = parsePrice(offers?.price ?? metaPrice);
  const currency = compact(
    String(
      offers?.priceCurrency ??
        $('meta[property="product:price:currency"]').attr("content") ??
        "USD",
    ),
  ).toUpperCase();

  return {
    isProduct: Boolean(product),
    title: title || null,
    canonicalUrl,
    priceCents,
    currency: currency || "USD",
  };
}
