(function(){
  function hash32bytes(arr){
    var h=5381>>>0;
    for(var i=0;i<arr.length;i++){ h=(Math.imul(h,33)+arr[i])>>>0; }
    return h>>>0;
  }
  function hash32str(s){ return hash32bytes(new TextEncoder().encode(s)); }
  function hash32hex(s){ return hash32str(s).toString(16).padStart(8,'0'); }
  function ks2(key,n){
    var kb=new TextEncoder().encode(key), out=new Uint8Array(n), i=0, off=0;
    while(off<n){
      var eb=new TextEncoder().encode(':'+i), arg=new Uint8Array(kb.length+eb.length);
      arg.set(kb); arg.set(eb,kb.length);
      var h=hash32bytes(arg);
      out[off++]=(h>>>24)&0xff; if(off>=n)break;
      out[off++]=(h>>>16)&0xff; if(off>=n)break;
      out[off++]=(h>>>8)&0xff;  if(off>=n)break;
      out[off++]=h&0xff;
      i++;
    }
    return out;
  }
  function b64bytes(s){ var a=atob(s), u=new Uint8Array(a.length); for(var i=0;i<a.length;i++)u[i]=a.charCodeAt(i); return u; }
  function decryptGate(v){
    try{
      var S=window.SECRETS||{}; if(!S.CT) return null;
      var ct=b64bytes(S.CT), ks=ks2(v,ct.length), pb=new Uint8Array(ct.length);
      for(var i=0;i<ct.length;i++) pb[i]=ct[i]^ks[i];
      var txt=new TextDecoder().decode(pb);
      if(S.MAGIC && txt.indexOf(S.MAGIC)===0) return txt.slice(S.MAGIC.length);
    }catch(e){}
    return null;
  }
  window.hash32bytes=hash32bytes; window.hash32str=hash32str; window.hash32hex=hash32hex;
  window.ks2=ks2; window.b64bytes=b64bytes; window.decryptGate=decryptGate;
})();
