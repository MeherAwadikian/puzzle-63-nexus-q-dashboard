/* Nexus-Q dashboard — data + hand-drawn SVG charts.
   No chart library: every path, bar and arc below is computed from the data
   arrays and emitted as SVG. Charts use a viewBox so they scale fluidly, and
   re-render on resize so labels/geometry stay correct at any width. */

"use strict";

/* ---------------- demo data (synthetic but internally consistent) ---------------- */
const MONTHS = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
const MRR = [182, 196, 205, 221, 238, 252, 274, 289, 301, 318, 334, 361]; // $k
const SESSIONS = [41, 44, 43, 52, 58, 61, 57, 66, 72, 69, 78, 86];        // k peak concurrent

const REGIONS = [
  { label: "N. America", value: 9.4 },
  { label: "Europe",     value: 7.1 },
  { label: "Asia-Pac",   value: 6.3 },
  { label: "LATAM",      value: 2.8 },
  { label: "M. East",    value: 2.1 },
  { label: "Africa",     value: 1.2 },
];

const SOURCES = [
  { label: "Organic search", value: 38, color: "#6d5efc" },
  { label: "Direct",         value: 24, color: "#27d3c4" },
  { label: "Referral",       value: 18, color: "#f7b955" },
  { label: "Paid",           value: 13, color: "#fb6f92" },
  { label: "Social",         value:  7, color: "#8b7cff" },
];

const KPIS = [
  { label: "Monthly revenue", value: "$361K", icon: "💲", delta: +8.1, up: true,
    spark: [238,252,274,289,301,318,334,361], color: "#6d5efc" },
  { label: "Active sessions", value: "86.2K", icon: "◴", delta: +10.3, up: true,
    spark: [58,61,57,66,72,69,78,86], color: "#27d3c4" },
  { label: "Avg API latency", value: "214 ms", icon: "⚡", delta: -6.4, up: true,
    spark: [248,240,236,230,226,222,219,214], color: "#35d07f", lowerIsBetter: true },
  { label: "Error rate", value: "0.42%", icon: "⚑", delta: +0.9, up: false,
    spark: [31,29,33,30,35,38,40,42], color: "#fb6f92" },
];

const ACCOUNTS = [
  { name: "Helios Freight", sub: "helios.io",       plan: "Enterprise", reqs: "4.82M", lat: "188 ms", health: "ok",   c: "#6d5efc" },
  { name: "Northwind Labs",  sub: "northwind.dev",   plan: "Scale",      reqs: "3.11M", lat: "205 ms", health: "ok",   c: "#27d3c4" },
  { name: "Atlas Retail",    sub: "atlasretail.com", plan: "Scale",      reqs: "2.74M", lat: "341 ms", health: "warn", c: "#f7b955" },
  { name: "Vela Health",     sub: "velahealth.co",   plan: "Enterprise", reqs: "2.09M", lat: "262 ms", health: "ok",   c: "#8b7cff" },
  { name: "Orbit Media",     sub: "orbit.media",     plan: "Growth",     reqs: "1.46M", lat: "512 ms", health: "crit", c: "#fb6f92" },
  { name: "Cobalt Energy",   sub: "cobalt.energy",   plan: "Scale",      reqs: "1.18M", lat: "198 ms", health: "ok",   c: "#35d07f" },
];

/* ---------------- small helpers ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const svgEl = (vbW, vbH) =>
  `<svg viewBox="0 0 ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet" role="img">`;
const round = (n, d = 1) => Number(n.toFixed(d));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* build a smooth-ish polyline path from [x,y] points (straight segments, crisp) */
function linePath(points) {
  return points.map((p, i) => (i ? "L" : "M") + round(p[0]) + " " + round(p[1])).join(" ");
}

