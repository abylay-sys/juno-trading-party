/**
 * Juno Markets — приём лид-заявок с лендинга «Открой счёт» (open.html) в Google Sheets.
 *
 * Установка (привязанный скрипт):
 *   1. Создай отдельную Google-таблицу «Juno Leads».
 *   2. Расширения → Apps Script → вставь этот код, сохрани.
 *   3. Deploy → New deployment → тип «Web app»:
 *        Execute as: Me,  Who has access: Anyone
 *   4. Скопируй Web app URL (…/exec) → вставь в site/open.html:
 *        window.LEAD_CONFIG = { sheetEndpoint: "…/exec" };
 *
 * Лист «Лиды» создаётся автоматически при первой заявке.
 * Пишет UTM-метки, поэтому источник (реклама/письмо) виден по каждому лиду.
 */

var SHEET_NAME = 'Лиды';
var HEADERS = ['Дата', 'Имя', 'Телефон', 'Email', 'Язык',
               'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
               'Страница', 'Хост', 'User-Agent'];

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.website) return ok_();               // honeypot — тихо игнорируем ботов
    var sh = sheet_();
    sh.appendRow([
      now_(), t_(p.name), t_(p.phone), t_(p.email), t_(p.lang),
      t_(p.utm_source), t_(p.utm_medium), t_(p.utm_campaign), t_(p.utm_content), t_(p.utm_term),
      t_(p.page), t_(p.source), t_(String(p.ua || '').slice(0, 200))
    ]);
    return ok_();
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'Juno Markets lead endpoint' });
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function now_() {
  return Utilities.formatDate(new Date(), 'Asia/Almaty', 'yyyy-MM-dd HH:mm:ss');
}
// Пишем как текст: ведущие = + - @ Sheets принимает за формулу (+7… → #ERROR!),
// плюс это защита от formula-инъекции в полях.
function t_(v) {
  v = (v == null) ? '' : String(v);
  return /^[=+\-@]/.test(v) ? ("'" + v) : v;
}
function ok_() { return json_({ ok: true }); }
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
