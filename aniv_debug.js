/**************************************
 * Debugs
 **************************************/

function debugToday() {
  const runId = GEAPA_CORE.coreRunId();
  const today = aniv_now_();
  GEAPA_CORE.coreLogInfo(runId, 'debugToday', {
    now: String(today),
    tz: CFG.TZ,
    mmdd: aniv_monthDayKey_(today),
    fmt: aniv_formatDate_(today)
  });
}

function pingEmail() {
  GEAPA_CORE.coreSendEmailText({
    to: Session.getActiveUser().getEmail(),
    subject: 'Ping GEAPA Aniversarios',
    body: 'Ok.'
  });
}

