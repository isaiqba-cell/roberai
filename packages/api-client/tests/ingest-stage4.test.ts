import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  IngestionFetchError,
  assessExtractionConfidence,
  createPoliteFetcher,
  discoverSizeChartCandidates,
  extractProductPageMetadata,
  extractSizeChart,
  parseMeasurementToCm,
  type ChartExtraction,
  type LlmExtractor,
} from "../src/ingest";

function fixture(name: string) {
  return readFileSync(
    resolve(process.cwd(), "tests", "fixtures", "size-charts", name),
    "utf8",
  );
}

describe("Stage 4 source discovery", () => {
  it("ranks official sources above retailers and editorial pages", async () => {
    const candidates = await discoverSizeChartCandidates({
      target: {
        brandName: "Loom & Line",
        brandSlug: "loom-line",
        modelName: "Daren",
        officialDomains: ["loomandline.example"],
      },
      maxQueries: 1,
      search: async () => [
        {
          title: "Daren size guide",
          link: "https://loomandline.example/size-guide?utm_source=test&srsltid=abc",
          position: 3,
        },
        {
          title: "Daren jeans measurements",
          link: "https://www.nordstrom.com/daren-jeans",
          position: 1,
        },
        {
          title: "My Daren jeans review",
          link: "https://denim-blog.example/review/daren",
          position: 2,
        },
      ],
    });

    expect(candidates.map((candidate) => candidate.sourceKind)).toEqual([
      "official",
      "retailer",
      "editorial",
    ]);
    expect(candidates[0]?.canonicalUrl).toBe(
      "https://loomandline.example/size-guide",
    );
  });
});

