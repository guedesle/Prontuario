import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

async function collectFiles(dir: string, extension: string): Promise<string[]> {
  const found: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await collectFiles(fullPath, extension)));
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      found.push(fullPath);
    }
  }

  return found;
}

async function publicStatus(filePath: string | undefined, appUrl: string, staticRoot: string) {
  if (!filePath) return null;

  const relative = path.relative(staticRoot, filePath).split(path.sep).join("/");
  const url = new URL(`/_next/static/${relative}`, appUrl);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return response.status;
  } catch {
    return -1;
  }
}

export async function GET() {
  const staticRoot = path.join(process.cwd(), ".next", "static");
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  try {
    const [cssFiles, jsFiles] = await Promise.all([
      collectFiles(staticRoot, ".css"),
      collectFiles(staticRoot, ".js"),
    ]);

    const [cssPublicStatus, jsPublicStatus] = await Promise.all([
      publicStatus(cssFiles[0], appUrl, staticRoot),
      publicStatus(jsFiles[0], appUrl, staticRoot),
    ]);

    return NextResponse.json(
      {
        status: "ok",
        localAssets: {
          cssPresent: cssFiles.length > 0,
          jsPresent: jsFiles.length > 0,
        },
        publicDelivery: {
          cssStatus: cssPublicStatus,
          jsStatus: jsPublicStatus,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        localAssets: { cssPresent: false, jsPresent: false },
        publicDelivery: { cssStatus: null, jsStatus: null },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
