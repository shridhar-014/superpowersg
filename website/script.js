/* Jaypee Sports — interactions
   Vanilla JS only. Everything degrades gracefully without it. */

(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  /* ---------- Footer year ---------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile nav ---------- */
  var nav = $(".nav");
  var burger = $("#navBurger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Toast ---------- */
  var toastEl = $("#toast");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 3800);
  }

  /* ---------- Forms: point the redirect back to wherever the site is hosted ---------- */
  var origin = location.origin + location.pathname;
  var nextMain = $("#formNext");
  if (nextMain) nextMain.value = origin + "?submitted=1#teamwear";
  $$(".js-form-next").forEach(function (el) { el.value = origin + "?submitted=1#store"; });
  if (/[?&]submitted=1/.test(location.search)) {
    toast("Thanks! Your message is in — we'll get back to you soon. 🏆");
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.hash);
  }

  /* ============================================================
     Keep-Up Challenge — tap the ball, don't let it drop
     ============================================================ */
  (function game() {
    var canvas = $("#gameCanvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var bestEl = $("#gameBest");

    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;

    var best = 0;
    try { best = parseInt(localStorage.getItem("jp-best"), 10) || 0; } catch (e) {}
    if (bestEl) bestEl.textContent = best;

    var state = "idle"; // idle | play | over
    var ball = { x: 0, y: 0, vx: 0, vy: 0, r: 26, spin: 0 };
    var score = 0;
    var gravity = 0.45;
    var particles = [];
    var running = true;
    var rafId = null;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ball.r = Math.max(20, Math.min(30, W * 0.085));
      if (state !== "play") rest();
    }

    function rest() {
      ball.x = W / 2;
      ball.y = H * 0.42;
      ball.vx = 0;
      ball.vy = 0;
      ball.spin = 0;
    }

    function start() {
      score = 0;
      state = "play";
      rest();
      kick(ball.x, ball.y + ball.r);
    }

    function kick(px, py) {
      ball.vy = -(H * 0.022 + 4.4);
      var dx = ball.x - px;
      ball.vx = dx * 0.22 + (Math.random() - 0.5) * 2.4;
      ball.spin += ball.vx * 0.02;
      for (var i = 0; i < 7; i++) {
        particles.push({
          x: ball.x, y: ball.y + ball.r * 0.6,
          vx: (Math.random() - 0.5) * 5,
          vy: Math.random() * -3 - 1,
          life: 1
        });
      }
    }

    function tap(px, py) {
      if (state !== "play") { start(); return; }
      var dx = px - ball.x, dy = py - ball.y;
      var reach = ball.r + Math.max(26, ball.r); // generous thumb-sized hitbox
      if (dx * dx + dy * dy <= reach * reach) {
        score++;
        kick(px, py);
        if (score > best) {
          best = score;
          if (bestEl) bestEl.textContent = best;
          try { localStorage.setItem("jp-best", String(best)); } catch (e) {}
        }
      }
    }

    function pointer(e) {
      var rect = canvas.getBoundingClientRect();
      var t = e.touches ? e.touches[0] : e;
      tap(t.clientX - rect.left, t.clientY - rect.top);
      e.preventDefault();
    }
    canvas.addEventListener("pointerdown", pointer);

    function drawBall() {
      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.rotate(ball.spin);
      // shadow
      ctx.restore();
      ctx.save();
      var shadowY = H - 12;
      var dist = Math.max(0, Math.min(1, (shadowY - ball.y) / H));
      ctx.globalAlpha = 0.35 * (1 - dist * 0.7);
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(ball.x, shadowY, ball.r * (0.7 + dist * 0.5), 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.rotate(ball.spin);
      // body
      var grad = ctx.createRadialGradient(-ball.r * 0.35, -ball.r * 0.4, ball.r * 0.2, 0, 0, ball.r);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.65, "#e8e8ee");
      grad.addColorStop(1, "#b9b9c6");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
      ctx.fill();
      // pentagon
      ctx.fillStyle = "#15151c";
      ctx.beginPath();
      for (var i = 0; i < 5; i++) {
        var a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        var px = Math.cos(a) * ball.r * 0.38;
        var py = Math.sin(a) * ball.r * 0.38;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      // seams
      ctx.strokeStyle = "rgba(21,21,28,0.55)";
      ctx.lineWidth = 1.5;
      for (var s = 0; s < 5; s++) {
        var a2 = -Math.PI / 2 + (s * 2 * Math.PI) / 5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a2) * ball.r * 0.42, Math.sin(a2) * ball.r * 0.42);
        ctx.lineTo(Math.cos(a2) * ball.r * 0.95, Math.sin(a2) * ball.r * 0.95);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawParticles() {
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.03;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = i % 2 ? "#ff5c1f" : "#00e5ff";
        ctx.fillRect(p.x, p.y, 3, 3);
      }
      ctx.globalAlpha = 1;
    }

    function text(msg, sub) {
      ctx.fillStyle = "rgba(255,255,255,0.94)";
      ctx.font = "700 " + Math.max(15, W * 0.055) + "px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(msg, W / 2, H * 0.2);
      if (sub) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "500 " + Math.max(11, W * 0.036) + "px 'Space Grotesk', sans-serif";
        ctx.fillText(sub, W / 2, H * 0.2 + Math.max(20, W * 0.07));
      }
    }

    function loop() {
      rafId = null;
      if (!running) return;
      ctx.clearRect(0, 0, W, H);

      if (state === "play") {
        ball.vy += gravity;
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.spin += ball.vx * 0.004;
        // walls
        if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx) * 0.85; }
        if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx) * 0.85; }
        if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy) * 0.6; }
        // floor = drop
        if (ball.y > H + ball.r * 2) {
          state = "over";
        }
        text(String(score));
      } else if (state === "idle") {
        // gentle idle bob
        ball.y = H * 0.42 + Math.sin(Date.now() / 600) * 6;
        text("Keep-ups", "Tap the ball to start");
      } else if (state === "over") {
        text("Dropped at " + score + "!", "Tap to try again");
      }

      drawParticles();
      if (state !== "over") drawBall();
      rafId = requestAnimationFrame(loop);
    }

    function setRunning(on) {
      running = on;
      if (on && rafId === null) rafId = requestAnimationFrame(loop);
    }

    // pause when offscreen or tab hidden — saves battery on phones
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        setRunning(entries[0].isIntersecting && !document.hidden);
      }, { threshold: 0.05 }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () {
      setRunning(!document.hidden);
    });

    window.addEventListener("resize", resize);
    resize();
    rafId = requestAnimationFrame(loop);
  })();

  /* ============================================================
     Kit Studio — live jersey customiser
     ============================================================ */
  (function kitStudio() {
    var svg = $("#jerseySvg");
    if (!svg) return;

    var COLORS = [
      { hex: "#ff5c1f", name: "Ember" },
      { hex: "#e11d48", name: "Crimson" },
      { hex: "#2563eb", name: "Royal" },
      { hex: "#0ea5e9", name: "Sky" },
      { hex: "#059669", name: "Emerald" },
      { hex: "#7c3aed", name: "Violet" },
      { hex: "#111827", name: "Jet" },
      { hex: "#f8fafc", name: "White" }
    ];

    var design = { primary: "#2563eb", accent: "#f8fafc", pattern: "sash", name: "JAYPEE" };

    var body = $("#jerseyBody");
    var sleeves = [$("#sleeveL"), $("#sleeveR")];
    var collar = $("#collar");
    var nameText = $("#jerseyName");
    var scriptText = $("#jerseyScript");
    var patterns = { hoops: $("#patHoops"), sash: $("#patSash"), split: $("#patSplit") };

    function luminance(hex) {
      var n = parseInt(hex.slice(1), 16);
      var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }

    function render() {
      body.setAttribute("fill", design.primary);
      sleeves.forEach(function (s) { s.setAttribute("fill", design.accent); });
      collar.setAttribute("stroke", design.accent);
      Object.keys(patterns).forEach(function (k) {
        patterns[k].style.display = design.pattern === k ? "" : "none";
        $$("#pat" + k.charAt(0).toUpperCase() + k.slice(1) + " rect, #pat" + k.charAt(0).toUpperCase() + k.slice(1) + " path").forEach(function (el) {
          el.setAttribute("fill", design.accent);
        });
      });
      // readable name colour against whatever sits behind the chest
      var bgLum = design.pattern === "split" || design.pattern === "sash" || design.pattern === "hoops"
        ? (luminance(design.primary) + luminance(design.accent)) / 2
        : luminance(design.primary);
      var ink = bgLum > 0.6 ? "#15151c" : "#ffffff";
      nameText.setAttribute("fill", ink);
      scriptText.setAttribute("fill", ink);
      nameText.textContent = design.name || "JAYPEE";
    }

    function buildSwatches(containerId, key) {
      var box = $(containerId);
      COLORS.forEach(function (c) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "swatch" + (design[key] === c.hex ? " active" : "");
        b.style.background = c.hex;
        b.setAttribute("role", "radio");
        b.setAttribute("aria-label", c.name);
        b.setAttribute("aria-checked", design[key] === c.hex ? "true" : "false");
        b.addEventListener("click", function () {
          design[key] = c.hex;
          $$(containerId + " .swatch").forEach(function (s) {
            s.classList.remove("active");
            s.setAttribute("aria-checked", "false");
          });
          b.classList.add("active");
          b.setAttribute("aria-checked", "true");
          render();
        });
        box.appendChild(b);
      });
    }
    buildSwatches("#primarySwatches", "primary");
    buildSwatches("#accentSwatches", "accent");

    $$("#patternSeg button").forEach(function (b) {
      b.addEventListener("click", function () {
        design.pattern = b.dataset.pattern;
        $$("#patternSeg button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        render();
      });
    });

    var nameInput = $("#teamNameInput");
    nameInput.addEventListener("input", function () {
      design.name = nameInput.value.toUpperCase().slice(0, 14);
      render();
    });

    $("#attachDesign").addEventListener("click", function () {
      function colorName(hex) {
        for (var i = 0; i < COLORS.length; i++) if (COLORS[i].hex === hex) return COLORS[i].name;
        return hex;
      }
      var summary = "Primary: " + colorName(design.primary) + " (" + design.primary + ") · " +
        "Accent: " + colorName(design.accent) + " (" + design.accent + ") · " +
        "Pattern: " + design.pattern + " · Team name: " + (design.name || "—");
      var hidden = $("#kitDesign");
      if (hidden) hidden.value = summary;
      var note = $("#attachedDesign");
      if (note) {
        note.hidden = false;
        note.querySelector("span").textContent = summary;
      }
      var studioNote = $("#studioNote");
      if (studioNote) studioNote.textContent = "Design attached — finish the enquiry form below. ✔";
      var form = $("#enquiryForm");
      if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
      toast("🎽 Your design is attached to the enquiry form");
    });

    render();
  })();
})();
