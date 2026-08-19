#!/usr/bin/env node

'use strict';
const fs = require('fs');
const path = require('path');

const SECRETS = path.join(__dirname, 'secrets.js');
const MAGIC = 'DEEPLEAK_FINAL::';


function hash32bytes(arr){
  let h = 5381 >>> 0;
  for (let i = 0; i < arr.length; i++) h = (Math.imul(h, 33) + arr[i]) >>> 0;
  return h >>> 0;
}
function textBytes(s){ return new TextEncoder().encode(s); }


function ks2(key, n){
  const kb = textBytes(key);
  const out = new Uint8Array(n);
  let i = 0, off = 0;
  while (off < n){
    const eb = textBytes(':' + i);
    const arg = new Uint8Array(kb.length + eb.length);
    arg.set(kb); arg.set(eb, kb.length);
    const h = hash32bytes(arg);
    out[off++] = (h >>> 24) & 0xff; if (off >= n) break;
    out[off++] = (h >>> 16) & 0xff; if (off >= n) break;
    out[off++] = (h >>> 8)  & 0xff; if (off >= n) break;
    out[off++] =  h         & 0xff;
    i++;
  }
  return out;
}

function b64e(u){ return Buffer.from(u).toString('base64'); }
function b64d(s){ return new Uint8Array(Buffer.from(s, 'base64')); }


function encrypt(flag, plaintext){
  const msg = MAGIC + plaintext;
  const mb = textBytes(msg);
  const ks = ks2(flag, mb.length);
  const ct = new Uint8Array(mb.length);
  for (let i = 0; i < mb.length; i++) ct[i] = mb[i] ^ ks[i];
  return b64e(ct);
}


function decrypt(flag, ctB64){
  const ct = b64d(ctB64);
  const ks = ks2(flag, ct.length);
  const pb = new Uint8Array(ct.length);
  for (let i = 0; i < ct.length; i++) pb[i] = ct[i] ^ ks[i];
  const txt = new TextDecoder().decode(pb);
  return txt.startsWith(MAGIC) ? txt.slice(MAGIC.length) : null;
}


function readSecrets(){
  const s = fs.readFileSync(SECRETS, 'utf8');
  const m = s.match(/CT:\s*"([^"]*)"/);
  if (!m) throw new Error('поле CT не найдено в secrets.js');
  return { src:s, ct:m[1] };
}
function writeSecrets(src, newCt){
  const out = src.replace(/(CT:\s*")[^"]*(")/, '$1' + newCt + '$2');
  fs.writeFileSync(SECRETS, out);
}

/* ---- CLI ---- */
function parseArgs(argv){
  const o = {};
  for (let i = 2; i < argv.length; i++){
    const a = argv[i];
    if (a === '--flag')   o.flag = argv[++i];
    else if (a === '--text')   o.text = argv[++i];
    else if (a === '--verify') o.verify = true;
    else if (a === '--help' || a === '-h') o.help = true;
  }
  return o;
}

function main(){
  const args = parseArgs(process.argv);
  if (args.help || (!args.flag && !args.verify)){
    console.log(`
build-final.js — (пере)генерация финала квеста

  Зашифровать новый финальный текст:
    node build-final.js --flag "offzone{итоговый_флаг}" --text final.txt

  Проверить, что текущий CT расшифровывается флагом:
    node build-final.js --verify --flag "offzone{итоговый_флаг}"

  --flag   итоговый флаг, который игрок соберёт из фрагментов 1..9
  --text   путь к .txt с финальной историей (кодировка UTF-8)
`);
    return;
  }

  if (args.verify){
    const { ct } = readSecrets();
    const r = decrypt(args.flag, ct);
    if (r === null){ console.log('НЕВЕРНО: CT этим флагом не расшифровывается.'); process.exit(1); }
    console.log('ВЕРНО. Расшифрованный финал:\n');
    console.log(r);
    return;
  }

  if (!args.text){ console.error('нужен --text файл с финальным текстом'); process.exit(1); }
  const plain = fs.readFileSync(path.resolve(args.text), 'utf8');
  const newCt = encrypt(args.flag, plain);
  const { src } = readSecrets();
  writeSecrets(src, newCt);
  console.log('Готово. CT в secrets.js обновлён.');
  console.log('Длина шифротекста:', Buffer.from(newCt, 'base64').length, 'байт');
  console.log('\nПроверка:');
  const back = decrypt(args.flag, newCt);
  console.log(back === plain ? '  расшифровка совпадает с исходным текстом ✓' : '  ОШИБКА: расшифровка не совпала ✗');
}

main();