/* ---------------- KPI cards + sparklines ---------------- */
function sparkline(values, color) {
  const w = 120, h = 34, pad = 2;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (w - pad * 2),
    h - pad - ((v - min) / span) * (h - pad * 2),
  ]);
  const id = "sg" + Math.round(pts[0][1] * 1000) + color.replace("#", "");
  const area = linePath(pts) + ` L${round(pts[pts.length-1][0])} ${h} L${round(pts[0][0])} ${h} Z`;
  return (
    svgEl(w, h) +
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="${color}" stop-opacity=".35"/>
       <stop offset="1" stop-color="${color}" stop-opacity="0"/>
     </linearGradient></defs>` +
    `<path d="${area}" fill="url(#${id})"/>` +
    `<path d="${linePath(pts)}" fill="none" stroke="${color}" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="${round(pts[pts.length-1][0])}" cy="${round(pts[pts.length-1][1])}" r="2.6" fill="${color}"/>` +
    `</svg>`
  );
}

function renderKpis() {
  const html = KPIS.map((k) => {
    const dir = k.delta >= 0 ? "+" : "";
    const cls = k.up ? "up" : "down";
    return `
      <article class="kpi">
        <div class="kpi-top">
          <span class="kpi-label">${esc(k.label)}</span>
          <span class="kpi-ic" aria-hidden="true">${k.icon}</span>
        </div>
        <div class="kpi-val">${esc(k.value)}</div>
        <div class="spark">${sparkline(k.spark, k.color)}</div>
        <div class="kpi-foot">
          <span class="delta ${cls}">${dir}${Math.abs(k.delta)}%</span>
          <span class="vs">vs previous period</span>
        </div>
      </article>`;
  }).join("");
  $(".kpis").innerHTML = html;
}

/* ---------------- combo area/line chart (MRR + sessions) ---------------- */
function renderArea(el) {
  const W = 720, H = 300;
  const pl = 46, pr = 18, pt = 18, pb = 36;
  const pw = W - pl - pr, ph = H - pt - pb;

  const scale = (arr) => {
    const min = Math.min(...arr), max = Math.max(...arr);
    const lo = min - (max - min) * 0.12, hi = max + (max - min) * 0.12;
    return (v) => pt + ph - ((v - lo) / (hi - lo)) * ph;
  };
  const yMrr = scale(MRR), ySes = scale(SESSIONS);
  const x = (i) => pl + (i / (MONTHS.length - 1)) * pw;

  const mrrPts = MRR.map((v, i) => [x(i), yMrr(v)]);
  const sesPts = SESSIONS.map((v, i) => [x(i), ySes(v)]);

  // horizontal gridlines + y labels (MRR scale, left axis)
  let grid = "", yticks = "";
  const ticks = 4;
  const mrrMin = Math.min(...MRR), mrrMax = Math.max(...MRR);
  for (let i = 0; i <= ticks; i++) {
    const gy = pt + (i / ticks) * ph;
    grid += `<line class="grid-line" x1="${pl}" y1="${round(gy)}" x2="${W - pr}" y2="${round(gy)}"/>`;
    const val = Math.round(mrrMax - (i / ticks) * (mrrMax - mrrMin));
    yticks += `<text class="axis-label" x="${pl - 8}" y="${round(gy) + 3}" text-anchor="end">$${val}k</text>`;
  }

  // x labels (every other month to avoid crowding)
  let xlabels = "";
  MONTHS.forEach((m, i) => {
    if (i % 2 === 0 || i === MONTHS.length - 1) {
      xlabels += `<text class="axis-label" x="${round(x(i))}" y="${H - 14}" text-anchor="middle">${m}</text>`;
    }
  });

  const areaPath = linePath(mrrPts) +
    ` L${round(x(MONTHS.length - 1))} ${pt + ph} L${round(pl)} ${pt + ph} Z`;

  const last = mrrPts[mrrPts.length - 1];
  const lastSes = sesPts[sesPts.length - 1];

  el.innerHTML =
    svgEl(W, H) +
    `<defs>
       <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0" stop-color="#6d5efc" stop-opacity=".40"/>
         <stop offset="1" stop-color="#6d5efc" stop-opacity="0"/>
       </linearGradient>
     </defs>` +
    grid + yticks + xlabels +
    `<path d="${areaPath}" fill="url(#mrrFill)"/>` +
    `<path d="${linePath(sesPts)}" fill="none" stroke="#27d3c4" stroke-width="2.4"
       stroke-dasharray="2 5" stroke-linecap="round"/>` +
    `<path d="${linePath(mrrPts)}" fill="none" stroke="#6d5efc" stroke-width="3"
       stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="${round(lastSes[0])}" cy="${round(lastSes[1])}" r="4" fill="#27d3c4"/>` +
    `<circle cx="${round(last[0])}" cy="${round(last[1])}" r="5" fill="#6d5efc" stroke="#0b0d17" stroke-width="2"/>` +
    `<text class="tip" x="${round(last[0]) - 6}" y="${round(last[1]) - 12}" text-anchor="end">$361k</text>` +
    `</svg>`;
}

/* ---------------- donut (traffic sources) ---------------- */
function renderDonut(el, legendEl) {
  const W = 190, H = 190, cx = 95, cy = 95, r = 66, sw = 26;
  const C = 2 * Math.PI * r;
  const total = SOURCES.reduce((s, x) => s + x.value, 0);

  let offset = 0, arcs = "";
  SOURCES.forEach((s) => {
    const frac = s.value / total;
    const len = frac * C;
    arcs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${s.color}" stroke-width="${sw}"
      stroke-dasharray="${round(len, 2)} ${round(C - len, 2)}"
      stroke-dashoffset="${round(-offset, 2)}"
      transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt"/>`;
    offset += len;
  });

  el.innerHTML =
    svgEl(W, H) +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1b2138" stroke-width="${sw}"/>` +
    arcs +
    `<text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="#e8ebf7"
       font-size="26" font-weight="750" font-family="var(--font)">1.9M</text>` +
    `<text x="${cx}" y="${cy + 16}" text-anchor="middle" fill="#6b7498"
       font-size="11" font-family="var(--font)">sessions</text>` +
    `</svg>`;

  legendEl.innerHTML = SOURCES.map((s) =>
    `<li><span class="dotc" style="background:${s.color}"></span>
        <span class="nm">${esc(s.label)}</span>
        <span class="pc">${round((s.value / total) * 100, 0)}%</span></li>`
  ).join("");
}

