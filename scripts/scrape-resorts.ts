import { chromium, type Page } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface ScrapedResortData {
  status: "OPEN" | "PARTIAL" | "CLOSED" | "UNKNOWN";
  baseDepthCm: number | null;
  liftsOpen: number | null;
  slopesOpen: number | null;
  temperature: number | null;
  weather: string | null;
  scrapedAt: string;
  error?: string;
}

interface ScrapedData {
  scrapedAt: string;
  resorts: Record<string, ScrapedResortData>;
}

async function scrapeMadarao(page: Page): Promise<ScrapedResortData> {
  console.log("Scraping Madarao...");

  try {
    await page.goto("https://www.madarao.jp/ski", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const data = await page.evaluate(() => {
      const t = document.body.innerText;
      const nl = String.fromCharCode(10);
      const result: Record<string, unknown> = {};

      // Snow depth: "積雪\n10 cm"
      let i = t.indexOf("積雪");
      if (i > -1) {
        const chunk = t.substring(i, i + 15).split(nl)[1];
        result.snowDepthCm = parseInt(chunk) || null;
      }

      // Temperature: "気温\n3 ℃"
      i = t.indexOf("気温");
      if (i > -1) {
        const chunk = t.substring(i, i + 15).split(nl)[1];
        result.temperatureC = parseInt(chunk) || null;
      }

      // Weather: "天候\n曇り"
      i = t.indexOf("天候");
      if (i > -1) {
        result.weather = t.substring(i, i + 15).split(nl)[1]?.trim() || null;
      }

      // Lifts: "リフト5基" (リフト is 3 chars)
      i = t.indexOf("リフト");
      if (i > -1) {
        result.liftsOpen = parseInt(t.substring(i + 3, i + 5)) || null;
      }

      // Courses: after "基、" comes the course count
      i = t.indexOf("基、");
      if (i > -1) {
        result.coursesOpen = parseInt(t.substring(i + 2, i + 5)) || null;
      }

      return result;
    });

    // Determine status based on lifts open
    let status: ScrapedResortData["status"] = "UNKNOWN";
    if (data.liftsOpen !== null && data.liftsOpen !== undefined) {
      if (data.liftsOpen === 0) {
        status = "CLOSED";
      } else if (data.liftsOpen < 10) {
        // Madarao has 10 total lifts
        status = "PARTIAL";
      } else {
        status = "OPEN";
      }
    }

    return {
      status,
      baseDepthCm: (data.snowDepthCm as number) ?? null,
      liftsOpen: (data.liftsOpen as number) ?? null,
      slopesOpen: (data.coursesOpen as number) ?? null,
      temperature: (data.temperatureC as number) ?? null,
      weather: (data.weather as string) ?? null,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error scraping Madarao:", error);
    return {
      status: "UNKNOWN",
      baseDepthCm: null,
      liftsOpen: null,
      slopesOpen: null,
      temperature: null,
      weather: null,
      scrapedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function scrapeLotteArai(page: Page): Promise<ScrapedResortData> {
  console.log("Scraping Lotte Arai...");

  try {
    // Main page has weather info - use domcontentloaded as site is JS heavy
    await page.goto("https://www.lottehotel.com/arai-resort/en", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Wait for weather info to load
    await page.waitForTimeout(5000);

    // Dismiss cookie banner if present
    try {
      const cookieBtn = page.locator('button:has-text("Full agreement")');
      if (await cookieBtn.isVisible({ timeout: 3000 })) {
        await cookieBtn.click();
        await page.waitForTimeout(500);
      }
    } catch {
      // Cookie banner might not be present
    }

    const weatherData = await page.evaluate(() => {
      const t = document.body.innerText;
      const nl = String.fromCharCode(10);
      const result: Record<string, unknown> = {};

      // Total Snowfall: "Total Snowfall\n209 ㎝"
      let i = t.indexOf("Total Snowfall");
      if (i > -1) {
        const chunk = t.substring(i, i + 25).split(nl)[1];
        result.totalSnowfallCm = parseInt(chunk) || null;
      }

      // New snow: "New snow\n0 ㎝"
      i = t.indexOf("New snow");
      if (i > -1) {
        const chunk = t.substring(i, i + 20).split(nl)[1];
        result.newSnowCm = parseInt(chunk) || 0;
      }

      // Temperature: "current weather\n9.1℃"
      i = t.indexOf("current weather");
      if (i > -1) {
        const chunk = t.substring(i, i + 30).split(nl)[1];
        result.temperatureC = parseFloat(chunk) || null;
      }

      return result;
    });

    // Go to slope conditions page for lift/course data
    await page.goto("https://www.lottehotel.com/arai-resort/en/snow-season", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Wait for slope conditions to load
    await page.waitForTimeout(5000);

    // Try to extract lift/course data from the slope conditions page
    // Note: Status indicators are rendered as images, not text, making accurate
    // counting difficult. We'll return null for these fields when uncertain.
    const slopeData = await page.evaluate(() => {
      const t = document.body.innerText;

      // Look for "Running" text or count text patterns
      // The page shows a legend: "● Running | △ Preparing | × Service suspended"
      const hasRunning = t.includes("Running");
      const hasSuspended = t.includes("Service suspended") || t.includes("×");

      // Try to find any numeric indicators like "2/5" or similar
      const liftCountMatch = t.match(/(\d+)\s*\/\s*(\d+)\s*lift/i);
      const courseCountMatch = t.match(/(\d+)\s*\/\s*(\d+)\s*course/i);

      return {
        liftsOpen: liftCountMatch ? parseInt(liftCountMatch[1]) : null,
        coursesOpen: courseCountMatch ? parseInt(courseCountMatch[1]) : null,
        hasRunningIndicator: hasRunning,
        hasSuspendedIndicator: hasSuspended,
      };
    });

    // Determine status based on indicators
    let status: ScrapedResortData["status"] = "UNKNOWN";
    if (slopeData.hasRunningIndicator && slopeData.hasSuspendedIndicator) {
      status = "PARTIAL"; // Some lifts running, some suspended
    } else if (slopeData.hasRunningIndicator) {
      status = "OPEN";
    } else if (slopeData.hasSuspendedIndicator) {
      status = "CLOSED";
    }

    return {
      status,
      baseDepthCm: (weatherData.totalSnowfallCm as number) ?? null,
      liftsOpen: slopeData.liftsOpen ?? null,
      slopesOpen: slopeData.coursesOpen ?? null,
      temperature: (weatherData.temperatureC as number) ?? null,
      weather: null, // Lotte Arai doesn't show weather description
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error scraping Lotte Arai:", error);
    return {
      status: "UNKNOWN",
      baseDepthCm: null,
      liftsOpen: null,
      slopesOpen: null,
      temperature: null,
      weather: null,
      scrapedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log("Starting resort scraper...");
  console.log("Time:", new Date().toISOString());

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    const [madarao, lotteArai] = await Promise.all([
      scrapeMadarao(await context.newPage()),
      scrapeLotteArai(await context.newPage()),
    ]);

    const output: ScrapedData = {
      scrapedAt: new Date().toISOString(),
      resorts: {
        madarao,
        "lotte-arai": lotteArai,
      },
    };

    console.log("\nScraped data:");
    console.log(JSON.stringify(output, null, 2));

    // Write to public/data/resort-status.json
    const outputPath = join(__dirname, "../public/data/resort-status.json");
    const outputDir = dirname(outputPath);

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\nWritten to ${outputPath}`);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

main().catch(console.error);
