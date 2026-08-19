(function(){
  "use strict";
  var GRID = 3;

  var board    = document.getElementById('board');
  var statusEl = document.getElementById('status');
  var winBox   = document.getElementById('win');
  var stage    = document.getElementById('stage');
  if(!board) return;
  board.style.gridTemplateColumns = 'repeat(' + GRID + ',1fr)';

  var cells = [], state = [], srcCanvas = null, tile = 0, suppress = false;
  function msg(t){ if(statusEl) statusEl.textContent = t; }

  // --- помехи при переходе (туда-обратно) ---
  var fx = document.getElementById('fx');
  window.goTransition = function(e, url, text){
    if(e) e.preventDefault();
    if(!fx){ window.location.href = url; return; }
    fx.classList.remove('in');
    fx.classList.add('go');
    var txt = fx.querySelector('.txt');
    if(txt && text) txt.textContent = text;
    setTimeout(function(){ window.location.href = url; }, 860);
  };

  window.addEventListener('DOMContentLoaded', function(){
    document.body.classList.add('entering');
    if(fx){
      fx.classList.add('in');
      setTimeout(function(){
        fx.classList.remove('in');
        document.body.classList.remove('entering');
      }, 900);
    }
  });

  function buildCells(){
    board.innerHTML = ''; cells = [];
    for (var i = 0; i < GRID*GRID; i++){
      var c = document.createElement('div'); c.className = 'cell'; c.draggable = true; c.dataset.i = i;
      var cv = document.createElement('canvas'); c.appendChild(cv);
      board.appendChild(c); cells.push({ el:c, cv:cv });
      (function(idx){
        c.addEventListener('dragstart', function(e){ e.dataTransfer.setData('text/plain', String(idx)); e.dataTransfer.effectAllowed='move'; c.classList.add('drag'); });
        c.addEventListener('dragend',   function(){ c.classList.remove('drag'); });
        c.addEventListener('dragover',  function(e){ e.preventDefault(); c.classList.add('over'); });
        c.addEventListener('dragleave', function(){ c.classList.remove('over'); });
        c.addEventListener('drop',      function(e){ e.preventDefault(); c.classList.remove('over');
          var from = parseInt(e.dataTransfer.getData('text/plain'), 10); if (isNaN(from)) return;
          if (from !== idx){ var tmp = state[from]; state[from] = state[idx]; state[idx] = tmp; render(); check(); }
          suppress = true; setTimeout(function(){ suppress = false; }, 0);
        });
        c.addEventListener('click', function(){ if (suppress) return; state[idx].r = (state[idx].r + 90) % 360; render(); check(); bumpCell(c); });
        c.addEventListener('touchstart', function(){},{passive:true});
      })(i);
    }
  }

  function bumpCell(el){
    el.style.transform = 'scale(0.92) rotate(1deg)';
    setTimeout(function(){ el.style.transform=''; }, 120);
  }

  function drawCell(i){
    var cv = cells[i].cv, s = state[i], ctx = cv.getContext('2d'), sz = tile;
    cv.width = sz; cv.height = sz; ctx.clearRect(0,0,sz,sz);
    // canvas background — тёмная подложка, чтобы разрывы между кусками читались как «разлом»
    ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0,0,sz,sz);
    ctx.save(); ctx.translate(sz/2, sz/2); ctx.rotate(s.r * Math.PI/180);
    var img = s.img;
    // shard рисуется без подсказки-рамки: на таком размере QR-куски похожи друг на друга
    ctx.drawImage(img, -tile/2, -tile/2, tile, tile);
    ctx.restore();
  }
  function render(){ for (var i = 0; i < state.length; i++) drawCell(i); }
  function check(){ for (var i = 0; i < state.length; i++){ if (state[i].t !== i || state[i].r !== 0) return; } win(); }

  function win(){
    if(stage) stage.style.display = 'none';
    winBox.classList.add('show');
    var wc = winBox.querySelector('canvas');
    // Один «модуль» тихой зоны вокруг QR — без него телефонные сканеры иногда
    // не считывают код на тёмном фоне страницы.
    var PAD = Math.round(tile / 3);
    var S = tile * GRID;
    var W = S + PAD * 2;
    wc.width = W; wc.height = W;
    var wctx = wc.getContext('2d');
    wctx.fillStyle = '#fff'; wctx.fillRect(0,0,W,W);
    for (var i = 0; i < state.length; i++){
      var col = i % GRID, row = Math.floor(i / GRID);
      wctx.drawImage(state[i].img, PAD + col*tile, PAD + row*tile, tile, tile);
    }
    wctx.strokeStyle = 'rgba(0,184,212,.35)'; wctx.lineWidth = 2; wctx.strokeRect(1,1,W-2,W-2);
    msg('отражение восстановлено. синхронизация...');
    launchFireworks();
  }

  // --- ФЕЙЕРВЕРК ---
  function launchFireworks(){
    var c = document.createElement('canvas');
    c.id = 'fireworks';
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;background:transparent;';
    document.body.appendChild(c);
    var ctx = c.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 1.2);
    function resize(){ c.width = Math.floor(window.innerWidth * DPR); c.height = Math.floor(window.innerHeight * DPR); }
    resize(); window.addEventListener('resize', resize);

    var rockets = [], particles = [];
    var startTime = performance.now();
    var lastRocket = 0;
    var SPAWN_MS = 1600;
    var END_MS   = 3200;

    function rand(min,max){ return Math.random()*(max-min)+min; }

    function spawnRocket(){
      rockets.push({
        x: rand(c.width*0.15, c.width*0.85), y: c.height + 10,
        vx: rand(-1,1) * DPR,
        vy: rand(-11,-13.5) * DPR,
        hue: Math.random() > 0.5 ? rand(175,210) : rand(330,350),
        targetY: rand(c.height*0.12, c.height*0.45)
      });
    }

    function explode(rx, ry, hue){
      var count = 42 + Math.floor(Math.random()*18);
      for(var i=0;i<count;i++){
        var ang = Math.random()*Math.PI*2;
        var spd = rand(2,8) * DPR;
        particles.push({
          x:rx, y:ry,
          vx: Math.cos(ang)*spd,
          vy: Math.sin(ang)*spd,
          life: rand(28,55),
          maxLife: 55,
          hue: hue + rand(-18,18),
          size: rand(1.5,3) * DPR,
          twinkle: Math.random() > 0.6
        });
      }
      particles.push({ x:rx, y:ry, vx:0, vy:0, life:10, maxLife:10, hue:hue, size:20*DPR, flash:true });
    }

    function skipShow(){
      startTime = -1e12;
      document.removeEventListener('pointerdown', skipShow);
    }
    setTimeout(function(){ document.addEventListener('pointerdown', skipShow); }, 900);

    function loop(now){
      var dt = now - startTime;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillRect(0,0,c.width,c.height);
      ctx.globalCompositeOperation = 'lighter';

      if(dt < SPAWN_MS && now - lastRocket > 340){
        spawnRocket();
        lastRocket = now;
        if(Math.random() > 0.7) setTimeout(spawnRocket, 110);
      }

      for(var i=rockets.length-1;i>=0;i--){
        var r = rockets[i];
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.2 * DPR;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2*DPR, 0, Math.PI*2);
        ctx.fillStyle = 'hsla('+r.hue+',100%,68%,0.9)';
        ctx.fill();
        if(r.vy > -1 || r.y <= r.targetY){
          explode(r.x, r.y, r.hue);
          rockets.splice(i,1);
        }
      }

      for(var p=particles.length-1;p>=0;p--){
        var pa = particles[p];
        pa.life--;
        if(pa.flash){
          var fa = pa.life/10;
          ctx.beginPath();
          ctx.arc(pa.x, pa.y, pa.size*fa*1.6, 0, Math.PI*2);
          ctx.fillStyle = 'hsla('+pa.hue+',100%,85%,'+fa+')';
          ctx.fill();
        }else{
          pa.x += pa.vx;
          pa.y += pa.vy;
          pa.vx *= 0.98;
          pa.vy += 0.14 * DPR;
          var alpha = Math.max(0, pa.life/pa.maxLife);
          if(!(pa.twinkle && Math.floor(pa.life/3)%2===0)){
            ctx.beginPath();
            ctx.arc(pa.x, pa.y, Math.max(0.5, pa.size*alpha), 0, Math.PI*2);
            ctx.fillStyle = 'hsla('+pa.hue+',100%,68%,'+alpha+')';
            ctx.fill();
          }
        }
        if(pa.life<=0) particles.splice(p,1);
      }
      ctx.globalCompositeOperation = 'source-over';

      if(dt < END_MS || particles.length > 0 || rockets.length > 0){
        requestAnimationFrame(loop);
      }else{
        window.removeEventListener('resize', resize);
        document.removeEventListener('pointerdown', skipShow);
        c.style.transition = 'opacity .45s';
        c.style.opacity = '0';
        setTimeout(function(){ c.remove(); }, 500);
      }
    }
    requestAnimationFrame(loop);

    var s = document.createElement('style');
    s.textContent = '@keyframes screenShake{0%,100%{transform:translate(0,0)}20%{transform:translate(-2px,1px)}40%{transform:translate(2px,-1px)}60%{transform:translate(-1px,-1px)}80%{transform:translate(1px,1px)}} body.shaking{animation:screenShake 150ms linear 4}';
    document.head.appendChild(s);
    document.body.classList.add('shaking');
    setTimeout(function(){ document.body.classList.remove('shaking'); }, 650);
  }

  function shuffle(n){
    var arr = [], i, j, t;
    for (i = 0; i < n; i++) arr.push(i);
    do {
      for (i = n-1; i > 0; i--){
        j = Math.floor(Math.random()*(i+1));
        t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
    } while (arr.every(function(v,k){ return v === k; }));

    state = [];
    for (var k = 0; k < n; k++){
      // Каждая ячейка получит фрагмент arr[k], повёрнутый на случайный угол.
      // 1/4 шанса оставить угол 0 уменьшена: фиксируем минимум три повёрнутых куска.
      state.push({ t: arr[k], r: [0,90,180,270][Math.floor(Math.random()*4)] });
    }
    var upright = state.filter(function(s){ return s.r === 0; }).length;
    if (upright > 5) state[0].r = 90;
    if (state.every(function(s,k){ return s.t === k && s.r === 0; })) state[0].r = 90;
  }

  function decodeLayout(){
    // MIRROR_LAYOUT — не пароль, а порядок сборки девяти тайлов. Он лежит в
    // открытом виде, но не превращает репозиторий в хранилище готовой картинки.
    var raw = window.atob(window.MIRROR_LAYOUT || '');
    var out = [];
    for (var i = 0; i < raw.length; i++) out.push(raw.charCodeAt(i) ^ 0x31);
    return out;
  }

  function start(imgs){
    tile = imgs[0].naturalWidth;
    var layout = decodeLayout();
    if(layout.length !== imgs.length || layout.some(function(v){ return v < 0 || v >= imgs.length; })){
      board.innerHTML = '<div class="err">раскладка отражения повреждена: фрагменты есть, но их порядок не восстановить.</div>';
      return;
    }
    // imgs[i] — фрагмент, который в правильной картинке стоит на позиции layout[i].
    var ordered = new Array(imgs.length);
    for (var i = 0; i < imgs.length; i++) ordered[layout[i]] = imgs[i];

    buildCells();
    shuffle(ordered.length);
    // привязываем загруженные изображения к позициям «правильного» фрагмента
    for (var k = 0; k < ordered.length; k++) state[k].img = ordered[state[k].t];
    render();
    msg('перетаскивай фрагменты мышью · клик по фрагменту — поворот на 90° по часовой стрелке');
  }

  var SHARDS = (window.MIRROR_SHARDS || []).slice();
  if(!SHARDS.length){
    board.innerHTML = '<div class="err">повреждённое отражение не содержит фрагментов.<br>проверь mirror/data.js — девять кусков должны быть на месте.</div>';
    return;
  }
  if(SHARDS.length !== GRID*GRID){
    board.innerHTML = '<div class="err">целостность отражения нарушена: найдено '+SHARDS.length+' фрагментов из '+GRID*GRID+'.</div>';
    return;
  }

  var loaded = 0, imgs = new Array(SHARDS.length), failed = false;
  SHARDS.forEach(function(src, i){
    var im = new Image();
    im.onload = function(){
      imgs[i] = im;
      loaded++;
      if(loaded === SHARDS.length && !failed) start(imgs);
    };
    im.onerror = function(){
      if(failed) return;
      failed = true;
      board.innerHTML = '<div class="err">один из фрагментов отражения не загрузился.<br>обнови страницу; если ошибка повторяется — канал #2 повреждён.</div>';
    };
    im.src = src;
  });
})();
