/* Jaypee Sports — catalogue shared helpers.
   Loaded by catalogue.html and admin.html before their own scripts.
   Exposes a single namespace: window.JPCat.                          */
(function () {
  "use strict";

  /* ================= CONSTANTS ================= */

  var SEGMENTS = [
    { id: "sportswear", label: "Sportswear", sub: "Manufactured In-House", number: "01" },
    { id: "equipment", label: "Sports Equipment", sub: "Every Sport, Every Level", number: "02" }
  ];

  var CATEGORIES = {
    sportswear: ["Sports T-Shirts", "Round Neck", "Tracksuits", "Jerseys", "Custom Orders"],
    equipment: ["Cricket", "Football", "Basketball", "Volleyball", "Hockey", "Other"]
  };

  var STORAGE_KEY = "jp_catalogue_draft_v1";

  /* Fallback if catalogue.json settings are missing */
  var DEFAULT_STYLE_SUFFIX =
    "Shot on a seamless light-grey studio background (#fafafa), soft diffused " +
    "three-point lighting, slight three-quarter front angle, centered composition, " +
    "sharp focus, subtle ember-red (#ff3b1f) accent styling, 4:5 portrait crop, " +
    "photorealistic, high detail, e-commerce product catalogue style. No people, " +
    "no watermarks, no added text or logos.";

  /* ================= GENERIC HELPERS ================= */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function imgPath(v) {
    if (!v) return null;
    v = String(v).trim();
    if (!v) return null;
    return v.indexOf("/") >= 0 ? v : "assets/products/" + v;
  }

  function pipeList(s) {
    return String(s || "").split("|").map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function num(s) {
    var n = parseFloat(String(s).replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? 0 : n;
  }

  function money(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }

  /* ================= CSV (same dialect as b2b.js) ================= */

  function parseCSV(text) {
    var rows = [], row = [], field = "", inQ = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += c;
      } else if (c === '"') { inQ = true; }
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }

  function toObjects(rows) {
    if (!rows.length) return [];
    var h = rows[0].map(function (s) { return slug(s); });
    return rows.slice(1)
      .filter(function (r) { return r.some(function (c) { return String(c).trim() !== ""; }); })
      .map(function (r) { var o = {}; h.forEach(function (k, i) { o[k] = (r[i] || "").trim(); }); return o; });
  }

  /* ================= DATA FETCH ================= */

  function fetchJSON() {
    return fetch("data/catalogue.json?t=" + Date.now(), { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("catalogue.json " + r.status); return r.json(); })
      .then(function (data) {
        if (!data || !isArray(data.products)) throw new Error("catalogue.json: bad shape");
        data.settings = data.settings || {};
        return data;
      });
  }

  /* Map of color name -> validated hex, from the site's canonical colors.csv */
  function fetchColors() {
    return fetch("data/colors.csv?t=" + Date.now(), { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("colors.csv"); return r.text(); })
      .then(function (t) {
        var map = {};
        toObjects(parseCSV(t)).forEach(function (r) {
          if (r.color_name && /^#[0-9a-fA-F]{3,8}$/.test(r.hex_code)) map[r.color_name] = r.hex_code;
        });
        return map;
      })
      .catch(function () { return {}; });
  }

  function isArray(v) { return Object.prototype.toString.call(v) === "[object Array]"; }

  /* ================= DRAFTS (localStorage) =================
     Shape: { products: { id: productObject | null }, settings: {...} }
     null = deleted base product (tombstone).                          */

  function emptyDraft() { return { products: {}, settings: {} }; }

  function loadDraft() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyDraft();
      var d = JSON.parse(raw);
      if (!d || typeof d !== "object") return emptyDraft();
      d.products = d.products && typeof d.products === "object" ? d.products : {};
      d.settings = d.settings && typeof d.settings === "object" ? d.settings : {};
      return d;
    } catch (e) { return emptyDraft(); }
  }

  function saveDraft(draft) {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); return true; }
    catch (e) { return false; }
  }

  function clearDraft() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
  }

  function draftCount(draft) {
    var n = 0, k;
    for (k in draft.products) { if (draft.products.hasOwnProperty(k)) n++; }
    if (draft.settings && draft.settings.prompt_style_suffix) n++;
    return n;
  }

  /* Merge committed base data with local drafts. Returns a new sorted array. */
  function mergeProducts(baseList, draft) {
    var byId = {}, order = [], i, p, id;
    for (i = 0; i < baseList.length; i++) {
      p = baseList[i];
      byId[p.id] = p;
      order.push(p.id);
    }
    for (id in draft.products) {
      if (!draft.products.hasOwnProperty(id)) continue;
      p = draft.products[id];
      if (p === null) { delete byId[id]; }
      else if (byId[id]) { byId[id] = p; }
      else { byId[id] = p; order.push(id); }
    }
    var out = [];
    for (i = 0; i < order.length; i++) { if (byId[order[i]]) out.push(byId[order[i]]); }
    return sortProducts(out);
  }

  function mergeSettings(baseSettings, draft) {
    var out = {};
    out.prompt_style_suffix =
      (draft.settings && draft.settings.prompt_style_suffix) ||
      (baseSettings && baseSettings.prompt_style_suffix) ||
      DEFAULT_STYLE_SUFFIX;
    return out;
  }

  function segIndex(id) {
    for (var i = 0; i < SEGMENTS.length; i++) { if (SEGMENTS[i].id === id) return i; }
    return SEGMENTS.length;
  }

  function catIndex(segId, cat) {
    var cats = CATEGORIES[segId] || [];
    for (var i = 0; i < cats.length; i++) { if (cats[i] === cat) return i; }
    return cats.length;
  }

  function sortProducts(list) {
    return list.slice().sort(function (a, b) {
      var d = segIndex(a.segment) - segIndex(b.segment);
      if (d) return d;
      d = catIndex(a.segment, a.category) - catIndex(b.segment, b.category);
      if (d) return d;
      d = (a.sort || 0) - (b.sort || 0);
      if (d) return d;
      return String(a.name).localeCompare(String(b.name));
    });
  }

  /* ================= PRESENTATION HELPERS ================= */

  function firstSentence(text) {
    var s = String(text || "").trim();
    if (!s) return "";
    var m = s.match(/^[^.!?]*[.!?]/);
    return m ? m[0].trim() : s;
  }

  function composePrompt(p, suffix) {
    if (p.prompt_override) return p.prompt_override;
    var seg = p.segment === "sportswear"
      ? "sportswear range, manufactured in-house by Jaypee Sports"
      : "sports equipment range";
    var parts = [
      "Professional studio product photograph of " + p.name +
      " — " + p.category + " from the " + seg + "."
    ];
    var fs = firstSentence(p.description);
    if (fs) parts.push(fs);
    if (p.sizes && p.sizes.length && p.segment === "sportswear") {
      parts.push("Garment presented on an invisible mannequin form.");
    }
    if (p.colors && p.colors.length) parts.push("Colourways: " + p.colors.join(", ") + ".");
    return parts.join(" ") + " " + (suffix || DEFAULT_STYLE_SUFFIX);
  }

  function formatPrice(p) {
    if (p.price_mode === "on_request") return "Price on request";
    if (p.price_mode === "range") {
      if (p.price_max > 0 && p.price_max !== p.price_min) {
        return money(p.price_min) + " – " + money(p.price_max);
      }
      return "From " + money(p.price_min);
    }
    return money(p.price_min);
  }

  function segmentById(id) {
    for (var i = 0; i < SEGMENTS.length; i++) { if (SEGMENTS[i].id === id) return SEGMENTS[i]; }
    return null;
  }

  /* ================= EXPORT ================= */

  window.JPCat = {
    SEGMENTS: SEGMENTS,
    CATEGORIES: CATEGORIES,
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_STYLE_SUFFIX: DEFAULT_STYLE_SUFFIX,
    esc: esc,
    imgPath: imgPath,
    pipeList: pipeList,
    num: num,
    money: money,
    parseCSV: parseCSV,
    toObjects: toObjects,
    slug: slug,
    fetchJSON: fetchJSON,
    fetchColors: fetchColors,
    loadDraft: loadDraft,
    saveDraft: saveDraft,
    clearDraft: clearDraft,
    draftCount: draftCount,
    emptyDraft: emptyDraft,
    mergeProducts: mergeProducts,
    mergeSettings: mergeSettings,
    sortProducts: sortProducts,
    composePrompt: composePrompt,
    formatPrice: formatPrice,
    firstSentence: firstSentence,
    segmentById: segmentById
  };
})();
