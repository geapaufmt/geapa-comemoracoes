/**************************************
 * Debugs
 **************************************/

function debugToday() {
  const runId = GEAPA_CORE.coreRunId();
  const today = now_();
  GEAPA_CORE.coreLogInfo(runId, 'debugToday', {
    now: String(today),
    tz: CFG.TZ,
    mmdd: monthDayKey_(today),
    fmt: formatDate_(today)
  });
}

function pingEmail() {
  MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Ping GEAPA Aniversários', 'Ok.');
}