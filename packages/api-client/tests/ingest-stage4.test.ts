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

  it("treats a 4xx robots response as unavailable and continues", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        new Response("Forbidden", {
          status: 403,
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
      minimumDelayMs: 0,
      jitterMs: 0,
    });

    await expect(
      fetcher.fetchHtml("https://brand.example/size-guide"),
    ).resolves.toMatchObject({ status: 200 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not continue when robots.txt is unreachable", async () => {
    const fetchImpl = jest.fn(async () =>
      Promise.resolve(
        new Response("Unavailable", {
          status: 503,
          headers: { "content-type": "text/plain" },
        }),
      ),
    ) as unknown as typeof fetch;
    const fetcher = createPoliteFetcher({
      fetchImpl,
      maximumAttempts: 1,
      minimumDelayMs: 0,
      jitterMs: 0,
    });

    await expect(
      fetcher.fetchHtml("https://brand.example/size-guide"),
    ).rejects.toMatchObject<Partial<IngestionFetchError>>({
      code: "HTTP_ERROR",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("cancels an HTML stream that exceeds the configured byte limit", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        new Response("User-agent: *\nAllow: /", {
          status: 200,
          headers: { "content-type": "text/plain" },
        }),
      )
      .mockResolvedValueOnce(
        new Response("<html><body>too large</body></html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      ) as unknown as typeof fetch;
    const fetcher = createPoliteFetcher({
      fetchImpl,
      maximumBytes: 8,
      minimumDelayMs: 0,
      jitterMs: 0,
    });

    await expect(
      fetcher.fetchHtml("https://brand.example/size-guide"),
    ).rejects.toMatchObject<Partial<IngestionFetchError>>({
      code: "RESPONSE_TOO_LARGE",
    });
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

  it("reads a dual-unit chart that labels its first column US Size", async () => {
    const extraction = await extractSizeChart({
      html: `
        <html><body>
          <p>Use these body measurements to find your denim size.</p>
          <table>
            <thead><tr><th>US Size</th><th>Waist</th><th>Hip</th></tr></thead>
            <tbody><tr>
              <td>28</td>
              <td><span class="inches">28&quot;<span class="visually-hidden">Inches</span></span><span class="cm">71</span></td>
              <td><span class="inches">38&quot;<span class="visually-hidden">Inches</span></span><span class="cm">96.5</span></td>
            </tr></tbody>
          </table>
        </body></html>`,
      sourceUrl: "https://official.example/dual-unit-chart",
      brandName: "Dual Unit Denim",
    });

    expect(extraction.measurementBasis).toBe("body");
    expect(extraction.rows[0]).toMatchObject({
      sizeLabel: "28",
      spec: { waistCm: 71.1 },
      observed: { hipCm: 96.5 },
    });
  });

  it("reads a transposed suggested-size chart", async () => {
    const extraction = await extractSizeChart({
      html: `
        <html><body>
          <p>Measure along the natural waistline. All measurements are in inches.</p>
          <table><tbody>
            <tr><th>Men's Suggested Size</th><td>32</td><td>34</td></tr>
            <tr><th>Waist</th><td>30</td><td>32-33</td></tr>
            <tr><th>Seat</th><td>36</td><td>38</td></tr>
          </tbody></table>
        </body></html>`,
      sourceUrl: "https://official.example/transposed-chart",
      brandName: "Transposed Workwear",
    });

    expect(extraction.measurementBasis).toBe("body");
    expect(extraction.rows).toHaveLength(2);
    expect(extraction.rows[1]).toMatchObject({
      sizeLabel: "34",
      spec: { waistCm: 82.6 },
      observed: { hipCm: 96.5 },
    });
  });

  it("reads tabular HTML embedded in application state", async () => {
    const embedded = JSON.stringify({
      chart: `<p>Actual garment measurements</p><table><tr><th>Size</th><th>Waist (cm)</th><th>Inseam (cm)</th></tr><tr><td>32x32</td><td>82</td><td>81</td></tr></table>`,
    });
    const extraction = await extractSizeChart({
      html: `<html><body><script type="application/json">${embedded}</script></body></html>`,
      sourceUrl: "https://official.example/embedded-chart",
      brandName: "Embedded Denim",
    });

    expect(extraction.measurementBasis).toBe("garment");
    expect(extraction.rows[0]).toMatchObject({
      sizeLabel: "32x32",
      spec: { waistCm: 82, inseamCm: 81 },
    });
  });

  it("reads per-model point-of-measure tables without mixing in body rows", async () => {
    const extraction = await extractSizeChart({
      html: `<html><body>
        <p>The chart below is displaying garment measurements. Toggle to body measurements.</p>
        <table>
          <tr><th>Denim Size</th><th>Waist (Smallest point)</th><th>Hip (Fullest point)</th></tr>
          <tr><td>28</td><td>29&quot;</td><td>39&quot;</td></tr>
        </table>
        <table>
          <tr>
            <th>Point of Measure</th><th>Garment: Waist</th><th>Garment: Low Hip</th>
            <th>Garment Front Rise</th><th>Garment: Thigh</th><th>Garment Leg opening</th>
            <th>Garment: Inseam ANKLE</th><th>Garment: REGULAR Inseam</th><th>Garment: Inseam TALL</th>
          </tr>
          <tr>
            <td>28</td><td>30 1/4&quot;</td><td>38 1/4&quot;</td><td>11 3/4&quot;</td>
            <td>23&quot;</td><td>13 1/2&quot;</td><td>26 1/2&quot;</td><td>28 1/2&quot;</td><td>30 1/2&quot;</td>
          </tr>
          <tr>
            <td>28</td><td>57.785</td><td>72.39</td><td>26.67</td>
            <td>44.45</td><td>20.0025</td><td>67.31</td><td>72.39</td><td>77.47</td>
          </tr>
        </table>
      </body></html>`,
      sourceUrl: "https://official.example/model-garment-chart",
      brandName: "Point of Measure Denim",
      modelName: "Original Straight",
    });

    expect(extraction.measurementBasis).toBe("garment");
    expect(extraction.rows.map((row) => row.sizeLabel)).toEqual([
      "28x26.5",
      "28x28.5",
      "28x30.5",
    ]);
    expect(extraction.rows[1]).toMatchObject({
      spec: {
        waistCm: 76.8,
        inseamCm: 72.4,
        thighCm: 58.4,
        riseCm: 29.8,
        legOpeningCm: 34.3,
      },
    });
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
          "image": ["https://cdn.example/daren-front.jpg"],
          "offers": {"price": "92,00", "priceCurrency": "USD"}
        }</script>
      </head><body></body></html>`,
      "https://loomandline.example/products/daren?color=indigo",
    );

    expect(metadata).toEqual({
      isProduct: true,
      title: "Daren Regular Straight Jean",
      canonicalUrl: "https://loomandline.example/products/daren-straight",
      imageUrl: "https://cdn.example/daren-front.jpg",
      priceCents: 9_200,
      currency: "USD",
    });
  });

  it("finds product variants nested inside a ProductGroup", () => {
    const metadata = extractProductPageMetadata(
      `<html><head>
        <link rel="canonical" href="/products/original-straight" />
        <script type="application/ld+json">{
          "@type": "ProductGroup",
          "name": "Original Straight Jean",
          "hasVariant": [{
            "@type": "Product",
            "name": "Original Straight Jean in Indigo",
            "offers": {"price": "118.00", "priceCurrency": "USD"}
          }]
        }</script>
      </head><body></body></html>`,
      "https://denim.example/products/original-straight?color=indigo",
    );

    expect(metadata).toEqual({
      isProduct: true,
      title: "Original Straight Jean in Indigo",
      canonicalUrl: "https://denim.example/products/original-straight",
      imageUrl: null,
      priceCents: 11_800,
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
