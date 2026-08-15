/* Jaypee Sports — catalogue booklet renderer. Requires catalogue-shared.js. */
(function () {
  "use strict";

  var C = window.JPCat;
  var pagesEl = document.getElementById("pages");
  var loadNote = document.getElementById("loadNote");
  var banner = document.getElementById("draftBanner");

  var printBtn = document.getElementById("printBtn");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

  function esc(s) { return C.esc(s); }

  /* ================= PAGE BUILDERS ================= */

  function coverPage() {
    return '' +
      '<section class="page page--cover">' +
        '<span class="cover-track" aria-hidden="true"></span>' +
        '<div class="cover-logo"><img src="assets/brand/jp-logo.svg" alt="Jaypee Sports logo"></div>' +
        '<span class="eyebrow cover-eyebrow">Est. 1997 · ISO 9001:2008 Certified</span>' +
        '<h1>Product<br>Catalogue <span>/26</span></h1>' +
        '<p class="cover-sub">In-house manufactured sportswear and professional sports equipment ' +
          'for teams, schools, academies and institutions across India.</p>' +
        '<div class="speed-band" aria-hidden="true"></div>' +
        '<div class="cover-foot"><span>Jaypee Sports Sales Pvt. Ltd.</span><span>Quality Par Excellence</span></div>' +
      '</section>';
  }

  function dividerPage(seg, cats, counts) {
    var rows = "";
    for (var i = 0; i < cats.length; i++) {
      rows += '<li><span class="idx">' + (i < 9 ? "0" : "") + (i + 1) + "</span>" +
        esc(cats[i]) +
        '<span class="idx" style="margin-left:auto">' + counts[cats[i]] + " item" + (counts[cats[i]] === 1 ? "" : "s") + "</span></li>";
    }
    return '' +
      '<section class="page page--divider page--numbered" id="seg-' + seg.id + '">' +
        '<div class="speed-band" aria-hidden="true"></div>' +
        '<span class="div-number">' + seg.number + '</span>' +
        '<span class="eyebrow eyebrow--ember">Segment ' + seg.number + '</span>' +
        "<h2>" + esc(seg.label) + "</h2>" +
        '<p class="div-sub">' + esc(seg.sub) + "</p>" +
        '<ul class="div-cats">' + rows + "</ul>" +
        '<div class="div-foot"><span>Jaypee Sports · Catalogue</span><span class="page-num"></span></div>' +
      "</section>";
  }

  function briefPanel(p, settings) {
    var prompt = C.composePrompt(p, settings.prompt_style_suffix);
    var file = p.image_file ? p.image_file : suggestedFile(p);
    return '<div class="img-brief">' +
      '<span class="eyebrow eyebrow--ember">Image Brief · AI Generation Prompt</span>' +
      '<p class="brief-text">' + esc(prompt) + "</p>" +
      '<span class="brief-note">Replace with photo → assets/products/' + esc(file) + "</span>" +
      "</div>";
  }

  function suggestedFile(p) {
    return C.slug(p.name).replace(/_/g, "-") + ".jpg";
  }

  function mediaBlock(p, settings) {
    var src = C.imgPath(p.image_file);
    if (!src) return '<figure class="p-media">' + briefPanel(p, settings) + "</figure>";
    /* eager, not lazy: a missing photo must fall back to the image brief before
       the reader (or the print dialog) reaches that page */
    return '<figure class="p-media" data-pid="' + esc(p.id) + '">' +
      '<img src="' + esc(src) + '" alt="' + esc(p.name) + '">' +
      "</figure>";
  }

  function specRows(p, colorHex) {
    var html = "";
    if (p.sizes && p.sizes.length) {
      var chips = "";
      for (var i = 0; i < p.sizes.length; i++) chips += '<span class="chip">' + esc(p.sizes[i]) + "</span>";
      html += '<div class="spec"><span class="spec-label">Sizes</span><div class="chips">' + chips + "</div></div>";
    }
    if (p.colors && p.colors.length) {
      var sw = "";
      for (var j = 0; j < p.colors.length; j++) {
        var name = p.colors[j];
        var hex = colorHex[name];
        sw += '<span class="swatch">' +
          (hex ? '<i style="background:' + hex + '"></i>' : "") +
          esc(name) + "</span>";
      }
      html += '<div class="spec"><span class="spec-label">Colours</span><div class="swatches">' + sw + "</div></div>";
    }
    if (p.segment === "sportswear" && p.category === "Custom Orders") {
      html += '<div class="spec"><span class="spec-label">Made to</span><div class="chips"><span class="chip">Your team colours &amp; crest</span></div></div>';
    }
    return html ? '<div class="p-specs">' + html + "</div>" : "";
  }

  function priceNote(p) {
    if (p.price_mode === "on_request") return "Call or WhatsApp +91 91551 42770 for a quote";
    if (p.price_mode === "range") {
      return p.segment === "sportswear"
        ? "Final price depends on fabric, size &amp; quantity"
        : "Final price depends on brand, grade &amp; quantity";
    }
    return "Bulk &amp; institutional pricing available";
  }

  function productPage(p, seg, settings, colorHex) {
    return '' +
      '<article class="page page--product page--numbered">' +
        '<header class="p-head">' +
          '<span class="badge badge-seg">' + seg.number + " · " + esc(seg.label) + "</span>" +
          '<span class="badge badge-cat">' + esc(p.category) + "</span>" +
        "</header>" +
        '<h2 class="p-name">' + esc(p.name) + "</h2>" +
        mediaBlock(p, settings) +
        '<p class="p-desc">' + esc(p.description || "") + "</p>" +
        specRows(p, colorHex) +
        '<div class="p-price-row">' +
          '<span class="spec-label">Price</span>' +
          '<span class="p-price">' + C.formatPrice(p) + "</span>" +
          '<span class="p-price-note">' + priceNote(p) + "</span>" +
        "</div>" +
        '<footer class="p-foot"><span>Jaypee Sports · Catalogue</span><span class="page-num"></span></footer>' +
      "</article>";
  }

  function backPage() {
    return '' +
      '<section class="page page--back">' +
        '<div class="speed-band" aria-hidden="true"></div>' +
        '<span class="eyebrow eyebrow--ember">Get in touch</span>' +
        "<h2>Jaypee Sports Sales Pvt. Ltd.</h2>" +
        '<p class="back-lede">Sportswear manufacturer and sports equipment supplier in India since 1997 — ' +
          "custom team jerseys, school &amp; college sports uniforms, tracksuits, sublimation sportswear and " +
          "equipment for every sport. Trusted by schools, academies, institutions and government sports projects nationwide.</p>" +
        '<div class="back-contact">' +
          "<strong>Phone / WhatsApp</strong><span>+91 91551 42770</span>" +
          "<strong>Email</strong><span>Jaypeesports@gmail.com</span>" +
          "<strong>Web</strong><span>jaypeesports.in · facebook.com/JaypeeSportsSalesPvtLtd</span>" +
        "</div>" +
        '<div class="back-stores">' +
          '<div class="store"><strong>Ranchi — Doranda</strong><span>C/O Jaypee Sports, Bharti Compound, South Kusai, Doranda, Ranchi — 834002</span></div>' +
          '<div class="store"><strong>Ranchi — Lalpur</strong><span>G-7, Kali Tower, Near Lalpur Thana, HV Road, Lalpur, Ranchi — 834001</span></div>' +
          '<div class="store"><strong>Kolkata — Gopalpur</strong><span>Siddha Pines, Natunpara, Bablatala, Gopalpur 1, Kolkata — 700136</span></div>' +
        "</div>" +
        '<div class="back-foot">' +
          '<p class="back-tagline">Quality <span>Par</span> Excellence</p>' +
          '<p class="back-meta">Est. 1997 · ISO 9001:2008 · Made in India</p>' +
        "</div>" +
      "</section>";
  }

  /* ================= RENDER ================= */

  function categoriesFor(segId, products) {
    var fixed = C.CATEGORIES[segId] || [];
    var seen = {}, extra = [], cats = [], i, p;
    for (i = 0; i < products.length; i++) {
      p = products[i];
      if (p.segment !== segId) continue;
      seen[p.category] = (seen[p.category] || 0) + 1;
    }
    for (i = 0; i < fixed.length; i++) { if (seen[fixed[i]]) cats.push(fixed[i]); }
    for (var k in seen) {
      if (seen.hasOwnProperty(k) && fixed.indexOf(k) < 0) extra.push(k);
    }
    extra.sort();
    return { cats: cats.concat(extra), counts: seen };
  }

  function render(products, settings, colorHex) {
    var html = coverPage();
    for (var s = 0; s < C.SEGMENTS.length; s++) {
      var seg = C.SEGMENTS[s];
      var info = categoriesFor(seg.id, products);
      if (!info.cats.length) continue;
      html += dividerPage(seg, info.cats, info.counts);
      for (var c = 0; c < info.cats.length; c++) {
        for (var i = 0; i < products.length; i++) {
          var p = products[i];
          if (p.segment === seg.id && p.category === info.cats[c]) {
            html += productPage(p, seg, settings, colorHex);
          }
        }
      }
    }
    html += backPage();
    pagesEl.innerHTML = html;

    /* if a listed photo is missing, fall back to the image brief */
    var figs = pagesEl.querySelectorAll(".p-media[data-pid]");
    for (var f = 0; f < figs.length; f++) {
      (function (fig) {
        var img = fig.querySelector("img");
        if (!img) return;
        img.onerror = function () {
          var pid = fig.getAttribute("data-pid");
          for (var j = 0; j < products.length; j++) {
            if (products[j].id === pid) { fig.innerHTML = briefPanel(products[j], settings); return; }
          }
        };
        if (img.complete && img.naturalWidth === 0) img.onerror();
      })(figs[f]);
    }
  }

  function showDraftBanner(n) {
    if (!banner) return;
    if (n > 0) {
      banner.textContent = "Previewing " + n + " unpublished local change" + (n === 1 ? "" : "s") +
        " — export from the Admin page and commit the file to publish for everyone.";
      banner.hidden = false;
    } else {
      banner.hidden = true;
    }
  }

  function init() {
    Promise.all([C.fetchJSON(), C.fetchColors()])
      .then(function (res) {
        var data = res[0], colorHex = res[1];
        var draft = C.loadDraft();
        var products = C.mergeProducts(data.products, draft);
        var settings = C.mergeSettings(data.settings, draft);
        showDraftBanner(C.draftCount(draft));
        render(products, settings, colorHex);
      })
      .catch(function (err) {
        if (loadNote) {
          loadNote.textContent = "Could not load the catalogue data (" + err.message +
            "). If you opened this file directly, serve the website folder over HTTP instead.";
        }
      });
  }

  init();
})();
