(function () {
  'use strict';
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return document.querySelector(s); };
  var safe = function (fn) { try { return fn(); } catch (e) { return null; } };

  /* ---------------- Sound ---------------- */
  var isSoundEnabled = false;
  var ctx = null;

  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // A short, soft "tick" synthesised on the fly. No audio files needed.
  function playClick() {
    if (!isSoundEnabled) return;
    var c = audio();
    if (!c) return;
    var t = c.currentTime;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1500, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.05);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Softer, higher and shorter than the click: a faint tap when pointing at something interactive.
  var lastHover = 0;
  function playHover() {
    if (!isSoundEnabled) return;
    var now = performance.now();
    if (now - lastHover < 70) return;
    lastHover = now;
    var c = audio();
    if (!c) return;
    var t = c.currentTime;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2300, t);
    osc.frequency.exponentialRampToValueAtTime(1900, t + 0.03);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.035, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }
  if (window.matchMedia('(hover: hover)').matches) {
    var lastEl = null;
    document.addEventListener('pointerover', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var el = e.target.closest && e.target.closest('a, button, summary, .tile, .post');
      if (!el) { lastEl = null; return; }
      if (el === lastEl) return;
      lastEl = el;
      playHover();
    });
  }

  var toast = $('#soundToast');
  var enableBtn = $('#enableSound');
  var closeBtn = $('#closeToast');
  var soundToggle = $('#soundToggle');

  function renderSound() {
    if (toast) toast.classList.toggle('enabled', isSoundEnabled);
    if (soundToggle) {
      soundToggle.setAttribute('aria-pressed', String(isSoundEnabled));
      soundToggle.setAttribute('aria-label', isSoundEnabled ? 'Turn sound off' : 'Turn sound on');
    }
  }
  function hideToast() {
    if (!toast) return;
    toast.classList.remove('show');
    safe(function () { sessionStorage.setItem('toast-dismissed', '1'); });
  }

  if (toast && !safe(function () { return sessionStorage.getItem('toast-dismissed'); })) {
    setTimeout(function () { toast.classList.add('show'); }, 900);
  }
  if (enableBtn) enableBtn.addEventListener('click', function () {
    isSoundEnabled = true;
    renderSound();
    playClick();
    setTimeout(hideToast, 2200);
  });
  if (closeBtn) closeBtn.addEventListener('click', hideToast);
  if (soundToggle) soundToggle.addEventListener('click', function () {
    isSoundEnabled = !isSoundEnabled;
    renderSound();
    playClick();
  });

  // Click sound on every button-like control.
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('button, summary, .btn, [data-click]');
    if (!el || el === enableBtn || el === soundToggle) return;
    playClick();
  });

  /* ---------------- Theme (circle reveal) ---------------- */
  var themeBtn = $('#themeToggle');
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  function currentTheme() {
    return root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');
  }
  function applyTheme(next) {
    root.setAttribute('data-theme', next);
    safe(function () { localStorage.setItem('theme', next); });
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'dark' ? '#121212' : '#f4f2ec');
  }
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    var r = themeBtn.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (!document.startViewTransition || reduced) { applyTheme(next); return; }
    var vt = document.startViewTransition(function () { applyTheme(next); });
    vt.ready.then(function () {
      var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 700, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(function () {});
  });

  /* ---------------- Pixel text (5x7 font) ---------------- */
  var FONT = {
    A: ['01110','10001','10001','11111','10001','10001','10001'],
    B: ['11110','10001','10001','11110','10001','10001','11110'],
    C: ['01111','10000','10000','10000','10000','10000','01111'],
    D: ['11110','10001','10001','10001','10001','10001','11110'],
    E: ['11111','10000','10000','11110','10000','10000','11111'],
    F: ['11111','10000','10000','11110','10000','10000','10000'],
    G: ['01111','10000','10000','10111','10001','10001','01111'],
    H: ['10001','10001','10001','11111','10001','10001','10001'],
    I: ['11111','00100','00100','00100','00100','00100','11111'],
    J: ['00111','00010','00010','00010','10010','10010','01100'],
    K: ['10001','10010','10100','11000','10100','10010','10001'],
    L: ['10000','10000','10000','10000','10000','10000','11111'],
    M: ['10001','11011','10101','10101','10001','10001','10001'],
    N: ['10001','11001','10101','10011','10001','10001','10001'],
    O: ['01110','10001','10001','10001','10001','10001','01110'],
    P: ['11110','10001','10001','11110','10000','10000','10000'],
    Q: ['01110','10001','10001','10001','10101','10010','01101'],
    R: ['11110','10001','10001','11110','10100','10010','10001'],
    S: ['01111','10000','10000','01110','00001','00001','11110'],
    T: ['11111','00100','00100','00100','00100','00100','00100'],
    U: ['10001','10001','10001','10001','10001','10001','01110'],
    V: ['10001','10001','10001','10001','10001','01010','00100'],
    W: ['10001','10001','10001','10101','10101','11011','10001'],
    X: ['10001','10001','01010','00100','01010','10001','10001'],
    Y: ['10001','10001','01010','00100','00100','00100','00100'],
    Z: ['11111','00001','00010','00100','01000','10000','11111']
  };

  function renderPixelText(el) {
    var text = (el.getAttribute('aria-label') || el.textContent).trim().toUpperCase();
    var words = text.split(/\s+/);
    // Unsupported characters: fall back to the normal text.
    for (var i = 0; i < text.length; i++) {
      if (text[i] !== ' ' && !FONT[text[i]]) return;
    }
    el.textContent = '';
    el.classList.add('is-pixel');
    var n = 0;
    words.forEach(function (word) {
      var w = document.createElement('span');
      w.className = 'pixel-word';
      w.setAttribute('aria-hidden', 'true');
      word.split('').forEach(function (ch) {
        var l = document.createElement('span');
        l.className = 'pixel-letter';
        FONT[ch].forEach(function (row, y) {
          for (var x = 0; x < 5; x++) {
            if (row[x] !== '1') continue;
            var p = document.createElement('span');
            p.className = 'px';
            p.style.gridArea = (y + 1) + ' / ' + (x + 1);
            // Pixels assemble left-to-right with a little jitter.
            p.style.setProperty('--d', (n * 0.018 + Math.random() * 0.35).toFixed(3) + 's');
            l.appendChild(p);
          }
        });
        n++;
        w.appendChild(l);
      });
      el.appendChild(w);
    });
  }
  var nameEl = $('#name');
  if (nameEl) renderPixelText(nameEl);

  /* ---------------- Greeting + clock ---------------- */
  function pad(v) { return String(v).padStart(2, '0'); }
  function greetingFor(h) {
    if (h < 5) return ['Good night', '🌙'];
    if (h < 12) return ['Good morning', '☀️'];
    if (h < 17) return ['Good afternoon', '🌤️'];
    if (h < 21) return ['Good evening', '🌇'];
    return ['Good night', '🌙'];
  }
  var clock = $('#clock'), greeting = $('#greeting'), emoji = $('#emoji');
  var greetSpan = document.querySelector('.greet');
  var istFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  function tick() {
    var o = {};
    istFmt.formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
    if (clock) clock.textContent = o.day + '/' + o.month + '/' + o.year + ' ' + o.hour + ':' + o.minute + ':' + o.second;
    var g = greetingFor(parseInt(o.hour, 10));
    if (greeting) greeting.textContent = g[0];
    if (emoji) emoji.textContent = g[1];
    if (greetSpan) greetSpan.textContent = g[0];
  }
  if (clock) { tick(); setInterval(tick, 1000); }
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------------- Typewriter ---------------- */
  var tw = $('#typewriter');
  var lines = window.__lines || [];
  if (tw && lines.length > 1 && !reduced) {
    var li = 0, ci = lines[0].length, deleting = true;
    var step = function () {
      var line = lines[li];
      if (!deleting) {
        ci++;
        tw.textContent = line.slice(0, ci);
        if (ci === line.length) { deleting = true; return setTimeout(step, 1900); }
        return setTimeout(step, 55 + Math.random() * 40);
      }
      ci--;
      tw.textContent = line.slice(0, ci);
      if (ci === 0) { deleting = false; li = (li + 1) % lines.length; return setTimeout(step, 350); }
      setTimeout(step, 28);
    };
    setTimeout(step, 2200);
  }

  /* ---------------- Quote ---------------- */
  var q = $('#quote');
  if (q) safe(function () {
    var list = JSON.parse(q.getAttribute('data-quotes') || '[]');
    if (list.length > 1) {
      var pick = list[Math.floor(Math.random() * list.length)];
      q.querySelector('blockquote').textContent = pick.text;
      q.querySelector('figcaption').textContent = pick.author;
    }
  });

  /* ---------------- Back to top ---------------- */
  var top = $('#toTop');
  if (top) top.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });

  /* ---------------- Scroll reveal ---------------- */
  var blocks = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(blocks, function (el) { el.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  Array.prototype.forEach.call(blocks, function (el) { io.observe(el); });
})();
