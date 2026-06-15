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
      var i = 0;
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.style.transitionDelay = (Math.min(i++, 6) * 60) + "ms";
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Analytics events (no-ops if GA is blocked) ---------- */
  function track(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  }
  var enquiryForm = document.getElementById("enquiryForm");
  if (enquiryForm) enquiryForm.addEventListener("submit", function () { track("enquiry_submit"); });
  $$(".notify").forEach(function (f) {
    f.addEventListener("submit", function () { track("waitlist_submit"); });
  });

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

    /* Rewards — difficulty ramps up so these demand real skill.
       Codes are month-stamped (e.g. CHAMP15-JUN26) and expire when
       the month turns; claiming requires an email address. */
    var REWARDS = [
      { score: 75, code: "CHAMP15", label: "15% off custom teamwear" },
      { score: 40, code: "JAYPEE10", label: "10% off custom teamwear" },
      { score: 20, code: "JAYPEE5", label: "5% off custom teamwear" }
    ];
    function rewardFor(s) {
      for (var i = 0; i < REWARDS.length; i++) if (s >= REWARDS[i].score) return REWARDS[i];
      return null;
    }
    function monthTag() {
      var M = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      var d = new Date();
      return M[d.getMonth()] + String(d.getFullYear() % 100);
    }
    function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function clearReward() {
      try {
        ["jp-reward-claimed", "jp-reward-label", "jp-reward-pending", "jp-reward-month", "jp-reward-score"]
          .forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
    }
    // auto-expire: anything earned in a previous month is wiped
    if (read("jp-reward-month") && read("jp-reward-month") !== monthTag()) clearReward();

    var claimForm = $("#gameClaim");
    var rewardEl = $("#gameReward");

    function showClaimed() {
      var code = read("jp-reward-claimed");
      var label = read("jp-reward-label");
      if (!code) return;
      if (rewardEl) {
        rewardEl.hidden = false;
        rewardEl.innerHTML = '🎁 Your code: <strong>' + code + '</strong> — ' + label +
          ' (valid this month). <a href="#teamwear">Use it in your enquiry →</a>';
      }
      if (claimForm) claimForm.hidden = true;
      var hidden = $("#rewardCode");
      if (hidden) hidden.value = code + " (" + label + ")";
      var note = $("#rewardNote");
      if (note) {
        note.hidden = false;
        note.querySelector("span").textContent = code + " — " + label;
      }
    }
    function showPending() {
      var pending = null;
      try { pending = JSON.parse(read("jp-reward-pending")); } catch (e) {}
      if (!pending || read("jp-reward-claimed")) return;
      if (rewardEl) {
        rewardEl.hidden = false;
        rewardEl.innerHTML = '🎁 You earned <strong>' + pending.label + '</strong>! Enter your email to get the code:';
      }
      if (claimForm) claimForm.hidden = false;
    }
    function onGameOver(s) {
      var r = rewardFor(s);
      if (!r) return;
      var prev = parseInt(read("jp-reward-score"), 10) || 0;
      if (s > prev) {
        store("jp-reward-score", String(s));
        store("jp-reward-month", monthTag());
        store("jp-reward-pending", JSON.stringify({ base: r.code, label: r.label, score: s }));
        // a better tier than an already-claimed code reopens the claim
        if (read("jp-reward-claimed") && read("jp-reward-claimed").indexOf(r.code) !== 0) {
          try { localStorage.removeItem("jp-reward-claimed"); } catch (e) {}
        }
        toast("🎁 You earned " + r.label + " — claim it below!");
        track("game_reward", { code: r.code, score: s });
      }
      if (read("jp-reward-claimed")) showClaimed(); else showPending();
    }
    if (claimForm) {
      claimForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var emailInput = $("#claimEmail");
        if (!emailInput || !emailInput.checkValidity()) { if (emailInput) emailInput.reportValidity(); return; }
        var pending = null;
        try { pending = JSON.parse(read("jp-reward-pending")); } catch (e2) {}
        if (!pending) return;
        var code = pending.base + "-" + monthTag();
        var btn = claimForm.querySelector("button");
        if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
        // lead lands in the store inbox; player gets the code by auto-reply
        fetch("https://formsubmit.co/ajax/shridhar.govind14.sg@gmail.com", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            email: emailInput.value,
            game_score: String(pending.score),
            reward_code: code + " (" + pending.label + ")",
            _subject: "Game reward claimed — jaypeesports.in",
            _template: "table",
            _captcha: "false",
            _autoresponse: "Congratulations! Your Jaypee Sports reward code is " + code + " — " +
              pending.label + ". Valid this month only, on custom teamwear orders (one per customer). " +
              "Mention this code in your enquiry at jaypeesports.in or in store. — Jaypee Sports, Quality Par Excellence"
          })
        }).catch(function () { /* player still gets the code on screen */ })
          .finally(function () {
            store("jp-reward-claimed", code);
            store("jp-reward-label", pending.label);
            store("jp-reward-month", monthTag());
            if (btn) { btn.disabled = false; btn.textContent = "Get my code"; }
            showClaimed();
            toast("🎁 Code " + code + " is yours — also sent to your email");
            track("reward_claimed", { code: code });
          });
      });
    }
    showClaimed();
    showPending();

    var state = "idle"; // idle | play | over
    var ball = { x: 0, y: 0, vx: 0, vy: 0, r: 26, spin: 0 };
    var baseR = 26;
    var score = 0;
    var gravity = 0.36; // base value — effective gravity climbs with score
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
      baseR = Math.max(20, Math.min(30, W * 0.085));
      ball.r = baseR;
      if (state !== "play") rest();
    }

    function rest() {
      ball.x = W / 2;
      ball.y = H * 0.42;
      ball.vx = 0;
      ball.vy = 0;
      ball.spin = 0;
      ball.r = baseR;
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
      // sideways chaos grows with score so rhythm alone can't win
      var chaos = 1.4 + Math.min(score, 60) * 0.055;
      var cap = 3.2 + Math.min(score, 60) * 0.025;
      ball.vx = Math.max(-cap, Math.min(cap, dx * 0.12 + (Math.random() - 0.5) * chaos));
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
      // hitbox forgiveness tightens as the score climbs
      var reach = ball.r + Math.max(8, 26 - score * 0.3);
      if (dx * dx + dy * dy <= reach * reach) {
        score++;
        // ball shrinks with success — precision required at high scores
        ball.r = baseR * Math.max(0.62, 1 - score * 0.006);
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
        // effective gravity climbs with score: faster drops, less think time
        ball.vy += gravity * (1 + Math.min(score, 80) * 0.02) * dt;
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
        text("Dropped at " + score + "!", (rewardFor(score) ? "🎁 Reward earned — claim below · " : "") + "Tap to try again");
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

/* ============================================================
   Dynamic sports motion background — spinning sport balls with
   motion speed-lines plus drifting athlete silhouettes.
   Recognizable sports graphics, animated, tuned to stay light
   on phones (capped DPR, fewer/lower-FPS on mobile, pauses when
   hidden, single static frame under reduced-motion).
   ============================================================ */
(function sportsBackground() {
  "use strict";
  var canvas = document.getElementById("motionBg");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  var W = 0, H = 0, mobile = false, FPS = 1000 / 50;
  var balls = [], figs = [], running = true, rafId = null, last = 0;

  var KINDS = ["football", "basket", "volley", "cricket", "tennis"];
  var runnerPath = (typeof Path2D !== "undefined")
    ? new Path2D("M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9 1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z")
    : null;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function circle(r) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); }

  function paintBall(kind, r) {
    ctx.save();
    if (kind === "football") {
      circle(r); ctx.fillStyle = "#f3f3f5"; ctx.fill();
      ctx.save(); circle(r); ctx.clip();
      ctx.fillStyle = "#15151c";
      ctx.beginPath();
      for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / 5; var x = Math.cos(a) * r * 0.4, y = Math.sin(a) * r * 0.4; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(21,21,28,0.85)"; ctx.lineWidth = r * 0.05;
      for (var s = 0; s < 5; s++) { var b = -Math.PI / 2 + s * 2 * Math.PI / 5; ctx.beginPath(); ctx.moveTo(Math.cos(b) * r * 0.4, Math.sin(b) * r * 0.4); ctx.lineTo(Math.cos(b) * r, Math.sin(b) * r); ctx.stroke(); }
      ctx.restore();
    } else if (kind === "basket") {
      circle(r); ctx.fillStyle = "#e8651a"; ctx.fill();
      ctx.save(); circle(r); ctx.clip();
      ctx.strokeStyle = "rgba(28,16,8,0.8)"; ctx.lineWidth = r * 0.05;
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(-r * 1.15, 0, r * 1.3, -0.65, 0.65); ctx.stroke();
      ctx.beginPath(); ctx.arc(r * 1.15, 0, r * 1.3, Math.PI - 0.65, Math.PI + 0.65); ctx.stroke();
      ctx.restore();
    } else if (kind === "volley") {
      circle(r); ctx.fillStyle = "#f6f8ff"; ctx.fill();
      ctx.save(); circle(r); ctx.clip();
      ctx.strokeStyle = "rgba(36,71,199,0.75)"; ctx.lineWidth = r * 0.05;
      ctx.beginPath(); ctx.arc(-r * 0.6, -r * 0.3, r * 1.15, -0.4, 1.1); ctx.stroke();
      ctx.beginPath(); ctx.arc(r * 0.4, r * 0.7, r * 1.15, -2.3, -0.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(r * 0.7, -r * 0.7, r * 1.15, 1.7, 3.1); ctx.stroke();
      ctx.restore();
    } else if (kind === "cricket") {
      circle(r); ctx.fillStyle = "#b21228"; ctx.fill();
      ctx.save(); circle(r); ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = r * 0.05; ctx.setLineDash([r * 0.13, r * 0.1]);
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    } else {
      circle(r); ctx.fillStyle = "#c7d92b"; ctx.fill();
      ctx.save(); circle(r); ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = r * 0.05;
      ctx.beginPath(); ctx.arc(-r * 1.05, 0, r * 1.3, -0.6, 0.6); ctx.stroke();
      ctx.beginPath(); ctx.arc(r * 1.05, 0, r * 1.3, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
      ctx.restore();
    }
    circle(r); ctx.strokeStyle = "rgba(12,12,20,0.16)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }

  function makeBalls(n) {
    balls = [];
    for (var i = 0; i < n; i++) {
      var ang = rnd(0, Math.PI * 2), spd = rnd(mobile ? 0.2 : 0.25, mobile ? 0.5 : 0.7);
      balls.push({
        kind: KINDS[(Math.random() * KINDS.length) | 0],
        x: Math.random() * W, y: Math.random() * H, r: rnd(mobile ? 24 : 34, mobile ? 48 : 88),
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        rot: Math.random() * Math.PI * 2, vr: rnd(-0.012, 0.012)
      });
    }
  }
  function makeFigs(n) {
    figs = [];
    for (var i = 0; i < n; i++) figs.push({ x: Math.random() * W, y: rnd(H * 0.2, H * 0.85), s: rnd(9, 16), vx: rnd(0.12, 0.4), ph: Math.random() * 6 });
  }

  function size() {
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height; if (!W || !H) return;
    mobile = W < 760;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    FPS = mobile ? 1000 / 30 : 1000 / 50;
    makeBalls(mobile ? 2 : 5);
    makeFigs(mobile ? 1 : 3);
  }

  function drawFigs(move) {
    if (!runnerPath) return;
    ctx.globalAlpha = 0.05; ctx.fillStyle = "#12121c";
    for (var i = 0; i < figs.length; i++) {
      var f = figs[i];
      ctx.save();
      ctx.translate(f.x, f.y + Math.sin(f.ph) * 4);
      ctx.scale(f.s, f.s); ctx.translate(-12, -12);
      ctx.fill(runnerPath);
      ctx.restore();
      if (move) { f.x += f.vx; f.ph += 0.012; if (f.x > W + f.s * 14) { f.x = -f.s * 14; f.y = rnd(H * 0.2, H * 0.85); } }
    }
    ctx.globalAlpha = 1;
  }

  function drawBalls(move) {
    for (var i = 0; i < balls.length; i++) {
      var b = balls[i];
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (sp > 0.05) {
        var ux = -b.vx / sp, uy = -b.vy / sp;
        ctx.globalAlpha = 0.14; ctx.strokeStyle = "#ff3b1f"; ctx.lineWidth = 1.4;
        for (var k = -1; k <= 1; k++) {
          var ox = -uy * b.r * 0.5 * k, oy = ux * b.r * 0.5 * k;
          ctx.beginPath();
          ctx.moveTo(b.x + ox + ux * b.r * 1.1, b.y + oy + uy * b.r * 1.1);
          ctx.lineTo(b.x + ox + ux * (b.r * 1.1 + b.r * 1.4 + sp * 18), b.y + oy + uy * (b.r * 1.1 + b.r * 1.4 + sp * 18));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      ctx.globalAlpha = 0.4;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); paintBall(b.kind, b.r); ctx.restore();
      ctx.globalAlpha = 1;
      if (move) {
        b.x += b.vx; b.y += b.vy; b.rot += b.vr;
        var m = b.r + 14;
        if (b.x < -m) b.x = W + m; if (b.x > W + m) b.x = -m;
        if (b.y < -m) b.y = H + m; if (b.y > H + m) b.y = -m;
      }
    }
  }

  function frame(move) { ctx.clearRect(0, 0, W, H); drawFigs(move); drawBalls(move); }

  function loop(now) {
    rafId = null; if (!running) return;
    if (!last || now - last >= FPS) { last = now; frame(true); }
    rafId = requestAnimationFrame(loop);
  }
  function setRunning(on) { running = on; if (on && rafId === null) { last = 0; rafId = requestAnimationFrame(loop); } }

  size(); if (!W || !H) return;
  if (reduce) { frame(false); return; }
  document.addEventListener("visibilitychange", function () { setRunning(!document.hidden); });
  var rT; window.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(size, 200); });
  rafId = requestAnimationFrame(loop);
})();
