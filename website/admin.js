/* Jaypee Sports — catalogue admin logic. Requires catalogue-shared.js. */
(function () {
  "use strict";

  var C = window.JPCat;
  var $ = function (sel) { return document.querySelector(sel); };

  var base = { products: [], settings: {} };
  var draft = C.loadDraft();
  var promptDirty = false;

  /* ---------- elements ---------- */
  var statusLine = $("#statusLine"), prodCount = $("#prodCount"), listEl = $("#productList");
  var form = $("#productForm"), formTitle = $("#formTitle"), saveBtn = $("#saveBtn"), cancelEdit = $("#cancelEdit");
  var fId = $("#fId"), fSegment = $("#fSegment"), fCategory = $("#fCategory"), fName = $("#fName"),
      fDesc = $("#fDesc"), fSizes = $("#fSizes"), fColors = $("#fColors"),
      fPriceMin = $("#fPriceMin"), fPriceMax = $("#fPriceMax"), maxWrap = $("#maxWrap"), minLabel = $("#minLabel"),
      fImage = $("#fImage"), fSort = $("#fSort"), fPrompt = $("#fPrompt"),
      promptState = $("#promptState"), promptReset = $("#promptReset");
  var styleSuffix = $("#styleSuffix");

  var toastEl = $("#toast"), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 3600);
  }

  /* ---------- draft helpers ---------- */

  function persist() { if (!C.saveDraft(draft)) toast("Could not save draft (browser storage unavailable)"); }

  function baseById(id) {
    for (var i = 0; i < base.products.length; i++) { if (base.products[i].id === id) return base.products[i]; }
    return null;
  }

  function stateOf(id) {
    if (!draft.products.hasOwnProperty(id)) return "";
    if (draft.products[id] === null) return "deleted";
    return baseById(id) ? "edited" : "new";
  }

  function currentSuffix() {
    return C.mergeSettings(base.settings, draft).prompt_style_suffix;
  }

  /* Display list: merged products PLUS tombstoned base products (so they can be restored) */
  function displayList() {
    var out = C.mergeProducts(base.products, draft);
    for (var i = 0; i < base.products.length; i++) {
      if (draft.products[base.products[i].id] === null) out.push(base.products[i]);
    }
    return C.sortProducts(out);
  }

  /* ---------- rendering ---------- */

  function refresh() {
    var list = displayList();
    var changes = C.draftCount(draft);
    var live = C.mergeProducts(base.products, draft).length;
    statusLine.textContent = live + " products in catalogue" +
      (changes ? " · " + changes + " unpublished local change" + (changes === 1 ? "" : "s") : " · all published");
    prodCount.textContent = "(" + live + ")";

    var html = "", lastGroup = "";
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var seg = C.segmentById(p.segment);
      var group = (seg ? seg.label : p.segment) + " · " + p.category;
      if (group !== lastGroup) {
        html += '<div class="pgroup">' + C.esc(group) + "</div>";
        lastGroup = group;
      }
      var st = stateOf(p.id);
      html += '<div class="prow' + (st === "deleted" ? " deleted" : "") + '">' +
        '<span class="pname">' + C.esc(p.name) + "</span>" +
        (st ? '<span class="flag flag-' + st + '">' + st + "</span>" : "") +
        '<span class="pprice">' + C.esc(C.formatPrice(p)) + "</span>" +
        (st === "deleted"
          ? '<button class="act" data-act="restore" data-id="' + C.esc(p.id) + '">Restore</button>'
          : '<button class="act" data-act="edit" data-id="' + C.esc(p.id) + '">Edit</button>' +
            '<button class="act" data-act="delete" data-id="' + C.esc(p.id) + '">Delete</button>') +
        "</div>";
    }
    listEl.innerHTML = html || '<p class="hint">No products yet — add the first one with the form.</p>';
  }

  listEl.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("button.act") : null;
    if (!btn) return;
    var id = btn.getAttribute("data-id"), act = btn.getAttribute("data-act");
    if (act === "edit") return openForm(id);
    if (act === "delete") return removeProduct(id);
    if (act === "restore") { delete draft.products[id]; persist(); refresh(); toast("Product restored"); }
  });

  /* ---------- form ---------- */

  function fillSegments() {
    var html = "";
    for (var i = 0; i < C.SEGMENTS.length; i++) {
      var s = C.SEGMENTS[i];
      html += '<option value="' + s.id + '">' + C.esc(s.label + " — " + s.sub) + "</option>";
    }
    fSegment.innerHTML = html;
  }

  function fillCategories(segId, selected) {
    var cats = (C.CATEGORIES[segId] || []).slice();
    if (selected && cats.indexOf(selected) < 0) cats.push(selected);
    var html = "";
    for (var i = 0; i < cats.length; i++) {
      html += '<option' + (cats[i] === selected ? " selected" : "") + ">" + C.esc(cats[i]) + "</option>";
    }
    fCategory.innerHTML = html;
  }

  function priceMode() {
    var r = document.querySelector('input[name="priceMode"]:checked');
    return r ? r.value : "exact";
  }

  function syncPriceInputs() {
    var m = priceMode();
    maxWrap.style.visibility = m === "range" ? "visible" : "hidden";
    minLabel.textContent = m === "range" ? "Min" : "Price";
    fPriceMin.disabled = fPriceMax.disabled = m === "on_request";
  }

  function formProduct() {
    var id = fId.value || "local-" + Date.now();
    return {
      id: id,
      segment: fSegment.value,
      category: fCategory.value,
      name: fName.value.trim(),
      description: fDesc.value.trim(),
      sizes: C.pipeList(fSizes.value),
      colors: C.pipeList(fColors.value),
      price_mode: priceMode(),
      price_min: C.num(fPriceMin.value),
      price_max: C.num(fPriceMax.value),
      image_file: fImage.value.trim(),
      prompt_override: promptDirty ? fPrompt.value.trim() : "",
      sort: parseInt(fSort.value, 10) || 0
    };
  }

  function syncPrompt() {
    if (promptDirty) return;
    var p = formProduct();
    p.prompt_override = "";
    fPrompt.value = p.name ? C.composePrompt(p, currentSuffix()) : "";
  }

  function setPromptDirty(v) {
    promptDirty = v;
    promptState.textContent = v ? "custom — saved with this product" : "auto-composed from the fields above";
    promptState.className = v ? "dirty" : "";
    promptReset.hidden = !v;
  }

  function resetForm() {
    form.reset();
    fId.value = "";
    fillCategories(fSegment.value || C.SEGMENTS[0].id, null);
    formTitle.textContent = "Add product";
    saveBtn.textContent = "Add to catalogue";
    cancelEdit.hidden = true;
    fSort.value = "10";
    setPromptDirty(false);
    syncPriceInputs();
    syncPrompt();
  }

  function openForm(id) {
    var p = draft.products[id] || baseById(id);
    if (!p) return;
    fId.value = p.id;
    fSegment.value = p.segment;
    fillCategories(p.segment, p.category);
    fName.value = p.name;
    fDesc.value = p.description || "";
    fSizes.value = (p.sizes || []).join("|");
    fColors.value = (p.colors || []).join("|");
    var radios = document.querySelectorAll('input[name="priceMode"]');
    for (var i = 0; i < radios.length; i++) radios[i].checked = radios[i].value === p.price_mode;
    fPriceMin.value = p.price_min || "";
    fPriceMax.value = p.price_max || "";
    fImage.value = p.image_file || "";
    fSort.value = p.sort || 0;
    setPromptDirty(!!p.prompt_override);
    fPrompt.value = p.prompt_override || C.composePrompt(p, currentSuffix());
    formTitle.textContent = "Edit product";
    saveBtn.textContent = "Save changes";
    cancelEdit.hidden = false;
    syncPriceInputs();
    if (form.scrollIntoView) form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function removeProduct(id) {
    var p = draft.products[id] || baseById(id);
    if (!p) return;
    if (!window.confirm('Remove "' + p.name + '" from the catalogue?')) return;
    if (baseById(id)) draft.products[id] = null;   /* tombstone a published product */
    else delete draft.products[id];                /* local-only: gone for good */
    persist();
    if (fId.value === id) resetForm();
    refresh();
    toast("Product removed (draft)");
  }

  function validate(p) {
    if (!p.name) return "Product name is required.";
    if (!p.segment || !p.category) return "Pick a segment and category.";
    if (p.price_mode === "exact" && p.price_min <= 0) return "Enter a price.";
    if (p.price_mode === "range") {
      if (p.price_min <= 0) return "Enter a minimum price.";
      if (p.price_max > 0 && p.price_max < p.price_min) return "Max price is below min price.";
    }
    if (p.image_file && /[^a-zA-Z0-9._\/-]/.test(p.image_file)) return "Image file name has unsupported characters.";
    return "";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var p = formProduct();
    if (p.price_mode === "on_request") { p.price_min = 0; p.price_max = 0; }
    if (p.price_mode === "exact") p.price_max = 0;
    var err = validate(p);
    if (err) return toast(err);
    var isEdit = !!fId.value;
    draft.products[p.id] = p;
    persist();
    refresh();
    resetForm();
    toast(isEdit ? "Product updated — preview it in the catalogue" : '"' + p.name + '" added — preview it in the catalogue');
  });

  cancelEdit.addEventListener("click", resetForm);

  fSegment.addEventListener("change", function () { fillCategories(fSegment.value, null); syncPrompt(); });

  var watched = [fCategory, fName, fDesc, fColors, fSizes];
  for (var w = 0; w < watched.length; w++) {
    watched[w].addEventListener("input", syncPrompt);
    watched[w].addEventListener("change", syncPrompt);
  }

  var radios = document.querySelectorAll('input[name="priceMode"]');
  for (var r = 0; r < radios.length; r++) radios[r].addEventListener("change", syncPriceInputs);

  fPrompt.addEventListener("input", function () { setPromptDirty(true); });
  promptReset.addEventListener("click", function () { setPromptDirty(false); syncPrompt(); });

  /* ---------- settings ---------- */

  $("#saveStyle").addEventListener("click", function () {
    var v = styleSuffix.value.trim();
    var baseVal = (base.settings && base.settings.prompt_style_suffix) || C.DEFAULT_STYLE_SUFFIX;
    if (!v || v === baseVal) delete draft.settings.prompt_style_suffix;
    else draft.settings.prompt_style_suffix = v;
    persist();
    refresh();
    syncPrompt();
    toast("Image style saved — applies to every auto-composed prompt");
  });

  /* ---------- export / import / discard ---------- */

  $("#exportBtn").addEventListener("click", function () {
    var out = {
      version: 1,
      updated: new Date().toISOString().slice(0, 10),
      settings: { prompt_style_suffix: currentSuffix() },
      products: C.mergeProducts(base.products, draft)
    };
    var blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "catalogue.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    toast("Exported — replace website/data/catalogue.json with this file to publish");
  });

  $("#importBtn").addEventListener("click", function () { $("#importInput").click(); });

  $("#importInput").addEventListener("change", function () {
    var file = this.files && this.files[0];
    this.value = "";
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try { data = JSON.parse(reader.result); } catch (e) { return toast("Not a valid JSON file."); }
      if (!data || Object.prototype.toString.call(data.products) !== "[object Array]") {
        return toast("File doesn't look like a catalogue export (no products array).");
      }
      if (!window.confirm("Load " + data.products.length + " products from this file as local drafts? " +
        "Your current drafts will be replaced.")) return;
      /* store as drafts: differences vs the committed base */
      var next = C.emptyDraft(), i, p, b;
      for (i = 0; i < data.products.length; i++) {
        p = data.products[i];
        if (!p || !p.id) continue;
        b = baseById(p.id);
        if (!b || JSON.stringify(b) !== JSON.stringify(p)) next.products[p.id] = p;
      }
      var importedIds = {};
      for (i = 0; i < data.products.length; i++) { if (data.products[i] && data.products[i].id) importedIds[data.products[i].id] = 1; }
      for (i = 0; i < base.products.length; i++) {
        if (!importedIds[base.products[i].id]) next.products[base.products[i].id] = null;
      }
      var sfx = data.settings && data.settings.prompt_style_suffix;
      var baseVal = (base.settings && base.settings.prompt_style_suffix) || C.DEFAULT_STYLE_SUFFIX;
      if (sfx && sfx !== baseVal) next.settings.prompt_style_suffix = sfx;
      draft = next;
      persist();
      refresh();
      styleSuffix.value = currentSuffix();
      syncPrompt();
      toast("Imported as drafts (" + C.draftCount(draft) + " differences from published data)");
    };
    reader.readAsText(file);
  });

  $("#discardBtn").addEventListener("click", function () {
    if (!C.draftCount(draft)) return toast("No local drafts to discard.");
    if (!window.confirm("Discard ALL local drafts on this device? Published data is not affected.")) return;
    draft = C.emptyDraft();
    C.clearDraft();
    refresh();
    resetForm();
    styleSuffix.value = currentSuffix();
    toast("Drafts discarded — showing published catalogue only");
  });

  /* ---------- init ---------- */

  fillSegments();
  fillCategories(C.SEGMENTS[0].id, null);
  syncPriceInputs();

  Promise.all([C.fetchJSON(), C.fetchColors()])
    .then(function (res) {
      base = res[0];
      var colorHex = res[1], dl = $("#colorNames"), html = "";
      for (var name in colorHex) { if (colorHex.hasOwnProperty(name)) html += "<option>" + C.esc(name) + "</option>"; }
      dl.innerHTML = html;
      styleSuffix.value = currentSuffix();
      refresh();
      resetForm();
    })
    .catch(function (err) {
      statusLine.textContent = "Could not load data/catalogue.json (" + err.message + ") — serve over HTTP.";
    });
})();
