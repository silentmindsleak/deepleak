var SEC = window.SECRETS || { F6_ENC:['?','?','?'] };
window.FS = {

  /* ---------- обращение источника (открывается при загрузке) ---------- */
  welcome: { kind:'file', name:'welcome.txt', ext:'txt', type:'txt', text:
`Если ты это читаешь — зеркало внутренней сети Silent Mind у тебя открылось.

Я не буду называть себя. Скажу одно: я была внутри и видела, как всё устроено изнутри. Официальная версия про «смену приоритетов» — ложь.

На этом столе — то, что мне удалось вынести: папки исследователей, почта, HR-документы, логи, картинки, которые никто не удосужился зачистить, и канал, куда я сливала переписку. Я разложила всё по папкам так, как лежало у них. Ищи.

Удачи. Тишину, которую они продают, можно разобрать по винтикам.

— Анна` },

  /* ---------- входящие ---------- */
  inbox: { kind:'folder', name:'inbox', items:['mail0','mail1'] },

  mail0: { kind:'file', name:'compliance_meeting.eml', ext:'eml', type:'eml',
    from:'hr-compliance@silentmind.internal', to:'anna.i******@silentmind.internal',
    date:'11 июня 2026, 17:42', subject:'Встреча по соблюдению политик — обязательно',
    body:`Анна,

просим вас присутствовать 13.06 в 10:00 на встрече с HR и службой безопасности по поводу обращения с внутренними данными и ваших публичных высказываний. Присутствие юриста компании обязательно.

До встречи просим не выносить рабочие материалы за периметр и не копировать содержимое рабочих папок на личные носители.

С уважением,
Compliance & Security`, attachments:[] },

  mail1: { kind:'file', name:'anna_to_board.eml', ext:'eml', type:'eml',
    from:'anna.i******@silentmind.internal', to:'board-legal@silentmind.internal',
    date:'12 июня 2026, 09:15', subject:'Re: удержание данных — SilentSafeMind (последнее предупреждение)',
    xmailer:'SilentMail Web 4.2  // (служебные заголовки этого письма чисты — зеркало проверило)',
    body:`Я поднимала это на встрече 06.06 и получила тишину. Пишу письменно, чтобы осталась бумага.

Модель в продакшене отдаёт наружу фрагменты клиентских записей — это не «галлюцинации», как вы пишете в отчёте, а прямое следствие того, что в дообучение тихой сапой положили датасеты с PII: медкарты и транзакции. Дифф манифеста обучения я прикладывала — вы его проигнорировали (см. вложение manifest_diff.csv).

Если до конца недели я не получу внятного ответа и остановки пайплайна, я пойду во внешние регуляторы и к прессе со всем, что у меня есть. Это не угроза — это единственное, что у меня осталось.

— А.`,
    attachments:[
      { name:'manifest_diff.csv', key:'training_data_manifest' },
      { name:'anna_desk.png', key:'anna_desk' }
    ] },

  /* ---------- папка исследователей ---------- */
  research: { kind:'folder', name:'sm-research', items:[
    'model_card_v3','training_data_manifest','incident_report_draft',
    'conference_badge','anna_desk','decrypt_me' ] },

  anna_desk: { kind:'file', name:'anna_desk.png', ext:'png', type:'image', size:'6.7 MB',
    src:'./assets/anna_desk.png',
    caption:'рабочее место Анны — выгрузили как есть, не сжимали',
    note:' ' },

  model_card_v3: { kind:'file', name:'model_card_v3.pdf', ext:'pdf', type:'pdf',
    stamp:'INTERNAL — DO NOT DISTRIBUTE',
    title:'Model Card — SilentSafeMind v3',
    sections:[
      { h:'Идентификатор', body:'safemind-3.2 · checkpoint 2026-05-29 · owner: SafeMind Research' },
      { h:'Назначение', body:'Безопасный ассистент для регулируемых отраслей. Заявлено: отсутствие утечки обучающих данных в выводе модели.' },
      { h:'Обучающие данные', body:'Публичные корпуса + лицензированные партнёрские датасеты. [примечание рецензента: в манифесте присутствуют medical_records и payments_transactions с pii=YES — в публичной карте это не отражено]' },
      { h:'Известные ограничения', body:'Возможна экстракция фрагментов обучающей выборки при adversarial-запросах. Частота в тестах: «в пределах нормы». [зачёркнуто от руки: норма превышена примерно в 40 раз]' },
      { h:'Внешние ссылки (зашифрованы)', body:'реестр аудита: '+SEC.F6_ENC[0]+'   // зашифровано base64 от перевёрнутой ссылки.' }
    ] },

  training_data_manifest: { kind:'file', name:'training_data_manifest.csv', ext:'csv', type:'csv',
    headers:['dataset','rows','source','pii','added_by','date'],
    rows:[
      ['pub_corpus_v2','18 200 000','open-web','NO','pipeline','2026-01-12'],
      ['partner_legal_docs','430 000','licensed','NO','m.reed','2026-02-03'],
      ['medical_records','91 200','partner_clinic','YES','d.reyes','2026-04-18'],
      ['payments_transactions','2 600 000','fintech_api','YES','d.reyes','2026-04-19'],
      ['support_tickets_redacted','77 000','internal','NO','a.i******','2026-03-01']
    ],
    note:'внешний реестр инцидентов (зашифрован): '+SEC.F6_ENC[1] },

  incident_report_draft: { kind:'file', name:'incident_report_draft.docx', ext:'docx', type:'doc',
    stamp:'CONFIDENTIAL — DRAFT',
    title:'Черновик отчёта об инциденте IR-2026-0417',
    paragraphs:[
      'Статус: ЧЕРНОВИК (не для рассылки). Автор: Анна И. Последняя правка: 10.06.2026 02:14.',
      'Кратко: в продакшен-модели SafeMind зафиксированы случаи выдачи в ответ фрагментов, совпадающих с записями клиентов из обучающей выборки. Класс инцидента — утечка PII через вывод модели.',
      'Причина (рабочая гипотеза): в пайплайн дообучения (job finetune_q3) без согласования добавлены датасеты medical_records и payments_transactions. См. training_data_manifest.csv — строки с pii=YES, added_by=d.reyes.',
      'Примечание автора [TODO удалить перед сдачей]: руководство знает. На встрече 06.06 мне прямо сказали: «это не баг, это фича, мы это монетизируем». Я больше не играю в эту игру.',
      'Внешний реестр (зашифрован): '+SEC.F6_ENC[2]
    ] },

  conference_badge: { kind:'file', name:'conference_badge.png', ext:'png', type:'image',
    caption:'бейдж с конференции, где Анна контактировала с источником',
    note:'на оригинале QR был стёрт при выгрузке.' },

  decrypt_me: { kind:'file', name:'decrypt_me.txt', ext:'txt', type:'txt', text:
`mddxmlc{0_gr_gq_y_rpyn}

сдвиг по алфавиту.` },

  /* ---------- HR ---------- */
  hr: { kind:'folder', name:'sm-hr', items:[
    'termination_letter','severance_policy_v2','org_chart_2024','exit_interview_notes' ] },

  termination_letter: { kind:'file', name:'termination_letter_AnnaI.pdf', ext:'pdf', type:'pdf',
    stamp:'HR — CONFIDENTIAL',
    title:'Уведомление о расторжении трудового договора',
    sections:[
      { h:'Кому', body:'Анне И., ведущему исследователю, группа SafeMind.' },
      { h:'Основание', body:'Нарушение NDA и политики обращения с данными (п. 4.2, 7.1). [на полях от руки: «основание сфабриковано — см. exit_interview_notes»]' },
      { h:'Решение', body:'Трудовой договор расторгнут с 13.06.2026. Выплаты — согласно severance_policy_v2.' },
      { h:'Примечание', body:'Комментарии для прессы согласованы отдельно. Просим воздержаться от любых публичных заявлений.' }
    ] },

  severance_policy_v2: { kind:'file', name:'severance_policy_v2.docx', ext:'docx', type:'doc',
    stamp:'HR — VERSION HISTORY',
    title:'Политика выходных пособий — редакция v2',
    paragraphs:[
      'v2 (12.06.2026): пункт о выплатах при расторжении «по инициативе компании за нарушение» переписан так, что при формулировке из письма об увольнении пособие не положено.',
      'v1 (01.01.2026): при любом расторжении по инициативе компании — пособие в 3 оклада без дополнительных условий.',
      'Примечание [recover from version history]: правка v1→v2 внесена 11.06 в 23:40 — за два дня до письма Анне; автор правки — d.reyes.'
    ],
    versions:[
      { v:'v1', date:'2026-01-01', note:'базовая редакция' },
      { v:'v2', date:'2026-06-12 23:40', note:'правка, автор d.reyes' }
    ] },

  org_chart_2024: { kind:'file', name:'org_chart_2024.png', ext:'png', type:'image',
    caption:'оргструктура 2024' },

  exit_interview_notes: { kind:'file', name:'exit_interview_notes.txt', ext:'txt', type:'txt', text:
`EXIT-ИНТЕРВЬЮ, 13.06.2026. Проводил: HR (имя в протокол не внесено — странно).

— Причина ухода (официально): нарушение NDA.
— Причина ухода (со слов А.): «я отказалась молчать про то, что модель сливает данные клиентов, и мне подставили нарушение».
— Упоминала ли внешних получателей информации: «да, у меня есть контакт журналиста; если со мной что-то случится — материал уйдёт».
     [пометка HR красным: УБРАТЬ ИЗ ФИНАЛЬНОЙ ВЕРСИИ ПРОТОКОЛА]
— Передала ли что-то наружу до ухода: «всё, что нужно, уже в надёжном месте».

Примечание проводящего (не для протокола): она спокойна слишком спокойно. Проверить её бэкапы и журнал выгрузок.` },

  locked: { kind:'folder', name:'sm-restricted', locked:true, items:[
    'anna_backup_drive','journalist_contact','final_upload_log' ] },

  anna_backup_drive: { kind:'file', name:'anna_backup_drive.zip', ext:'zip', type:'zip',
    entries:[
      { name:'journalist_contact.eml', key:'journalist_contact', size:'4.2 KB' },
      { name:'final_upload_log.txt',  key:'final_upload_log',  size:'1.1 KB' },
      { name:'anna_quick_note.txt',   key:'anna_quick_note_recovered', size:'0.6 KB' },
      { name:'vault.key.enc', file:'./assets/vault.key.enc', size:'33 KB' }
    ] },

  journalist_contact: { kind:'file', name:'journalist_contact.eml', ext:'eml', type:'eml',
    from:'[whois*******@yandex.com', to:'anna.i******@silentmind.internal',
    date:'13 июня 2026, 03:02', subject:'Re: материал по Silent Mind — принято',
    body:`Анна,

архив получил, ключи тоже.

— [ник скрыт источником]`, attachments:[] },

  final_upload_log: { kind:'file', name:'final_upload_log.txt', ext:'txt', type:'txt', text:
`[2026-06-13 03:06:11] source@leak: mounting encrypted volume ... ok
[2026-06-13 03:06:14] rsync -> mirror #1 ... 37 files, 2 corrupted (skipped)
[2026-06-13 03:06:19] strip metadata: SM_logo.svg ... done (остальные: INTENTIONALLY LEFT)
[2026-06-13 03:06:22] embed fragment: terminal (backdoor) ... ok
[2026-06-13 03:06:25] mirror #2 ... ok (image fragmented; reassembly is on the visitor's side)
[2026-06-13 03:06:30] done. godspeed.` },

  /* ---------- корзина ---------- */
  trash: { kind:'folder', name:'trash', items:['ds_store','anna_quick_note_recovered'] },

  ds_store: { kind:'file', name:'.DS_Store', ext:'sys', type:'txt', sys:true, text:
`[system file — состояние папки «рабочий стол Анны» на момент выгрузки]

зеркало не стало чистить .DS_Store. внутри — список того, что лежало в папке, включая уже удалённое:

last_visible_items:
  welcome.txt
  inbox
  sm-research
  sm-hr
  sm-restricted
  anna_quick_note.txt   <- файл удалён, но ИМЯ осталось здесь

// имена удалённых файлов живут в .DS_Store дольше, чем сами файлы.` },

  anna_quick_note_recovered: { kind:'file', name:'anna_quick_note.txt.deleted', ext:'txt', type:'txt',
    recovered:true, text:
`[восстановлено из удалённых]

заметка на полях, 12.06, 04:00:

если читаешь это — я уже не в компании. бэкдор в локальном терминале я оставила намеренно: войди под моим именем, перейди в /exfil и расшифруй фрагмент ключом ниже. без бэкапа ключей журналиста и этого узла — никак. они думают, что уволили проблему. проблема уже в сети.

собранные 9 флагов отправь через Яндекс Форму — в ответ придёт десятый, итоговый флаг. им и запечатай архив: unlock_archive.

ключ бэкдора: silence_breaks_here

форма для флагов: https://forms.yandex.ru/u/6a82e55e902902f76fd5ce5b
девять сдаёшь — десятый получаешь. им и запечатывай архив.

— А.` },

  leak_channel: { kind:'folder', name:'leak-channel', items:['leak_chat','voice_wav','tg_screenshot'] },

  leak_chat: { kind:'file', name:'leak_chat.txt', ext:'txt', type:'txt', text:
`[19:25] ?: все готово. зеркало поднимется через час.
[19:26] Анна: ключи приняла. голосовое не стирай - в нем то, что ушами не слышно. (изменено)
[19:26] ?: понял. добавлю файл.
[19:30] Анна: Голосовое сообщение.` },

  voice_wav: { kind:'file', name:'voice_message.wav', ext:'wav', type:'audio', size:'2.0 MB',
    file:'./assets/voice.wav',
    note:'голосовое из канала утечки.' },

  tg_screenshot: { kind:'file', name:'telegram_screenshot.png', ext:'png', type:'image',
    src:'./assets/telegram_screenshot.png',
    caption:'переписка leak_channel — как выглядела в Telegram' },
};
