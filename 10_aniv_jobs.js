/**************************************
 * 10_aniv_jobs.gs
 * JOBS/ENTRADAS (funções chamadas por triggers)
 *
 * Ideia:
 * - Cada job é pequeno e só orquestra:
 *   1) calcula datas
 *   2) lê linhas
 *   3) chama envio
 *   4) registra logs
 **************************************/

/**
 * ------------------------------------------------------------
 * checkBirthdaysToday()
 * ------------------------------------------------------------
 * Envia:
 * - E-mail individual para cada aniversariante (membro).
 * - Resumo para Comunicação (lista do dia).
 *
 * Observação importante:
 * - Usa lock para evitar duplicidade se dois triggers rodarem juntos.
 */
function checkBirthdaysToday() {
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'checkBirthdaysToday: INÍCIO');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    GEAPA_CORE.coreLogWarn(runId, 'Lock não obtido — evitando execução concorrente.');
    return;
  }

  try {
    const today = aniv_now_();

    // Range “do dia”: [today, tomorrow) (fim exclusivo)
    const start = aniv_startOfDay_(today);
    const endExclusive = aniv_addDays_(start, 1);

    const rows = aniv_getMemberBirthdaysForWindow_(start, endExclusive);
    GEAPA_CORE.coreLogInfo(runId, 'checkBirthdaysToday: aniversariantes (membros)', { count: rows.length });

    // 1) e-mail individual para cada membro aniversariante
    rows.forEach(m => {
      try {
        aniv_sendBirthdayMessageToMember_(m, start);
      } catch (e) {
        GEAPA_CORE.coreLogError(runId, 'Erro ao enviar para aniversariante', {
          nome: m.name, email: m.email, err: String(e), stack: e && e.stack
        });
      }
    });

    // 2) resumo para Comunicação
    aniv_notifyCommunicationMembers_(rows, start, null, false);

    GEAPA_CORE.coreLogInfo(runId, 'checkBirthdaysToday: FIM OK', { count: rows.length });
  } catch (e) {
    GEAPA_CORE.coreLogError(runId, 'checkBirthdaysToday: ERRO GERAL', { err: String(e), stack: e && e.stack });
    throw e;
  } finally {
    lock.releaseLock();
  }
}

/**
 * ------------------------------------------------------------
 * weeklyBirthdayDigest()
 * ------------------------------------------------------------
 * Envia para Comunicação um resumo dos próximos N dias.
 */
function weeklyBirthdayDigest() {
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'weeklyBirthdayDigest: INÍCIO');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    GEAPA_CORE.coreLogWarn(runId, 'Lock não obtido — evitando execução concorrente.');
    return;
  }

  try {
    const start = aniv_startOfDay_(aniv_now_());
    const endExclusive = aniv_addDays_(start, ANIV_CFG.DAYS_AHEAD_WEEKLY + 1); // inclui o último dia “cheio”

    const rows = aniv_getMemberBirthdaysForWindow_(start, endExclusive);
    aniv_notifyCommunicationMembers_(rows, start, aniv_addDays_(start, ANIV_CFG.DAYS_AHEAD_WEEKLY), true);

    GEAPA_CORE.coreLogInfo(runId, 'weeklyBirthdayDigest: FIM OK', { count: rows.length });
  } catch (e) {
    GEAPA_CORE.coreLogError(runId, 'weeklyBirthdayDigest: ERRO GERAL', { err: String(e), stack: e && e.stack });
    throw e;
  } finally {
    lock.releaseLock();
  }
}

/**
 * ------------------------------------------------------------
 * checkProfsBirthdaysToday()
 * ------------------------------------------------------------
 * Envia:
 * - e-mail individual para professor aniversariante
 * - resumo para Comunicação
 */
function checkProfsBirthdaysToday() {
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'checkProfsBirthdaysToday: INÍCIO');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    GEAPA_CORE.coreLogWarn(runId, 'Lock não obtido — evitando execução concorrente.');
    return;
  }

  try {
    const today = aniv_now_();
    const start = aniv_startOfDay_(today);
    const endExclusive = aniv_addDays_(start, 1);

    const rows = aniv_getProfBirthdaysForWindow_(start, endExclusive);
    GEAPA_CORE.coreLogInfo(runId, 'checkProfsBirthdaysToday: aniversariantes (profs)', { count: rows.length });

    rows.forEach(p => {
      try {
        aniv_sendProfBirthdayEmail_(p, start);
      } catch (e) {
        GEAPA_CORE.coreLogError(runId, 'Erro ao enviar prof', {
          nome: p.name, email: p.email, err: String(e), stack: e && e.stack
        });
      }
    });

    aniv_notifyCommunicationProfs_(rows, start, null, false);

    GEAPA_CORE.coreLogInfo(runId, 'checkProfsBirthdaysToday: FIM OK', { count: rows.length });
  } finally {
    lock.releaseLock();
  }
}

