/* =====================================================================
   WEDDING SITE · Interactions, countdown, themes & hidden admin
   ===================================================================== */
(function () {
  "use strict";

  const cfg = window.WEDDING || {};
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==================================================================
     SHA-256 — crypto.subtle when available (https / localhost),
     compact pure-JS fallback otherwise (e.g. opening the file directly).
  ================================================================== */
  function sha256Sync(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    const maxWord = Math.pow(2, 32);
    let result = "", i, j;
    const words = [];
    const asciiBitLength = ascii.length * 8;
    let hash = (sha256Sync.h = sha256Sync.h || []);
    const k = (sha256Sync.k = sha256Sync.k || []);
    let primeCounter = k.length;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += "\x80";
    while ((ascii.length % 64) - 56) ascii += "\x00";
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return "";
      words[i >> 2] |= j << (((3 - i) % 4) * 8);
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;
    for (j = 0; j < words.length; ) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] +
          (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        const t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash);
        hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? "0" : "") + b.toString(16);
      }
    }
    return result;
  }

  async function sha256(str) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return sha256Sync(str);
  }

  /* Console helper for the couple: WEDDING_HASH("newPin") prints the hash
     to paste into js/config.js as adminPinHash. */
  window.WEDDING_HASH = (pin) =>
    sha256(String(pin)).then((h) => {
      console.log("adminPinHash for '" + pin + "':\n" + h);
      return h;
    });

  /* ==================================================================
     1. Theme (dark default · light) — persisted
  ================================================================== */
  const root = document.documentElement;
  const metaTheme = $('meta[name="theme-color"]');
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    if (metaTheme) metaTheme.content = t === "light" ? "#f6f4ee" : "#0a0d0b";
    try { localStorage.setItem("theme", t); } catch (_) {}
    document.dispatchEvent(new CustomEvent("themechange"));
  }
  applyTheme((() => { try { return localStorage.getItem("theme") || "dark"; } catch (_) { return "dark"; } })());
  const themeToggle = $("#themeToggle");
  if (themeToggle) themeToggle.addEventListener("click", () =>
    applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark")
  );

  /* ==================================================================
     2. Inject config text into [data-edit]
  ================================================================== */
  $$("[data-edit]").forEach((el) => {
    const key = el.getAttribute("data-edit");
    if (cfg[key] != null) el.innerHTML = cfg[key];
  });
  if (cfg.name1 && cfg.name2) document.title = `${cfg.name1} & ${cfg.name2} · Save the Date`;

  /* ==================================================================
     3. Build dynamic sections from config (story, schedule, FAQ)
  ================================================================== */
  const tl = $("#storyTimeline");
  if (tl && Array.isArray(cfg.story)) {
    tl.innerHTML = cfg.story.map((s) => `
      <div class="timeline__item reveal">
        <span class="timeline__dot"></span>
        <span class="timeline__year">${s.year}</span>
        <h3>${s.title}</h3>
        <p>${s.text}</p>
      </div>`).join("");
  }

  const track = $("#scheduleTrack");
  if (track && Array.isArray(cfg.schedule)) {
    track.innerHTML = cfg.schedule.map((s) => `
      <div class="schedule__item reveal">
        <span class="schedule__time">${s.time}</span>
        <span class="schedule__dot"></span>
        <h3>${s.title}</h3>
        <p>${s.text}</p>
      </div>`).join("");
  }

  const faqList = $("#faqList");
  if (faqList && Array.isArray(cfg.faq)) {
    faqList.innerHTML = cfg.faq.map((f) => `
      <div class="faq__item">
        <button class="faq__q" type="button">${f.q}<i>＋</i></button>
        <div class="faq__a"><p>${f.a}</p></div>
      </div>`).join("");
    $$(".faq__item", faqList).forEach((item) => {
      const btn = $(".faq__q", item);
      const body = $(".faq__a", item);
      btn.addEventListener("click", () => {
        const open = item.classList.toggle("is-open");
        body.style.maxHeight = open ? body.scrollHeight + "px" : "0";
      });
    });
  }

  /* ==================================================================
     4. Map + directions
  ================================================================== */
  const mapQuery = cfg.venueMapQuery || cfg.venueShort || "";
  if (mapQuery) {
    const q = encodeURIComponent(mapQuery);
    const frame = $("#mapFrame");
    if (frame) frame.src = `https://www.google.com/maps?q=${q}&output=embed`;
    const dir = $("#directionsBtn");
    if (dir) dir.href = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
    const mapsBtn = $("#mapsBtn");
    if (mapsBtn) mapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  /* ==================================================================
     5. Add to calendar (.ics)
  ================================================================== */
  const calBtn = $("#addToCalendar");
  if (calBtn && cfg.weddingDateTime) {
    calBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const start = new Date(cfg.weddingDateTime);
      const end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
      const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const title = `${cfg.name1 || ""} & ${cfg.name2 || ""} Wedding`.trim();
      const loc = ((cfg.venueName ? cfg.venueName + ", " : "") + (cfg.venueMapQuery || "")).replace(/<br\s*\/?>/gi, ", ");
      const ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Wedding//EN",
        "BEGIN:VEVENT",
        `UID:${Date.now()}@wedding`,
        `DTSTAMP:${fmt(new Date())}`,
        `DTSTART:${fmt(start)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${title}`,
        `LOCATION:${loc}`,
        "DESCRIPTION:We can't wait to celebrate with you!",
        "END:VEVENT", "END:VCALENDAR",
      ].join("\r\n");
      const blob = new Blob([ics], { type: "text/calendar" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "our-wedding.ics";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  /* ==================================================================
     6. Countdown (big clock + hero chip + progress bar)
  ================================================================== */
  const target = cfg.weddingDateTime ? new Date(cfg.weddingDateTime).getTime() : null;
  const els = { d: $("#days"), h: $("#hours"), m: $("#minutes"), s: $("#seconds") };
  const msgEl = $("#countdownMsg");
  const miniDays = $("#miniDays");
  const yearBar = $("#yearProgress");
  const yearLabel = $("#yearProgressLabel");
  const pad = (n) => String(n).padStart(2, "0");

  function setNum(el, val) {
    if (!el) return;
    const next = pad(val);
    if (el.textContent !== next) {
      el.textContent = next;
      const box = el.closest(".count");
      if (box) { box.classList.add("tick"); setTimeout(() => box.classList.remove("tick"), 300); }
    }
  }

  function tick() {
    if (!target) return;
    const diff = target - Date.now();
    if (diff <= 0) {
      setNum(els.d, 0); setNum(els.h, 0); setNum(els.m, 0); setNum(els.s, 0);
      if (msgEl) msgEl.textContent = "Today is the day — we're married! 💍";
      if (miniDays) miniDays.textContent = "0";
      return;
    }
    const d = Math.floor(diff / 864e5);
    setNum(els.d, d);
    setNum(els.h, Math.floor((diff % 864e5) / 36e5));
    setNum(els.m, Math.floor((diff % 36e5) / 6e4));
    setNum(els.s, Math.floor((diff % 6e4) / 1e3));
    if (miniDays) miniDays.textContent = String(d);
  }
  if (target) {
    tick();
    setInterval(tick, 1000);
    // Progress of the final year of waiting
    const yearBefore = target - 365 * 864e5;
    const pct = Math.min(100, Math.max(0, ((Date.now() - yearBefore) / (target - yearBefore)) * 100));
    setTimeout(() => { if (yearBar) yearBar.style.width = pct.toFixed(1) + "%"; }, 600);
    if (yearLabel) yearLabel.textContent = pct <= 0
      ? "The final year hasn't started yet"
      : `${pct.toFixed(0)}% of the final year behind us`;
  }

  /* ==================================================================
     7. Intro overlay
  ================================================================== */
  window.addEventListener("load", () => {
    setTimeout(() => { const i = $("#intro"); if (i) i.classList.add("is-done"); }, reducedMotion ? 100 : 2300);
  });

  /* ==================================================================
     8. Nav (scroll state, mobile menu) + scroll progress
  ================================================================== */
  const nav = $("#nav");
  const toggle = $("#navToggle");
  const links = $("#navLinks");
  const progressBar = $("#progressBar");
  window.addEventListener("scroll", () => {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 40);
    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    }
  }, { passive: true });

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
    });
    $$("a", links).forEach((a) => a.addEventListener("click", () => {
      links.classList.remove("is-open");
      toggle.classList.remove("is-open");
    }));
  }

  /* ==================================================================
     9. Scroll reveal
  ================================================================== */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ==================================================================
     10. Detail card tilt (desktop only)
  ================================================================== */
  if (window.matchMedia("(hover: hover)").matches && !reducedMotion) {
    $$(".tilt").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* ==================================================================
     11. Gallery lightbox
  ================================================================== */
  const lightbox = $("#lightbox");
  const lightboxBody = $("#lightboxBody");
  const galleryGrid = $("#galleryGrid");
  function closeLightbox() { if (lightbox) lightbox.hidden = true; }
  if (galleryGrid && lightbox) {
    galleryGrid.addEventListener("click", (e) => {
      const item = e.target.closest(".gallery__item");
      if (!item) return;
      const img = item.querySelector("img");
      lightboxBody.innerHTML = "";
      if (img) {
        const big = document.createElement("img");
        big.src = img.src; big.alt = img.alt || "";
        lightboxBody.appendChild(big);
      } else {
        lightboxBody.appendChild(item.cloneNode(true));
      }
      lightbox.hidden = false;
    });
    $("#lightboxClose").addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  }

  /* ==================================================================
     12. RSVP — stores locally, optionally posts to cfg.rsvpEndpoint
  ================================================================== */
  const store = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {} },
  };

  const form = $("#rsvpForm");
  const success = $("#rsvpSuccess");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const data = Object.fromEntries(new FormData(form).entries());
      data.submittedAt = new Date().toISOString();

      const all = store.get("rsvps", []);
      all.push(data);
      store.set("rsvps", all);

      // Auto-sync the guest list tracker if this name is on it
      const guests = store.get("guestList", []);
      const match = guests.find((g) => nameKey(g.name) === nameKey(data.name));
      if (match) {
        match.status = data.attending === "yes" ? "confirmed" : "declined";
        match.party = Math.max(1, parseInt(data.guests, 10) || 1);
        if (data.phone && !match.phone) match.phone = data.phone;
        store.set("guestList", guests);
      }

      if (cfg.rsvpEndpoint) {
        fetch(cfg.rsvpEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        }).catch(() => {});
      }

      form.hidden = true;
      if (success) success.hidden = false;
      burst();
    });
  }

  /* ==================================================================
     13. Confetti burst
  ================================================================== */
  function burst() {
    if (reducedMotion) return;
    const colors = ["#2fe89a", "#6ee7b7", "#d8c08a", "#1faa72", "#eaf3ee"];
    for (let i = 0; i < 100; i++) {
      const c = document.createElement("span");
      c.style.cssText = `position:fixed;left:50%;top:42%;z-index:999;pointer-events:none;
        width:${Math.random() * 8 + 4}px;height:${Math.random() * 8 + 4}px;
        background:${colors[(Math.random() * colors.length) | 0]};
        border-radius:${Math.random() > 0.5 ? "50%" : "2px"};`;
      document.body.appendChild(c);
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 300 + 80;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 120;
      c.animate([
        { transform: "translate(-50%,-50%) rotate(0) scale(1)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 420}px)) rotate(${Math.random() * 720}deg) scale(0.3)`, opacity: 0 },
      ], { duration: 1600 + Math.random() * 900, easing: "cubic-bezier(0.22,1,0.36,1)" }).onfinish = () => c.remove();
    }
  }

  /* ==================================================================
     14. Ambient background — night sky with shooting stars in dark
         mode, falling leaves in light mode. Rebuilds on theme change.
  ================================================================== */
  const canvas = $("#particles");
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, stars = [], leaves = [], shots = [], nextShot = 0;
    const isLight = () => root.getAttribute("data-theme") === "light";
    const LEAF_COLORS = ["#107a54", "#0e8c5f", "#3f9a72", "#a5854a", "#c9a35f"];

    function newLeaf(anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -30,
        size: Math.random() * 9 + 6,
        vy: Math.random() * 0.8 + 0.4,
        vx: Math.random() * 0.5 - 0.1,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.04,
        sway: Math.random() * Math.PI * 2,
        color: LEAF_COLORS[(Math.random() * LEAF_COLORS.length) | 0],
        a: Math.random() * 0.3 + 0.35,
      };
    }

    function build() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      stars = Array.from({ length: Math.min(170, Math.floor((w * h) / 8500)) }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.3 + 0.3,
        tw: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.03 + 0.008,
        gold: Math.random() > 0.85,
      }));
      leaves = Array.from({ length: Math.min(34, Math.max(14, Math.floor(w / 42))) }, () => newLeaf(true));
      shots = [];
      nextShot = performance.now() + 1500;
    }

    function drawLeaf(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.color;
      ctx.beginPath(); // pointed-oval leaf
      ctx.moveTo(0, -p.size);
      ctx.quadraticCurveTo(p.size * 0.8, 0, 0, p.size);
      ctx.quadraticCurveTo(-p.size * 0.8, 0, 0, -p.size);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)"; // midrib
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.7);
      ctx.lineTo(0, p.size * 0.7);
      ctx.stroke();
      ctx.restore();
    }

    let t = 0;
    function draw(now) {
      t += 0.008;
      ctx.clearRect(0, 0, w, h);

      if (isLight()) {
        leaves.forEach((p, i) => {
          p.y += p.vy;
          p.x += p.vx + Math.sin(t * 2 + p.sway) * 0.45;
          p.rot += p.vr + Math.sin(t + p.sway) * 0.004;
          if (p.y > h + 30 || p.x < -40 || p.x > w + 40) leaves[i] = newLeaf(false);
          drawLeaf(p);
        });
      } else {
        stars.forEach((s) => {
          s.tw += s.sp;
          const a = 0.2 + Math.abs(Math.sin(s.tw)) * 0.55;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = s.gold ? `rgba(216,192,138,${a})` : `rgba(220,245,232,${a})`;
          ctx.fill();
        });
        if (now > nextShot) {
          nextShot = now + 2500 + Math.random() * 5500;
          const fromLeft = Math.random() > 0.5;
          shots.push({
            x: fromLeft ? Math.random() * w * 0.35 : w - Math.random() * w * 0.35,
            y: Math.random() * h * 0.35,
            vx: (fromLeft ? 1 : -1) * (Math.random() * 5 + 7),
            vy: Math.random() * 2.5 + 2,
            life: 1,
          });
        }
        shots.forEach((sh) => {
          sh.x += sh.vx;
          sh.y += sh.vy;
          sh.life -= 0.016;
          const tail = 13;
          const grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * tail, sh.y - sh.vy * tail);
          grad.addColorStop(0, `rgba(110,231,183,${Math.max(0, sh.life)})`);
          grad.addColorStop(1, "rgba(110,231,183,0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(sh.x, sh.y);
          ctx.lineTo(sh.x - sh.vx * tail, sh.y - sh.vy * tail);
          ctx.stroke();
          ctx.beginPath(); // bright head
          ctx.arc(sh.x, sh.y, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(234,243,238,${Math.max(0, sh.life)})`;
          ctx.fill();
        });
        shots = shots.filter((sh) => sh.life > 0 && sh.x > -60 && sh.x < w + 60 && sh.y < h + 60);
      }
      requestAnimationFrame(draw);
    }

    build();
    requestAnimationFrame(draw);
    window.addEventListener("resize", build);
    document.addEventListener("themechange", build);
  }

  /* ==================================================================
     15. Falling petals in the hero
  ================================================================== */
  const petalsCanvas = $("#petals");
  const heroEl = $(".hero");
  if (petalsCanvas && heroEl && !reducedMotion) {
    const ctx = petalsCanvas.getContext("2d");
    let w, h, petals;
    function resize() {
      w = petalsCanvas.width = heroEl.clientWidth;
      h = petalsCanvas.height = heroEl.clientHeight;
      petals = Array.from({ length: 26 }, () => spawn(true));
    }
    function spawn(anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -20,
        size: Math.random() * 7 + 4,
        vy: Math.random() * 0.7 + 0.35,
        vx: Math.random() * 0.6 - 0.3,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.03,
        sway: Math.random() * 2,
        gold: Math.random() > 0.72,
        a: Math.random() * 0.35 + 0.25,
      };
    }
    let t = 0;
    function draw() {
      t += 0.01;
      ctx.clearRect(0, 0, w, h);
      petals.forEach((p, i) => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(t * 2 + p.sway) * 0.3;
        p.rot += p.vr;
        if (p.y > h + 20) petals[i] = spawn(false);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fillStyle = p.gold ? `rgba(216,192,138,${p.a})` : `rgba(47,232,154,${p.a * 0.8})`;
        ctx.fill();
        ctx.restore();
      });
      requestAnimationFrame(draw);
    }
    resize(); draw();
    window.addEventListener("resize", resize);
  }

  /* ==================================================================
     16. Hero parallax
  ================================================================== */
  const heroContent = $(".hero__content");
  if (heroContent && !reducedMotion) {
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        heroContent.style.transform = `translateY(${y * 0.25}px)`;
        heroContent.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.7)));
      }
    }, { passive: true });
  }

  /* ==================================================================
     17. HIDDEN ADMIN — couple's dashboard
     Open with: typing the secret keyword anywhere on the page,
     7 quick taps on the footer monogram, or visiting #admin.
     Locked behind a hashed PIN (see js/config.js).
  ================================================================== */
  const gate = $("#adminGate");
  const panel = $("#adminPanel");
  const pinInput = $("#adminPin");
  const pinError = $("#adminError");

  function openGate() {
    if (!gate) return;
    if (sessionStorage.getItem("adminUnlocked") === "1") { openPanel(); return; }
    gate.hidden = false;
    pinError.hidden = true;
    pinInput.value = "";
    setTimeout(() => pinInput.focus(), 50);
  }
  function closeGate() { if (gate) gate.hidden = true; }

  async function tryUnlock() {
    const hash = await sha256(pinInput.value.trim());
    if (hash && hash === cfg.adminPinHash) {
      sessionStorage.setItem("adminUnlocked", "1");
      closeGate();
      openPanel();
    } else {
      pinError.hidden = false;
      pinInput.value = "";
      const card = $(".admin-gate__card");
      if (card) card.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-10px)" }, { transform: "translateX(10px)" }, { transform: "translateX(0)" }],
        { duration: 260 }
      );
    }
  }

  if (gate) {
    $("#adminEnter").addEventListener("click", tryUnlock);
    $("#adminCancel").addEventListener("click", closeGate);
    pinInput.addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
  }

  // Trigger 1: typed keyword (not while typing in a field)
  let keyBuffer = "";
  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (["input", "textarea", "select"].includes(tag)) return;
    if (e.key === "Escape") {
      closeGate(); closeLightbox();
      if (panel && !panel.hidden) panel.hidden = true;
      return;
    }
    if (e.key.length !== 1) return;
    keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-24);
    if (cfg.adminKeyword && keyBuffer.endsWith(cfg.adminKeyword.toLowerCase())) {
      keyBuffer = "";
      openGate();
    }
  });

  // Trigger 2: 7 quick taps on the footer monogram (mobile-friendly)
  const monogram = $("#footerMonogram");
  if (monogram) {
    let taps = 0, timer = null;
    monogram.addEventListener("click", () => {
      taps++;
      clearTimeout(timer);
      timer = setTimeout(() => (taps = 0), 3000);
      if (taps >= 7) { taps = 0; openGate(); }
    });
  }

  // Trigger 3: #admin in the URL
  function checkHash() { if (location.hash === "#admin") openGate(); }
  window.addEventListener("hashchange", checkHash);
  // Deferred: opening the dashboard runs renderAdmin, which uses constants
  // declared further down this file — calling it inline would hit their TDZ.
  setTimeout(checkHash, 0);

  /* ---- Dashboard logic ---- */
  function openPanel() {
    if (!panel) return;
    panel.hidden = false;
    document.body.style.overflow = "hidden";
    const notesEl = $("#coupleNotes");
    if (notesEl) notesEl.value = store.get("coupleNotes", "");
    renderAdmin();
  }
  function closePanel() {
    panel.hidden = true;
    document.body.style.overflow = "";
    if (location.hash === "#admin") history.replaceState(null, "", location.pathname + location.search);
  }
  if (panel) $("#adminClose").addEventListener("click", closePanel);

  const STATUS_NEXT = { invited: "confirmed", confirmed: "declined", declined: "invited" };
  const STATUS_LABEL = { invited: "Invited", confirmed: "Coming", declined: "Declined" };

  /* Declared (not const) so the #admin deep-link, which opens the dashboard
     while this script is still evaluating, can already use it. */
  function nameKey(n) { return String(n || "").trim().toLowerCase().replace(/\s+/g, " "); }

  /* Latest RSVP per name — used to fill in tracker rows, not to count. */
  function rsvpsByName() {
    const byName = new Map();
    store.get("rsvps", [])
      .slice()
      .sort((a, b) => String(a.submittedAt || "").localeCompare(String(b.submittedAt || "")))
      .forEach((r) => { const key = nameKey(r.name); if (key) byName.set(key, r); });
    return byName;
  }

  /* Pull RSVP answers into the tracker rows so the list agrees with the stats.
     Only rows still at the default "invited" are touched — a status the couple
     set by hand stays put. */
  function syncGuestList() {
    const guests = store.get("guestList", []);
    const byName = rsvpsByName();
    let changed = false;
    guests.forEach((g) => {
      if (g.status && g.status !== "invited") return;
      const r = byName.get(nameKey(g.name));
      if (!r) return;
      g.status = r.attending === "yes" ? "confirmed" : "declined";
      g.party = Math.max(1, parseInt(r.guests, 10) || 1);
      if (r.phone && !g.phone) g.phone = r.phone;
      changed = true;
    });
    if (changed) store.set("guestList", guests);
    return guests;
  }

  /* What the stat tiles count: every RSVP response, one for one — so the totals
     always match the RSVP inbox — plus the guest list rows nobody has responded
     for yet. A tracker row and that guest's response are the same person, so the
     row is skipped once a matching name has replied. */
  function mergedPeople() {
    const rsvps = store.get("rsvps", []);
    const responded = new Set(rsvps.map((r) => nameKey(r.name)).filter(Boolean));

    const people = rsvps.map((r) => ({
      status: r.attending === "yes" ? "confirmed" : "declined",
      party: Math.max(1, parseInt(r.guests, 10) || 1),
    }));

    store.get("guestList", []).forEach((g) => {
      if (responded.has(nameKey(g.name))) return;
      people.push({ status: g.status || "invited", party: Math.max(1, parseInt(g.party, 10) || 1) });
    });

    return people;
  }

  function renderAdmin() {
    if (!panel || panel.hidden) return;
    const guests = syncGuestList();
    const rsvps = store.get("rsvps", []);
    const q = ($("#guestSearch").value || "").toLowerCase();

    // Stats — guest list tracker + anyone who RSVP'd without being on it
    const people = mergedPeople();
    const confirmed = people.filter((p) => p.status === "confirmed");
    const declined = people.filter((p) => p.status === "declined");
    $("#statInvited").textContent = people.length;
    $("#statYes").textContent = confirmed.length;
    $("#statNo").textContent = declined.length;
    $("#statHeads").textContent = confirmed.reduce((n, p) => n + p.party, 0);
    $("#statPending").textContent = people.length - confirmed.length - declined.length;

    // Guest list
    const onList = new Set(guests.map((g) => nameKey(g.name)));
    const offList = [...rsvpsByName().keys()].filter((k) => !onList.has(k)).length;
    $("#guestHint").textContent = offList ? `(${offList} RSVP'd but not on this list)` : "";

    const listEl = $("#guestList");
    const filtered = guests.filter((g) => g.name.toLowerCase().includes(q));
    listEl.innerHTML = filtered.length
      ? filtered.map((g) => `
        <li data-id="${g.id}">
          <span class="g-name">${escapeHtml(g.name)}</span>
          <input class="g-phone" type="tel" inputmode="tel" data-act="phone" placeholder="Cell number"
                 value="${escapeHtml(g.phone || "")}" aria-label="Cell number for ${escapeHtml(g.name)}" />
          <span class="g-party">×${g.party || 1}</span>
          <button class="admin__status" data-status="${g.status}" data-act="status">${STATUS_LABEL[g.status] || g.status}</button>
          <button class="admin__del" data-act="del" title="Remove">✕</button>
        </li>`).join("")
      : `<li class="admin__empty">${q ? "No guests match your search." : "No guests yet — add your first above."}</li>`;

    // RSVP inbox
    const rsvpEl = $("#rsvpList");
    $("#rsvpHint").textContent = rsvps.length ? `(${rsvps.length})` : "";
    rsvpEl.innerHTML = rsvps.length
      ? rsvps.map((r, i) => ({ r, i })).reverse().map(({ r, i }) => `
        <li data-i="${i}">
          <div class="r-top">
            <strong>${escapeHtml(r.name || "?")}</strong>
            <span class="${r.attending === "yes" ? "g-yes" : ""}" style="color:${r.attending === "yes" ? "var(--emerald-bright)" : "#e87a7a"}">
              ${r.attending === "yes" ? "✓ Accepts" : "✕ Declines"} · ${r.guests || 1}
              <button class="admin__del" data-act="del-rsvp" title="Delete this response">✕</button>
            </span>
          </div>
          <span class="r-meta">
            ${r.phone || r.email
              ? `<a href="${r.phone ? "tel:" + escapeHtml(r.phone) : "mailto:" + escapeHtml(r.email)}">${escapeHtml(r.phone || r.email)}</a>`
              : ""}${r.dietary ? " · " + escapeHtml(r.dietary) : ""} · ${new Date(r.submittedAt).toLocaleDateString()}
          </span>
          ${r.song ? `<span class="r-meta">♫ ${escapeHtml(r.song)}</span>` : ""}
          ${r.message ? `<span class="r-msg">“${escapeHtml(r.message)}”</span>` : ""}
        </li>`).join("")
      : `<li class="admin__empty">No RSVP responses in this browser yet.</li>`;

    renderInvites(guests);
    renderTodos();
    renderContacts();
    renderDream();
  }

  /* ---- To-do list (seeded with wedding-planning basics) ---- */
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const DEFAULT_TODOS = [
    "Book the venue", "Confirm photographer", "Choose the menu & cake",
    "Send invitations", "Wedding rings", "Playlist & first dance song",
    "Finalise seating chart", "Plan the honeymoon",
  ];
  function getTodos() {
    let todos = store.get("todos", null);
    if (!todos) {
      todos = DEFAULT_TODOS.map((text) => ({ id: uid(), text, done: false }));
      store.set("todos", todos);
    }
    return todos;
  }
  function renderTodos() {
    const listEl = $("#todoList");
    if (!listEl) return;
    const todos = getTodos();
    $("#todoHint").textContent = todos.length ? `${todos.filter((t) => t.done).length}/${todos.length} done` : "";
    listEl.innerHTML = todos.length
      ? todos.map((td) => `
        <li data-id="${td.id}" class="${td.done ? "is-done" : ""}">
          <button class="admin__check" data-act="toggle" title="Toggle done">${td.done ? "✓" : ""}</button>
          <span class="g-name">${escapeHtml(td.text)}</span>
          <button class="admin__del" data-act="del" title="Remove">✕</button>
        </li>`).join("")
      : `<li class="admin__empty">Nothing to do — enjoy the calm.</li>`;
  }

  /* ---- Contacts ---- */
  function renderContacts() {
    const listEl = $("#contactList");
    if (!listEl) return;
    const contacts = store.get("contacts", []);
    listEl.innerHTML = contacts.length
      ? contacts.map((c) => `
        <li data-id="${c.id}">
          <div class="r-top">
            <strong>${escapeHtml(c.name)}</strong>
            <button class="admin__del" data-act="del" title="Remove">✕</button>
          </div>
          <span class="r-meta">
            ${c.role ? escapeHtml(c.role) : ""}
            ${c.phone ? ` · <a href="tel:${escapeHtml(c.phone)}">${escapeHtml(c.phone)}</a>` : ""}
            ${c.email ? ` · <a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a>` : ""}
          </span>
        </li>`).join("")
      : `<li class="admin__empty">No contacts yet — add your photographer, florist, DJ…</li>`;
  }

  /* ---- Dreamboard ---- */
  function renderDream() {
    const grid = $("#dreamGrid");
    if (!grid) return;
    const board = store.get("dreamboard", []);
    grid.innerHTML = board.length
      ? board.map((d) => `
        <figure class="admin__dream-item" data-id="${d.id}">
          <img src="${d.src}" alt="Inspiration" />
          <button class="admin__del admin__dream-del" data-act="del" title="Remove">✕</button>
        </figure>`).join("")
      : `<p class="admin__empty">No inspiration yet — upload your first image.</p>`;
  }
  function shrinkImage(file, maxSide, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /* ==================================================================
     Invitations — one image + one message, sent guest by guest through
     whichever app the couple (or their phone's share sheet) prefers.
  ================================================================== */
  const INVITE_IMG = cfg.inviteImage || "assets/invite/Invite_template.png";
  const DEFAULT_INVITE_MSG = cfg.inviteMessage ||
    "Hi {name}! {name1} & {name2} are getting married on {dateLong}. All the details and the RSVP are here:\n{link}";

  function defaultLink() {
    if (cfg.siteUrl) return cfg.siteUrl;
    return location.protocol === "file:" ? "" : location.origin + location.pathname.replace(/index\.html$/, "");
  }
  function inviteLink() { return (store.get("inviteLink", null) ?? defaultLink()).trim(); }
  function inviteTemplate() { return store.get("inviteMessage", null) ?? DEFAULT_INVITE_MSG; }

  /* Fill {name}, {link} and any config key the couple drops in as {key}. */
  function inviteText(name) {
    return inviteTemplate().replace(/\{(\w+)\}/g, (whole, key) => {
      if (key === "name") return name || "there";
      if (key === "link") return inviteLink();
      return cfg[key] != null ? String(cfg[key]).replace(/<br\s*\/?>/gi, ", ") : whole;
    });
  }

  /* 082 123 4567 → 27821234567, so wa.me links reach the right person. */
  function waNumber(raw) {
    let d = String(raw || "").replace(/[^\d+]/g, "");
    const cc = String(cfg.countryCode || "").replace(/\D/g, "");
    if (d.startsWith("+")) return d.slice(1);
    if (d.startsWith("00")) return d.slice(2);
    if (cc && d.startsWith("0")) return cc + d.slice(1);
    if (cc && d.length <= 10 && !d.startsWith(cc)) return cc + d;
    return d;
  }

  /* The image as a File, fetched once. Null when it can't be read —
     opening the site straight off disk (file://) blocks the fetch. */
  let invitePromise = null;
  function inviteFile() {
    if (!invitePromise) {
      invitePromise = fetch(INVITE_IMG)
        .then((r) => (r.ok ? r.blob() : Promise.reject()))
        .then((b) => new File([b], "wedding-invitation" + (b.type.includes("jpeg") ? ".jpg" : ".png"), { type: b.type }))
        .catch(() => null);
    }
    return invitePromise;
  }

  function sendLink(channel, name, phone) {
    const text = inviteText(name);
    const num = waNumber(phone);
    const enc = encodeURIComponent(text);
    switch (channel) {
      case "whatsapp": return num ? `https://wa.me/${num}?text=${enc}` : `https://wa.me/?text=${enc}`;
      case "sms":      return `sms:${num ? "+" + num : ""}${/iPhone|iPad|Mac/.test(navigator.userAgent) ? "&" : "?"}body=${enc}`;
      case "telegram": return `https://t.me/share/url?url=${encodeURIComponent(inviteLink())}&text=${enc}`;
      case "email":    return `mailto:?subject=${encodeURIComponent(`${cfg.name1 || ""} & ${cfg.name2 || ""} — you're invited`.trim())}&body=${enc}`;
      default:         return "";
    }
  }

  function openSend(channel, name, phone) {
    const url = sendLink(channel, name, phone);
    if (!url) return;
    if (channel === "email" || channel === "sms") location.href = url;
    else window.open(url, "_blank", "noopener");
  }

  /* The phone's own share sheet — the only route that carries the image. */
  async function shareInvite(name, guestId) {
    const note = $("#inviteShareNote");
    const text = inviteText(name);
    const file = await inviteFile();
    const payload = { title: `${cfg.name1 || ""} & ${cfg.name2 || ""} — you're invited`.trim(), text };
    if (inviteLink()) payload.url = inviteLink();

    if (navigator.share) {
      try {
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          // Some apps drop the caption when a file rides along; text still helps the rest.
          await navigator.share({ ...payload, files: [file] });
        } else {
          await navigator.share(payload);
          if (note) note.textContent = "Shared without the picture — this browser won't attach files. Save the image and add it in the chat.";
        }
        if (guestId) { markSent(guestId); renderInvites(); }
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return; // the couple closed the sheet
      }
    }
    copyText(text);
    if (note) note.textContent = "No share sheet here — the message is on your clipboard. Use the buttons above, or save the image and attach it yourself.";
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(() => {});
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (_) {}
    ta.remove();
    return Promise.resolve();
  }

  function markSent(id, on) {
    const sent = store.get("invitesSent", {});
    if (on === false) delete sent[id]; else sent[id] = new Date().toISOString();
    store.set("invitesSent", sent);
  }

  function renderInvites(guests) {
    const listEl = $("#inviteList");
    if (!listEl) return;
    guests = guests || store.get("guestList", []);
    const sent = store.get("invitesSent", {});
    const q = ($("#inviteSearch").value || "").toLowerCase();

    const withPhone = guests.filter((g) => g.phone);
    $("#inviteHint").textContent = withPhone.length
      ? `${Object.keys(sent).filter((id) => guests.some((g) => g.id === id)).length}/${withPhone.length} marked sent`
      : "";
    $("#inviteQueueHint").textContent = guests.length - withPhone.length
      ? `(${guests.length - withPhone.length} without a number)`
      : "";

    const rows = guests.filter((g) => g.name.toLowerCase().includes(q));
    listEl.innerHTML = rows.length
      ? rows.map((g) => `
        <li data-id="${g.id}" class="${sent[g.id] ? "is-sent" : ""}">
          <div class="r-top">
            <strong>${escapeHtml(g.name)}</strong>
            <button class="admin__check" data-act="sent" title="Mark as sent">${sent[g.id] ? "✓" : ""}</button>
          </div>
          <span class="r-meta">${g.phone ? escapeHtml(g.phone) : "No cell number yet — add one on the Guests tab"}</span>
          ${g.phone ? `
          <div class="invite__row-actions">
            <button class="btn btn--ghost btn--sm" data-act="share">Share…</button>
            <button class="btn btn--ghost btn--sm" data-act="whatsapp">WhatsApp</button>
            <button class="btn btn--ghost btn--sm" data-act="sms">SMS</button>
            <button class="btn btn--ghost btn--sm" data-act="telegram">Telegram</button>
            <button class="btn btn--ghost btn--sm" data-act="copy">Copy</button>
          </div>` : ""}
        </li>`).join("")
      : `<li class="admin__empty">${q ? "No guests match your search." : "No guests yet — add them on the Guests tab."}</li>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  if (panel) {
    $("#guestAddForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#newGuestName").value.trim();
      if (!name) return;
      const guests = store.get("guestList", []);
      guests.push({
        id: uid(),
        name,
        phone: $("#newGuestPhone").value.trim(),
        party: Math.max(1, parseInt($("#newGuestParty").value, 10) || 1),
        status: "invited",
      });
      store.set("guestList", guests);
      $("#newGuestName").value = "";
      $("#newGuestPhone").value = "";
      $("#newGuestParty").value = "1";
      renderAdmin();
    });

    /* Paste a list: one guest per line, "Name, cell number, party size" */
    $("#guestBulkAdd").addEventListener("click", () => {
      const box = $("#guestBulkText");
      const rows = box.value.split("\n").map((l) => l.trim()).filter(Boolean);
      if (!rows.length) return;
      const guests = store.get("guestList", []);
      let added = 0;
      rows.forEach((line) => {
        const parts = line.split(/[,;\t]/).map((p) => p.trim());
        const name = parts[0];
        if (!name || guests.some((g) => nameKey(g.name) === nameKey(name))) return;
        // The number and the party size can arrive in either order, or not at all.
        const phone = parts.slice(1).find((p) => /\d/.test(p) && p.replace(/\D/g, "").length >= 7) || "";
        const size = parts.slice(1).find((p) => /^\d{1,2}$/.test(p));
        guests.push({
          id: uid(),
          name,
          phone,
          party: Math.max(1, parseInt(size, 10) || 1),
          status: "invited",
        });
        added++;
      });
      store.set("guestList", guests);
      box.value = "";
      renderAdmin();
      $("#guestHint").textContent = `(added ${added})`;
    });

    $("#guestSearch").addEventListener("input", renderAdmin);

    /* Cell numbers are edited in place — save on blur, don't re-render mid-typing */
    $("#guestList").addEventListener("change", (e) => {
      if (e.target.dataset.act !== "phone") return;
      const id = e.target.closest("li").dataset.id;
      const guests = store.get("guestList", []);
      const g = guests.find((g) => g.id === id);
      if (!g) return;
      g.phone = e.target.value.trim();
      store.set("guestList", guests);
      renderInvites(guests);
    });

    $("#guestList").addEventListener("click", (e) => {
      const act = e.target.dataset.act;
      if (!act || act === "phone") return; // the phone field saves on change, not on click
      const id = e.target.closest("li").dataset.id;
      let guests = store.get("guestList", []);
      if (act === "del") guests = guests.filter((g) => g.id !== id);
      if (act === "status") {
        const g = guests.find((g) => g.id === id);
        if (g) g.status = STATUS_NEXT[g.status] || "invited";
      }
      store.set("guestList", guests);
      renderAdmin();
    });

    $("#rsvpList").addEventListener("click", (e) => {
      if (e.target.dataset.act !== "del-rsvp") return;
      const i = parseInt(e.target.closest("li").dataset.i, 10);
      const rsvps = store.get("rsvps", []);
      if (Number.isNaN(i) || !rsvps[i]) return;
      rsvps.splice(i, 1);
      store.set("rsvps", rsvps);
      renderAdmin();
    });

    /* Tabs */
    $("#adminTabs").addEventListener("click", (e) => {
      const btn = e.target.closest(".admin__tab");
      if (!btn) return;
      $$(".admin__tab", panel).forEach((b) => b.classList.toggle("is-active", b === btn));
      $$(".admin__pane", panel).forEach((p) => p.classList.toggle("is-active", p.dataset.pane === btn.dataset.tab));
    });

    /* To-do */
    $("#todoAddForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const text = $("#newTodo").value.trim();
      if (!text) return;
      const todos = getTodos();
      todos.push({ id: uid(), text, done: false });
      store.set("todos", todos);
      $("#newTodo").value = "";
      renderAdmin();
    });
    $("#todoList").addEventListener("click", (e) => {
      const act = e.target.dataset.act;
      if (!act) return;
      const id = e.target.closest("li").dataset.id;
      let todos = getTodos();
      if (act === "del") todos = todos.filter((t) => t.id !== id);
      if (act === "toggle") {
        const t = todos.find((t) => t.id === id);
        if (t) t.done = !t.done;
      }
      store.set("todos", todos);
      renderAdmin();
    });

    /* Contacts */
    $("#contactAddForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#newContactName").value.trim();
      if (!name) return;
      const contacts = store.get("contacts", []);
      contacts.push({
        id: uid(),
        name,
        role: $("#newContactRole").value.trim(),
        phone: $("#newContactPhone").value.trim(),
        email: $("#newContactEmail").value.trim(),
      });
      store.set("contacts", contacts);
      $("#contactAddForm").reset();
      renderAdmin();
    });
    $("#contactList").addEventListener("click", (e) => {
      if (e.target.dataset.act !== "del") return;
      const id = e.target.closest("li").dataset.id;
      store.set("contacts", store.get("contacts", []).filter((c) => c.id !== id));
      renderAdmin();
    });

    /* Invitations */
    const previewImg = $("#invitePreview");
    previewImg.addEventListener("error", () => {
      previewImg.closest(".invite__preview").innerHTML =
        `<p class="admin__empty">Couldn't load <code>${escapeHtml(INVITE_IMG)}</code> — drop your invite image there, or point <code>inviteImage</code> in <code>js/config.js</code> at it.</p>`;
    });
    previewImg.src = INVITE_IMG;

    const linkInput = $("#inviteLink");
    const msgInput = $("#inviteMessage");
    linkInput.value = inviteLink();
    msgInput.value = inviteTemplate();
    if (!linkInput.value) $("#inviteSaved").textContent = "Add your site's address so guests have something to tap.";

    let inviteTimer;
    function saveInviteSettings() {
      $("#inviteSaved").textContent = "saving…";
      clearTimeout(inviteTimer);
      inviteTimer = setTimeout(() => {
        store.set("inviteLink", linkInput.value.trim());
        store.set("inviteMessage", msgInput.value);
        $("#inviteSaved").textContent = "saved ✓";
      }, 500);
    }
    linkInput.addEventListener("input", saveInviteSettings);
    msgInput.addEventListener("input", saveInviteSettings);

    $("#inviteShare").addEventListener("click", () => shareInvite(""));
    $$("[data-send]", panel).forEach((btn) =>
      btn.addEventListener("click", () => openSend(btn.dataset.send, "", ""))
    );
    $("#inviteCopy").addEventListener("click", () => {
      copyText(inviteText(""));
      $("#inviteShareNote").textContent = "Message copied — paste it wherever you like.";
    });
    $("#inviteDownload").addEventListener("click", async () => {
      const file = await inviteFile();
      if (!file) {
        $("#inviteShareNote").textContent = "Couldn't read the invite image — open the site through a web address rather than straight off the disk.";
        return;
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file);
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    $("#inviteSearch").addEventListener("input", () => renderInvites());

    $("#inviteList").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const li = btn.closest("li");
      const guest = store.get("guestList", []).find((g) => g.id === li.dataset.id);
      if (!guest) return;
      const act = btn.dataset.act;

      if (act === "sent") {
        markSent(guest.id, !li.classList.contains("is-sent"));
        renderInvites();
        return;
      }
      if (act === "copy") {
        copyText(inviteText(guest.name));
        $("#inviteQueueHint").textContent = `copied ${guest.name}'s message ✓`;
        return;
      }
      if (act === "share") { shareInvite(guest.name, guest.id); return; }

      openSend(act, guest.name, guest.phone);
      markSent(guest.id);
      renderInvites();
    });

    $("#inviteCopyNumbers").addEventListener("click", () => {
      const nums = store.get("guestList", []).filter((g) => g.phone).map((g) => "+" + waNumber(g.phone));
      copyText(nums.join("\n"));
      $("#inviteQueueHint").textContent = `${nums.length} number${nums.length === 1 ? "" : "s"} copied ✓`;
    });
    $("#inviteMarkNone").addEventListener("click", () => {
      if (!confirm("Clear every “invite sent” mark?")) return;
      store.set("invitesSent", {});
      renderInvites();
    });

    /* Notes — autosave while typing */
    const notesEl = $("#coupleNotes");
    let notesTimer;
    notesEl.addEventListener("input", () => {
      $("#notesStatus").textContent = "saving…";
      clearTimeout(notesTimer);
      notesTimer = setTimeout(() => {
        store.set("coupleNotes", notesEl.value);
        $("#notesStatus").textContent = "saved ✓";
      }, 600);
    });

    /* Dreamboard uploads — images are shrunk before storing so the
       browser's localStorage quota lasts. */
    $("#dreamUpload").addEventListener("change", async (e) => {
      for (const file of [...e.target.files]) {
        if (!file.type.startsWith("image/")) continue;
        try {
          const src = await shrinkImage(file, 900, 0.82);
          const board = store.get("dreamboard", []);
          board.push({ id: uid(), src });
          localStorage.setItem("dreamboard", JSON.stringify(board));
        } catch (_) {
          alert("Storage is full — remove a few dreamboard images and try again.");
          break;
        }
      }
      e.target.value = "";
      renderAdmin();
    });
    $("#dreamGrid").addEventListener("click", (e) => {
      if (e.target.dataset.act !== "del") return;
      const id = e.target.closest(".admin__dream-item").dataset.id;
      store.set("dreamboard", store.get("dreamboard", []).filter((d) => d.id !== id));
      renderAdmin();
    });

    $("#adminExport").addEventListener("click", () => {
      const guests = store.get("guestList", []);
      const rsvps = store.get("rsvps", []);
      const sent = store.get("invitesSent", {});
      const rows = [["Type", "Name", "Party/Guests", "Status/Attending", "Cell number", "Role/Dietary", "Email/Message", "Song request", "Date", "Invite sent"]];
      guests.forEach((g) => rows.push(["Guest", g.name, g.party || 1, g.status, g.phone || "", "", "", "", "", sent[g.id] ? "yes" : ""]));
      rsvps.forEach((r) => rows.push(["RSVP", r.name, r.guests || 1, r.attending, r.phone || "", r.dietary || "", r.message || r.email || "", r.song || "", r.submittedAt || "", ""]));
      store.get("contacts", []).forEach((c) => rows.push(["Contact", c.name, "", "", c.phone || "", c.role || "", c.email || "", "", "", ""]));
      store.get("todos", []).forEach((t) => rows.push(["To-do", t.text, "", t.done ? "done" : "open", "", "", "", "", "", ""]));
      const csv = rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
      a.download = "wedding-guest-data.csv";
      a.click();
      URL.revokeObjectURL(a.href);
    });

    $("#adminClear").addEventListener("click", () => {
      if (confirm("Clear all locally stored RSVP responses? This cannot be undone.")) {
        store.set("rsvps", []);
        renderAdmin();
      }
    });
  }
})();
