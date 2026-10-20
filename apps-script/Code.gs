/**
 * ata.co — form kayıtları
 * Sitedeki tüm formlar (Satın al, Sat, Kirala, Partner olun, İlan sorusu,
 * Ücretsiz kitapçık, Haberdar olun) bu E-Tablodaki "Kayıtlar" sekmesine satır olarak düşer.
 * Haberdar olun dışındaki her kayıt için size e-posta bildirimi gelir.
 *
 * Sütunlar: Tarih · İsim · E-posta · Telefon · Durum · Detaylar · Bölüm · Dil
 *
 * Kurulum / güncelleme:
 *   E-Tablo → Uzantılar → Apps Script → bu kodun tamamını yapıştırın → Kaydet →
 *   Dağıt → Dağıtımları yönet → kalem simgesi → Sürüm: Yeni sürüm → Dağıt
 *   (Böyle yaparsanız sitedeki form adresi değişmez.)
 */
const NOTIFY_EMAIL = 'terziliatakan@icloud.com';
const SHEET_NAME = 'Kayıtlar';
const COLUMNS = ['Tarih', 'İsim', 'E-posta', 'Telefon', 'Durum', 'Detaylar', 'Bölüm', 'Dil'];

// Formun geldiği bölüm (sitedeki adıyla)
const SECTION = {
  buy: 'Satın al', sell: 'Sat', rent: 'Kirala', partner: 'Partner olun',
  listing: 'İlan sorusu', handbook: 'Ücretsiz kitapçık', newsletter: 'Haberdar olun'
};
// Bölüme göre ilk durum. Takip ettikçe bu sütunu kendiniz güncelleyebilirsiniz.
function status_(type, p) {
  if (type === 'newsletter') return 'Bülten abonesi';
  if (type === 'handbook') return p.delivered === 'evet' ? 'Kitapçık indirildi' : 'Kitapçık gönderilecek';
  return 'Yeni · aranacak';
}
// Detaylar sütununda görünen başlıklar
const LABELS = {
  partner_kind: 'Başvuru türü', company: 'Şirket', handbook: 'Kitapçık', listing: 'İlan',
  direction: 'Talep', budget: 'Bütçe', purpose: 'Amaç', when: 'Zaman', ptype: 'Mülk tipi',
  location: 'Konum', bedrooms: 'Oda', area: 'Bölge', move_in: 'Taşınma tarihi', message: 'Mesaj'
};
const SKIP = ['type', 'name', 'contact', 'email', 'phone', 'lang', 'page', 'website', 'delivered'];
const LANGS = { tr: 'Türkçe', en: 'İngilizce', ru: 'Rusça', de: 'Almanca', es: 'İspanyolca', ar: 'Arapça' };

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return ok_(); // spam tuzağı

  // Eski formlardan gelen tek "iletişim" alanını e-posta ya da telefona ayır
  let email = p.email || '', phone = p.phone || '';
  if (p.contact) { if (/@/.test(p.contact)) email = email || p.contact; else phone = phone || p.contact; }

  // Bilinen alanlar sabit sırayla, bilinmeyenler sonda
  const keys = Object.keys(LABELS).concat(Object.keys(p).filter(k => !(k in LABELS) && SKIP.indexOf(k) < 0));
  const detail = keys.filter(k => p[k]).map(k => (LABELS[k] || k) + ': ' + p[k]);

  const section = SECTION[p.type] || p.type || '?';
  sheet_().appendRow([
    new Date(), p.name, email, phone, status_(p.type, p), detail.join('\n'),
    section, LANGS[p.lang] || p.lang || ''
  ].map(safe_));

  if (p.type !== 'newsletter') {
    const body = [
      'Bölüm: ' + section,
      p.name ? 'İsim: ' + p.name : '',
      email ? 'E-posta: ' + email : '',
      phone ? 'Telefon: ' + phone : '',
      detail.length ? '\n' + detail.join('\n') : '',
      '\nDil: ' + (LANGS[p.lang] || p.lang || '')
    ].filter(Boolean).join('\n');
    MailApp.sendEmail(NOTIFY_EMAIL, 'ata.co — ' + section + (p.name ? ' · ' + p.name : (email ? ' · ' + email : '')), body);
  }
  return ok_();
}

function doGet() { return ok_(); }

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME, 0);
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLUMNS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    sh.setColumnWidth(6, 320);
    sh.getRange('F:F').setWrap(true);
  }
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
