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

    // Go to slopes-guide page which has lift/course status via aria-labels
    await page.goto(
      "https://www.lottehotel.com/arai-resort/en/snow/slopes-guide",
      {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      }
    );

    // Wait for content to load
    await page.waitForTimeout(5000);

    // Extract lift/course data using aria-label attributes
    // aria-label="Open" = running, aria-label="Close" = suspended
    const slopeData = await page.evaluate(() => {
      let liftsOpen = 0;
      let liftsClosed = 0;
      let coursesOpen = 0;
      let coursesClosed = 0;

      document
        .querySelectorAll('[aria-label="Open"], [aria-label="Close"]')
        .forEach((el) => {
          const row = el.closest("li, tr, div");
          const text = row?.textContent || "";
          const isOpen = el.getAttribute("aria-label") === "Open";

          // Lifts have "Lift" or "Gondola" in the text
          if (text.includes("Lift") || text.includes("Gondola")) {
            if (isOpen) liftsOpen++;
            else liftsClosed++;
          }
          // Courses have course names but no "Lift"/"Gondola"
          else if (
            text.length > 10 &&
            !text.includes("Running") &&
            !text.includes("suspended")
          ) {
            if (isOpen) coursesOpen++;
            else coursesClosed++;
          }
        });

      return { liftsOpen, liftsClosed, coursesOpen, coursesClosed };
    });

    // Determine status based on lift counts
    let status: ScrapedResortData["status"] = "UNKNOWN";
    if (slopeData.liftsOpen > 0 && slopeData.liftsClosed > 0) {
      status = "PARTIAL";
    } else if (slopeData.liftsOpen > 0) {
      status = "OPEN";
    } else if (slopeData.liftsClosed > 0) {
      status = "CLOSED";
    }

    return {
      status,
      baseDepthCm: (weatherData.totalSnowfallCm as number) ?? null,
      liftsOpen: slopeData.liftsOpen,
      slopesOpen: slopeData.coursesOpen,
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

async function scrapeShigaKogen(page: Page): Promise<ScrapedResortData> {
  console.log("Scraping Shiga Kogen...");

  try {
    await page.goto("https://shigakogen-ski.or.jp/lift/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Wait for content to load
    await page.waitForTimeout(5000);

    const data = await page.evaluate(() => {
      const t = document.body.innerText;

      // Count lift status: 運行中 (Open) vs 運休中 (Closed)
      const liftsOpen = (t.match(/運行中/g) || []).length;
      const liftsClosed = (t.match(/運休中/g) || []).length;

      return { liftsOpen, liftsClosed };
    });

    // Determine status based on lifts
    let status: ScrapedResortData["status"] = "UNKNOWN";
    const totalLifts = data.liftsOpen + data.liftsClosed;
    if (totalLifts > 0) {
      if (data.liftsOpen === 0) {
        status = "CLOSED";
      } else if (data.liftsClosed > 0) {
        status = "PARTIAL";
      } else {
        status = "OPEN";
      }
    }

    return {
      status,
      baseDepthCm: null,
      liftsOpen: data.liftsOpen,
      slopesOpen: null, // Shiga Kogen doesn't show simple slope count
      temperature: null,
      weather: null,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error scraping Shiga Kogen:", error);
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

async function scrapeSuginohara(page: Page): Promise<ScrapedResortData> {
  console.log("Scraping Suginohara...");

  try {
    await page.goto(
      "https://www.princehotels.co.jp/ski/myoko/winter/coursemap/",
      {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      }
    );

    // Wait for content to load
    await page.waitForTimeout(5000);

    const data = await page.evaluate(() => {
      const t = document.body.innerText;

      // Look for patterns like "コース 10/16" and "リフト 2/5"
      let liftsOpen = null;
      let liftsTotal = null;
      let coursesOpen = null;
      let coursesTotal = null;

      // Match lift pattern: リフト followed by number/number
      const liftMatch = t.match(/リフト\s*(\d+)\s*[/／]\s*(\d+)/);
      if (liftMatch) {
        liftsOpen = parseInt(liftMatch[1]);
        liftsTotal = parseInt(liftMatch[2]);
      }

      // Match course pattern: コース followed by number/number
      const courseMatch = t.match(/コース\s*(\d+)\s*[/／]\s*(\d+)/);
      if (courseMatch) {
        coursesOpen = parseInt(courseMatch[1]);
        coursesTotal = parseInt(courseMatch[2]);
      }

      return { liftsOpen, liftsTotal, coursesOpen, coursesTotal };
    });

    // Determine status based on lifts (total: 5)
    let status: ScrapedResortData["status"] = "UNKNOWN";
    if (data.liftsOpen !== null && data.liftsTotal !== null) {
      if (data.liftsOpen === 0) {
        status = "CLOSED";
      } else if (data.liftsOpen < data.liftsTotal) {
        status = "PARTIAL";
      } else {
        status = "OPEN";
      }
    }

    return {
      status,
      baseDepthCm: null,
      liftsOpen: data.liftsOpen,
      slopesOpen: data.coursesOpen,
      temperature: null,
      weather: null,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error scraping Suginohara:", error);
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

async function scrapeIkenotaira(page: Page): Promise<ScrapedResortData> {
  console.log("Scraping Ikenotaira...");

  try {
    // Go directly to the slope guide section
    await page.goto("https://alpenblick-resort.com/ski#ski_guide", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Wait for content to load
    await page.waitForTimeout(5000);

    const data = await page.evaluate(() => {
      const t = document.body.innerText;

      // Count lifts: "In service" vs "Service suspended"
      const liftsOpen = (t.match(/In service/gi) || []).length;
      const liftsSuspended = (t.match(/Service suspended/gi) || []).length;

      // Count courses: look for "Closed" after course specs
      const coursesClosed = (t.match(/\)\s*Closed/g) || []).length;
      const coursesOpen = (t.match(/\)\s*Open(?!ing)/g) || []).length;

      // Check if main page shows CLOSE status
      const isClosed = /\[Today's business hours\]\s*CLOSE/i.test(t);

      return {
        liftsOpen,
        liftsSuspended,
        coursesOpen,
        coursesClosed,
        isClosed,
      };
    });

    // Determine status based on lifts (total: 5)
    let status: ScrapedResortData["status"] = "UNKNOWN";
    const totalLifts = data.liftsOpen + data.liftsSuspended;
    if (data.isClosed) {
      status = "CLOSED";
    } else if (totalLifts > 0) {
      if (data.liftsOpen === 0) {
        status = "CLOSED";
      } else if (data.liftsOpen < totalLifts) {
        status = "PARTIAL";
      } else {
        status = "OPEN";
      }
    } else if (data.coursesOpen === 0 && data.coursesClosed > 0) {
      status = "CLOSED";
    }

    return {
      status,
      baseDepthCm: null,
      liftsOpen: data.liftsOpen,
      slopesOpen: data.coursesOpen,
      temperature: null,
      weather: null,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error scraping Ikenotaira:", error);
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

async function scrapeAkakuraKanko(page: Page): Promise<ScrapedResortData> {
  console.log("Scraping Akakura Kanko...");

  try {
    await page.goto("https://akr-ski.com/slope/", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const data = await page.evaluate(() => {
      const t = document.body.innerText;

      // Count lifts: 運行中 (operating) vs 停止中 (stopped)
      const liftsOpen = (t.match(/運行中/g) || []).length;
      const liftsStopped = (t.match(/停止中/g) || []).length;

      // Count courses: 滑走可 (skiable) vs 滑走不可 (not skiable)
      const coursesOpen = (t.match(/滑走可/g) || []).length;
      const coursesClosed = (t.match(/滑走不可/g) || []).length;

      // Adjust coursesOpen since 滑走可 also matches within 滑走不可
      const actualCoursesOpen = coursesOpen - coursesClosed;

      return {
        liftsOpen,
        liftsStopped,
        coursesOpen: actualCoursesOpen,
        coursesClosed,
      };
    });

    // Determine status based on lifts (total: 6)
    let status: ScrapedResortData["status"] = "UNKNOWN";
    const totalLifts = data.liftsOpen + data.liftsStopped;
    if (totalLifts > 0) {
      if (data.liftsOpen === 0) {
        status = "CLOSED";
      } else if (data.liftsOpen < totalLifts) {
        status = "PARTIAL";
      } else {
        status = "OPEN";
      }
    }

    return {
      status,
      baseDepthCm: null,
      liftsOpen: data.liftsOpen,
      slopesOpen: data.coursesOpen,
      temperature: null,
      weather: null,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error scraping Akakura Kanko:", error);
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
    const [
      madarao,
      lotteArai,
      akakuraKanko,
      ikenotaira,
      suginohara,
      shigaKogen,
    ] = await Promise.all([
      scrapeMadarao(await context.newPage()),
      scrapeLotteArai(await context.newPage()),
      scrapeAkakuraKanko(await context.newPage()),
      scrapeIkenotaira(await context.newPage()),
      scrapeSuginohara(await context.newPage()),
      scrapeShigaKogen(await context.newPage()),
    ]);

    const output: ScrapedData = {
      scrapedAt: new Date().toISOString(),
      resorts: {
        madarao,
        "lotte-arai": lotteArai,
        "akakura-kanko": akakuraKanko,
        ikenotaira,
        suginohara,
        "shiga-kogen": shigaKogen,
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
