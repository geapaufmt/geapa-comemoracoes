/**************************************
 * 11_aniv_readers.gs
 * LEITURA + FILTRO DE DADOS
 *
 * Regras principais:
 * - Abre Sheets via Registry KEY (sem IDs fixos).
 * - Usa cabeçalhos (nomes) para achar colunas.
 * - Normaliza aniversário "dia/mês" para o ano do período consultado.
 * - Janela é [startInclusive, endExclusive).
 **************************************/

/**
 * ------------------------------------------------------------
 * Lê aniversariantes (MEMBROS) dentro de uma janela.
 * ------------------------------------------------------------
 */
function aniv_getMemberBirthdaysForWindow_(startInclusive, endExclusive) {
  const sh = aniv_getSheetByKey_(ANIV_CFG.MEMBERS.KEY);
  const data = aniv_readSheet_(sh);

  const iName  = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_NAME);
  const iBirth = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_BIRTHDATE);
  const iEmail = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_EMAIL);
  const iRole  = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_ROLE, true);
  const iInsta = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_INSTA, true);

  if (iName < 0 || iBirth < 0 || iEmail < 0) return [];

  const startYear = new Date(startInclusive).getFullYear();

  const out = [];
  for (const row of data.rows) {
    const name = String(row[iName] || '').trim();
    const birthRaw = row[iBirth];
    const email = String(row[iEmail] || '').trim();
    if (!name || !birthRaw) continue;

    const birth = aniv_parseDateAny_(birthRaw);
    if (!birth) continue;

    const normalized = aniv_normalizeToYear_(birth, startYear);
    if (aniv_inWindowMonthDay_(normalized, startInclusive, endExclusive)) {
      out.push({
        name,
        email,
        role: iRole >= 0 ? String(row[iRole] || '').trim() : '',
        insta: iInsta >= 0 ? String(row[iInsta] || '').trim() : '',
        birth
      });
    }
  }

  out.sort((a, b) => aniv_monthDayKey_(a.birth).localeCompare(aniv_monthDayKey_(b.birth)));
  return out;
}

/**
 * ------------------------------------------------------------
 * Lê aniversariantes (PROFS) dentro de uma janela.
 * ------------------------------------------------------------
 */
function aniv_getProfBirthdaysForWindow_(startInclusive, endExclusive) {
  const sh = aniv_getSheetByKey_(ANIV_CFG.PROFS.KEY);
  const data = aniv_readSheet_(sh);

  const iName  = aniv_findHeaderIndex_(data.headers, ANIV_CFG.PROFS.COL_NAME);
  const iEmail = aniv_findHeaderIndex_(data.headers, ANIV_CFG.PROFS.COL_EMAIL);
  const iBirth = aniv_findHeaderIndex_(data.headers, ANIV_CFG.PROFS.COL_BIRTHDATE);

  if (iName < 0 || iEmail < 0 || iBirth < 0) return [];

  const startYear = new Date(startInclusive).getFullYear();

  const out = [];
  for (const row of data.rows) {
    const name = String(row[iName] || '').trim();
    const email = String(row[iEmail] || '').trim();
    const birthRaw = row[iBirth];
    if (!name || !email || !birthRaw) continue;

    const birth = aniv_parseDateAny_(birthRaw);
    if (!birth) continue;

    const normalized = aniv_normalizeToYear_(birth, startYear);
    if (aniv_inWindowMonthDay_(normalized, startInclusive, endExclusive)) {
      out.push({ name, email, birth });
    }
  }

  out.sort((a, b) => aniv_monthDayKey_(a.birth).localeCompare(aniv_monthDayKey_(b.birth)));
  return out;
}

/**
 * ------------------------------------------------------------
 * Lê DATAS COMEMORATIVAS dentro de uma janela.
 * ------------------------------------------------------------
 */
function aniv_getCommemorativesForWindow_(startInclusive, endExclusive) {
  const sh = aniv_getSheetByKey_(ANIV_CFG.DATES.KEY);
  const data = aniv_readSheet_(sh);

  const iTitle = aniv_findHeaderIndex_(data.headers, ANIV_CFG.DATES.COL_TITLE);
  const iDate = aniv_findHeaderIndex_(data.headers, ANIV_CFG.DATES.COL_DATE);
  const iDesc = aniv_findHeaderIndex_(data.headers, ANIV_CFG.DATES.COL_DESC, true);
  const iAudience = aniv_findHeaderIndex_(data.headers, ANIV_CFG.DATES.COL_AUDIENCE, true);

  if (iTitle < 0 || iDate < 0) return [];

  const startYear = new Date(startInclusive).getFullYear();

  const out = [];
  for (const row of data.rows) {
    const title = String(row[iTitle] || '').trim();
    const dateRaw = row[iDate];
    if (!title || !dateRaw) continue;

    const d = aniv_parseDateAny_(dateRaw);
    if (!d) continue;

    const normalized = aniv_normalizeToYear_(d, startYear);
    if (aniv_inWindowMonthDay_(normalized, startInclusive, endExclusive)) {
      out.push({
        title,
        date: d,
        dateStr: aniv_formatBirth_(normalized),
        desc: iDesc >= 0 ? String(row[iDesc] || '').trim() : '',
        audience: iAudience >= 0 ? String(row[iAudience] || '').trim() : ''
      });
    }
  }

  out.sort((a, b) => aniv_monthDayKey_(a.date).localeCompare(aniv_monthDayKey_(b.date)));
  return out;
}

/** Lê a planilha inteira (cabeçalho + linhas). */
function aniv_readSheet_(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h || '').trim());
  const rows = values.slice(1);
  return { headers, rows };
}

/**
 * Procura um cabeçalho pelo nome, normalizando (minúsculo e sem acentos).
 * optional=true retorna -1 se não achar.
 */
function aniv_findHeaderIndex_(headers, name, optional) {
  const target = aniv_normHeader_(name);
  for (let i = 0; i < headers.length; i++) {
    if (aniv_normHeader_(headers[i]) === target) return i;
  }
  return -1;
}

/** Normaliza cabeçalho (remove acentos) para comparação robusta. */
function aniv_normHeader_(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}