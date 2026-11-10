/* EXPERIMENT: music player. Plays a lo-fi loop generated live with the Web Audio API
   (no audio files, no copyright issues). A track with a `src` plays that file instead. */
(function () {
  'use strict';
  var root = document.getElementById('np');
  if (!root) return;

  var tracks = JSON.parse(root.getAttribute('data-tracks') || '[]');
  if (!tracks.length) return;

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    cover: $('npCover'), title: $('npTitle'), artist: $('npArtist'), cur: $('npCur'), dur: $('npDur'),
    seek: $('npSeek'), fill: $('npFill'), play: $('npPlay'), prev: $('npPrev'), next: $('npNext'), vol: $('npVol')
  };

  var ctx = null, out = null, session = null, audioEl = null;
  var index = 0, playing = false, elapsed = 0, lastTick = 0, volume = 0.55;

  /* ---------------- helpers ---------------- */
  function fmt(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function noiseBuffer(c) {
    var len = c.sampleRate * 2, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function ensureCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      out = ctx.createGain();
      out.gain.value = volume;
      var tone = ctx.createBiquadFilter();           // gentle top-end roll-off for the lo-fi feel
      tone.type = 'lowpass';
      tone.frequency.value = 6500;
      out.connect(tone).connect(ctx.destination);
      ctx.noise = noiseBuffer(ctx);
    }
    return ctx;
  }

  /* ---------------- generative lo-fi session ---------------- */
  function startSession(track) {
    var c = ctx;
    var master = c.createGain();
    master.gain.value = 0.0001;
    master.gain.exponentialRampToValueAtTime(1, c.currentTime + 0.6);
    master.connect(out);

    var sixteenth = 60 / track.bpm / 4;
    var step = 0;
    var next = c.currentTime + 0.12;
    var chords = track.chords;

    function env(g, t, a, peak, d) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    }
    function osc(type, freq, t, dur, vol, attack) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = freq;
      env(g, t, attack, vol, dur);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + attack + dur + 0.05);
      return o;
    }
    function pad(chord, t, len) {
      var lp = c.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.4;
      lp.connect(master);
      chord.forEach(function (n) {
        [-7, 7].forEach(function (det) {
          var o = c.createOscillator(), g = c.createGain();
          o.type = 'triangle'; o.frequency.value = midi(n); o.detune.value = det;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.014, t + 0.7);
          g.gain.setValueAtTime(0.014, t + len - 0.5);
          g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.9);
          o.connect(g).connect(lp);
          o.start(t); o.stop(t + len + 1);
        });
      });
    }
    function bass(note, t, dur) { osc('sine', midi(note), t, dur, 0.17, 0.012); }
    function bell(note, t) {                       // soft electric-piano-ish pluck
      var f = midi(note);
      osc('sine', f, t, 1.4, 0.05, 0.004);
      osc('sine', f * 2, t, 0.7, 0.014, 0.004);
      osc('triangle', f * 4, t, 0.25, 0.006, 0.002);
    }
    function kick(t) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(130, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 0.32);
    }
    function noiseHit(t, type, freq, q, vol, dur) {
      var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = c.noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f).connect(g).connect(master);
      s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02);
    }

    // very quiet vinyl hiss under everything
    var hiss = c.createBufferSource(), hf = c.createBiquadFilter(), hg = c.createGain();
    hiss.buffer = c.noise; hiss.loop = true;
    hf.type = 'bandpass'; hf.frequency.value = 3200; hf.Q.value = 0.3;
    hg.gain.value = 0.006;
    hiss.connect(hf).connect(hg).connect(master);
    hiss.start();

    function scheduleStep(n, t) {
      var s = n % 16, chord = chords[Math.floor(n / 16) % chords.length];
      if (s % 2 === 1) t += sixteenth * 0.2;       // swing the off-beats
      if (s === 0) pad(chord, t, sixteenth * 16);
      if (s === 0 || s === 10) bass(chord[0] - 12, t, sixteenth * (s === 0 ? 7 : 5));
      if (s === 0 || s === 10) kick(t);
      if (s === 4 || s === 12) {
        noiseHit(t, 'bandpass', 1900, 0.7, 0.13, 0.17);
        osc('triangle', 185, t, 0.1, 0.05, 0.002);
      }
      if (s % 2 === 0) noiseHit(t, 'highpass', 8200, 0.7, s % 4 === 2 ? 0.035 : 0.02, 0.045);
      if (s % 2 === 0 && s !== 0 && Math.random() < 0.34) {
        bell(chord[1 + Math.floor(Math.random() * (chord.length - 1))] + (Math.random() < 0.5 ? 12 : 0), t);
      }
      if (Math.random() < 0.05) noiseHit(t + Math.random() * sixteenth, 'highpass', 2500, 0.5, 0.02, 0.012); // crackle
    }

    var timer = setInterval(function () {
      while (next < c.currentTime + 0.16) { scheduleStep(step, next); step++; next += sixteenth; }
    }, 40);

    return {
      stop: function () {
        clearInterval(timer);
        var t = c.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        setTimeout(function () { try { hiss.stop(); master.disconnect(); } catch (e) {} }, 500);
      }
    };
  }

  /* ---------------- engine control ---------------- */
  function startEngine() {
    var track = tracks[index];
    if (track.src) {
      audioEl = audioEl || new Audio();
      audioEl.src = track.src;
      audioEl.volume = volume;
      audioEl.currentTime = elapsed;
      audioEl.play().catch(function () {});
      return;
    }
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') ctx.resume();
    session = startSession(track);
  }
  function stopEngine() {
    if (session) { session.stop(); session = null; }
    if (audioEl) audioEl.pause();
  }

  /* ---------------- UI ---------------- */
  function renderTrack() {
    var t = tracks[index];
    els.title.textContent = t.title;
    els.artist.textContent = t.artist;
    els.cover.style.setProperty('--sky1', t.sky[0]);
    els.cover.style.setProperty('--sky2', t.sky[1]);
    els.dur.textContent = fmt(t.duration);
  }
  function renderPlay() {
    root.classList.toggle('is-playing', playing);
    els.play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }
  function renderProgress() {
    var t = tracks[index];
    var dur = (audioEl && tracks[index].src && isFinite(audioEl.duration)) ? audioEl.duration : t.duration;
    var pct = Math.min(100, (elapsed / dur) * 100);
    els.fill.style.width = pct + '%';
    els.cur.textContent = fmt(elapsed);
    els.seek.setAttribute('aria-valuenow', String(Math.round(pct)));
  }

  function play() {
    if (playing) return;
    playing = true;
    lastTick = performance.now();
    startEngine();
    renderPlay();
  }
  function pause() {
    if (!playing) return;
    playing = false;
    stopEngine();
    renderPlay();
  }
  function go(i, keepPlaying) {
    var was = playing || keepPlaying;
    stopEngine();
    playing = false;
    index = (i + tracks.length) % tracks.length;
    elapsed = 0;
    renderTrack();
    renderProgress();
    if (was) { playing = true; lastTick = performance.now(); startEngine(); }
    renderPlay();
  }

  els.play.addEventListener('click', function () { playing ? pause() : play(); });
  els.next.addEventListener('click', function () { go(index + 1); });
  els.prev.addEventListener('click', function () { elapsed > 3 ? go(index) : go(index - 1); });

  function seekTo(clientX) {
    var r = els.seek.getBoundingClientRect();
    var ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    var t = tracks[index];
    var dur = (audioEl && t.src && isFinite(audioEl.duration)) ? audioEl.duration : t.duration;
    elapsed = ratio * dur;
    if (audioEl && t.src) audioEl.currentTime = elapsed;
    renderProgress();
  }
  els.seek.addEventListener('click', function (e) { seekTo(e.clientX); });
  els.seek.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { elapsed += 5; renderProgress(); }
    if (e.key === 'ArrowLeft') { elapsed = Math.max(0, elapsed - 5); renderProgress(); }
  });

  els.vol.addEventListener('input', function () {
    volume = els.vol.value / 100;
    var vv = document.getElementById('npVolVal'); if (vv) vv.textContent = els.vol.value;
    if (out) out.gain.value = volume;
    if (audioEl) audioEl.volume = volume;
  });

  // Progress clock
  setInterval(function () {
    if (!playing) return;
    var now = performance.now();
    var t = tracks[index];
    if (audioEl && t.src) elapsed = audioEl.currentTime;
    else elapsed += (now - lastTick) / 1000;
    lastTick = now;
    renderProgress();
    var dur = (audioEl && t.src && isFinite(audioEl.duration)) ? audioEl.duration : t.duration;
    if (elapsed >= dur) go(index + 1, true);
  }, 250);

  document.addEventListener('visibilitychange', function () { lastTick = performance.now(); });

  renderTrack();
  renderProgress();
  renderPlay();
})();
