/**
 * Render script for personalized lead videos.
 *
 * Usage:
 *   npx ts-node render-video.ts \
 *     --lead-name "Sarah" \
 *     --message "Hi Sarah, your home on Maple Drive..." \
 *     --property-image "https://example.com/house.jpg" \
 *     --output ./out/sarah-video.mp4 \
 *     [--agent-name "Jorge"] \
 *     [--brand-color "#1a73e8"] \
 *     [--property-address "123 Main St"] \
 *     [--market-data "Home values up 12%"] \
 *     [--phone "(512) 555-0199"] \
 *     [--calendar "calendly.com/jorge"] \
 *     [--format vertical|horizontal]
 */

import path from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

// ─── CLI Argument Parsing ────────────────────────────────────────────

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (key.startsWith("--") && i + 1 < argv.length) {
      const name = key.slice(2); // strip leading "--"
      args[name] = argv[++i];
    }
  }
  return args;
}

function required(args: Record<string, string>, key: string): string {
  const val = args[key];
  if (!val) {
    console.error(`Missing required argument: --${key}`);
    process.exit(1);
  }
  return val;
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  const leadName = required(args, "lead-name");
  const message = required(args, "message");
  const propertyImage = required(args, "property-image");
  const outputPath = required(args, "output");

  const agentName = args["agent-name"] ?? "Jorge";
  const brandColor = args["brand-color"] ?? "#1a73e8";
  const propertyAddress = args["property-address"] ?? "123 Main Street, Austin TX";
  const marketData = args["market-data"] ?? "Home values up 8% this year";
  const phoneNumber = args["phone"] ?? "(512) 555-0199";
  const calendarLink = args["calendar"] ?? "calendly.com/jorge-ramirez";
  const format = args["format"] ?? "vertical";

  const compositionId =
    format === "horizontal" ? "LeadVideoHorizontal" : "LeadVideoVertical";

  const inputProps = {
    leadName,
    message,
    propertyImage,
    propertyAddress,
    marketData,
    agentName,
    brandColor,
    phoneNumber,
    calendarLink,
  };

  console.log(`Bundling Remotion project...`);
  const entryPoint = path.resolve(__dirname, "jorge-videos/src/index.ts");
  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  console.log(`Selecting composition: ${compositionId}`);
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps,
  });

  const absoluteOutput = path.resolve(outputPath);
  console.log(`Rendering to ${absoluteOutput} ...`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: absoluteOutput,
    inputProps,
    onProgress: ({ progress }) => {
      const pct = (progress * 100).toFixed(1);
      process.stdout.write(`\rRendering: ${pct}%`);
    },
  });

  console.log(`\nDone! Video saved to ${absoluteOutput}`);
}

main().catch((err) => {
  console.error("Render failed:", err);
  process.exit(1);
});
