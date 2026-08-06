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

  /* ─── Тема (светлая / тёмная) ──────────────────────── */

  var THEME_KEY = "tp-theme";

  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "light" ? "#F4F4F6" : "#0B0B0C");
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
  }

  (function initTheme() {
    // data-theme уже выставлен ранним инлайн-скриптом в <head>; здесь только meta и кнопка,
    // сохранение (localStorage) — лишь по явному клику, чтобы ?theme= не перетирал выбор
    var cur = document.documentElement.getAttribute("data-theme") || "dark";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", cur === "light" ? "#F4F4F6" : "#0B0B0C");
    var btn = document.getElementById("theme-toggle");
    if (btn) btn.addEventListener("click", function () {
      applyTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
    });
  })();

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
  /* Заявки уходят в Google Sheets через Apps Script (TP_CONFIG.sheetEndpoint).
     Если задан TP_CONFIG.registrationUrl (внешняя форма, напр. FYNXT) —
     он приоритетнее и заменяет нашу форму на iframe. */

  (function mountForm() {
    var box = document.getElementById("reg-box");
    if (!box) return;

    // приоритет — внешняя форма, если её ссылку проставили
    if (CONFIG.registrationUrl) {
      var f = document.createElement("iframe");
      f.src = CONFIG.registrationUrl;
      f.title = "Trading Party";
      f.loading = "lazy";
      box.innerHTML = "";
      box.appendChild(f);
      return;
    }

    var form = document.getElementById("reg-form");
    if (!form) return;
    var msg = form.querySelector("#rf-msg");
    var btn = form.querySelector(".rf-submit");
    var get = function (n) { return form.elements[n]; };

    function show(text, cls) {
      msg.textContent = text || "";
      msg.className = "rf-msg" + (cls ? " " + cls : "");
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var dict = window.COPY[currentLang()] || {};

      // honeypot: заполнено только ботом — тихо «принимаем», ничего не шлём
      if (get("website") && get("website").value) {
        form.reset(); show(dict["reg.form.success"], "ok"); return;
      }
      if (!form.checkValidity()) { form.reportValidity(); show(dict["reg.form.invalid"], "err"); return; }
      if (!CONFIG.sheetEndpoint) { show(dict["reg.form.pending"], "err"); return; }

      var data = new URLSearchParams({
        name: get("name").value.trim(),
        email: get("email").value.trim(),
        phone: get("phone").value.trim(),
        telegram: get("telegram").value.trim(),
        lang: currentLang(),
        source: location.hostname,
        ua: navigator.userAgent
      });

      var orig = btn.textContent;
      btn.disabled = true; btn.textContent = dict["reg.form.sending"] || "…"; show("", "");

      // no-cors: простой запрос доходит и пишет строку; ответ непрозрачен —
      // считаем успехом по факту доставки, сетевую ошибку ловим в catch.
      fetch(CONFIG.sheetEndpoint, { method: "POST", mode: "no-cors", body: data })
        .then(function () { form.reset(); show(dict["reg.form.success"], "ok"); })
        .catch(function () { show(dict["reg.form.error"], "err"); })
        .then(function () { btn.disabled = false; btn.textContent = orig; });
    });
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
