/* Jaypee Sports — B2B ordering (pilot, v2)
   All prices are ASSUMED PLACEHOLDERS — edit the DATA section below.   */

(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ================= DATA (all values assumed — edit freely) ================= */

  var SPORTS = ["Football", "Basketball", "Cricket", "Hockey", "Volleyball"];

  var TIERS = [
    { min: 100, mult: 0.85, label: "100+ pcs · 15% off" },
    { min: 50,  mult: 0.90, label: "50–99 pcs · 10% off" },
    { min: 10,  mult: 0.95, label: "10–49 pcs · 5% off" },
    { min: 1,   mult: 1.00, label: "1–9 pcs · base price" }
  ];
  function tierFor(q) { for (var i = 0; i < TIERS.length; i++) if (q >= TIERS[i].min) return TIERS[i]; return TIERS[TIERS.length - 1]; }

  var EQUIPMENT = [
    { id: "fb-ball",  sport: "Football",   name: "Match Football (Size 5)",  price: 650,  detail: "32-panel PU, hand-stitched, all-weather." },
    { id: "fb-glove", sport: "Football",   name: "Goalkeeper Gloves",        price: 450,  detail: "Latex palm, breathable mesh back, sizes 7–10." },
    { id: "bb-ball",  sport: "Basketball", name: "Basketball (Size 7)",      price: 550,  detail: "Composite cover, indoor/outdoor, deep channels." },
    { id: "bb-net",   sport: "Basketball", name: "Basketball Net (Pair)",    price: 250,  detail: "Heavy-duty nylon, all-weather, standard 12-loop." },
    { id: "cr-bat",   sport: "Cricket",    name: "Kashmir Willow Bat",       price: 1200, detail: "Short handle, full size, pre-knocked blade." },
    { id: "cr-ball",  sport: "Cricket",    name: "Leather Cricket Ball",     price: 350,  detail: "4-piece construction, match grade, red." },
    { id: "hk-stick", sport: "Hockey",     name: "Field Hockey Stick",       price: 900,  detail: "Fibreglass-reinforced, 36.5\", mid-bow." },
    { id: "hk-ball",  sport: "Hockey",     name: "Hockey Ball",              price: 200,  detail: "Dimpled PVC, match weight, white." },
    { id: "vb-ball",  sport: "Volleyball", name: "Volleyball (Size 4)",      price: 500,  detail: "Soft-touch PU, 18 panel, indoor/outdoor." },
    { id: "vb-net",   sport: "Volleyball", name: "Volleyball Net",           price: 600,  detail: "9.5m × 1m, steel cable top, weather-proof." }
  ];
  var EQUIP_PRINT_FEE = 30;

  var PRODUCT_TYPES = {
    sportswear: ["Jersey", "T-shirt", "Lowers", "Shorts", "Tracksuit", "Cap"],
    corporate:  ["T-shirt", "Tracksuit", "Cap", "School Uniform"]
  };

  // ready-made stock. img: add a product photo path later and it becomes the mockup base layer.
  var READY = {
    "Jersey":         [{ id: "rj1", name: "Club Jersey — Dry-Fit",       price: 350, img: null },
                       { id: "rj2", name: "Pro Match Jersey — Dot-Knit", price: 450, img: null }],
    "T-shirt":        [{ id: "rt1", name: "Round-Neck Sports Tee",       price: 250, img: null },
                       { id: "rt2", name: "Polo T-shirt",                price: 320, img: null }],
    "Lowers":         [{ id: "rl1", name: "Training Lowers",             price: 300, img: null }],
    "Shorts":         [{ id: "rs1", name: "Sports Shorts",               price: 220, img: null }],
    "Tracksuit":      [{ id: "rk1", name: "Polyester Tracksuit Set",     price: 850, img: null }],
    "Cap":            [{ id: "rc1", name: "Baseball Cap",                price: 150, img: null }],
    "School Uniform": [{ id: "ru1", name: "House T-shirt (School)",      price: 200, img: null },
                       { id: "ru2", name: "School Uniform Set",          price: 550, img: null }]
  };

  var SIZES = {}; // populated from products.csv (sizesFor falls back to defaults)
  // mockup placement of each print code (engineering geometry — not edited via data)
  var BOX_COORDS = { F1: [76, 78], F2: [124, 78], F3: [100, 115], F4: [100, 175], B1: [100, 70], B2: [100, 125], B3: [100, 180], S1: [44, 70], S2: [156, 70] };

  var POSITIONS = {
    front: [
      { id: "F1", name: "Left chest",   rec: [9, 9],   box: [76, 78]  },
      { id: "F2", name: "Right chest",  rec: [9, 9],   box: [124, 78] },
      { id: "F3", name: "Centre chest", rec: [25, 30], box: [100, 115] },
      { id: "F4", name: "Front bottom", rec: [12, 8],  box: [100, 175] }
    ],
    back: [
      { id: "B1", name: "Upper back (name)", rec: [25, 8],  box: [100, 70]  },
      { id: "B2", name: "Centre back",       rec: [28, 35], box: [100, 125] },
      { id: "B3", name: "Lower back",        rec: [12, 8],  box: [100, 180] }
    ],
    sleeve: [
      { id: "S1", name: "Left sleeve",  rec: [7, 7], box: [44, 70]  },
      { id: "S2", name: "Right sleeve", rec: [7, 7], box: [156, 70] }
    ]
  };
  var PRINT_POS_FEE = 40;
  var CM = 4;

  // sizes per product; quantities are entered per size
  function sizesFor(product) {
    if (SIZES[product] && SIZES[product].length) return SIZES[product];
    if (product === "Cap") return ["Free Size"];
    return ["S", "M", "L", "XL", "XXL"];
  }

  /* ---- customization: Printed (Sublimation) vs Non-printed (Plain) ---- */

  var PLAIN_FABRICS = [
    { id: "cotton",    name: "Cotton",      gsm: 180, add: 0,  colors: ["White", "Black", "Navy", "Red", "Maroon", "Yellow", "Grey"] },
    { id: "polycot",   name: "Poly-Cotton", gsm: 200, add: 15, colors: ["White", "Black", "Navy", "Sky Blue", "Green"] },
    { id: "drifit",    name: "Dry-Fit",     gsm: 140, add: 30, colors: ["White", "Black", "Navy", "Red", "Royal Blue", "Orange", "Green"] },
    { id: "interlock", name: "Interlock",   gsm: 220, add: 35, colors: ["White", "Black", "Navy", "Maroon"] }
  ];
  // sublimation-capable fabrics only (polyester family) — 6 examples with GSM and price +/-
  var SUB_FABRICS = [
    { id: "poly",     name: "Polyester",      gsm: 160, add: -20 },
    { id: "drifit",   name: "Dry-Fit",        gsm: 140, add: 0   },
    { id: "dotknit",  name: "Dot Knit",       gsm: 180, add: 25  },
    { id: "nirmal",   name: "Nirmal Knit",    gsm: 200, add: 35  },
    { id: "honeycomb",name: "Honeycomb Mesh", gsm: 170, add: 30  },
    { id: "jacquard", name: "Jacquard Knit",  gsm: 220, add: 60  }
  ];
  var COLOR_HEX = { "White": "#f4f4f4", "Black": "#1c1c1f", "Navy": "#1e2a52", "Red": "#c8102e", "Royal Blue": "#2447c7", "Orange": "#e8651a", "Green": "#1d7a3e", "Maroon": "#6d1f2c", "Yellow": "#e8c81a", "Grey": "#8a8a90", "Sky Blue": "#7db8e8" };

  var PANEL_FEES = { "Front": 40, "Back": 40, "Sleeves": 30, "Full sublimation": 90 };
  var NAME_NUM_FEE = 70; // per piece, custom name & number
  var CUSTOM_BASE = { "Jersey": 380, "T-shirt": 260, "Lowers": 320, "Shorts": 240, "Tracksuit": 950, "Cap": 180, "School Uniform": 600 };
  var CUSTOM_MOQ = 10;

  var DESIGNS = ["D-01 Strike", "D-02 Bolt", "D-03 Wave", "D-04 Fade", "D-05 Hex Mesh", "D-06 Stripes"];

  var STYLE_OPTIONS = {
    "Jersey":         { label: "Neck type",   options: ["Round neck", "V-neck", "Polo collar", "Mandarin collar"] },
    "T-shirt":        { label: "Neck type",   options: ["Round neck", "V-neck", "Polo collar", "Henley"] },
    "School Uniform": { label: "Collar type", options: ["Shirt collar", "Round neck (house tee)"] },
    "Tracksuit":      { label: "Collar type", options: ["High-zip collar", "Hooded"] },
    "Cap":            { label: "Cap style",   options: ["Baseball", "Snapback", "Flexfit"] },
    "Lowers":         { label: "Waistband",   options: ["Elastic", "Elastic + drawstring"] },
    "Shorts":         { label: "Waistband",   options: ["Elastic", "Elastic + drawstring"] }
  };
  var SLEEVES = ["Half", "Quarter", "Full", "Custom"];
  var SLEEVE_PRODUCTS = ["Jersey", "T-shirt", "School Uniform", "Tracksuit"];

  /* ================= HELPERS ================= */

  function money(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }
  function track(name, params) { if (typeof window.gtag === "function") window.gtag("event", name, params || {}); }

  var toastEl = $("#toast"), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 3600);
  }
  function el(html) { var t = document.createElement("div"); t.innerHTML = html.trim(); return t.firstChild; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---- size grid component: per-size quantities ---- */
  function sizeGrid(product) {
    var wrap = el('<div class="size-grid-wrap"><p class="control-label">Sizes &amp; quantity per size</p><div class="size-grid"></div><p class="size-total">Total: <strong>0</strong> pcs</p></div>');
    var grid = $(".size-grid", wrap);
    sizesFor(product).forEach(function (sz) {
      grid.appendChild(el('<label class="size-cell"><span>' + sz + '</span><input type="number" min="0" value="0" data-size="' + sz + '"></label>'));
    });
    wrap.total = function () {
      return $$("input", grid).reduce(function (n, i) { return n + Math.max(0, parseInt(i.value, 10) || 0); }, 0);
    };
    wrap.breakdown = function () {
      return $$("input", grid).filter(function (i) { return (parseInt(i.value, 10) || 0) > 0; })
        .map(function (i) { return i.dataset.size + "×" + i.value; }).join(", ");
    };
    wrap.onChange = function (fn) {
      $$("input", grid).forEach(function (i) {
        i.addEventListener("input", function () {
          $(".size-total strong", wrap).textContent = wrap.total();
          fn();
        });
      });
    };
    return wrap;
  }

  /* ================= MOCKUP (layered stage: photo base later, SVG fallback now) ================= */

  function garmentSVG(product, view, colorHex, panelsLit) {
    var fill = colorHex || "#e9e9ee";
    function lit(p) { return panelsLit && (panelsLit.indexOf(p) >= 0 || panelsLit.indexOf("Full sublimation") >= 0); }
    var subPat = '<defs><pattern id="sub" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#cfd6f5"/><path d="M0 8 8 0" stroke="#7c3aed" stroke-width="1.4" opacity=".5"/></pattern></defs>';
    var body;
    if (product === "Shorts") {
      body = '<path d="M55 40 L145 40 L160 170 L112 170 L100 95 L88 170 L40 170 Z" fill="' + (lit("Front") ? "url(#sub)" : fill) + '" stroke="rgba(12,12,20,.25)"/>';
    } else if (product === "Lowers") {
      body = '<path d="M62 30 L138 30 L150 200 L110 200 L100 80 L90 200 L50 200 Z" fill="' + (lit("Front") ? "url(#sub)" : fill) + '" stroke="rgba(12,12,20,.25)"/>';
    } else if (product === "Cap") {
      body = '<path d="M40 120 Q40 50 100 50 Q160 50 160 120 Z" fill="' + (lit("Front") ? "url(#sub)" : fill) + '" stroke="rgba(12,12,20,.25)"/><path d="M40 120 Q100 100 178 124 L174 138 Q100 118 42 132 Z" fill="' + fill + '" stroke="rgba(12,12,20,.25)"/>';
    } else {
      var torsoLit = (view === "front" && lit("Front")) || (view === "back" && lit("Back"));
      body =
        '<path d="M70 32 L36 52 L52 98 L66 90 L66 44 Z" fill="' + (lit("Sleeves") ? "url(#sub)" : fill) + '" stroke="rgba(12,12,20,.25)"/>' +
        '<path d="M130 32 L164 52 L148 98 L134 90 L134 44 Z" fill="' + (lit("Sleeves") ? "url(#sub)" : fill) + '" stroke="rgba(12,12,20,.25)"/>' +
        '<path d="M100 22 C88 22 78 26 70 32 L66 44 L66 198 C66 208 134 208 134 198 L134 44 L130 32 C122 26 112 22 100 22 Z" fill="' + (torsoLit ? "url(#sub)" : fill) + '" stroke="rgba(12,12,20,.25)"/>' +
        (view === "front" ? '<path d="M84 26 L100 46 L116 26" fill="none" stroke="rgba(12,12,20,.35)" stroke-width="4" stroke-linecap="round"/>' : '<path d="M84 26 Q100 36 116 26" fill="none" stroke="rgba(12,12,20,.35)" stroke-width="4" stroke-linecap="round"/>') +
        (product === "Tracksuit" && view === "front" ? '<line x1="100" y1="46" x2="100" y2="200" stroke="rgba(12,12,20,.35)" stroke-width="3" stroke-dasharray="4 3"/>' : "");
    }
    return '<svg viewBox="0 0 200 220" role="img" aria-label="' + esc(product) + '">' + subPat + body + "</svg>";
  }

  // layered mockup stage: base layer = product photo when available (item.img), else neutral SVG;
  // print-area layers are drawn ON TOP as positioned overlays.
  function mockupStage(product, item, view, marks, logoData) {
    var base = item && item.img
      ? '<img class="stage-base" src="' + esc(item.img) + '" alt="">'
      : '<div class="stage-base">' + garmentSVG(product, view, "#e9e9ee", null) + "</div>";
    var layers = "";
    (marks || []).forEach(function (m) {
      var w = m.w * CM / 2, h = m.h * CM / 2.2; // % of stage (viewBox 200×220)
      var x = m.box[0] / 2, y = m.box[1] / 2.2;
      var style = 'style="left:' + (x - w / 2) + "%;top:" + (y - h / 2) + "%;width:" + w + "%;height:" + h + '%"';
      layers += '<div class="stage-area" ' + style + ">" +
        (logoData ? '<img src="' + logoData + '" alt="">' : "") +
        '<span class="stage-tag">' + m.id + "</span></div>";
    });
    return '<div class="mock-stage">' + base + layers + "</div>";
  }

  /* ================= CART ================= */

  var cart = [];
  try { cart = JSON.parse(localStorage.getItem("jp-b2b-cart")) || []; } catch (e) {}

  function saveCart() {
    try { localStorage.setItem("jp-b2b-cart", JSON.stringify(cart)); } catch (e) {}
    $("#cartCount").textContent = cart.reduce(function (n, it) { return n + it.qty; }, 0);
  }
  function addToCart(item) {
    cart.push(item);
    saveCart(); renderCart();
    toast("✓ Added to cart — " + item.title);
    track("b2b_add_to_cart", { item: item.title, qty: item.qty });
    $("#cartSection").hidden = false;
  }
  function lineTotal(it) { return it.unit * tierFor(it.qty).mult * it.qty; }

  function renderCart() {
    var box = $("#cartItems");
    box.innerHTML = "";
    if (!cart.length) {
      box.appendChild(el('<p class="b2b-empty">Your cart is empty — add items from the categories above.</p>'));
      $("#cartSummary").innerHTML = "";
      $("#checkoutForm").hidden = true;
      return;
    }
    cart.forEach(function (it, i) {
      var t = tierFor(it.qty);
      box.appendChild(el('<div class="glass cart-row">' +
        '<div class="cart-row-main"><strong>' + esc(it.title) + "</strong>" +
        '<span class="cart-row-detail">' + esc(it.detail) + "</span></div>" +
        '<div class="cart-row-side">' +
        '<span class="cart-price">' + it.qty + " pcs · " + money(it.unit * t.mult) + "/pc · <strong>" + money(lineTotal(it)) + "</strong></span>" +
        '<button class="cart-remove" data-i="' + i + '" aria-label="Remove">✕</button>' +
        "</div></div>"));
    });
    var sub = cart.reduce(function (n, it) { return n + lineTotal(it); }, 0);
    var base = cart.reduce(function (n, it) { return n + it.unit * it.qty; }, 0);
    $("#cartSummary").innerHTML =
      '<div class="sum-row"><span>Items</span><span>' + cart.reduce(function (n, it) { return n + it.qty; }, 0) + " pcs</span></div>" +
      (base - sub > 0.5 ? '<div class="sum-row sum-save"><span>Bulk savings</span><span>− ' + money(base - sub) + "</span></div>" : "") +
      '<div class="sum-row sum-total"><span>Total (indicative)</span><span>' + money(sub) + "</span></div>" +
      '<p class="enquiry-fine">GST &amp; delivery as applicable · final quote confirmed by our team.</p>';
    $("#checkoutForm").hidden = false;
    $$(".cart-remove", box).forEach(function (b) {
      b.addEventListener("click", function () { cart.splice(+b.dataset.i, 1); saveCart(); renderCart(); });
    });
  }

  /* ================= CATEGORY STEP ================= */

  var flowRoot = $("#flowRoot");
  $$('#catGrid input[name="category"]').forEach(function (cb) {
    cb.addEventListener("change", function () {
      if (!cb.checked) { if (!$$('#catGrid input:checked').length) flowRoot.hidden = true; return; }
      $$('#catGrid input[name="category"]').forEach(function (o) { if (o !== cb) o.checked = false; });
      flowRoot.hidden = false;
      if (cb.value === "equipment") renderEquipment();
      else renderManufacturing(cb.value);
      flowRoot.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ================= EQUIPMENT FLOW (unchanged behaviour) ================= */

  function renderEquipment() {
    flowRoot.innerHTML =
      '<h2 class="b2b-step-title"><span class="b2b-step-num">2</span> Sports equipment</h2>' +
      '<div class="chips-row" id="eqSports"></div><div class="eq-grid" id="eqGrid"></div>';
    var chipRow = $("#eqSports");
    var active = "All";
    ["All"].concat(SPORTS).forEach(function (s) {
      var c = el('<button type="button" class="chip' + (s === active ? " active" : "") + '">' + s + "</button>");
      c.addEventListener("click", function () {
        active = s;
        $$(".chip", chipRow).forEach(function (x) { x.classList.remove("active"); });
        c.classList.add("active");
        drawEq();
      });
      chipRow.appendChild(c);
    });
    function drawEq() {
      var grid = $("#eqGrid");
      grid.innerHTML = "";
      EQUIPMENT.filter(function (e) { return active === "All" || e.sport === active; }).forEach(function (eq) {
        var card = el('<article class="glass eq-card">' +
          '<div class="eq-img" aria-hidden="true"><span>' + esc(eq.sport) + '</span>Photo coming soon</div>' +
          "<h3>" + esc(eq.name) + "</h3>" +
          '<p class="eq-detail">' + esc(eq.detail) + "</p>" +
          '<p class="eq-price">' + money(eq.price) + ' <span>/pc</span></p>' +
          '<label class="cart-qty">Qty <input type="number" min="1" value="1" class="eq-qty"></label>' +
          '<p class="eq-tier"></p>' +
          '<label class="eq-cust-toggle"><input type="checkbox" class="eq-cust"> Add name printing (+' + money(EQUIP_PRINT_FEE) + "/pc)</label>" +
          '<div class="eq-cust-box" hidden>' +
          '<label>Names to print (one per line)<textarea class="field eq-names" rows="3" placeholder="e.g. DAV PUBLIC SCHOOL&#10;or one player name per line"></textarea></label>' +
          '<label>Logo (optional)<input type="file" accept="image/*" class="field eq-logo"></label>' +
          '<label class="b2b-consent"><input type="checkbox" class="eq-rights"><span>I own or hold rights to these names/logos and authorise their printing.</span></label>' +
          "</div>" +
          '<button class="btn btn-primary eq-add" type="button">Add to cart · <span class="eq-total"></span></button>' +
          "</article>");
        var qtyI = $(".eq-qty", card), tierP = $(".eq-tier", card), totalS = $(".eq-total", card);
        var custT = $(".eq-cust", card), custBox = $(".eq-cust-box", card);
        function upd() {
          var q = Math.max(1, parseInt(qtyI.value, 10) || 1);
          var unit = eq.price + (custT.checked ? EQUIP_PRINT_FEE : 0);
          var t = tierFor(q);
          tierP.textContent = t.label + " → " + money(unit * t.mult) + "/pc";
          totalS.textContent = money(unit * t.mult * q);
        }
        qtyI.addEventListener("input", upd);
        custT.addEventListener("change", function () { custBox.hidden = !custT.checked; upd(); });
        $(".eq-add", card).addEventListener("click", function () {
          var q = Math.max(1, parseInt(qtyI.value, 10) || 1);
          var names = $(".eq-names", card).value.trim();
          var hasLogo = $(".eq-logo", card).files.length > 0;
          if (custT.checked && (names || hasLogo) && !$(".eq-rights", card).checked) {
            toast("Please confirm you hold rights to the names/logos."); return;
          }
          addToCart({
            title: eq.name,
            detail: eq.sport + (custT.checked ? " · printed" + (names ? ": " + names.split("\n").length + " name(s)" : "") + (hasLogo ? " + logo (share file after order)" : "") : ""),
            unit: eq.price + (custT.checked ? EQUIP_PRINT_FEE : 0),
            qty: q
          });
        });
        upd();
        grid.appendChild(card);
      });
    }
    drawEq();
  }

  /* ================= MANUFACTURING FLOW ================= */

  function renderManufacturing(section) {
    var isCorp = section === "corporate"; // corporate/uniform wear is not sport-specific
    var S = { section: section, sport: null, product: null, route: null, n0: isCorp ? 4 : 5 };
    var label = section === "sportswear" ? "Sportswear" : "Corporate / Uniform wear";
    flowRoot.innerHTML =
      (isCorp ? "" :
        '<h2 class="b2b-step-title"><span class="b2b-step-num">2</span> ' + label + " — select sport</h2>" +
        '<div class="chips-row" id="mSport"></div>') +
      '<div id="mProductStep"' + (isCorp ? "" : " hidden") + '><h2 class="b2b-step-title"><span class="b2b-step-num">' + (isCorp ? 2 : 3) + "</span> " + (isCorp ? label + " — what do you want?" : "What do you want?") + '</h2><div class="chips-row" id="mProduct"></div></div>' +
      '<div id="mRouteStep" hidden><h2 class="b2b-step-title"><span class="b2b-step-num">' + (isCorp ? 3 : 4) + "</span> Choose how</h2>" +
      '<div class="route-grid">' +
      '<button type="button" class="glass route-card" data-route="ready"><strong>Ready-made</strong><span>In-stock items, optional printing</span></button>' +
      '<button type="button" class="glass route-card" data-route="custom"><strong>Custom manufacturing</strong><span>Made to your spec (min ' + CUSTOM_MOQ + " pcs)</span></button>" +
      "</div></div>" +
      '<div id="mConfig"></div>';

    if (!isCorp) {
      var sportRow = $("#mSport");
      SPORTS.forEach(function (s) {
        var c = el('<button type="button" class="chip">' + s + "</button>");
        c.addEventListener("click", function () {
          S.sport = s;
          $$(".chip", sportRow).forEach(function (x) { x.classList.remove("active"); });
          c.classList.add("active");
          drawProducts();
        });
        sportRow.appendChild(c);
      });
    } else {
      drawProducts();
    }
    function drawProducts() {
      $("#mProductStep").hidden = false;
      var row = $("#mProduct");
      row.innerHTML = "";
      PRODUCT_TYPES[section].forEach(function (p) {
        var c = el('<button type="button" class="chip">' + p + "</button>");
        c.addEventListener("click", function () {
          S.product = p;
          $$(".chip", row).forEach(function (x) { x.classList.remove("active"); });
          c.classList.add("active");
          $("#mRouteStep").hidden = false;
          $("#mConfig").innerHTML = "";
          $("#mRouteStep").scrollIntoView({ behavior: "smooth", block: "center" });
        });
        row.appendChild(c);
      });
    }
    $$(".route-card", flowRoot).forEach(function (b) {
      b.addEventListener("click", function () {
        if (!S.product) { toast("Pick a product first"); return; }
        S.route = b.dataset.route;
        $$(".route-card", flowRoot).forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        if (S.route === "ready") renderReady(S); else renderCustom(S);
      });
    });
  }

  /* ---------- READY-MADE: item → sizes/qty → (optional) printing ---------- */

  function renderReady(S) {
    var stock = READY[S.product] || [];
    var box = $("#mConfig");
    box.innerHTML = '<h2 class="b2b-step-title"><span class="b2b-step-num">5</span> Ready-made ' + esc(S.product) + " — pick an item</h2>" +
      '<div class="eq-grid" id="stockGrid"></div><div id="readyConfig"></div>';
    var grid = $("#stockGrid");
    stock.forEach(function (item) {
      var card = el('<article class="glass eq-card stock-card">' +
        '<div class="eq-img" aria-hidden="true"><span>' + esc(S.product) + "</span>Photo coming soon</div>" +
        "<h3>" + esc(item.name) + "</h3>" +
        '<p class="eq-price">' + money(item.price) + " <span>/pc</span></p>" +
        '<button class="btn btn-ghost" type="button">Select →</button></article>');
      $("button", card).addEventListener("click", function () { renderReadyConfig(S, item); });
      grid.appendChild(card);
    });
  }

  function renderReadyConfig(S, item) {
    var D = { view: "front", marks: {}, logo: null, printing: false };
    var hasSleeves = SLEEVE_PRODUCTS.indexOf(S.product) >= 0;
    var groups = hasSleeves ? ["front", "back", "sleeve"] : ["front", "back"];
    var box = $("#readyConfig");
    box.innerHTML =
      '<h2 class="b2b-step-title"><span class="b2b-step-num">6</span> ' + esc(item.name) + "</h2>" +
      '<div class="designer glass">' +
      '<div class="designer-preview"><div class="view-tabs" id="viewTabs" hidden></div><div id="mockup"></div>' +
      '<p class="designer-hint">Product photo becomes the mockup base — print areas appear as layers on top.</p></div>' +
      '<div class="designer-controls">' +
      '<div id="rSizes"></div>' +
      '<p class="eq-tier" id="rTier"></p>' +
      '<button type="button" class="btn btn-ghost print-toggle" id="printToggle">+ Add printing (optional)</button>' +
      '<div id="printSection" hidden>' +
      '<p class="control-label">Print positions (F = front, B = back' + (hasSleeves ? ", S = sleeve" : "") + ") · " + money(PRINT_POS_FEE) + "/position/pc</p>" +
      '<div id="posList"></div>' +
      '<label>Your logo / artwork<input type="file" accept="image/*" class="field" id="dLogo"></label>' +
      '<label class="b2b-consent"><input type="checkbox" id="dRights"><span>I own or hold rights to this logo/artwork and authorise its printing.</span></label>' +
      "</div>" +
      '<button class="btn btn-primary" id="dAdd" type="button">Add to cart · <span id="dTotal"></span></button>' +
      "</div></div>";

    var sizes = sizeGrid(S.product);
    $("#rSizes").appendChild(sizes);

    var tabs = $("#viewTabs");
    groups.forEach(function (g) {
      var t = el('<button type="button" class="chip' + (g === D.view ? " active" : "") + '">' + (g === "sleeve" ? "Sleeves" : g.charAt(0).toUpperCase() + g.slice(1)) + "</button>");
      t.addEventListener("click", function () {
        D.view = g;
        $$(".chip", tabs).forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        drawPositions(); drawMockup();
      });
      tabs.appendChild(t);
    });

    function activeMarks() {
      var list = [];
      Object.keys(D.marks).forEach(function (id) {
        var viewOf = id[0] === "F" ? "front" : id[0] === "B" ? "back" : "sleeve";
        if (viewOf === D.view || (D.view === "front" && viewOf === "sleeve")) list.push(D.marks[id]);
      });
      return list;
    }
    function drawMockup() {
      $("#mockup").innerHTML = mockupStage(S.product, item, D.view === "sleeve" ? "front" : D.view, D.printing ? activeMarks() : [], D.logo);
    }
    function drawPositions() {
      var pl = $("#posList");
      pl.innerHTML = "";
      POSITIONS[D.view].forEach(function (p) {
        var on = !!D.marks[p.id];
        var row = el('<div class="pos-row' + (on ? " on" : "") + '">' +
          '<label><input type="checkbox" ' + (on ? "checked" : "") + "> <strong>" + p.id + "</strong> " + p.name +
          ' <span class="pos-rec">rec. ' + p.rec[0] + "×" + p.rec[1] + " cm</span></label>" +
          '<span class="pos-size"' + (on ? "" : " hidden") + '>W <input type="number" class="pw" min="3" max="35" value="' + (on ? D.marks[p.id].w : p.rec[0]) + '"> × H <input type="number" class="ph" min="3" max="40" value="' + (on ? D.marks[p.id].h : p.rec[1]) + '"> cm</span></div>');
        $('input[type="checkbox"]', row).addEventListener("change", function (e) {
          if (e.target.checked) D.marks[p.id] = { id: p.id, name: p.name, box: p.box, w: p.rec[0], h: p.rec[1] };
          else delete D.marks[p.id];
          drawPositions(); drawMockup(); upd();
        });
        $$(".pos-size input", row).forEach(function (inp) {
          inp.addEventListener("input", function () {
            if (!D.marks[p.id]) return;
            D.marks[p.id].w = Math.min(35, Math.max(3, parseFloat($(".pw", row).value) || p.rec[0]));
            D.marks[p.id].h = Math.min(40, Math.max(3, parseFloat($(".ph", row).value) || p.rec[1]));
            drawMockup();
          });
        });
        pl.appendChild(row);
      });
    }

    $("#printToggle").addEventListener("click", function () {
      D.printing = !D.printing;
      $("#printSection").hidden = !D.printing;
      $("#viewTabs").hidden = !D.printing;
      this.textContent = D.printing ? "− Remove printing" : "+ Add printing (optional)";
      if (D.printing && !$("#posList").children.length) drawPositions();
      drawMockup(); upd();
    });
    $("#dLogo").addEventListener("change", function (e) {
      var f = e.target.files[0];
      if (!f) { D.logo = null; drawMockup(); return; }
      var r = new FileReader();
      r.onload = function () { D.logo = r.result; drawMockup(); };
      r.readAsDataURL(f);
    });
    function unit() { return item.price + (D.printing ? Object.keys(D.marks).length * PRINT_POS_FEE : 0); }
    function upd() {
      var q = sizes.total();
      var t = tierFor(Math.max(1, q));
      $("#rTier").textContent = (D.printing ? Object.keys(D.marks).length + " print position(s) · " : "") + t.label + " → " + money(unit() * t.mult) + "/pc";
      $("#dTotal").textContent = money(unit() * t.mult * Math.max(0, q));
    }
    sizes.onChange(upd);
    $("#dAdd").addEventListener("click", function () {
      var q = sizes.total();
      if (!q) { toast("Enter quantity for at least one size"); return; }
      if (D.printing && D.logo && !$("#dRights").checked) { toast("Please confirm you hold rights to the logo."); return; }
      var posTxt = Object.keys(D.marks).map(function (id) { return id + " (" + D.marks[id].w + "×" + D.marks[id].h + "cm)"; }).join(", ");
      addToCart({
        title: item.name,
        detail: S.sport + " · " + S.product + " · sizes: " + sizes.breakdown() +
          (D.printing && posTxt ? " · prints: " + posTxt : " · no prints") +
          (D.printing && D.logo ? " · logo uploaded (share file after order)" : ""),
        unit: unit(),
        qty: q
      });
    });
    drawMockup(); upd();
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- CUSTOM: Printed (sublimation) vs Non-printed (plain) ---------- */

  function renderCustom(S) {
    var styleOpt = STYLE_OPTIONS[S.product] || { label: "Style", options: ["Standard"] };
    var hasSleeves = SLEEVE_PRODUCTS.indexOf(S.product) >= 0;
    var C = {
      make: null, fabric: null, color: null, style: styleOpt.options[0],
      sleeve: "Half", sleeveCustom: "", panels: [], names: false, roster: [],
      design: null
    };
    var box = $("#mConfig");
    box.innerHTML =
      '<h2 class="b2b-step-title"><span class="b2b-step-num">5</span> Custom-manufactured ' + esc(S.product) + "</h2>" +
      '<p class="control-label">Type of product</p>' +
      '<div class="route-grid">' +
      '<button type="button" class="glass route-card" data-make="sub"><strong>Printed — Sublimation</strong><span>Full-colour printed fabric panels</span></button>' +
      '<button type="button" class="glass route-card" data-make="plain"><strong>Non-printed — Plain</strong><span>Solid fabric colours, no printing</span></button>' +
      "</div>" +
      '<div id="customBody"></div><div id="reviewBox"></div>';

    $$("[data-make]", box).forEach(function (b) {
      b.addEventListener("click", function () {
        C.make = b.dataset.make;
        $$("[data-make]", box).forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        C.fabric = (C.make === "sub" ? SUB_FABRICS : PLAIN_FABRICS)[0];
        C.color = C.make === "plain" ? C.fabric.colors[0] : null;
        C.panels = []; C.design = null;
        drawBody();
      });
    });

    var sizes;
    function drawBody() {
      var fabrics = C.make === "sub" ? SUB_FABRICS : PLAIN_FABRICS;
      var body = $("#customBody");
      body.innerHTML =
        '<div class="designer glass"><div class="designer-preview"><div id="cMockup"></div><p class="designer-hint" id="cHint"></p></div>' +
        '<div class="designer-controls">' +
        '<label>Fabric (' + (C.make === "sub" ? "sublimation-compatible" : "plain") + ') <select class="field" id="cFabric">' +
        fabrics.map(function (f, i) { return '<option value="' + i + '">' + f.name + " · " + f.gsm + " GSM" + (f.add ? " (" + (f.add > 0 ? "+" : "−") + money(Math.abs(f.add)).slice(1) + " ₹)" : "") + "</option>"; }).join("") + "</select></label>" +
        (C.make === "plain"
          ? '<div><p class="control-label">Colour (as per fabric availability)</p><div class="swatch-row" id="cColors"></div></div>'
          : '<div><p class="control-label">Panels to sublimate</p><div class="chips-row" id="cPanels">' +
            ["Front", "Back", "Sleeves", "Full sublimation"].map(function (p) { return '<button type="button" class="chip" data-panel="' + p + '">' + p + " +" + money(PANEL_FEES[p]).slice(1) + "₹</button>"; }).join("") + "</div>" +
            '<label class="eq-cust-toggle" style="margin-top:6px"><input type="checkbox" id="cNames"> Custom name &amp; number (+' + money(NAME_NUM_FEE) + "/pc)</label>" +
            '<div id="rosterBox" hidden></div>' +
            '<p class="control-label" style="margin-top:10px">Design</p>' +
            '<div class="design-grid" id="cDesigns">' +
            DESIGNS.map(function (d) { return '<button type="button" class="design-card" data-design="' + esc(d) + '"><span class="design-thumb">' + d.slice(0, 4) + "</span>" + esc(d) + "</button>"; }).join("") +
            '<button type="button" class="design-card consult" data-design="Design consultancy"><span class="design-thumb">★</span>Request design consultancy — our team contacts you</button>' +
            "</div>") +
        "<label>" + esc(styleOpt.label) + ' <select class="field" id="cStyle">' + styleOpt.options.map(function (o) { return "<option>" + esc(o) + "</option>"; }).join("") + "</select></label>" +
        (hasSleeves ? '<label>Sleeve length <select class="field" id="cSleeve">' + SLEEVES.map(function (s) { return "<option>" + s + "</option>"; }).join("") + '</select></label><label id="cSleeveCustomWrap" hidden>Custom sleeve length (cm)<input type="number" class="field" id="cSleeveCustom" min="5" max="70" placeholder="e.g. 24"></label>' : "") +
        '<div id="cSizes"></div>' +
        '<label>Notes<textarea class="field" id="cNotes" rows="2" placeholder="anything our team should know"></textarea></label>' +
        '<p class="eq-tier" id="cTier"></p>' +
        '<button class="btn btn-primary" id="cReview" type="button">Review order →</button>' +
        "</div></div>";

      sizes = sizeGrid(S.product);
      $("#cSizes").appendChild(sizes);
      sizes.onChange(upd);

      $("#cFabric").addEventListener("change", function (e) {
        C.fabric = fabrics[+e.target.value];
        if (C.make === "plain") { C.color = C.fabric.colors[0]; drawColors(); }
        drawMock(); upd();
      });
      if (C.make === "plain") drawColors();
      else {
        $$("#cPanels .chip", body).forEach(function (chip) {
          chip.addEventListener("click", function () {
            var p = chip.dataset.panel;
            if (p === "Full sublimation") {
              C.panels = C.panels.indexOf(p) >= 0 ? [] : ["Full sublimation"];
            } else {
              var i = C.panels.indexOf(p);
              if (i >= 0) C.panels.splice(i, 1); else C.panels.push(p);
              C.panels = C.panels.filter(function (x) { return x !== "Full sublimation"; });
            }
            $$("#cPanels .chip", body).forEach(function (x) { x.classList.toggle("active", C.panels.indexOf(x.dataset.panel) >= 0); });
            drawMock(); upd();
          });
        });
        $("#cNames").addEventListener("change", function (e) {
          C.names = e.target.checked;
          $("#rosterBox").hidden = !C.names;
          if (C.names) drawRoster();
          upd();
        });
        $$(".design-card", body).forEach(function (d) {
          d.addEventListener("click", function () {
            C.design = d.dataset.design;
            $$(".design-card", body).forEach(function (x) { x.classList.remove("active"); });
            d.classList.add("active");
            drawMock();
          });
        });
      }
      $("#cStyle").addEventListener("change", function (e) { C.style = e.target.value; drawMock(); });
      if (hasSleeves) {
        $("#cSleeve").addEventListener("change", function (e) {
          C.sleeve = e.target.value;
          $("#cSleeveCustomWrap").hidden = C.sleeve !== "Custom";
          drawMock();
        });
        $("#cSleeveCustom").addEventListener("input", function (e) { C.sleeveCustom = e.target.value; drawMock(); });
      }
      $("#cReview").addEventListener("click", renderReview);
      drawMock(); upd();
      body.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function drawColors() {
      var wrap = $("#cColors");
      if (!wrap) return;
      wrap.innerHTML = "";
      C.fabric.colors.forEach(function (c) {
        var s = el('<button type="button" class="swatch' + (c === C.color ? " active" : "") + '" style="background:' + (COLOR_HEX[c] || "#ddd") + '" aria-label="' + esc(c) + '" title="' + esc(c) + '"></button>');
        s.addEventListener("click", function () {
          C.color = c;
          $$(".swatch", wrap).forEach(function (x) { x.classList.remove("active"); });
          s.classList.add("active");
          drawMock();
        });
        wrap.appendChild(s);
      });
    }
    function drawRoster() {
      var rb = $("#rosterBox");
      if (rb.children.length) return;
      rb.innerHTML = '<p class="control-label">Player details</p><div id="rosterRows"></div><button type="button" class="btn btn-ghost" id="rosterAdd" style="padding:8px 14px;font-size:.8rem">+ Add player</button>';
      function addRow(name, num) {
        var r = el('<div class="roster-row"><input type="text" placeholder="Name" class="field rname" value="' + esc(name || "") + '"><input type="text" placeholder="No." class="field rnum" maxlength="3" value="' + esc(num || "") + '"><button type="button" class="cart-remove" aria-label="Remove">✕</button></div>');
        $(".cart-remove", r).addEventListener("click", function () { r.remove(); });
        $("#rosterRows").appendChild(r);
      }
      $("#rosterAdd").addEventListener("click", function () { addRow(); });
      addRow(); addRow();
    }
    function rosterList() {
      return $$("#rosterRows .roster-row").map(function (r) {
        return { name: $(".rname", r).value.trim(), num: $(".rnum", r).value.trim() };
      }).filter(function (p) { return p.name || p.num; });
    }
    function drawMock() {
      var hex = C.make === "plain" ? (COLOR_HEX[C.color] || "#e9e9ee") : "#e9e9ee";
      $("#cMockup").innerHTML = garmentSVG(S.product, "front", hex, C.make === "sub" ? C.panels : null);
      $("#cHint").textContent = C.fabric.name + " " + C.fabric.gsm + " GSM" +
        (C.make === "plain" ? " · " + C.color : " · panels: " + (C.panels.join(", ") || "none yet") + (C.design ? " · " + C.design : "")) +
        " · " + C.style + (hasSleeves ? " · " + C.sleeve + (C.sleeve === "Custom" && C.sleeveCustom ? " (" + C.sleeveCustom + "cm)" : "") + " sleeves" : "");
    }
    function panelsFee() {
      return C.panels.reduce(function (n, p) { return n + (PANEL_FEES[p] || 0); }, 0);
    }
    function unit() {
      return (CUSTOM_BASE[S.product] || 300) + C.fabric.add + (C.make === "sub" ? panelsFee() : 0) + (C.names ? NAME_NUM_FEE : 0);
    }
    function upd() {
      var q = Math.max(0, sizes ? sizes.total() : 0);
      var t = tierFor(Math.max(1, q));
      $("#cTier").textContent = t.label + " → " + money(unit() * t.mult) + "/pc" + (q < CUSTOM_MOQ ? " · minimum " + CUSTOM_MOQ + " pcs" : "");
    }

    function renderReview() {
      var q = sizes.total();
      if (!C.make) { toast("Choose printed or plain first"); return; }
      if (q < CUSTOM_MOQ) { toast("Custom manufacturing needs at least " + CUSTOM_MOQ + " pcs total"); return; }
      if (C.make === "sub" && !C.panels.length) { toast("Select at least one panel to sublimate"); return; }
      if (C.make === "sub" && !C.design) { toast("Pick a design or request design consultancy"); return; }
      var roster = C.names ? rosterList() : [];
      var t = tierFor(q);
      var rows = [
        ["Product", S.sport + " · " + S.product + " · " + (C.make === "sub" ? "Printed (Sublimation)" : "Non-printed (Plain)")],
        ["Fabric", C.fabric.name + " · " + C.fabric.gsm + " GSM"],
        C.make === "plain" ? ["Colour", C.color] : ["Sublimated panels", C.panels.join(", ")],
        C.make === "sub" ? ["Design", C.design] : null,
        [styleOpt.label, C.style],
        hasSleeves ? ["Sleeves", C.sleeve + (C.sleeve === "Custom" && C.sleeveCustom ? " (" + C.sleeveCustom + " cm)" : "")] : null,
        ["Sizes", sizes.breakdown() + " — " + q + " pcs total"],
        C.names ? ["Name & number (+" + money(NAME_NUM_FEE) + "/pc)", roster.length ? roster.map(function (p) { return p.name + (p.num ? " #" + p.num : ""); }).join(", ") : "details to follow"] : null,
        ["Price", money(unit() * t.mult) + "/pc (" + t.label + ") → " + money(unit() * t.mult * q)]
      ].filter(Boolean);
      var rb = $("#reviewBox");
      rb.innerHTML =
        '<h2 class="b2b-step-title"><span class="b2b-step-num">6</span> Review &amp; confirm</h2>' +
        '<div class="designer glass"><div class="designer-preview">' + $("#cMockup").innerHTML + "</div>" +
        '<div class="designer-controls"><table class="review-table">' +
        rows.map(function (r) { return "<tr><th>" + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>"; }).join("") +
        "</table>" +
        '<label class="b2b-consent"><input type="checkbox" id="finalConsent"><span><strong>I have verified every detail above.</strong> I understand that no modifications are possible after the order is placed and printing/production begins.</span></label>' +
        '<button class="btn btn-primary" id="confirmAdd" type="button">Add to cart</button>' +
        "</div></div>";
      $("#confirmAdd").addEventListener("click", function () {
        if (!$("#finalConsent").checked) { toast("Please confirm you have verified the details."); return; }
        var notes = $("#cNotes").value.trim();
        addToCart({
          title: "Custom " + S.product + " — " + S.sport + (C.make === "sub" ? " (Sublimation)" : " (Plain)"),
          detail: rows.slice(1, -1).map(function (r) { return r[0] + ": " + r[1]; }).join(" · ") + (notes ? " · notes: " + notes : ""),
          unit: unit(),
          qty: q,
          moq: CUSTOM_MOQ
        });
        rb.innerHTML = "";
      });
      rb.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /* ================= CHECKOUT ================= */

  $("#cartBtn").addEventListener("click", function () {
    $("#cartSection").hidden = false;
    renderCart();
    $("#cartSection").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("#checkoutForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!cart.length) { toast("Cart is empty"); return; }
    var f = e.target;
    var lines = cart.map(function (it, i) {
      var t = tierFor(it.qty);
      return (i + 1) + ". " + it.title + " | " + it.detail + " | " + it.qty + " pcs × " + money(it.unit * t.mult) + " = " + money(lineTotal(it));
    });
    var total = cart.reduce(function (n, it) { return n + lineTotal(it); }, 0);
    var bill = lines.join("\n") + "\nTOTAL (indicative): " + money(total) + " + GST/delivery as applicable";
    var btn = $("button[type=submit]", f);
    btn.disabled = true; btn.textContent = "Placing order…";
    fetch("https://formsubmit.co/ajax/shridhar.govind14.sg@gmail.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        _subject: "B2B ORDER — jaypeesports.in (" + money(total) + ")",
        _template: "table",
        _captcha: "false",
        name: f.name.value, institution: f.org.value, phone: f.phone.value, email: f.email.value,
        order: bill,
        _autoresponse: "Thank you for your Jaypee Sports B2B order!\n\n" + bill +
          "\n\nNote: no modifications are possible once printing/production begins. Our team will confirm the final quote within 1-2 working days. Share logo/artwork files by replying to this email or on WhatsApp +91 91551 42770.\n— Jaypee Sports, Quality Par Excellence"
      })
    }).catch(function () {})
      .finally(function () {
        track("b2b_order", { value: Math.round(total), items: cart.length });
        var wa = "https://wa.me/919155142770?text=" + encodeURIComponent("B2B order from " + f.name.value + " (" + f.org.value + ")\n" + bill);
        $("#orderSuccess").hidden = false;
        $("#orderSuccess").innerHTML = "<h3>✅ Order placed!</h3>" +
          "<p>The bill has been emailed to <strong>" + esc(f.email.value) + "</strong>. Our team will confirm the final quote within 1–2 working days.</p>" +
          '<pre class="bill-pre">' + esc(bill) + "</pre>" +
          '<a class="btn btn-primary" target="_blank" rel="noopener" href="' + wa + '">Send bill to WhatsApp →</a>';
        cart = []; saveCart(); renderCart();
        f.hidden = true; f.reset();
        btn.disabled = false; btn.textContent = "Place order & send bill";
        $("#orderSuccess").scrollIntoView({ behavior: "smooth", block: "center" });
      });
  });

  /* ================= DATA LOADER (reads website/data/*.csv) =================
     The catalogue above is the built-in fallback. On load we fetch the CSV
     files and override it, so editing the CSVs changes the live portal.       */

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
  function pipeList(s) { return String(s || "").split("|").map(function (x) { return x.trim(); }).filter(Boolean); }
  function num(s) { var n = parseFloat(String(s).replace(/[^0-9.\-]/g, "")); return isNaN(n) ? 0 : n; }

  function fetchCSV(name) {
    return fetch("data/" + name + ".csv?t=" + Date.now(), { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(name); return r.text(); })
      .then(function (t) { return toObjects(parseCSV(t)); });
  }

  var APPLY = {
    sports: function (o) { var v = o.map(function (r) { return r.sport; }).filter(Boolean); if (v.length) SPORTS = v; },
    products: function (o) {
      if (!o.length) return;
      var pt = { sportswear: [], corporate: [] }, sizes = {}, styles = {}, base = {}, sleeves = [];
      o.forEach(function (r) {
        var type = r.product_type; if (!type) return;
        var sec = (r.section || "Both").toLowerCase();
        if (sec === "sportswear" || sec === "both") pt.sportswear.push(type);
        if (sec === "corporate" || sec === "both") pt.corporate.push(type);
        sizes[type] = pipeList(r.sizes);
        styles[type] = { label: r.style_label || "Style", options: pipeList(r.style_options) };
        base[type] = num(r.custom_base_price_inr);
        if (/^y/i.test(r.has_sleeves || "")) sleeves.push(type);
      });
      if (pt.sportswear.length || pt.corporate.length) PRODUCT_TYPES = pt;
      SIZES = sizes; STYLE_OPTIONS = styles; CUSTOM_BASE = base; SLEEVE_PRODUCTS = sleeves;
    },
    equipment: function (o) {
      var v = o.map(function (r, i) { return { id: "eq" + i, sport: r.sport, name: r.item_name, price: num(r.price_inr), detail: r.description, img: r.image_file || null }; })
        .filter(function (r) { return r.name; });
      if (v.length) EQUIPMENT = v;
    },
    readymade: function (o) {
      if (!o.length) return;
      var ready = {};
      o.forEach(function (r, i) {
        if (!r.product_type || !r.item_name) return;
        (ready[r.product_type] = ready[r.product_type] || []).push({ id: "r" + i, name: r.item_name, price: num(r.price_inr), img: r.image_file || null });
      });
      if (Object.keys(ready).length) READY = ready;
    },
    fabrics: function (o) {
      var plain = [], sub = [];
      o.forEach(function (r) {
        if (!r.fabric_name) return;
        var rec = { id: slug(r.fabric_name), name: r.fabric_name, gsm: num(r.gsm), add: num(r.price_change_inr) };
        if (/sub/i.test(r.type)) sub.push(rec);
        else { rec.colors = pipeList(r.colors_available); plain.push(rec); }
      });
      if (plain.length) PLAIN_FABRICS = plain;
      if (sub.length) SUB_FABRICS = sub;
    },
    colors: function (o) { var m = {}; o.forEach(function (r) { if (r.color_name) m[r.color_name] = r.hex_code; }); if (Object.keys(m).length) COLOR_HEX = m; },
    designs: function (o) { var v = o.map(function (r) { return r.design_name; }).filter(Boolean); if (v.length) DESIGNS = v; },
    print_areas: function (o) {
      if (!o.length) return;
      var pos = { front: [], back: [], sleeve: [] };
      var map = { front: "front", back: "back", sleeve: "sleeve", sleeves: "sleeve" };
      o.forEach(function (r) {
        var key = map[(r.view || "").toLowerCase()]; if (!key) return;
        pos[key].push({ id: r.code, name: r.area_name, rec: [num(r.recommended_width_cm), num(r.recommended_height_cm)], box: BOX_COORDS[r.code] || [100, 110] });
      });
      if (pos.front.length || pos.back.length || pos.sleeve.length) POSITIONS = pos;
    },
    settings: function (o) {
      var s = {}; o.forEach(function (r) { if (r.setting) s[slug(r.setting)] = r.value; });
      if (s.equipment_print_fee) EQUIP_PRINT_FEE = num(s.equipment_print_fee);
      if (s.print_position_fee) PRINT_POS_FEE = num(s.print_position_fee);
      if (s.name_and_number_fee) NAME_NUM_FEE = num(s.name_and_number_fee);
      if (s.custom_min_order_qty) CUSTOM_MOQ = num(s.custom_min_order_qty);
      PANEL_FEES = {
        "Front": num(s.sublimation_panel_fee_front) || PANEL_FEES.Front,
        "Back": num(s.sublimation_panel_fee_back) || PANEL_FEES.Back,
        "Sleeves": num(s.sublimation_panel_fee_sleeves) || PANEL_FEES.Sleeves,
        "Full sublimation": num(s.sublimation_panel_fee_full) || PANEL_FEES["Full sublimation"]
      };
      if (s.sleeve_length_options) { var sl = pipeList(s.sleeve_length_options); if (sl.length) SLEEVES = sl; }
      if (s.quantity_discount_tiers) {
        var tiers = pipeList(s.quantity_discount_tiers).map(function (t) {
          var p = t.split(":"); return { min: num(p[0]), disc: num(p[1]) };
        }).filter(function (t) { return t.min > 0; }).sort(function (a, b) { return b.min - a.min; });
        if (tiers.length) {
          TIERS = tiers.map(function (t) { return { min: t.min, mult: 1 - t.disc / 100, label: t.min + "+ pcs · " + t.disc + "% off" }; });
          TIERS.push({ min: 1, mult: 1, label: "base price" });
        }
      }
    }
  };

  function loadData() {
    var files = Object.keys(APPLY);
    var status = $("#dataStatus");
    return Promise.all(files.map(function (name) {
      return fetchCSV(name).then(function (objs) { APPLY[name](objs); return true; })
        .catch(function () { return false; });
    })).then(function (results) {
      var ok = results.filter(Boolean).length;
      if (status) {
        status.hidden = false;
        status.textContent = ok ? "Catalogue loaded from your data files ✓" : "Showing built-in sample catalogue.";
      }
    });
  }

  /* ================= INIT ================= */
  $("#year") && ($("#year").textContent = new Date().getFullYear());
  saveCart();
  if (cart.length) { $("#cartSection").hidden = false; renderCart(); }
  loadData();
})();
