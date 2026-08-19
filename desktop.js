(function(){
  "use strict";
  var FS = window.FS, SEC = window.SECRETS || {};
  var $ = function(s,r){ return (r||document).querySelector(s); };
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  var zTop=20, wins={}, created=0, unlocked=false, IMG_CTX=null;

  var ICONS=[
    {key:'welcome', glyph:'▤', label:'welcome.txt'},
    {key:'inbox',   glyph:'✉', label:'inbox'},
    {key:'research',glyph:'◧', label:'sm-research'},
    {key:'hr',      glyph:'◨', label:'sm-hr'},
    {key:'locked',  glyph:'⛁', label:'sm-restricted', locked:true},
    {key:'leak_channel', glyph:'≋', label:'leak-channel'},
    {key:'game',    glyph:'?', label:'osint-check'},
    {key:'terminal',glyph:'⌘', label:'terminal'}
  ];
  var DOCK=[
    {key:'inbox',   glyph:'✉', name:'inbox'},
    {key:'research',glyph:'◧', name:'sm-research'},
    {key:'hr',      glyph:'◨', name:'sm-hr'},
    {key:'locked',  glyph:'⛁', name:'sm-restricted', locked:true},
    {key:'leak_channel', glyph:'≋', name:'leak-channel'},
    {key:'game',    glyph:'?', name:'osint-check'},
    {key:'terminal',glyph:'⌘', name:'terminal'},
    {key:'trash',   glyph:'␡', name:'trash'}
  ];

  /* ---------- рендер ---------- */
  function renderNode(key, siblings){
    var n=FS[key];
    if(!n) return {title:'?', html:'<div class="term"><div class="ln dim">узел не найден</div></div>'};
    if(n.kind==='folder') return { title:n.name.toUpperCase()+' — '+n.items.length+' записей', html:renderFolder(key,n) };
    return { title:n.name, html:renderFile(key,n,siblings) };
  }
  function fic(ext){
    if(ext==='folder') return '<div class="fic folder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>';
    return '<div class="fic"><span class="ext '+esc(ext)+'">'+esc(ext).toUpperCase()+'</span></div>';
  }
  function renderFolder(key,n){
    window['__SIB_'+key]=n.items;
    if(n.locked && !unlocked){
      return '<div class="fpath">~/leak/<b>'+esc(n.name)+'</b> $ access required</div>'+
        '<div class="lockbox"><div class="pr">&gt; введите код доступа:</div>'+
        '<input type="text" id="lockInput" placeholder="ВВЕДИ КОД ДОСТУПА" autocomplete="off">'+
        '<button class="btn" onclick="tryUnlock()">ОТКРЫТЬ</button><div class="err" id="lockErr"></div></div>';
    }
    var h='<div class="fpath">~/leak/<b>'+esc(n.name)+'</b> $ ls -la</div><div class="fgrid">';
    n.items.forEach(function(k){ var c=FS[k]; if(!c)return;
      var ext=c.kind==='folder'?'folder':(c.ext||'txt');
      var sz=c.size?'<div class="fsize">'+esc(c.size)+'</div>':'';
      h+='<div class="fitem" onclick="openNode(\''+k+'\',window.__SIB_'+key+')">'+fic(ext)+'<div class="fname">'+esc(c.name)+'</div>'+sz+'</div>';
    });
    return h+'</div>';
  }
  function frame(name,inner){ return frameSz(name,'',inner); }
  function frameSz(name,extra,inner){ return '<div class="frame"><div class="fr-bar">~/leak/<b>'+esc(name)+'</b>'+(extra?' <span class="frx">'+esc(extra)+'</span>':'')+' — просмотр</div>'+inner+'</div>'; }

  function renderFile(key,n,siblings){
    switch(n.type){
      case 'txt': {
        var rec=n.recovered?'<span class="rec">восстановлено из удалённых</span><br>':'';
        return frame(n.name,'<div class="paper"><div class="notepad'+(n.sys?' sys':'')+'">'+rec+esc(n.text)+'</div></div>');
      }
      case 'eml': {
        var att='';
        if(n.attachments&&n.attachments.length){ att='<div class="att"><div class="lab">вложения ('+n.attachments.length+')</div>';
          n.attachments.forEach(function(a){ att+='<span class="chip" onclick="openNode(\''+a.key+'\')"><span class="d"></span>'+esc(a.name)+'</span>'; });
          att+='</div>'; }
        var xm=n.xmailer?'<div class="xmail">'+esc(n.xmailer)+'</div>':'';
        return frame(n.name,'<div class="paper"><div class="mail">'+
          '<div class="mh"><b>От:</b> '+esc(n.from)+'</div><div class="mh"><b>Кому:</b> '+esc(n.to)+'</div>'+
          '<div class="mh"><b>Дата:</b> '+esc(n.date)+'</div><div class="subj">'+esc(n.subject)+'</div>'+xm+
          '<hr><div class="mbody">'+esc(n.body)+'</div>'+att+'</div></div>');
      }
      case 'doc': {
        var p=n.paragraphs.map(function(x){return '<p>'+esc(x)+'</p>';}).join('');
        var ver='';
        if(n.versions){ ver='<div class="ver"><b>история версий:</b><br>'+n.versions.map(function(v){return '<span class="v">'+esc(v.v)+'</span> · '+esc(v.date)+' — '+esc(v.note);}).join('<br>')+'</div>'; }
        return frame(n.name,'<div class="paper"><div class="doc">'+(n.stamp?'<div class="stamp">'+esc(n.stamp)+'</div>':'')+'<h2>'+esc(n.title)+'</h2>'+p+ver+'</div></div>');
      }
      case 'pdf': {
        var s=n.sections.map(function(x){return '<h3>'+esc(x.h)+'</h3><p>'+esc(x.body)+'</p>';}).join('');
        return frame(n.name,'<div class="paper"><div class="pdf">'+(n.stamp?'<div class="stamp">'+esc(n.stamp)+'</div>':'')+'<h2>'+esc(n.title)+'</h2>'+s+'</div></div>');
      }
      case 'csv': {
        var th=n.headers.map(function(h){return '<th>'+esc(h)+'</th>';}).join('');
        var tr=n.rows.map(function(r){return '<tr>'+r.map(function(c){return '<td class="'+(String(c).toUpperCase()==='YES'?'yes':'')+'">'+esc(c)+'</td>';}).join('')+'</tr>';}).join('');
        var note=n.note?'<div class="frnote">'+esc(n.note)+'</div>':'';
        return frame(n.name,'<div class="paper"><div class="csvwrap"><table class="csv"><thead><tr>'+th+'</tr></thead><tbody>'+tr+'</tbody></table></div>'+note+'</div>');
      }
      case 'zip': {
        var h='<div class="zip"><div class="zh">~/leak/'+esc(n.name)+' $ unzip -l'+(n.hint?'<br><span class="hintz">// '+esc(n.hint)+'</span>':'')+'</div>';
        n.entries.forEach(function(e){
          var btn = e.file ? '<a class="zbtn" href="'+esc(e.file)+'" download>скачать</a>'
                  : e.key  ? '<button onclick="openNode(\''+e.key+'\')">извлечь</button>'
                  : '<button disabled>—</button>';
          h+='<div class="zrow"><span class="zn">'+esc(e.name)+'</span><span class="zs">'+esc(e.size||'')+'</span>'+btn+'</div>';
        });
        return h+'</div>';
      }
      case 'audio': {
        return frameSz(n.name, n.size||'', '<div class="audiov"><div class="aicon">♪</div>'+
          '<div class="anote">'+esc(n.note||'')+'</div><a class="dlbtn" href="'+esc(n.file)+'" download>скачать файл</a></div>');
      }
      case 'image': {
        var list=siblings||[key]; IMG_CTX={list:list, idx:list.indexOf(key)};
        var stage = n.src ? '<img src="'+esc(n.src)+'" alt="'+esc(n.name)+'">'
                          : '<div class="ph"><span class="ic">▣</span>превью не уцелело при выгрузке</div>';
        var dl = n.src ? '<a class="dlbtn" href="'+esc(n.src)+'" download>скачать оригинал</a>' : '';
        var nav = list.length>1
          ? '<button onclick="navImage(-1)">[ &lt; ]</button><span class="mid">'+(IMG_CTX.idx+1)+' / '+list.length+'</span><button onclick="navImage(1)">[ &gt; ]</button>'
          : '<span></span><span class="mid">'+esc(n.name)+'</span><span></span>';
        return frameSz(n.name, n.size||'', '<div class="imgv"><div class="stage">'+stage+'</div>'+dl+
          '<div class="cap">'+esc(n.caption||'')+'</div><div class="note">'+esc(n.note||'')+'</div>'+
          '<div class="nav">'+nav+'</div></div>');
      }
    }
    return '<div class="term"><div class="ln dim">неизвестный тип</div></div>';
  }

  var APPS = {
    about:{ title:'ОБ ЭТОЙ УТЕЧКЕ', persist:false, html:function(){
      return '<div class="term"><div class="ln">узел: internal-leak.node</div>'+
        '<div class="ln">статус зеркала: НЕ ПРОВЕРЕНО</div><div class="ln">сессия: анонимная / без входа</div>'+
        '<div class="ln dim"> </div>'+
        '<div class="ln dim"> </div>'+
        '<div class="ln"> </div></div>'; }},
    terminal:{ title:'TERMINAL // backdoor', persist:true, html:termHTML, wire:wireTerminal },
    game:{ title:'OSINT-CHECK // 3x3', persist:true, html:gameHTML, wire:wireGame }
  };

  function termHTML(){
    return '<div class="term"><div class="th"></div>'+
      '<div class="inrow"><span class="dim">source@backdoor:~$</span><input class="ti" autocomplete="off" spellcheck="false"><button class="btn ts">↵</button></div></div>';
  }

  function wireTerminal(w){
    var hist=w.querySelector('.th'), inp=w.querySelector('.ti'), btn=w.querySelector('.ts');
    var st={logged:false, cwd:'~', solved8:false};
    function scroll(){ var b=w.querySelector('.win-body'); if(b) b.scrollTop=b.scrollHeight; }
    function emit(h){ var d=document.createElement('div'); d.className='ln'; d.innerHTML=h; hist.appendChild(d); scroll(); }
    function help(){ emit(
      '<span class="g">backdoor console</span> — команды: '+
      'help · whoami · login &lt;user&gt; · cd &lt;path&gt; · cat &lt;file&gt; · decrypt --key "&lt;фраза&gt;" · unlock_archive --flag offzone{...} · clear<br>'+
      '<span class="dim">подсказки: кого уволили? где лежит заметка с ключом? читай файлы в файловом менеджере; мусор тоже стоит проверить.</span>'); }
    function process(line){
      line=line.trim(); if(!line) return;
      if(line==='help'){ help(); return; }
      if(line==='clear'){ hist.innerHTML=''; return; }
      if(line==='whoami'){ emit(st.logged?'anna':'guest (не авторизована в бэкдоре)'); return; }
      if(line.indexOf('login ')===0){ var u=line.slice(6).trim();
        if(u==='anna'){ st.logged=true; emit('welcome, anna. канал бэкдора открыт. дальше: <span class="g">cd /exfil</span>'); }
        else emit('unknown user. (подсказка: кого уволили по сфабрикованному основанию?)'); return; }
      if(line.indexOf('cd ')===0){ var p=line.slice(3).trim();
        if(!st.logged){ emit('сначала <span class="g">login anna</span>.'); return; }
        if(p==='/exfil'||p==='exfil'){ st.cwd='/exfil'; emit('now in /exfil. здесь то, что Анна выгрузила. вспомни заметку в корзине → <span class="g">decrypt --key "&lt;фраза&gt;"</span>'); }
        else emit('no such directory: '+esc(p)); return; }
      if(line.indexOf('cat ')===0){ var f=line.slice(4).trim();
        if(f==='final_upload_log'||f==='log'){ emit('<span class="dim">... embed final-flag fragment: terminal (backdoor) ... ok</span> бэкдор ждёт <span class="g">decrypt --key</span>.'); }
        else if(f==='note'||f==='anna_quick_note'){ emit('заметка Анны — в корзине (trash). открой её в файловом менеджере, не здесь.'); }
        else emit('cat: '+esc(f)+': документы читай через файловый менеджер.'); return; }
      if(line.indexOf('decrypt --key ')===0){
        if(!st.logged||st.cwd!=='/exfil'){ emit('бэкдор не готов: нужно <span class="g">login anna</span> и <span class="g">cd /exfil</span>.'); return; }
        var k=line.slice('decrypt --key '.length).trim().replace(/^"|"$/g,'');
        if(k===SEC.KEY8){ var f8='offzone{8_'+window.hash32hex(k)+'}'; st.solved8=true;
          emit('<span class="g">backdoor ok → fragment 8:</span> '+f8);
          emit('<span class="dim">собери все 9 флагов, отправь их через Яндекс Форму и получишь итоговый флаг. затем введи: unlock_archive --flag offzone{...}</span>'); }
        else emit('wrong key. фраза — в заметке Анны (папка trash).'); return; }
      if(line.indexOf('unlock_archive --flag ')===0){ var v=line.slice('unlock_archive --flag '.length).trim();
        var lore=window.decryptGate(v);
        if(lore){ emit('<span class="g">ACCESS GRANTED — архив расшифрован:</span>'); emit('<div class="story">'+esc(lore)+'</div>'); }
        else emit('не совпадает. итоговый флаг приходит в ответ на 9 отправленных через Яндекс Форму флагов.'); return; }
      emit('command not found: '+esc(line.split(/\s+/)[0])+'. набери <span class="g">help</span>.');
    }
    function run(){ var v=inp.value; emit('<span class="dim">source@backdoor:~$</span> '+esc(v)); process(v); inp.value=''; inp.focus(); }
    inp.addEventListener('keydown',function(e){ if(e.key==='Enter') run(); });
    btn.addEventListener('click',run);
    emit('<span class="dim">backdoor channel established. набери <span class="g">help</span>.</span>');
    setTimeout(function(){ inp.focus(); },50);
  }

  function gameHTML(){
    return '<div class="game"><div class="ghint">карточки лежат <b>рубашкой вверх</b> — кликай, чтобы перевернуть.</div>'+
      '<div class="ggrid"></div><div class="gout-row"><button class="btn gbuild">собрать флаг</button>'+
      '<input class="gout" readonly></div></div>';
  }
  function wireGame(w){
    var g=w.querySelector('.ggrid'), CELLS=[1,4,7],
        IMG=['./assets/question_1.png','./assets/question_2.png','./assets/question_3.png'];
    for(var i=0;i<9;i++){
      var cell=document.createElement('div'); cell.className='gcell';
      var card=document.createElement('div'); card.className='card';
      var front=document.createElement('div'); front.className='face front';
      front.innerHTML='<div class="gpos">'+(i+1)+'</div><div class="qmark">?</div><div class="flip-hint">перевернуть</div>';
      var back=document.createElement('div'); back.className='face back';
      card.appendChild(front); card.appendChild(back); cell.appendChild(card); g.appendChild(cell);
      var qi=CELLS.indexOf(i);
      (function(card,back,qi,idx){
        card.addEventListener('click',function(){
          if(card.classList.contains('flipped')) return;  
          card.classList.add('flipped');
          if(qi>=0){
            back.innerHTML='<img src="'+IMG[qi]+'" alt="question '+(qi+1)+'"><input class="ga" data-idx="'+qi+'" placeholder="ответ '+(qi+1)+'" autocomplete="off" spellcheck="false">';
            var inp=back.querySelector('.ga'); setTimeout(function(){ if(inp) inp.focus(); },460);
          } else {
            back.classList.add('broken'); back.innerHTML='<div class="gpos">'+(idx+1)+'</div><div class="btxt">нет сигнала</div>';
          }
        });
      })(card,back,qi,i);
    }
    var out=w.querySelector('.gout');
    w.querySelector('.gbuild').addEventListener('click',function(){
      var a=['','','']; g.querySelectorAll('.ga').forEach(function(inp){ var idx=+inp.getAttribute('data-idx'); a[idx]=inp.value.trim().toLowerCase(); });
      out.value='offzone{9_'+a.join('_')+'}'; out.focus(); out.select();
      try{ navigator.clipboard.writeText(out.value); }catch(e){}
    });
  }

  /* ---------- window manager ---------- */
  function ensureWin(key){
    if(wins[key]) return wins[key];
    var w=document.createElement('div'); w.className='win'; w.id='win-'+key;
    var n=created++; w.style.top=(70+(n*26)%170)+'px'; w.style.left=(120+(n*34)%320)+'px'; w.style.width='540px';
    w.innerHTML='<div class="win-head"><span class="t"></span>'+
      '<span class="ctrls"><span data-act="min">[ _ ]</span><span data-act="max">[ + ]</span><span data-act="close">[ x ]</span></span></div>'+
      '<div class="win-body"></div>';
    $('#desktop').appendChild(w); wins[key]=w;
    w.addEventListener('mousedown',function(){ focus(w); });
    w.querySelector('.ctrls').addEventListener('click',function(e){ var a=e.target.getAttribute('data-act'); if(!a)return;
      if(a==='close')closeWin(key); else if(a==='min')minWin(key); else w.classList.toggle('max'); });
    var head=w.querySelector('.win-head'), dragging=false, ox=0, oy=0;
    head.addEventListener('mousedown',function(e){ if(e.target.closest('.ctrls'))return; if(w.classList.contains('max'))return;
      dragging=true; ox=e.clientX-w.offsetLeft; oy=e.clientY-w.offsetTop; });
    document.addEventListener('mousemove',function(e){ if(!dragging)return; w.style.left=(e.clientX-ox)+'px'; w.style.top=Math.max(30,e.clientY-oy)+'px'; });
    document.addEventListener('mouseup',function(){ dragging=false; });
    return w;
  }
  function focus(w){ w.style.zIndex=++zTop; }

  window.openNode=function(key,siblings){
    var node=FS[key]||APPS[key]; if(!node)return;
    var w=ensureWin(key);
    if(!w.dataset.built){
      var r = APPS[key] ? {title:APPS[key].title, html:APPS[key].html()} : renderNode(key,siblings);
      w.querySelector('.win-head .t').textContent=r.title;
      w.querySelector('.win-body').innerHTML=r.html;
      if(APPS[key]&&APPS[key].wire) APPS[key].wire(w);
      if(APPS[key]&&APPS[key].persist) w.dataset.built='1';
    }
    w.classList.add('open'); w.classList.remove('min'); focus(w);
    w.classList.remove('glitch-in'); void w.offsetWidth; w.classList.add('glitch-in');
    updateDock();
  };
  function closeWin(key){ var w=wins[key]; if(!w)return; w.classList.remove('open','min','max'); updateDock(); }
  function minWin(key){ var w=wins[key]; if(!w)return; w.classList.add('min'); updateDock(); }

  window.navImage=function(dir){ if(!IMG_CTX)return; var i=IMG_CTX.idx+dir; if(i<0||i>=IMG_CTX.list.length)return; openNode(IMG_CTX.list[i],IMG_CTX.list); };
  window.tryUnlock=function(){ var v=($('#lockInput')||{}).value||'';
    if(v.trim().toUpperCase()==='ANNA-0417'){ unlocked=true; openNode('locked'); }
    else { var e=$('#lockErr'); if(e)e.textContent='ДОСТУП ЗАПРЕЩЁН — код неверен'; } };

  /* ---------- dock / icons / ctx ---------- */
  function buildDock(){ var d=$('#dock'); DOCK.forEach(function(it){
    var el=document.createElement('div'); el.className='dock-ic'+(it.locked?' locked':''); el.setAttribute('data-node',it.key); el.setAttribute('data-name',it.name);
    el.innerHTML=it.glyph+'<span class="run"></span>'; el.addEventListener('click',function(){ dockClick(it.key); }); d.appendChild(el); }); }
  function dockClick(key){ var w=wins[key]; var open=w&&w.classList.contains('open'); var min=w&&w.classList.contains('min'); var top=w&&parseInt(w.style.zIndex||0,10)===zTop;
    if(open&&!min&&top) minWin(key); else openNode(key); }
  function updateDock(){ document.querySelectorAll('.dock-ic[data-node]').forEach(function(d){ var w=wins[d.getAttribute('data-node')]; var open=w&&w.classList.contains('open');
    d.classList.toggle('running',!!open); d.classList.toggle('active',!!open&&!(w&&w.classList.contains('min'))); }); }

  function buildIcons(){ var c=$('#icons'); ICONS.forEach(function(it){
    var el=document.createElement('div'); el.className='icon'+(it.locked?' locked':'');
    el.innerHTML='<div class="glyph">'+it.glyph+'</div><div class="label">'+esc(it.label)+'</div>';
    el.addEventListener('click',function(){ selectIcon(el); openNode(it.key); }); c.appendChild(el); }); }
  function selectIcon(el){ document.querySelectorAll('.icon.sel').forEach(function(i){i.classList.remove('sel');}); el.classList.add('sel'); }
  $('#desktop').addEventListener('mousedown',function(e){ if(!e.target.closest('.icon')) document.querySelectorAll('.icon.sel').forEach(function(i){i.classList.remove('sel');}); });

  var ctx=$('#ctx'); function hideCtx(){ ctx.style.display='none'; }
  $('#desktop').addEventListener('contextmenu',function(e){ if(e.target.closest('.win,#dock,.icon,#topbar,#ctx,#boot'))return;
    e.preventDefault(); ctx.style.display='block'; ctx.style.left=Math.min(e.clientX,window.innerWidth-220)+'px'; ctx.style.top=Math.min(e.clientY,window.innerHeight-180)+'px'; });
  document.addEventListener('click',hideCtx); document.addEventListener('scroll',hideCtx,true);
  document.addEventListener('keydown',function(e){ if(e.key==='Escape')hideCtx(); });
  window.__ctx={
    refresh:function(){ hideCtx(); var g=$('#grid'); g.style.transition='opacity .2s'; g.style.opacity='0'; setTimeout(function(){g.style.opacity='.7';},180); },
    arrange:function(){ hideCtx(); document.querySelectorAll('#icons .icon').forEach(function(ic){ ic.style.transition='transform .2s'; ic.style.transform='translateX(6px)'; setTimeout(function(){ic.style.transform='';},200); }); }
  };

  /* ---------- clock / watermark / boot ---------- */
  function tick(){ var d=new Date(); $('#clock').textContent=d.toTimeString().slice(0,8); }
  tick(); setInterval(tick,1000);
  (function(){ var wm=$('#wm'); for(var i=0;i<60;i++){ var s=document.createElement('span'); s.textContent='SILENT MIND // INTERNAL —'; wm.appendChild(s); } })();

  var BOOT=[
    ['> инициализация зеркала internal-leak.node',''],
    ['> монтирование слитой файловой системы ... ','ok'],
    ['> подключение бэкдор-канала ... ','ok'],
    ['> восстановление удалённых записей ... ','ok'],
    ['> проверка целостности ... ','warn: 2 файла повреждены'],
    ['> сессия: анонимная / не авторизована',''],
    ['> добро пожаловать. не верь интерфейсу.','']
  ];
  function runBoot(){
    var b=$('#boot'), box=$('#boot .lines'), i=0;
    function step(){ if(i>=BOOT.length){ finish(); return; }
      var ln=document.createElement('div'); ln.className='bline';
      ln.innerHTML=esc(BOOT[i][0])+(BOOT[i][1]?'<span class="'+(BOOT[i][1]==='ok'?'ok':'w')+'">'+esc(BOOT[i][1])+'</span>':'');
      box.appendChild(ln); i++; setTimeout(step,200); }
    function finish(){ setTimeout(function(){ b.classList.add('done'); setTimeout(function(){ b.style.display='none'; openNode('welcome'); },460); },300); }
    function skip(){ if(b.style.display==='none')return; b.classList.add('done'); setTimeout(function(){ b.style.display='none'; openNode('welcome'); },280); }
    step(); b.addEventListener('click',skip,{once:true});
    document.addEventListener('keydown',function h(e){ if(e.key==='Enter'||e.key===' '){ document.removeEventListener('keydown',h); skip(); } },{once:true});
    setTimeout(function(){ skip(); },6000);
  }

  buildIcons(); buildDock();
  (function(){
    var l=$('#topbar .left');
    if(l){ var m=document.createElement('span'); m.className='menu'; m.textContent='osint-чек';
      m.addEventListener('click',function(){ openNode('game'); }); l.appendChild(m); }
    var c=$('#ctx');
    if(c){ var s=document.createElement('div'); s.className='csep';
      var ci=document.createElement('div'); ci.className='ci'; ci.textContent='OSINT-чек';
      ci.addEventListener('click',function(){ openNode('game'); hideCtx(); }); c.appendChild(s); c.appendChild(ci); }
  })();
  runBoot();
})();