/* ---------------- vertical bar chart (requests by region) ---------------- */
function renderBar(el) {
  const W = 560, H = 300;
  const pl = 24, pr = 12, pt = 18, pb = 40;
  const pw = W - pl - pr, ph = H - pt - pb;
  const max = Math.max(...REGIONS.map((r) => r.value)) * 1.15;
  const n = REGIONS.length;
  const gap = 22;
  const bw = (pw - gap * (n - 1)) / n;

  let grid = "";
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const gy = pt + (i / ticks) * ph;
    grid += `<line class="grid-line" x1="${pl}" y1="${round(gy)}" x2="${W - pr}" y2="${round(gy)}"/>`;
  }

  let bars = "";
  REGIONS.forEach((rg, i) => {
    const bx = pl + i * (bw + gap);
    const bh = (rg.value / max) * ph;
    const by = pt + ph - bh;
    bars +=
      `<rect x="${round(bx)}" y="${round(by)}" width="${round(bw)}" height="${round(bh)}"
         rx="6" fill="url(#barGrad)"/>` +
      `<text class="tip" x="${round(bx + bw / 2)}" y="${round(by - 8)}" text-anchor="middle">${rg.value}M</text>` +
      `<text class="axis-label" x="${round(bx + bw / 2)}" y="${H - 16}" text-anchor="middle">${esc(rg.label)}</text>`;
  });

  el.innerHTML =
    svgEl(W, H) +
    `<defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="#8b7cff"/>
       <stop offset="1" stop-color="#6d5efc" stop-opacity=".55"/>
     </linearGradient></defs>` +
    grid + bars +
    `</svg>`;
}

/* ---------------- accounts table ---------------- */
function renderTable() {
  const labels = { ok: "Healthy", warn: "Degraded", crit: "At risk" };
  $("#tableBody").innerHTML = ACCOUNTS.map((a) => `
    <tr>
      <td>
        <div class="acct">
          <span class="ico" style="background:${a.c}">${esc(a.name[0])}</span>
          <span><span class="nm">${esc(a.name)}</span><br><span class="sub">${esc(a.sub)}</span></span>
        </div>
      </td>
      <td><span class="plan-pill">${esc(a.plan)}</span></td>
      <td class="num">${esc(a.reqs)}</td>
      <td class="num">${esc(a.lat)}</td>
      <td><span class="status ${a.health}"><span class="pip"></span>${labels[a.health]}</span></td>
    </tr>`).join("");
}

/* ---------------- charts that depend on width: re-render on resize ---------------- */
function renderCharts() {
  renderArea($("#areaChart"));
  renderDonut($("#donutChart"), $("#donutLegend"));
  renderBar($("#barChart"));
}

/* ---------------- interactions ---------------- */
function wireUi() {
  // mobile nav
  const app = $(".app"), scrim = $("#scrim");
  const open = (v) => { app.classList.toggle("nav-open", v); scrim.hidden = !v; };
  $("#menuBtn").addEventListener("click", () => open(!app.classList.contains("nav-open")));
  scrim.addEventListener("click", () => open(false));

  // segmented date range (visual state only in this demo)
  document.querySelectorAll(".seg-btn").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll(".seg-btn").forEach((x) => x.classList.remove("is-active"));
      b.classList.add("is-active");
    }));

  // nav active state
  document.querySelectorAll(".nav-item").forEach((n) =>
    n.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".nav-item").forEach((x) => x.classList.remove("is-active"));
      n.classList.add("is-active");
      if (window.innerWidth <= 860) open(false);
    }));
}

/* ---------------- boot ---------------- */
function boot() {
  renderKpis();
  renderCharts();
  renderTable();
  wireUi();
}
document.addEventListener("DOMContentLoaded", boot);

let rAF;
window.addEventListener("resize", () => {
  cancelAnimationFrame(rAF);
  rAF = requestAnimationFrame(renderCharts);
});
