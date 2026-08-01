/* Лендинг Trading Party: язык, обратный отсчёт, появление блоков, форма регистрации. */

(function () {
  "use strict";

  var CONFIG = window.TP_CONFIG || {};
  var DEFAULT_LANG = "ru";
  var STORE_KEY = "tp-lang";

  /* ─── Язык ─────────────────────────────────────────── */

  function saved() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function remember(l) {
    try { localStorage.setItem(STORE_KEY, l); } catch (e) {}
  }

  function apply(lang) {
    var dict = window.COPY[lang];
    if (!dict) return;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n")];
      if (v != null) el.innerHTML = v;
    });

    document.documentElement.lang = lang === "kz" ? "kk" : "ru";
    if (dict["meta.title"]) document.title = dict["meta.title"];
    var md = document.querySelector('meta[name="description"]');
    if (md && dict["meta.desc"]) md.setAttribute("content", dict["meta.desc"]);

    document.querySelectorAll(".lang button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });

    remember(lang);
    renderCount();
  }

  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () { apply(b.dataset.lang); });
  });

  /* ─── Обратный отсчёт до закрытия регистрации ──────── */

  var LABELS = {
    ru: ["дней", "часов", "минут", "секунд"],
    kz: ["күн", "сағат", "минут", "секунд"]
  };

  function currentLang() {
    var on = document.querySelector('.lang button[aria-pressed="true"]');
    return on ? on.dataset.lang : DEFAULT_LANG;
  }

  function renderCount() {
    var box = document.getElementById("countdown");
    var block = document.getElementById("countdown-block");
    if (!box || !block) return;

    // Дата закрытия регистрации задаётся в TP_CONFIG.registrationEnds (ISO).
    // Пока не проставлена — блок целиком скрыт, чтобы не оставлять пустоту.
    var end = CONFIG.registrationEnds ? new Date(CONFIG.registrationEnds) : null;
    if (!end || isNaN(end.getTime())) { block.hidden = true; return; }

    var left = end.getTime() - Date.now();
    if (left <= 0) { block.hidden = true; return; }
    block.hidden = false;

    var s = Math.floor(left / 1000);
    var parts = [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
    var labels = LABELS[currentLang()] || LABELS.ru;

    box.innerHTML = parts.map(function (n, i) {
      return '<div class="unit"><div class="u-n">' + n +
             '</div><div class="u-l">' + labels[i] + "</div></div>";
    }).join("");
  }

  setInterval(renderCount, 1000);

  /* ─── Форма регистрации ────────────────────────────── */
  /* Когда платформа выдаст ссылку — впиши её в TP_CONFIG.registrationUrl,
     заглушка сама заменится на iframe. */

  (function mountForm() {
    var box = document.getElementById("reg-box");
    if (!box || !CONFIG.registrationUrl) return;
    var f = document.createElement("iframe");
    f.src = CONFIG.registrationUrl;
    f.title = "Trading Party";
    f.loading = "lazy";
    box.innerHTML = "";
    box.appendChild(f);
  })();

  /* ─── Появление блоков при скролле ─────────────────── */

  var rise = document.querySelectorAll(".rise");
  if (!("IntersectionObserver" in window)) {
    rise.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rise.forEach(function (el) { io.observe(el); });
  }

  /* ─── Старт ────────────────────────────────────────── */

  apply(saved() || DEFAULT_LANG);
})();
