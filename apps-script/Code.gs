/**
 * Trading Party — приём заявок с лендинга в Google Sheets.
 *
 * Установка (привязанный скрипт):
 *   1. Создай Google-таблицу.
 *   2. Расширения → Apps Script → вставь этот код, сохрани.
 *   3. Deploy → New deployment → тип «Web app»:
 *        Execute as: Me,  Who has access: Anyone
 *   4. Скопируй Web app URL (…/exec) → вставь в site/index.html:
 *        TP_CONFIG.sheetEndpoint = "…"
 *
 * Лист «Заявки» создаётся автоматически при первой заявке.
 */

var SHEET_NAME = 'Заявки';
var HEADERS = ['Дата', 'Имя', 'Email', 'Телефон', 'Telegram', 'Язык', 'Источник', 'User-Agent'];

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.website) return ok_();               // honeypot — тихо игнорируем ботов
    var sh = sheet_();
    sh.appendRow([
      now_(), p.name || '', p.email || '', p.phone || '',
      p.telegram || '', p.lang || '', p.source || '', String(p.ua || '').slice(0, 200)
    ]);
    return ok_();
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'Trading Party registration endpoint' });
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
function ok_() { return json_({ ok: true }); }
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
