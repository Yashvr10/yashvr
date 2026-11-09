// The First World War: shared code for every page.
//
// The motion in these pages comes from HyperFrames registry items (lt-kicker-name, world-map, count-up,
// organic-light-leak-overlay, grain-overlay), ported to OpenFilm. A HyperFrames composition builds one paused GSAP
// timeline; an OpenFilm page draws whatever moment t it is asked for. `play` joins the two: frame(t) seeks the
// timeline, so the same t always gives the same picture.

/* global gsap, d3, topojson */

gsap.defaults({ lazy: false });

/** Hand a paused GSAP timeline to OpenFilm. */
export function play(tl, { duration, ready } = {}) {
  window.film = {
    duration,
    ready: Promise.all([document.fonts.ready, ready || Promise.resolve()]),
    frame(t) {
      tl.seek(Math.max(0, duration ? Math.min(t, duration) : t), false);
    },
  };
}

/** Stateless hash: the same i and seed always give the same number in [0, 1). */
export function hash(i, seed = 1) {
  let h = (i * 374761393 + seed * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Numbers to text, 57470 -> "57,470". */
export const fmt = (v) => Math.round(v).toLocaleString("en-US");

/** count-up (registry component), its counting part: one `set` of the text per frame, eased sine.inOut. */
export function countUp(tl, el, { from = 0, to, at = 0, dur = 1.7, fps = 30, format = fmt }) {
  const ease = gsap.parseEase("sine.inOut");
  const n = Math.max(1, Math.round(dur * fps));
  for (let f = 0; f <= n; f++) tl.set(el, { textContent: format(from + (to - from) * ease(f / n)) }, at + (dur * f) / n);
  tl.to(el, { scale: 1.06, duration: 0.16, ease: "power3.out" }, at + dur);
  tl.to(el, { scale: 1, duration: 0.18, ease: "power2.out" }, at + dur + 0.16);
}

// ---------- maps (from the registry's world-map block: D3 + topojson + Natural Earth via world-atlas) ----------

let atlas;
export async function countries() {
  if (!atlas) {
    const world = await (await fetch("lib/countries-50m.json")).json();
    atlas = topojson.feature(world, world.objects.countries).features;
  }
  return atlas;
}

export const ISO = {
  france: 250, uk: 826, ireland: 372, russia: 643, serbia: 688, belgium: 56, montenegro: 499, italy: 380, portugal: 620, romania: 642,
  greece: 300, usa: 840, germany: 276, austria: 40, hungary: 348, czechia: 203, slovakia: 703, bosnia: 70, croatia: 191,
  slovenia: 705, turkey: 792, bulgaria: 100, ukraine: 804, belarus: 112, poland: 616, finland: 246, estonia: 233,
  latvia: 428, lithuania: 440, syria: 760, iraq: 368, jordan: 400, lebanon: 422, israel: 376, palestine: 275,
  saudi: 682, moldova: 498, switzerland: 756, netherlands: 528, luxembourg: 442, spain: 724, denmark: 208,
  norway: 578, sweden: 752, albania: 8, macedonia: 807, kosovo: -99, georgia: 268, armenia: 51, azerbaijan: 31,
};

/**
 * Draw Europe into an <svg> (1920x1080) at a lon/lat window. Returns { project, g, paths } where g is the group a
 * camera move scales, paths maps ISO number -> <path>.
 * view: [[lonW, latS], [lonE, latN]]
 */
export async function europe(svg, { view = [[-11, 35], [44, 62]], pad = 60 } = {}) {
  const features = (await countries()).filter((f) => {
    const [[x0, y0], [x1, y1]] = d3.geoBounds(f);
    if (y1 < 25 || y0 > 72) return false;
    return x0 > x1 /* crosses 180° (Russia) */ || (x1 > -25 && x0 < 60);
  });
  const box = { type: "Feature", geometry: { type: "MultiPoint", coordinates: view } };
  const projection = d3.geoConicConformal().rotate([-15, 0]).parallels([40, 60])
    .fitExtent([[pad, pad], [1920 - pad, 1080 - pad]], box);
  const path = d3.geoPath(projection);
  const root = d3.select(svg).attr("viewBox", "0 0 1920 1080");
  const g = root.append("g").attr("class", "camera");
  g.append("path").datum(d3.geoGraticule().step([5, 5])()).attr("d", path)
    .attr("fill", "none").attr("stroke", "var(--line)").attr("stroke-width", 0.6).attr("stroke-opacity", 0.55)
    .attr("vector-effect", "non-scaling-stroke");
  const paths = {};
  g.append("g").selectAll("path").data(features).join("path")
    .attr("d", path).attr("fill", "var(--land)").attr("stroke", "var(--ground)").attr("stroke-width", 0.9)
    .attr("vector-effect", "non-scaling-stroke")
    .each(function (d) { paths[+d.id] = this; });
  const overlay = g.append("g").attr("class", "overlay");
  return { project: (lonlat) => projection(lonlat), path, g: g.node(), overlay: overlay.node(), paths };
}

/** A line through lon/lat points as an SVG path with a length, for draw-on (stroke-dashoffset). */
export function line(overlay, map, pts, attrs = {}) {
  const p = d3.select(overlay).append("path")
    .attr("d", d3.line().curve(d3.curveCatmullRom.alpha(0.5))(pts.map(map.project)))
    .attr("fill", "none").attr("vector-effect", "non-scaling-stroke");
  for (const [k, v] of Object.entries(attrs)) p.attr(k, v);
  const node = p.node(), len = node.getTotalLength();
  node.style.strokeDasharray = `${len} ${len}`;
  node.style.strokeDashoffset = len;
  return node;
}

/** A pin with a label at a lon/lat. Returns the group (fade it in) and its ring (pulse it). */
export function pin(overlay, map, lonlat, text, { dx = 18, dy = -14, size = 30, anchor = "start", sub } = {}) {
  const [x, y] = map.project(lonlat);
  const g = d3.select(overlay).append("g").attr("transform", `translate(${x},${y})`).style("opacity", 0);
  const ring = g.append("circle").attr("r", 14).attr("fill", "none").attr("stroke", "var(--poppy)").attr("stroke-width", 2)
    .attr("vector-effect", "non-scaling-stroke");
  g.append("circle").attr("r", 6).attr("fill", "var(--poppy)");
  if (text) {
    g.append("text").attr("x", dx).attr("y", dy).attr("text-anchor", anchor).attr("class", "serif")
      .attr("font-size", size).attr("font-weight", 700).attr("fill", "var(--paper)")
      .attr("paint-order", "stroke").attr("stroke", "var(--ground)").attr("stroke-width", 6).text(text);
  }
  if (sub) {
    g.append("text").attr("x", dx).attr("y", dy + size * 0.95).attr("text-anchor", anchor).attr("class", "mono")
      .attr("font-size", size * 0.55).attr("fill", "var(--dim)")
      .attr("paint-order", "stroke").attr("stroke", "var(--ground)").attr("stroke-width", 5).text(sub);
  }
  return { g: g.node(), ring: ring.node() };
}

/** A free label at a lon/lat. */
export function label(overlay, map, lonlat, text, { size = 26, cls = "label", fill = "var(--dim)", anchor = "middle", ls } = {}) {
  const [x, y] = map.project(lonlat);
  const t = d3.select(overlay).append("text").attr("x", x).attr("y", y).attr("text-anchor", anchor)
    .attr("class", cls).attr("font-size", size).attr("fill", fill).style("opacity", 0)
    .attr("paint-order", "stroke").attr("stroke", "var(--ground)").attr("stroke-width", 6).text(text);
  if (ls) t.attr("letter-spacing", ls);
  return t.node();
}

/** Camera: the transform that frames a lon/lat window, for gsap.to(map.g, cam(...)). */
export function cam(map, [[w, s], [e, n]], pad = 80) {
  const a = map.project([w, n]), b = map.project([e, s]), c = map.project([w, s]), d = map.project([e, n]);
  const x0 = Math.min(a[0], c[0]), x1 = Math.max(b[0], d[0]), y0 = Math.min(a[1], d[1]), y1 = Math.max(b[1], c[1]);
  const k = Math.min((1920 - 2 * pad) / (x1 - x0), (1080 - 2 * pad) / (y1 - y0));
  return { attr: { transform: `translate(${960 - k * (x0 + x1) / 2},${540 - k * (y0 + y1) / 2}) scale(${k})` } };
}

/** The common furniture of a map page: a title top-left and a source line. */
export function chrome(root, { kicker, title, note }) {
  root.insertAdjacentHTML("beforeend", `
    <div class="map-head" style="position:absolute;left:96px;top:72px">
      <div class="label" id="kicker" style="font-size:22px;color:var(--poppy);opacity:0">${kicker}</div>
      <div class="serif" id="title" style="font-size:64px;font-weight:700;margin-top:10px;clip-path:inset(0 100% 0 0)">${title}</div>
    </div>
    ${note ? `<div class="mono" id="note" style="position:absolute;left:96px;bottom:54px;font-size:18px;color:var(--dim);opacity:0">${note}</div>` : ""}`);
  return {
    in(tl, at = 0.15) {
      tl.to("#kicker", { opacity: 1, duration: 0.4, ease: "power2.out" }, at);
      tl.to("#title", { clipPath: "inset(0 0% 0 0)", duration: 0.9, ease: "power3.inOut" }, at + 0.1);
      if (note) tl.to("#note", { opacity: 1, duration: 0.6 }, at + 0.6);
    },
  };
}
