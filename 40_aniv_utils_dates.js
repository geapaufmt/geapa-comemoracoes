/**************************************
 * 20_aniv_utils_dates.gs
 * Datas: parse, normalização, comparações por mês/dia
 **************************************/

function aniv_now_() {
  return new Date();
}

function aniv_startOfDay_(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function aniv_addDays_(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
}

function aniv_formatDate_(date) {
  return Utilities.formatDate(new Date(date), ANIV_CFG.TZ, 'dd/MM/yyyy');
}

/**
 * ------------------------------------------------------------
 * aniv_parseDateAny_
 * ------------------------------------------------------------
 * Aceita:
 * - Date do Sheets
 * - string "DD/MM", "DD/MM/AAAA", "DD-MM-AAAA", etc.
 *
 * Retorna:
 * - Date (com ano original se existir; se não, ano=2000 por padrão)
 */
function aniv_parseDateAny_(raw) {
  if (!raw) return null;

  // 1) Se já é Date
  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;

  const s = String(raw).trim();
  if (!s) return null;

  // 2) Tenta "DD/MM/AAAA" ou "DD/MM"
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?$/);
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    let yy = m[3] ? Number(m[3]) : 2000;
    if (yy < 100) yy = 2000 + yy; // 2 dígitos
    const d = new Date(yy, mm - 1, dd);
    if (d && !isNaN(d.getTime())) return d;
    return null;
  }

  // 3) fallback: tenta Date.parse (pode funcionar em alguns formatos)
  const t = Date.parse(s);
  if (!isNaN(t)) return new Date(t);

  return null;
}

/**
 * Ajusta a data (dia/mês) para um ano específico.
 * Isso permite comparar aniversário sem depender do ano real.
 */
function aniv_normalizeToYear_(date, year) {
  const d = new Date(date);
  return new Date(Number(year), d.getMonth(), d.getDate());
}

/**
 * Key "MM-DD" para ordenação por dia/mês.
 */
function aniv_monthDayKey_(date) {
  const d = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

/**
 * Formata "DD/MM" (para aniversário)
 */
function aniv_formatBirth_(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

/**
 * ------------------------------------------------------------
 * Janela por mês/dia: [startInclusive, endExclusive)
 * ------------------------------------------------------------
 * A comparação é feita usando o ANO de startInclusive,
 * pois nós normalizamos todas as datas para o mesmo ano.
 */
function aniv_inWindowMonthDay_(normalizedDate, startInclusive, endExclusive) {
  const t = new Date(normalizedDate).getTime();
  return t >= new Date(startInclusive).getTime() && t < new Date(endExclusive).getTime();
}