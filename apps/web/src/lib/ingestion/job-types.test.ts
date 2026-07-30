import { parseIngestionJob } from "./job-types";

describe("parseIngestionJob", () => {
  const payload = {
    brandSlug: "madewell",
    brandName: "Madewell",
    modelName: "Women's denim size chart",
    category: "jeans" as const,
    sourceUrl: "https://www.madewell.com/Denim-SizeChart.html",
  };

  it("accepts an admin chart job with a supplied HTTPS source", () => {
    expect(parseIngestionJob("ingest_size_chart", payload)).toEqual({
      type: "ingest_size_chart",
      payload,
    });
  });

  it("keeps anchor ingestion distinct from body-chart ingestion", () => {
    expect(parseIngestionJob("ingest_reference", payload).type).toBe(
      "ingest_reference",
    );
    expect(() =>
      parseIngestionJob("ingest_size_chart", {
        ...payload,
        sourceUrl: "http://example.com/chart",
      }),
    ).toThrow();
  });
});
