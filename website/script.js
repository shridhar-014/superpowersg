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

  /* ---------- Scroll progress drives the aurora background ---------- */
  (function scrollAurora() {
    var doc = document.documentElement;
    var ticking = false;
    function update() {
      var max = doc.scrollHeight - window.innerHeight;
      doc.style.setProperty("--scroll", max > 0 ? (window.scrollY / max).toFixed(4) : 0);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  /* ---------- Lightbox: tap a gallery photo to enlarge ---------- */
  (function lightbox() {
    var lb = $("#lightbox");
    if (!lb) return;
    var lbImg = $("#lightboxImg");
    var lbCap = $("#lightboxCap");
    var lbClose = $("#lightboxClose");
    var lastFocus = null;

    function close() {
      lb.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    $$(".gallery-tile.has-photo").forEach(function (fig) {
      fig.setAttribute("role", "button");
      fig.setAttribute("tabindex", "0");
      fig.setAttribute("aria-label", "Enlarge photo");
      function open() {
        var img = fig.querySelector("img");
        if (!img) return;
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        var strong = fig.querySelector("figcaption strong");
        var span = fig.querySelector("figcaption span");
        lbCap.textContent = (strong ? strong.textContent : "") + (span ? " — " + span.textContent : "");
        lb.hidden = false;
        document.body.style.overflow = "hidden";
        lastFocus = fig;
        if (lbClose) lbClose.focus();
      }
      fig.addEventListener("click", open);
      fig.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });
    lb.addEventListener("click", function (e) {
      if (e.target !== lbImg) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !lb.hidden) close();
    });
  })();

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

    /* Rewards — confirm/adjust tiers with the store before promoting widely */
    var REWARDS = [
      { score: 50, code: "CHAMP15", label: "15% off custom teamwear" },
      { score: 30, code: "JAYPEE10", label: "10% off custom teamwear" },
      { score: 15, code: "JAYPEE5", label: "5% off custom teamwear" }
    ];
    function rewardFor(s) {
      for (var i = 0; i < REWARDS.length; i++) if (s >= REWARDS[i].score) return REWARDS[i];
      return null;
    }
    function showReward() {
      var code = null, label = null;
      try {
        code = localStorage.getItem("jp-reward-code");
        label = localStorage.getItem("jp-reward-label");
      } catch (e) {}
      if (!code) return;
      var el = $("#gameReward");
      if (el) {
        el.hidden = false;
        el.innerHTML = '🎁 Earned: <strong>' + code + '</strong> — ' + label + '. <a href="#teamwear">Use it in your enquiry →</a>';
      }
      var hidden = $("#rewardCode");
      if (hidden) hidden.value = code + " (" + label + ")";
      var note = $("#rewardNote");
      if (note) {
        note.hidden = false;
        note.querySelector("span").textContent = code + " — " + label;
      }
    }
    function onGameOver(s) {
      var r = rewardFor(s);
      if (!r) return;
      var prev = 0;
      try { prev = parseInt(localStorage.getItem("jp-reward-score"), 10) || 0; } catch (e) {}
      if (s > prev) {
        try {
          localStorage.setItem("jp-reward-code", r.code);
          localStorage.setItem("jp-reward-label", r.label);
          localStorage.setItem("jp-reward-score", String(s));
        } catch (e) {}
        toast("🎁 You earned " + r.code + " — " + r.label + "!");
      }
      showReward();
    }
    showReward();

    var state = "idle"; // idle | play | over
    var ball = { x: 0, y: 0, vx: 0, vy: 0, r: 26, spin: 0 };
    var score = 0;
    var gravity = 0.36;
    var particles = [];
    var running = true;
    var rafId = null;
    var lastT = 0; // physics are scaled by real elapsed time so 60Hz and 120Hz screens play identically

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
      ball.vy = -(H * 0.015 + 3.2);
      var dx = ball.x - px;
      ball.vx = Math.max(-3.2, Math.min(3.2, dx * 0.12 + (Math.random() - 0.5) * 1.4));
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
      ctx.strokeStyle = "rgba(12,12,20,0.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
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

    function drawParticles(dt) {
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.12 * dt; p.life -= 0.03 * dt;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = i % 2 ? "#0c0c0e" : "#9a9aa4";
        ctx.fillRect(p.x, p.y, 3, 3);
      }
      ctx.globalAlpha = 1;
    }

    function text(msg, sub) {
      ctx.fillStyle = "rgba(12,12,14,0.92)";
      ctx.font = "700 " + Math.max(15, W * 0.055) + "px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(msg, W / 2, H * 0.2);
      if (sub) {
        ctx.fillStyle = "rgba(12,12,14,0.5)";
        ctx.font = "500 " + Math.max(11, W * 0.036) + "px 'Space Grotesk', sans-serif";
        ctx.fillText(sub, W / 2, H * 0.2 + Math.max(20, W * 0.07));
      }
    }

    function loop(t) {
      rafId = null;
      if (!running) return;
      var dt = lastT ? Math.min((t - lastT) / 16.667, 2.5) : 1;
      lastT = t;
      ctx.clearRect(0, 0, W, H);

      if (state === "play") {
        ball.vy += gravity * dt;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        ball.spin += ball.vx * 0.004 * dt;
        // walls
        if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx) * 0.85; }
        if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx) * 0.85; }
        if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy) * 0.6; }
        // floor = drop
        if (ball.y > H + ball.r * 2) {
          state = "over";
          onGameOver(score);
        }
        text(String(score));
      } else if (state === "idle") {
        // gentle idle bob
        ball.y = H * 0.42 + Math.sin(Date.now() / 600) * 6;
        text("Keep-ups", "Tap the ball to start");
      } else if (state === "over") {
        var r = rewardFor(score);
        text("Dropped at " + score + "!", (r ? "🎁 Earned " + r.code + " · " : "") + "Tap to try again");
      }

      drawParticles(dt);
      if (state !== "over") drawBall();
      rafId = requestAnimationFrame(loop);
    }

    function setRunning(on) {
      running = on;
      lastT = 0; // forget paused time so the ball doesn't lurch on resume
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
})();
