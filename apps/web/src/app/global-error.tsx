"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void import("@sentry/react").then((Sentry) => {
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          style={{
            alignItems: "center",
            background: "#fff9f0",
            color: "#3f1119",
            display: "flex",
            flexDirection: "column",
            fontFamily: "Georgia, serif",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "3rem", margin: 0 }}>Rober</p>
          <h1 style={{ fontSize: "2rem", margin: "2rem 0 0" }}>
            We hit a temporary snag.
          </h1>
          <p style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.6 }}>
            Your fit memory is safe. Retry to continue.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#711d2b",
              border: 0,
              borderRadius: "6px",
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
              marginTop: "1rem",
              minHeight: "48px",
              padding: "0 1.5rem",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
