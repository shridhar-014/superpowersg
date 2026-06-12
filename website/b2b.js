/* Jaypee Sports — B2B ordering (pilot)
   All prices are ASSUMED PLACEHOLDERS — edit the DATA section below.   */

(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ================= DATA (all values assumed — edit freely) ================= */

  var SPORTS = ["Football", "Basketball", "Cricket", "Hockey", "Volleyball"];

  // quantity-based pricing: same tiers everywhere
  var TIERS = [
    { min: 100, mult: 0.85, label: "100+ pcs · 15% off" },
    { min: 50,  mult: 0.90, label: "50–99 pcs · 10% off" },
    { min: 10,  mult: 0.95, label: "10–49 pcs · 5% off" },
    { min: 1,   mult: 1.00, label: "1–9 pcs · base price" }
  ];
  function tierFor(q) { for (var i = 0; i < TIERS.length; i++) if (q >= TIERS[i].min) return TIERS[i]; return TIERS[TIERS.length - 1]; }

  var EQUIPMENT = [
    { id: "fb-ball",  sport: "Football",   name: "Match Football (Size 5)",     price: 650,  detail: "32-panel PU, hand-stitched, all-weather." },
    { id: "fb-glove", sport: "Football",   name: "Goalkeeper Gloves",           price: 450,  detail: "Latex palm, breathable mesh back, sizes 7–10." },
    { id: "bb-ball",  sport: "Basketball", name: "Basketball (Size 7)",         price: 550,  detail: "Composite cover, indoor/outdoor, deep channels." },
    { id: "bb-net",   sport: "Basketball", name: "Basketball Net (Pair)",       price: 250,  detail: "Heavy-duty nylon, all-weather, standard 12-loop." },
    { id: "cr-bat",   sport: "Cricket",    name: "Kashmir Willow Bat",          price: 1200, detail: "Short handle, full size, pre-knocked blade." },
    { id: "cr-ball",  sport: "Cricket",    name: "Leather Cricket Ball",        price: 350,  detail: "4-piece construction, match grade, red." },
    { id: "hk-stick", sport: "Hockey",     name: "Field Hockey Stick",          price: 900,  detail: "Fibreglass-reinforced, 36.5\", mid-bow." },
    { id: "hk-ball",  sport: "Hockey",     name: "Hockey Ball",                 price: 200,  detail: "Dimpled PVC, match weight, white." },
    { id: "vb-ball",  sport: "Volleyball", name: "Volleyball (Size 4)",         price: 500,  detail: "Soft-touch PU, 18 panel, indoor/outdoor." },
    { id: "vb-net",   sport: "Volleyball", name: "Volleyball Net",              price: 600,  detail: "9.5m × 1m, steel cable top, weather-proof." }
  ];
  var EQUIP_PRINT_FEE = 30; // per item, when name printing is added

  var PRODUCT_TYPES = {
    sportswear: ["Jersey", "T-shirt", "Lowers", "Shorts", "Tracksuit", "Cap"],
    corporate:  ["T-shirt", "Tracksuit", "Cap", "School Uniform"]
  };

  // ready-made stock (price per piece; colors in stock)
  var READY = {
    "Jersey":         [{ id: "rj1", name: "Club Jersey — Dry-Fit",      price: 350, colors: ["Red", "Royal Blue", "Black"] },
                       { id: "rj2", name: "Pro Match Jersey — Dot-Knit", price: 450, colors: ["White", "Navy", "Green"] }],
    "T-shirt":        [{ id: "rt1", name: "Round-Neck Sports Tee",      price: 250, colors: ["White", "Black", "Navy", "Red"] },
                       { id: "rt2", name: "Polo T-shirt",               price: 320, colors: ["White", "Navy", "Maroon"] }],
    "Lowers":         [{ id: "rl1", name: "Training Lowers",            price: 300, colors: ["Black", "Navy"] }],
    "Shorts":         [{ id: "rs1", name: "Sports Shorts",              price: 220, colors: ["Black", "Royal Blue", "Red"] }],
    "Tracksuit":      [{ id: "rk1", name: "Polyester Tracksuit Set",    price: 850, colors: ["Black/White", "Navy/Sky"] }],
    "Cap":            [{ id: "rc1", name: "Baseball Cap",               price: 150, colors: ["White", "Black", "Red", "Navy"] }],
    "School Uniform": [{ id: "ru1", name: "House T-shirt (School)",     price: 200, colors: ["Red", "Blue", "Green", "Yellow"] },
                       { id: "ru2", name: "School Uniform Set",         price: 550, colors: ["As per school colours"] }]
  };

  // print positions; rec = recommended size in cm [w, h]; box = [x, y] center on the mockup (viewBox 200×220)
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
  var PRINT_POS_FEE = 40; // per position per piece
  var CM = 4; // mockup scale: 1 cm ≈ 4 viewBox units

  // custom manufacturing
  var FABRICS = [
    { id: "drifit",    name: "Polyester Dry-Fit", add: 30, colors: ["White", "Black", "Navy", "Red", "Royal Blue", "Orange", "Green"] },
    { id: "cotton",    name: "Cotton 180 GSM",    add: 0,  colors: ["White", "Black", "Navy", "Red", "Maroon", "Yellow", "Grey"] },
    { id: "polycot",   name: "Poly-Cotton",       add: 15, colors: ["White", "Black", "Navy", "Sky Blue", "Green"] },
    { id: "dotknit",   name: "Dot-Knit Mesh",     add: 25, colors: ["White", "Black", "Royal Blue", "Red"] },
    { id: "interlock", name: "Interlock",         add: 35, colors: ["White", "Black", "Navy", "Maroon"] }
  ];
  var COLOR_HEX = { "White": "#f4f4f4", "Black": "#1c1c1f", "Navy": "#1e2a52", "Red": "#c8102e", "Royal Blue": "#2447c7", "Orange": "#e8651a", "Green": "#1d7a3e", "Maroon": "#6d1f2c", "Yellow": "#e8c81a", "Grey": "#8a8a90", "Sky Blue": "#7db8e8" };
  var SUBLIMATION_ADD = 70;
  var CUSTOM_BASE = { "Jersey": 380, "T-shirt": 260, "Lowers": 320, "Shorts": 240, "Tracksuit": 950, "Cap": 180, "School Uniform": 600 };
  var CUSTOM_MOQ = 10;

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

  /* ================= GARMENT MOCKUP (own SVG tool — instant & exact) ================= */

  function garmentSVG(product, view, colorHex, marks, logoData) {
    var fill = colorHex || "#e9e9ee";
    var body;
    if (product === "Shorts") {
      body = '<path d="M55 40 L145 40 L160 170 L112 170 L100 95 L88 170 L40 170 Z" fill="' + fill + '" stroke="rgba(12,12,20,.25)"/>';
    } else if (product === "Lowers") {
      body = '<path d="M62 30 L138 30 L150 200 L110 200 L100 80 L90 200 L50 200 Z" fill="' + fill + '" stroke="rgba(12,12,20,.25)"/>';
    } else if (product === "Cap") {
      body = '<path d="M40 120 Q40 50 100 50 Q160 50 160 120 Z" fill="' + fill + '" stroke="rgba(12,12,20,.25)"/><path d="M40 120 Q100 100 178 124 L174 138 Q100 118 42 132 Z" fill="' + fill + '" stroke="rgba(12,12,20,.25)"/>';
    } else {
      // jersey / t-shirt / tracksuit / uniform silhouette
      body = '<path d="M100 22 C88 22 78 26 70 32 L36 52 L52 98 L66 90 L66 198 C66 208 134 208 134 198 L134 90 L148 98 L164 52 L130 32 C122 26 112 22 100 22 Z" fill="' + fill + '" stroke="rgba(12,12,20,.25)"/>'
        + (view === "front" ? '<path d="M84 26 L100 46 L116 26" fill="none" stroke="rgba(12,12,20,.35)" stroke-width="4" stroke-linecap="round"/>' : '<path d="M84 26 Q100 36 116 26" fill="none" stroke="rgba(12,12,20,.35)" stroke-width="4" stroke-linecap="round"/>')
        + (product === "Tracksuit" && view === "front" ? '<line x1="100" y1="46" x2="100" y2="200" stroke="rgba(12,12,20,.35)" stroke-width="3" stroke-dasharray="4 3"/>' : "");
    }
    var overlays = "";
    (marks || []).forEach(function (m) {
      var w = m.w * CM, h = m.h * CM;
      var x = m.box[0] - w / 2, y = m.box[1] - h / 2;
      if (logoData) {
        overlays += '<image href="' + logoData + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid meet"/>';
      } else {
        overlays += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="rgba(124,58,237,.18)" stroke="#7c3aed" stroke-dasharray="4 3" rx="3"/>';
      }
      overlays += '<text x="' + m.box[0] + '" y="' + (y - 4) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#7c3aed">' + m.id + "</text>";
    });
    return '<svg viewBox="0 0 200 220" role="img" aria-label="' + esc(product) + " mockup — " + view + '">' + body + overlays + "</svg>";
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
    saveCart();
    renderCart();
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
      var row = el('<div class="glass cart-row">' +
        '<div class="cart-row-main"><strong>' + esc(it.title) + "</strong>" +
        '<span class="cart-row-detail">' + esc(it.detail) + "</span></div>" +
        '<div class="cart-row-side">' +
        '<label class="cart-qty">Qty <input type="number" min="' + (it.moq || 1) + '" value="' + it.qty + '" data-i="' + i + '"></label>' +
        '<span class="cart-price">' + money(it.unit * t.mult) + "/pc · <strong>" + money(lineTotal(it)) + "</strong></span>" +
        '<button class="cart-remove" data-i="' + i + '" aria-label="Remove">✕</button>' +
        "</div></div>");
      box.appendChild(row);
    });
    var sub = cart.reduce(function (n, it) { return n + lineTotal(it); }, 0);
    var base = cart.reduce(function (n, it) { return n + it.unit * it.qty; }, 0);
    $("#cartSummary").innerHTML =
      '<div class="sum-row"><span>Items</span><span>' + cart.reduce(function (n, it) { return n + it.qty; }, 0) + " pcs</span></div>" +
      (base - sub > 0.5 ? '<div class="sum-row sum-save"><span>Bulk savings</span><span>− ' + money(base - sub) + "</span></div>" : "") +
      '<div class="sum-row sum-total"><span>Total (indicative)</span><span>' + money(sub) + "</span></div>" +
      '<p class="enquiry-fine">GST &amp; delivery as applicable · final quote confirmed by our team.</p>';
    $("#checkoutForm").hidden = false;

    $$(".cart-qty input", box).forEach(function (inp) {
      inp.addEventListener("change", function () {
        var it = cart[+inp.dataset.i];
        it.qty = Math.max(it.moq || 1, parseInt(inp.value, 10) || 1);
        saveCart(); renderCart();
      });
    });
    $$(".cart-remove", box).forEach(function (b) {
      b.addEventListener("click", function () {
        cart.splice(+b.dataset.i, 1);
        saveCart(); renderCart();
      });
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

  /* ================= EQUIPMENT FLOW ================= */

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
          '<label>Names to print (one per line — institution or individual names)<textarea class="field eq-names" rows="3" placeholder="e.g. DAV PUBLIC SCHOOL&#10;or one player name per line"></textarea></label>' +
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

  /* ================= MANUFACTURING FLOW (sportswear / corporate) ================= */

  function renderManufacturing(section) {
    var S = { section: section, sport: null, product: null, route: null };
    var label = section === "sportswear" ? "Sportswear" : "Corporate / Uniform wear";
    flowRoot.innerHTML =
      '<h2 class="b2b-step-title"><span class="b2b-step-num">2</span> ' + label + " — select sport</h2>" +
      '<div class="chips-row" id="mSport"></div>' +
      '<div id="mProductStep" hidden><h2 class="b2b-step-title"><span class="b2b-step-num">3</span> What do you want?</h2><div class="chips-row" id="mProduct"></div></div>' +
      '<div id="mRouteStep" hidden><h2 class="b2b-step-title"><span class="b2b-step-num">4</span> Choose how</h2>' +
      '<div class="route-grid">' +
      '<button type="button" class="glass route-card" data-route="ready"><strong>Ready-made</strong><span>In-stock items with your prints added</span></button>' +
      '<button type="button" class="glass route-card" data-route="custom"><strong>Custom manufacturing</strong><span>Made to your spec — fabric, colours, cut (min ' + CUSTOM_MOQ + " pcs)</span></button>" +
      "</div></div>" +
      '<div id="mConfig"></div>';

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

  /* ---------- ready-made + print designer ---------- */

  function renderReady(S) {
    var stock = READY[S.product] || [];
    var box = $("#mConfig");
    box.innerHTML = '<h2 class="b2b-step-title"><span class="b2b-step-num">5</span> Ready-made ' + esc(S.product) + " — pick an item</h2>" +
      '<div class="eq-grid" id="stockGrid"></div><div id="printDesigner"></div>';
    var grid = $("#stockGrid");
    stock.forEach(function (item) {
      var card = el('<article class="glass eq-card stock-card">' +
        '<div class="eq-img" aria-hidden="true"><span>' + esc(S.product) + "</span>Photo coming soon</div>" +
        "<h3>" + esc(item.name) + "</h3>" +
        '<p class="eq-detail">In stock: ' + item.colors.map(esc).join(", ") + "</p>" +
        '<p class="eq-price">' + money(item.price) + " <span>/pc</span></p>" +
        '<button class="btn btn-ghost" type="button">Select &amp; add prints →</button></article>');
      $("button", card).addEventListener("click", function () {
        renderPrintDesigner(S, item);
      });
      grid.appendChild(card);
    });
  }

  function renderPrintDesigner(S, item) {
    var D = { color: item.colors[0], qty: 10, view: "front", marks: {}, logo: null };
    var hasSleeves = SLEEVE_PRODUCTS.indexOf(S.product) >= 0;
    var groups = hasSleeves ? ["front", "back", "sleeve"] : ["front", "back"];
    var box = $("#printDesigner");
    box.innerHTML =
      '<h2 class="b2b-step-title"><span class="b2b-step-num">6</span> Prints on: ' + esc(item.name) + "</h2>" +
      '<div class="designer glass">' +
      '<div class="designer-preview"><div class="view-tabs" id="viewTabs"></div><div id="mockup"></div>' +
      '<p class="designer-hint">Marked boxes show your selected print positions to scale.</p></div>' +
      '<div class="designer-controls">' +
      '<label>Colour <select class="field" id="dColor">' + item.colors.map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("") + "</select></label>" +
      '<p class="control-label">Print positions (F = front, B = back' + (hasSleeves ? ", S = sleeve" : "") + ")</p>" +
      '<div id="posList"></div>' +
      '<label>Your logo / artwork<input type="file" accept="image/*" class="field" id="dLogo"></label>' +
      '<label class="b2b-consent"><input type="checkbox" id="dRights"><span>I own or hold rights to this logo/artwork and authorise its printing.</span></label>' +
      '<label class="cart-qty">Quantity <input type="number" min="1" value="10" id="dQty"></label>' +
      '<p class="eq-tier" id="dTier"></p>' +
      '<button class="btn btn-primary" id="dAdd" type="button">Add to cart · <span id="dTotal"></span></button>' +
      "</div></div>";

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
        var m = D.marks[id];
        var viewOf = id[0] === "F" ? "front" : id[0] === "B" ? "back" : "sleeve";
        if (viewOf === D.view || (D.view === "front" && viewOf === "sleeve")) list.push(m);
      });
      return list;
    }
    function drawMockup() {
      $("#mockup").innerHTML = garmentSVG(S.product, D.view === "sleeve" ? "front" : D.view, COLOR_HEX[D.color.split("/")[0]] || "#e9e9ee", activeMarks(), D.logo);
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
    $("#dColor").addEventListener("change", function (e) { D.color = e.target.value; drawMockup(); });
    $("#dLogo").addEventListener("change", function (e) {
      var f = e.target.files[0];
      if (!f) { D.logo = null; drawMockup(); return; }
      var r = new FileReader();
      r.onload = function () { D.logo = r.result; drawMockup(); };
      r.readAsDataURL(f);
    });
    function unit() { return item.price + Object.keys(D.marks).length * PRINT_POS_FEE; }
    function upd() {
      var q = Math.max(1, parseInt($("#dQty").value, 10) || 1);
      D.qty = q;
      var t = tierFor(q);
      $("#dTier").textContent = Object.keys(D.marks).length + " print position(s) · " + t.label + " → " + money(unit() * t.mult) + "/pc";
      $("#dTotal").textContent = money(unit() * t.mult * q);
    }
    $("#dQty").addEventListener("input", upd);
    $("#dAdd").addEventListener("click", function () {
      var nPos = Object.keys(D.marks).length;
      if (D.logo && !$("#dRights").checked) { toast("Please confirm you hold rights to the logo."); return; }
      var posTxt = Object.keys(D.marks).map(function (id) { return id + " (" + D.marks[id].w + "×" + D.marks[id].h + "cm)"; }).join(", ");
      addToCart({
        title: item.name + " — " + D.color,
        detail: S.sport + " · " + S.product + (nPos ? " · prints: " + posTxt : " · no prints") + (D.logo ? " · logo uploaded (share file after order)" : ""),
        unit: unit(),
        qty: D.qty
      });
    });
    drawPositions(); drawMockup(); upd();
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- custom manufacturing ---------- */

  function renderCustom(S) {
    var C = { fabric: FABRICS[0], make: "normal", color: FABRICS[0].colors[0], style: (STYLE_OPTIONS[S.product] || { options: [""] }).options[0], sleeve: "Half", sleeveCustom: "", qty: CUSTOM_MOQ };
    var styleOpt = STYLE_OPTIONS[S.product] || { label: "Style", options: ["Standard"] };
    var hasSleeves = SLEEVE_PRODUCTS.indexOf(S.product) >= 0;
    var box = $("#mConfig");
    box.innerHTML =
      '<h2 class="b2b-step-title"><span class="b2b-step-num">5</span> Custom-manufactured ' + esc(S.product) + "</h2>" +
      '<div class="designer glass"><div class="designer-preview"><div id="cMockup"></div><p class="designer-hint" id="cHint"></p></div>' +
      '<div class="designer-controls">' +
      '<label>Fabric <select class="field" id="cFabric">' + FABRICS.map(function (f) { return '<option value="' + f.id + '">' + f.name + (f.add ? " (+" + money(f.add) + ")" : "") + "</option>"; }).join("") + "</select></label>" +
      '<p class="control-label">Type of make</p>' +
      '<div class="chips-row"><button type="button" class="chip active" data-make="normal">Normal</button><button type="button" class="chip" data-make="sublimation">Sublimation (+' + money(SUBLIMATION_ADD) + "/pc)</button></div>" +
      '<div id="cColorWrap"><p class="control-label">Colour (as per fabric availability)</p><div class="swatch-row" id="cColors"></div></div>' +
      "<label>" + esc(styleOpt.label) + ' <select class="field" id="cStyle">' + styleOpt.options.map(function (o) { return "<option>" + esc(o) + "</option>"; }).join("") + "</select></label>" +
      (hasSleeves ? '<label>Sleeve length <select class="field" id="cSleeve">' + SLEEVES.map(function (s) { return "<option>" + s + "</option>"; }).join("") + '</select></label><label id="cSleeveCustomWrap" hidden>Custom sleeve length (cm)<input type="number" class="field" id="cSleeveCustom" min="5" max="70" placeholder="e.g. 24"></label>' : "") +
      '<label>Notes (sizes split, name list, design brief)<textarea class="field" id="cNotes" rows="2" placeholder="e.g. 12×M, 8×L · names list to follow"></textarea></label>' +
      '<label class="cart-qty">Quantity (min ' + CUSTOM_MOQ + ') <input type="number" min="' + CUSTOM_MOQ + '" value="' + CUSTOM_MOQ + '" id="cQty"></label>' +
      '<p class="eq-tier" id="cTier"></p>' +
      '<button class="btn btn-primary" id="cAdd" type="button">Add to cart · <span id="cTotal"></span></button>' +
      "</div></div>";

    function drawColors() {
      var wrap = $("#cColors");
      wrap.innerHTML = "";
      if (C.make === "sublimation") {
        $("#cColorWrap").innerHTML = '<p class="control-label">Colour</p><p class="eq-detail">Sublimation prints any colours/design across the garment — share your design after ordering, or our designers create one for you.</p>';
        return;
      }
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
    function drawMock() {
      var hex = C.make === "sublimation" ? "#cfd6f5" : (COLOR_HEX[C.color] || "#e9e9ee");
      $("#cMockup").innerHTML = garmentSVG(S.product, "front", hex, [], null);
      $("#cHint").textContent = C.make === "sublimation"
        ? "Sublimation — full-design preview is prepared by our designers after order."
        : esc(C.fabric.name) + " · " + C.color + " · " + C.style + (hasSleeves ? " · " + C.sleeve + (C.sleeve === "Custom" && C.sleeveCustom ? " (" + C.sleeveCustom + "cm)" : "") + " sleeves" : "");
    }
    function unit() { return (CUSTOM_BASE[S.product] || 300) + C.fabric.add + (C.make === "sublimation" ? SUBLIMATION_ADD : 0); }
    function upd() {
      var q = Math.max(CUSTOM_MOQ, parseInt($("#cQty").value, 10) || CUSTOM_MOQ);
      C.qty = q;
      var t = tierFor(q);
      $("#cTier").textContent = t.label + " → " + money(unit() * t.mult) + "/pc";
      $("#cTotal").textContent = money(unit() * t.mult * q);
    }

    $("#cFabric").addEventListener("change", function (e) {
      C.fabric = FABRICS.filter(function (f) { return f.id === e.target.value; })[0];
      C.color = C.fabric.colors[0];
      drawColors(); drawMock(); upd();
    });
    $$("[data-make]", box).forEach(function (b) {
      b.addEventListener("click", function () {
        C.make = b.dataset.make;
        $$("[data-make]", box).forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        drawColors(); drawMock(); upd();
      });
    });
    $("#cStyle").addEventListener("change", function (e) { C.style = e.target.value; drawMock(); });
    if (hasSleeves) {
      $("#cSleeve").addEventListener("change", function (e) {
        C.sleeve = e.target.value;
        $("#cSleeveCustomWrap").hidden = C.sleeve !== "Custom";
        drawMock();
      });
      $("#cSleeveCustom") && $("#cSleeveCustom").addEventListener("input", function (e) { C.sleeveCustom = e.target.value; drawMock(); });
    }
    $("#cQty").addEventListener("input", upd);
    $("#cAdd").addEventListener("click", function () {
      var spec = [C.fabric.name, C.make === "sublimation" ? "Sublimation" : "Normal · " + C.color, C.style];
      if (hasSleeves) spec.push(C.sleeve + (C.sleeve === "Custom" && C.sleeveCustom ? " " + C.sleeveCustom + "cm" : "") + " sleeves");
      var notes = $("#cNotes").value.trim();
      addToCart({
        title: "Custom " + S.product + " — " + S.sport,
        detail: spec.join(" · ") + (notes ? " · " + notes : ""),
        unit: unit(),
        qty: C.qty,
        moq: CUSTOM_MOQ
      });
    });
    drawColors(); drawMock(); upd();
    box.scrollIntoView({ behavior: "smooth", block: "start" });
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
          "\n\nOur team will confirm the final quote within 1-2 working days. Please share logo/artwork files by replying to this email or on WhatsApp +91 91551 42770.\n— Jaypee Sports, Quality Par Excellence"
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

  /* ================= INIT ================= */
  $("#year") && ($("#year").textContent = new Date().getFullYear());
  saveCart();
  if (cart.length) { $("#cartSection").hidden = false; renderCart(); }
})();
