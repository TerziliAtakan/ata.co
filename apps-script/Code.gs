/**
 * ata.co — form kayıtları
 * Sitedeki tüm formlar (satın al, sat, kirala, partner, ilan sorusu, el kitapçığı, bülten)
 * bu Google E-Tablosuna satır olarak düşer ve size e-posta bildirimi gelir.
 *
 * Kurulum: E-Tablo → Uzantılar → Apps Script → bu kodu yapıştırın → Dağıt → Yeni dağıtım →
 * Tür: Web uygulaması · Yürüten: Ben · Erişim: Herkes → URL'yi kopyalayıp panelde
 * Site ayarları → "Form adresi" alanına yapıştırın.
 */
const NOTIFY_EMAIL = 'terziliatakan@icloud.com';
const SHEET_NAME = 'Talepler';
const TYPES = {
  buy: 'Satın alma', sell: 'Satış', rent: 'Kiralama', partner: 'Partner',
  listing: 'İlan sorusu', handbook: 'El kitapçığı', newsletter: 'Bülten'
};
const COLUMNS = ['Tarih', 'Tür', 'Ad', 'İletişim', 'E-posta', 'Telefon', 'İlan', 'Detay', 'Dil', 'Sayfa', 'Durum'];

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return ok_(); // spam tuzağı

  const sheet = sheet_();
  const known = ['type', 'name', 'contact', 'email', 'phone', 'listing', 'lang', 'page', 'website'];
  const detail = Object.keys(p).filter(k => known.indexOf(k) < 0 && p[k])
    .map(k => k + ': ' + p[k]).join('\n');
  const type = TYPES[p.type] || p.type || '?';

  sheet.appendRow([new Date(), type, p.name, p.contact, p.email, p.phone, p.listing, detail, p.lang, p.page, 'Yeni']
    .map(safe_));

  if (p.type !== 'newsletter') {
    const lines = [
      'Tür: ' + type,
      p.name ? 'Ad: ' + p.name : '',
      p.contact ? 'İletişim: ' + p.contact : '',
      p.email ? 'E-posta: ' + p.email : '',
      p.phone ? 'Telefon: ' + p.phone : '',
      p.listing ? 'İlan: ' + p.listing : '',
      detail,
      'Dil: ' + (p.lang || ''),
    ].filter(Boolean);
    MailApp.sendEmail(NOTIFY_EMAIL, 'ata.co — yeni talep: ' + type + (p.name ? ' · ' + p.name : ''), lines.join('\n'));
  }
  return ok_();
}

function doGet() { return ok_(); }

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) { sh.appendRow(COLUMNS); sh.setFrozenRows(1); sh.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold'); }
  return sh;
}

// Formül enjeksiyonunu önle (= + - @ ile başlayan metinler)
function safe_(v) {
  if (v === undefined || v === null) return '';
  if (v instanceof Date) return v;
  v = String(v).slice(0, 2000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function ok_() { return ContentService.createTextOutput('ok'); }
