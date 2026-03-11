function aniv_install_triggers() {
  // apaga triggers antigos desse módulo para não duplicar
  const handlers = [
    'checkBirthdaysToday',
    'weeklyBirthdayDigest',
    'checkProfsBirthdaysToday',
    'weeklyProfsBirthdayDigest',
    'checkCommemorativesToday',
    'weeklyCommemorativesDigest'
  ];

  ScriptApp.getProjectTriggers().forEach(t => {
    if (handlers.includes(t.getHandlerFunction())) {
      ScriptApp.deleteTrigger(t);
    }
  });

  // diários (09h) — ajuste se quiser
  ScriptApp.newTrigger('checkBirthdaysToday').timeBased().everyDays(1).atHour(7).create();
  ScriptApp.newTrigger('checkProfsBirthdaysToday').timeBased().everyDays(1).atHour(7).create();
  ScriptApp.newTrigger('checkCommemorativesToday').timeBased().everyDays(1).atHour(7).create();

  // semanais (segunda 09h)
  ScriptApp.newTrigger('weeklyBirthdayDigest').timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).create();
  ScriptApp.newTrigger('weeklyProfsBirthdayDigest').timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).create();
  ScriptApp.newTrigger('weeklyCommemorativesDigest').timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).create();
}