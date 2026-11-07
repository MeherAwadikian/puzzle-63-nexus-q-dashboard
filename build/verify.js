/* Live verification for the Nexus-Q dashboard.
   Reuses the Playwright install from the puzzle-61 project and drives the real
   system Chrome (channel:'chrome') per the #61 D:-drive lesson. */
const path = require("path");
const pwPath = "C:/Users/h/puzzle-61-video-hero/node_modules/playwright";
const { chromium } = require(pwPath);

const URL = process.argv[2] || "http://localhost:8763/";
const OUT = __dirname;

(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const results = [];
  const check = (name, cond, extra = "") =>
    results.push({ name, pass: !!cond, extra });

  // ---- desktop ----
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const kpiCount = await page.locator(".kpi").count();
  check("4 KPI cards render", kpiCount === 4, `got ${kpiCount}`);

  const sparkPaths = await page.locator(".kpi .spark svg path").count();
  check("KPI sparklines drew paths", sparkPaths >= 8, `${sparkPaths} spark paths`);

  const areaPaths = await page.locator("#areaChart svg path").count();
  const areaLines = await page.locator("#areaChart svg line").count();
  check("Area chart drew (paths+gridlines)", areaPaths >= 3 && areaLines >= 4,
        `${areaPaths} paths, ${areaLines} gridlines`);

  const donutArcs = await page.locator("#donutChart svg circle").count();
  const donutLegend = await page.locator("#donutLegend li").count();
  check("Donut drew arcs + legend", donutArcs >= 6 && donutLegend === 5,
        `${donutArcs} circles, ${donutLegend} legend rows`);

  const bars = await page.locator("#barChart svg rect").count();
  check("Bar chart drew bars", bars >= 6, `${bars} rects`);

  const rows = await page.locator("#tableBody tr").count();
  check("Table has account rows", rows === 6, `${rows} rows`);

  const statusPips = await page.locator("#tableBody .status .pip").count();
  check("Table status pills render", statusPips === 6, `${statusPips} pips`);

  // sidebar visible on desktop
  const sbVisible = await page.locator(".sidebar .brand-text").isVisible();
  check("Sidebar visible on desktop", sbVisible);

  // area chart actually has geometry (non-trivial path length)
  const areaD = await page.locator("#areaChart svg path").first().getAttribute("d");
  check("Area path has real coordinates", areaD && areaD.length > 80,
        `d length ${areaD ? areaD.length : 0}`);

  await page.screenshot({ path: path.join(OUT, "shot-desktop.png"), fullPage: true });

  // ---- narrow / responsive ----
  const mob = await browser.newPage({ viewport: { width: 420, height: 880 } });
  await mob.goto(URL, { waitUntil: "networkidle" });
  await mob.waitForTimeout(400);

  // sidebar should be off-canvas (translated out) at narrow width
  const sbTransform = await mob.evaluate(() => {
    const el = document.querySelector(".sidebar");
    return getComputedStyle(el).transform;
  });
  check("Sidebar off-canvas when narrow", sbTransform && sbTransform !== "none",
        sbTransform);

  const menuVisible = await mob.locator("#menuBtn").isVisible();
  check("Hamburger menu shown when narrow", menuVisible);

  // charts still present and sized to the narrow viewport
  const barBox = await mob.locator("#barChart svg").boundingBox();
  check("Bar chart fits narrow width", barBox && barBox.width <= 420 && barBox.width > 120,
        barBox ? `svg width ${Math.round(barBox.width)}px` : "no box");

  // open the drawer
  await mob.locator("#menuBtn").click();
  await mob.waitForTimeout(350);
  const sbAfter = await mob.evaluate(() =>
    getComputedStyle(document.querySelector(".sidebar")).transform);
  check("Drawer opens on menu tap", sbAfter !== sbTransform, `after: ${sbAfter}`);

  await mob.screenshot({ path: path.join(OUT, "shot-narrow.png"), fullPage: true });

  await browser.close();

  // ---- report ----
  let pass = 0;
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.extra ? "  (" + r.extra + ")" : ""}`);
    if (r.pass) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