describe("Stage 4 polite fetching", () => {
  it("stops before requesting a page denied by robots.txt", async () => {
    const fetchImpl = jest.fn(async () =>
      Promise.resolve(
        new Response("User-agent: *\nDisallow: /size-guide", {
          status: 200,
          headers: { "content-type": "text/plain" },
        }),
      ),
    ) as unknown as typeof fetch;
    const fetcher = createPoliteFetcher({
      fetchImpl,
      minimumDelayMs: 0,
      jitterMs: 0,
    });

    await expect(
      fetcher.fetchHtml("https://brand.example/size-guide"),
    ).rejects.toMatchObject<Partial<IngestionFetchError>>({
      code: "ROBOTS_DENIED",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("keeps at least five seconds between same-domain requests", async () => {
    let now = 0;
    const sleeps: number[] = [];
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        new Response("User-agent: *\nAllow: /", {
          status: 200,
          headers: { "content-type": "text/plain" },
        }),
      )
      .mockResolvedValueOnce(
        new Response("<html><body>Size chart</body></html>", {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      ) as unknown as typeof fetch;
    const fetcher = createPoliteFetcher({
      fetchImpl,
      minimumDelayMs: 5_000,
      jitterMs: 0,
      now: () => now,
      sleep: async (milliseconds) => {
        sleeps.push(milliseconds);
        now += milliseconds;
      },
    });

    const snapshot = await fetcher.fetchHtml(
      "https://brand.example/size-guide",
    );
    expect(sleeps).toContain(5_000);
    expect(snapshot.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("caps transient network retries at two", async () => {
    const sleeps: number[] = [];
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        new Response("User-agent: *\nAllow: /", {
          status: 200,
          headers: { "content-type": "text/plain" },
        }),
      )
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(new Response("still busy", { status: 503 }))
      .mockResolvedValueOnce(
        new Response("<html><body>Ready</body></html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      ) as unknown as typeof fetch;
    const fetcher = createPoliteFetcher({
      fetchImpl,
      minimumDelayMs: 0,
      jitterMs: 0,
      sleep: async (milliseconds) => {
        sleeps.push(milliseconds);
      },
    });

    await expect(
      fetcher.fetchHtml("https://brand.example/size-guide"),
    ).resolves.toMatchObject({ status: 200 });
    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(sleeps).toEqual(expect.arrayContaining([500, 1_000]));
  });
});

describe("Stage 4 deterministic extraction", () => {
  it("normalizes fractions and ranges", () => {
    expect(parseMeasurementToCm("31 1/2 in", "waistCm")).toBe(80);
    expect(parseMeasurementToCm("31½ in", "waistCm")).toBe(80);
    expect(parseMeasurementToCm("78-82 cm", "waistCm")).toBe(80);
  });

  it.each([
    ["levis.html", "garment", "32x32", 83.8, 81.3],
    ["lee.html", "body", "32x32", 84, 81],
    ["wrangler.html", "garment", "31x32", 81.3, 81.3],
    ["madewell.html", "body", "28", 71.1, undefined],
    ["uniqlo.html", "garment", "30", 81, 76],
  ])(
    "extracts %s into canonical centimeters",
    async (name, basis, sizeLabel, waistCm, inseamCm) => {
      const extraction = await extractSizeChart({
        html: fixture(String(name)),
        sourceUrl: `https://official.example/${name}`,
        brandName: String(name).split(".")[0]!,
      });
      const row = extraction.rows.find(
        (candidate) => candidate.sizeLabel === sizeLabel,
      );

      expect(extraction.method).toBe("deterministic");
      expect(extraction.measurementBasis).toBe(basis);
      expect(row?.spec.waistCm).toBe(waistCm);
      expect(row?.spec.inseamCm).toBe(inseamCm);
    },
  );

  it("adds model construction measurements to every matching inseam", async () => {
    const extraction = await extractSizeChart({
      html: fixture("levis.html"),
      sourceUrl: "https://official.example/levis",
      brandName: "Levi's",
      modelName: "505 Regular",
    });
    const size32Rows = extraction.rows.filter((row) =>
      row.sizeLabel.startsWith("32x"),
    );

    expect(size32Rows).toHaveLength(3);
    expect(size32Rows.every((row) => row.spec.riseCm === 28.6)).toBe(true);
    expect(size32Rows.every((row) => row.spec.legOpeningCm === 40.6)).toBe(
      true,
    );
  });

  it("uses a schema-validated mocked LLM only when tables yield no rows", async () => {
    const llmExtractor = jest.fn<
      ReturnType<LlmExtractor>,
      Parameters<LlmExtractor>
    >(async (_request) => ({
      measurementBasis: "garment",
      detectedUnit: "cm",
      rows: [
        {
          sizeLabel: "M",
          waistCm: 82,
          hipCm: null,
          inseamCm: 79,
          thighCm: 62,
          riseCm: 29,
          legOpeningCm: 43,
          hemCm: null,
          kneeCm: null,
          stretchPct: 1,
          cut: "straight",
          evidence: ["visual grid row M"],
        },
      ],
      warnings: [],
    }));

    const extraction = await extractSizeChart({
      html: "<html><head><title>Visual chart</title></head><body><div>Interactive sizing grid</div></body></html>",
      sourceUrl: "https://brand.example/visual-chart",
      brandName: "Example",
      llmExtractor,
    });

    expect(llmExtractor).toHaveBeenCalledTimes(1);
    expect(extraction.method).toBe("llm");
    expect(extraction.rows[0]?.spec.waistCm).toBe(82);
  });

  it("extracts a canonical product link and visible structured price", () => {
    const metadata = extractProductPageMetadata(
      `<html><head>
        <link rel="canonical" href="/products/daren-straight" />
        <script type="application/ld+json">{
          "@type": "Product",
          "name": "Daren Regular Straight Jean",
          "offers": {"price": "92,00", "priceCurrency": "USD"}
        }</script>
      </head><body></body></html>`,
      "https://loomandline.example/products/daren?color=indigo",
    );

    expect(metadata).toEqual({
      isProduct: true,
      title: "Daren Regular Straight Jean",
      canonicalUrl: "https://loomandline.example/products/daren-straight",
      priceCents: 9_200,
      currency: "USD",
    });
  });
});

describe("Stage 4 publication confidence", () => {
  const extraction: ChartExtraction = {
    method: "deterministic",
    measurementBasis: "garment",
    detectedUnit: "cm",
    rows: [
      {
        sizeLabel: "32x32",
        spec: {
          waistCm: 83,
          inseamCm: 81,
          thighCm: 61,
          riseCm: 28,
          legOpeningCm: 42,
          stretchPct: 1,
          cut: "straight",
        },
        observed: {
          waistCm: 83,
          inseamCm: 81,
          thighCm: 61,
          riseCm: 28,
          legOpeningCm: 42,
        },
        evidence: ["official chart row"],
      },
    ],
    warnings: [],
    pageTitle: "Official size chart",
  };

  it("publishes strong official garment data", () => {
    const result = assessExtractionConfidence({
      extraction,
      sourceKind: "official",
    });
    expect(result.status).toBe("published");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    expect(result.needsReview).toBe(false);
  });

  it("flags changed content even when its dimensions remain plausible", () => {
    const result = assessExtractionConfidence({
      extraction,
      sourceKind: "official",
      contentChanged: true,
    });
    expect(result.status).toBe("published");
    expect(result.needsReview).toBe(true);
    expect(result.flags).toContain(
      "source content changed since prior version",
    );
  });
});
