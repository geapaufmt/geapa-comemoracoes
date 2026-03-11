/**************************************
 * 25_aniv_recipients.gs
 * Descobre destinatários da Comunicação automaticamente.
 **************************************/

/**
 * Retorna emails dos membros cujo cargo combina com Comunicação/Marketing.
 */
function aniv_getCommunicationRecipientEmails_() {
  const runId = GEAPA_CORE.coreRunId();

  const sh = aniv_getSheetByKey_(ANIV_CFG.MEMBERS.KEY);
  if (!sh) {
    GEAPA_CORE.coreLogError(runId, 'Comunicação: aba de membros não encontrada', { key: ANIV_CFG.MEMBERS.KEY });
    return [];
  }

  const data = aniv_readSheet_(sh);

  const iRole  = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_ROLE);
  const iEmail = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_EMAIL);

  if (iRole < 0 || iEmail < 0) {
    GEAPA_CORE.coreLogError(runId, 'Comunicação: colunas ROLE/EMAIL não encontradas', {
      roleHeader: ANIV_CFG.MEMBERS.COL_ROLE, emailHeader: ANIV_CFG.MEMBERS.COL_EMAIL, headers: data.headers
    });
    return [];
  }

  const needles = (ANIV_CFG.COMM.ROLES_MATCH || []).map(x => aniv_normHeader_(x));
  const requireCoord = !!ANIV_CFG.COMM.REQUIRE_COORDINATOR_WORD;

  const emails = new Set();

  for (const row of data.rows) {
    const roleRaw = String(row[iRole] || '').trim();
    const emailRaw = String(row[iEmail] || '').trim();

    if (!roleRaw || !emailRaw) continue;
    if (!GEAPA_CORE.coreIsValidEmail(emailRaw)) continue;

    const role = aniv_normHeader_(roleRaw);

    const matchTopic = needles.some(n => role.includes(n));
    if (!matchTopic) continue;

    if (requireCoord && !role.includes('coord')) continue;

    emails.add(emailRaw);
  }

  const list = Array.from(emails);
  GEAPA_CORE.coreLogInfo(runId, 'Comunicação: destinatários encontrados', { count: list.length, list });

  return list;
}

/**
 * Envia e-mail HTML para Comunicação.
 * Retorna true se enviou, false se não havia destinatários.
 */
function aniv_sendToCommunication_(subject, htmlBody) {
  const runId = GEAPA_CORE.coreRunId();
  const recipients = aniv_getCommunicationRecipientEmails_();

  if (!recipients.length) {
    GEAPA_CORE.coreLogWarn(runId, 'Comunicação: nenhum destinatário encontrado — não enviei resumo', { subject });
    return false;
  }

  GEAPA_CORE.coreSendHtmlEmail({
    to: recipients.join(','),
    subject,
    htmlBody
  });

  GEAPA_CORE.coreLogInfo(runId, 'Comunicação: enviado', { subject, toCount: recipients.length });
  return true;
}