/**
 * ------------------------------------------------------------
 * weeklyProfsBirthdayDigest()
 * ------------------------------------------------------------
 */
function weeklyProfsBirthdayDigest() {
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'weeklyProfsBirthdayDigest: INÍCIO');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    GEAPA_CORE.coreLogWarn(runId, 'Lock não obtido — evitando execução concorrente.');
    return;
  }

  try {
    const start = aniv_startOfDay_(aniv_now_());
    const endExclusive = aniv_addDays_(start, ANIV_CFG.DAYS_AHEAD_WEEKLY + 1);

    const rows = aniv_getProfBirthdaysForWindow_(start, endExclusive);
    aniv_notifyCommunicationProfs_(rows, start, aniv_addDays_(start, ANIV_CFG.DAYS_AHEAD_WEEKLY), true);

    GEAPA_CORE.coreLogInfo(runId, 'weeklyProfsBirthdayDigest: FIM OK', { count: rows.length });
  } finally {
    lock.releaseLock();
  }
}

/**
 * ------------------------------------------------------------
 * checkCommemorativesToday()
 * ------------------------------------------------------------
 */
function checkCommemorativesToday() {
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'checkCommemorativesToday: INÍCIO');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    GEAPA_CORE.coreLogWarn(runId, 'Lock não obtido — evitando execução concorrente.');
    return;
  }

  try {
    const today = aniv_now_();
    const start = aniv_startOfDay_(today);
    const endExclusive = aniv_addDays_(start, 1);

    const rows = aniv_getCommemorativesForWindow_(start, endExclusive);
    GEAPA_CORE.coreLogInfo(runId, 'checkCommemorativesToday: datas', { count: rows.length });

    rows.forEach(c => {
      try {
        aniv_sendCommemorativeEmail_(c, start);
      } catch (e) {
        GEAPA_CORE.coreLogError(runId, 'Erro ao enviar comemorativa', {
          titulo: c.title, err: String(e), stack: e && e.stack
        });
      }
    });

    GEAPA_CORE.coreLogInfo(runId, 'checkCommemorativesToday: FIM OK', { count: rows.length });
  } finally {
    lock.releaseLock();
  }
}

/**
 * ------------------------------------------------------------
 * weeklyCommemorativesDigest()
 * ------------------------------------------------------------
 */
function weeklyCommemorativesDigest() {
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'weeklyCommemorativesDigest: INÍCIO');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    GEAPA_CORE.coreLogWarn(runId, 'Lock não obtido — evitando execução concorrente.');
    return;
  }

  try {
    const start = aniv_startOfDay_(aniv_now_());
    const endExclusive = aniv_addDays_(start, ANIV_CFG.DAYS_AHEAD_WEEKLY + 1);

    const rows = aniv_getCommemorativesForWindow_(start, endExclusive);

    const subject = ANIV_CFG.EMAIL.SUBJECT_COMMEM_WEEK;
    const subtitle = `De ${aniv_formatDate_(start)} até ${aniv_formatDate_(aniv_addDays_(start, ANIV_CFG.DAYS_AHEAD_WEEKLY))}`;

    const items = rows.length
      ? rows.map(r => ({
          line1: `📌 ${aniv_safe_(r.title)}`,
          line2: `${aniv_safe_(r.dateStr)}${r.desc ? ` — ${aniv_safe_(r.desc)}` : ''}${r.audience ? ` (${aniv_safe_(r.audience)})` : ''}`
        }))
      : [{ line1: 'Sem datas comemorativas no período.', line2: '' }];

    const html = aniv_buildHtmlEmail_({
      title: subject,
      subtitle,
      items,
      footer: ANIV_CFG.BRAND.QUOTE
    });

    aniv_sendToCommunication_(subject, html);

    GEAPA_CORE.coreLogInfo(runId, 'weeklyCommemorativesDigest: FIM OK', { count: rows.length });
  } catch (e) {
    GEAPA_CORE.coreLogError(runId, 'weeklyCommemorativesDigest: ERRO', { err: String(e), stack: e && e.stack });
    throw e;
  } finally {
    lock.releaseLock();
  }
}