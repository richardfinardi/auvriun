/* AUVRIUN WhatsApp Hub • Cloudflare Worker • Z-API Omni.
   Credenciais SOMENTE em Secrets Cloudflare. Nunca colocar tokens no GitHub ou em páginas. */
const PREFIX = "/whatsapp";
const API = "https://api.omni.z-api.io/v1/channels/";
const ORIGINS = new Set(["https://auvriun.com", "https://www.auvriun.com"]);
const TXT = new TextEncoder();
const MAX_HISTORY_AGE = 60 * 24 * 3600;

function json(value, status=200, origin="") {
  const headers = {"content-type":"application/json; charset=utf-8","cache-control":"no-store",
    "x-content-type-options":"nosniff","vary":"Origin"};
  if (ORIGINS.has(origin)) headers["access-control-allow-origin"] = origin;
  return new Response(JSON.stringify(value), {status, headers});
}
function fail(message, status=400, origin="") { return json({ok:false,error:message},status,origin); }
function validSlug(value) { return typeof value === "string" && /^[a-z][a-z0-9_-]{1,39}$/.test(value); }
function digits(value) { return String(value??"").replace(/\D/g,""); }
function phone(value) { const s=digits(value); return /^\d{10,15}$/.test(s)?s:null; }
function limitText(value, max) { return String(value??"").trim().slice(0,max); }
async function hash(value) {
  const a=new Uint8Array(await crypto.subtle.digest("SHA-256",TXT.encode(value)));
  return Array.from(a,b=>b.toString(16).padStart(2,"0")).join("");
}
function secureEqual(a,b) {
  if (a.length!==b.length || !a.length) return false;
  let d=0; for(let i=0;i<a.length;i++) d|=a.charCodeAt(i)^b.charCodeAt(i);
  return d===0;
}
async function authorizedAdmin(req,env) {
  const expected=String(env.AUVRIUN_ADMIN_KEY||"");
  const got=req.headers.get("x-auvriun-admin-key")||"";
  if(expected.length<32 || got.length<32 || got.length>512)return false;
  return secureEqual(await hash(expected),await hash(got));
}
async function readJson(request) {
  const length=Number(request.headers.get("content-length")||0);
  if(length>30000)throw new Error("Corpo acima do limite");
  const body=await request.text();
  if(body.length>30000)throw new Error("Corpo acima do limite");
  try { return JSON.parse(body); } catch { throw new Error("JSON inválido"); }
}
async function appRead(env,id) {
  const raw=await env.AUVRIUN_KV.get("app:"+id);
  return raw?JSON.parse(raw):null;
}

/* Credenciais de instâncias adicionais, cadastradas no painel. Criptografia AES-GCM
   com chave derivada do Secret administrativo preexistente no Worker.
   Não alterar AUVRIUN_ADMIN_KEY sem migrar os registros criptografados. */
async function vaultKey(env){
  const secret=String(env.AUVRIUN_ADMIN_KEY||"");
  if(secret.length<32)throw Error("Configure AUVRIUN_ADMIN_KEY");
  const base=await crypto.subtle.importKey("raw",TXT.encode(secret),"HKDF",false,["deriveKey"]);
  return crypto.subtle.deriveKey({
    name:"HKDF",hash:"SHA-256",salt:TXT.encode("auvriun-whatsapp-vault-v1"),
    info:TXT.encode("wapi-credentials")
  },base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
function bytesBase64(bytes){
  let raw="";for(const byte of bytes)raw+=String.fromCharCode(byte);
  return btoa(raw);
}
function base64Bytes(value){
  return Uint8Array.from(atob(value),x=>x.charCodeAt(0));
}
async function encryptCredentials(env,instanceId,token){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const data=TXT.encode(JSON.stringify({instanceId,token}));
  const encrypted=await crypto.subtle.encrypt({name:"AES-GCM",iv},await vaultKey(env),data);
  return JSON.stringify({v:1,iv:bytesBase64(iv),data:bytesBase64(new Uint8Array(encrypted))});
}
async function decryptCredentials(env,encrypted){
  const x=JSON.parse(encrypted);
  if(x.v!==1)throw Error("Formato de credenciais desconhecido");
  const bytes=await crypto.subtle.decrypt({name:"AES-GCM",iv:base64Bytes(x.iv)},
    await vaultKey(env),base64Bytes(x.data));
  return JSON.parse(new TextDecoder().decode(bytes));
}
function safeInstanceId(input){
  const value=String(input||"").trim();
  if(!/^[A-Za-z0-9_-]{6,100}$/.test(value))throw Error("ID da instância W-API inválido");
  return value;
}
async function providerCredentials(env,app){
  if(app.provider!=="WAPI")return {provider:"OMNI"};
  const encrypted=await env.AUVRIUN_KV.get("provider:wapi:"+app.id);
  if(encrypted){
    const decoded=await decryptCredentials(env,encrypted);
    return {provider:"WAPI",instanceId:safeInstanceId(decoded.instanceId),token:decoded.token,source:"app"};
  }
  const instanceId=String(env.WAPI_INSTANCE_ID||"").trim(),token=String(env.WAPI_TOKEN||"").trim();
  if(!instanceId||!token)throw Error("Configure a W-API no painel da aplicação ou Secrets globais");
  return {provider:"WAPI",instanceId:safeInstanceId(instanceId),token,source:"global"};
}

function validateApp(id,input,previous) {
  if(!validSlug(id))throw new Error("Código da aplicação inválido: minúsculas, números e hífen");
  if(!input||typeof input!=="object"||Array.isArray(input))throw new Error("Aplicação inválida");
  const name=limitText(input.name,80);
  if(name.length<2)throw new Error("Informe o nome da aplicação");
  const brand= input.brand==="CONSULTORIARF" ? "CONSULTORIARF" : "AUVRIUN";
  const provider=input.provider==="WAPI"?"WAPI":"OMNI";
  const recipients=Array.isArray(input.recipients)?input.recipients:[];
  if(recipients.length>30)throw new Error("Máximo de 30 destinatários por aplicação");
  const seen=new Set();
  const normalized=recipients.map((r,i)=>{
    const n=phone(r?.phone);
    if(!n||seen.has(n))throw new Error("Telefone inválido ou duplicado na linha "+(i+1));
    seen.add(n);
    return {name:limitText(r.name,80)||"Contato "+(i+1),phone:n,active:r.active!==false};
  });
  const events=Array.isArray(input.events)?input.events:[];
  if(events.length<1||events.length>30)throw new Error("Informe de 1 a 30 eventos autorizados");
  const eventIds=new Set();
  const normalizedEvents=events.map((e,i)=>{
    const event=limitText(e?.id,60);
    if(!/^[a-z][a-z0-9_]{2,59}$/.test(event)||eventIds.has(event))
      throw new Error("Evento inválido ou duplicado na linha "+(i+1));
    eventIds.add(event);
    const mode=e?.mode==="TEMPLATE"?"TEMPLATE":"TEXT";
    let content=null;
    if(mode==="TEMPLATE"){
      if(!e.content||e.content.type!=="TEMPLATE"||!e.content.body||typeof e.content.body!=="object")
        throw new Error("Evento "+event+": informe o conteúdo TEMPLATE aprovado pela Meta");
      const encoded=JSON.stringify(e.content);
      if(encoded.length>12000)throw new Error("Template muito grande");
      content=e.content;
    }
    return {id:event,mode,text:limitText(e?.text,4000),content,active:e.active!==false};
  });
  return {id,name,brand,provider,active:input.active!==false,recipients:normalized,events:normalizedEvents,
    keyHash:previous?.keyHash||null,createdAt:previous?.createdAt||new Date().toISOString(),
    updatedAt:new Date().toISOString()};
}
function publicApp(a) {
  const {keyHash,...safe}=a;
  return {...safe,hasKey:!!keyHash};
}
function newKey() {
  const arr=crypto.getRandomValues(new Uint8Array(32));
  let s=""; for(const b of arr)s+=String.fromCharCode(b);
  return "auv_"+btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function interpolate(obj, vars) {
  if(typeof obj==="string")return obj.replace(/\{\{([a-zA-Z0-9_]{1,40})\}\}/g,(_,key)=>
    Object.prototype.hasOwnProperty.call(vars,key)?String(vars[key]).slice(0,500):"");
  if(Array.isArray(obj))return obj.map(x=>interpolate(x,vars));
  if(obj&&typeof obj==="object")return Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,interpolate(v,vars)]));
  return obj;
}
function historyKey(){
  return "hist:"+String(9999999999999-Date.now()).padStart(13,"0")+":"+crypto.randomUUID();
}
async function sendOne(env,app,event,recipient,content,reference,origin,providerConfig) {
  const key=historyKey(),started=new Date().toISOString();
  const record={id:key,app:app.id,event:event.id,reference:limitText(reference,100),
    recipient:recipient.name,phoneFinal:recipient.phone.slice(-4),provider:app.provider||"OMNI",createdAt:started,
    status:"REQUESTED",messageId:null,http:null};
  try {
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),12000);
    let response;
    try {
      if(app.provider==="WAPI"){
        response=await fetch("https://api.w-api.app/v1/message/send-text?instanceId="+encodeURIComponent(providerConfig.instanceId),{
          method:"POST",headers:{"content-type":"application/json",
            "authorization":"Bearer "+providerConfig.token},
          body:JSON.stringify({phone:recipient.phone,message:content.body.message}),
          signal:controller.signal
        });
      }else{
        response=await fetch(API+encodeURIComponent(String(env.OMNI_CHANNEL_ID))+"/messages",{
          method:"POST",headers:{"content-type":"application/json",
            "authorization":"Bearer "+env.OMNI_SECRET_KEY},
          body:JSON.stringify({recipient:{identifier:recipient.phone},content}),signal:controller.signal
        });
      }
    }finally{clearTimeout(timer);}
    const raw=(await response.text()).slice(0,5000);
    let result={};try{result=JSON.parse(raw)||{};}catch{}
    const id=result.messageId||result.data?.messageId||result.id||result.data?.id||result.key?.id||null;
    record.messageId=id?String(id).slice(0,120):null;
    record.http=response.status;
    const rejected=result.ok===false||result.success===false||result.error===true||
      typeof result.error==="string"&&!!result.error||result.status===false;
    record.status=response.ok&&!rejected?"ACCEPTED":"REJECTED";
    if(record.status==="REJECTED"){
      const providerMessage=
        typeof result.message==="string"?result.message:
        typeof result.error==="string"?result.error:
        typeof result.error?.message==="string"?result.error.message:
        typeof result.data?.message==="string"?result.data.message:
        typeof result.details==="string"?result.details:"Falha sem detalhe do provedor";
      // Nunca reproduzir credenciais que um upstream possa incluir na mensagem de erro.
      const safeMessage=String(providerMessage).replace(/Bearer\s+[^\s"'<>]+/gi,"Bearer [oculto]")
        .replace(/(?:token|api[_-]?key|secret)\s*[:=]\s*[^\s,;"'<>]+/gi,"credencial=[oculta]");
      record.error="HTTP "+response.status+" - "+limitText(safeMessage,180);
    }
    if(record.messageId && record.status==="ACCEPTED")
      await env.AUVRIUN_KV.put("message:"+record.messageId,key,{expirationTtl:MAX_HISTORY_AGE});
  }catch(error){record.status="ERROR";record.error=limitText(error?.message||error,200);}
  try{await env.AUVRIUN_KV.put(key,JSON.stringify(record),{expirationTtl:MAX_HISTORY_AGE});}
  catch(error){console.error("AUVRIUN HISTORICO NAO GRAVADO",String(error));}
  console.log("AUVRIUN ENVIO",JSON.stringify({app:app.id,event:event.id,final:record.phoneFinal,
    status:record.status,http:record.http,messageId:record.messageId}));
  return {recipient:record.recipient,phoneFinal:record.phoneFinal,
    status:record.status,http:record.http,messageId:record.messageId,error:record.error||null};
}
async function dispatch(env,app,payload) {
  if(!app?.active)throw new Error("Aplicação desativada ou inexistente");
  if(!app.keyHash && !payload.__admin)throw new Error("Aplicação sem chave");
  const event=app.events.find(e=>e.id===payload.event&&e.active);
  if(!event)throw new Error("Evento não autorizado para a aplicação");
  if(app.provider==="WAPI"){
    if(event.mode!=="TEXT")throw new Error("A W-API requer evento do tipo Texto");
  }else if(!env.OMNI_SECRET_KEY || !env.OMNI_CHANNEL_ID){
    throw new Error("Configure OMNI_SECRET_KEY e OMNI_CHANNEL_ID");
  }
  let selected=app.recipients.filter(r=>r.active);
  if(payload.only!==undefined){
    if(!Array.isArray(payload.only)||payload.only.length>30)throw new Error("Seleção de destinatários inválida");
    const requested=new Set(payload.only.map(digits));
    if(requested.size!==payload.only.length)throw new Error("Destinatários duplicados");
    if(app.recipients.some(r=>requested.has(r.phone)&&!r.active) || selected.filter(r=>requested.has(r.phone)).length!==requested.size)
      throw new Error("Somente destinatários ativos cadastrados podem receber");
    selected=selected.filter(r=>requested.has(r.phone));
  }
  if(!selected.length)throw new Error("Nenhum destinatário ativo");
  if(selected.length>30)throw new Error("Destinatários acima do limite");
  const custom=payload.variables&&typeof payload.variables==="object"&&!Array.isArray(payload.variables)?payload.variables:{};
  // A marca pertence à aplicação e não pode ser alterada por quem chama a API.
  const brand=app.brand==="CONSULTORIARF" ? "CONSULTORIA RF" : "AUVRIUN";
  const vars={...custom,marca:brand};
  if(Object.keys(vars).length>40||JSON.stringify(vars).length>5000)throw new Error("Variáveis acima do limite");
  let content;
  if(event.mode==="TEMPLATE")content=interpolate(event.content,vars);
  else {
    // Mensagem específica do evento é permitida apenas para aplicações autenticadas.
    const text=limitText(interpolate(payload.message||event.text,vars),4000);
    if(!text)throw new Error("Informe message ou texto padrão do evento");
    content={type:"TEXT",body:{message:text}};
  }
  const providerConfig=await providerCredentials(env,app);
  const results=await Promise.all(selected.map(r=>sendOne(env,app,event,r,content,payload.reference,"",providerConfig)));
  const accepted=results.filter(r=>r.status==="ACCEPTED").length;
  const firstFailure=results.find(r=>r.status!=="ACCEPTED");
  return {ok:accepted>0,app:app.id,event:event.id,
    requested:results.length,accepted,
    provider:app.provider||"OMNI",
    ...(accepted===0?{error:"Nenhum envio aceito pela "+(app.provider==="WAPI"?"W-API":"Omni")+
      ". "+(firstFailure?.error||("HTTP "+(firstFailure?.http||"indisponível")))}:{}),
    note:"ACCEPTED significa aceite pela API, não comprova entrega no WhatsApp.",results};
}
async function webhook(request,env) {
  const secret=String(env.OMNI_WEBHOOK_SIGNING_SECRET||"");
  if(!secret)return new Response("Webhook não configurado",{status:503});
  const sig=request.headers.get("x-webhook-signature")||"";
  const idem=request.headers.get("x-idempotency-key")||"";
  const t=sig.match(/(?:^|,)\s*t=(\d+)(?:,|$)/),v=sig.match(/(?:^|,)\s*v1=([a-fA-F0-9]{64})(?:,|$)/);
  const p=idem.match(/^(.*):([^:]+):([^:]+)$/);
  if(!t||!v||!p||Math.abs(Date.now()/1000-Number(t[1]))>300)return new Response("Assinatura ausente ou expirada",{status:401});
  // Para assinatura, usa corpo descomprimido como na integração ANFEER existente.
  let body=new Uint8Array(await request.arrayBuffer());
  if(body.length>200000)return new Response("Corpo excessivo",{status:413});
  if(request.headers.get("content-encoding")?.toLowerCase()==="gzip"){
    body=new Uint8Array(await new Response(new Blob([body]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
  }
  const prefix=TXT.encode([t[1],p[1],p[2],p[3],""].join("\n"));
  const canonical=new Uint8Array(prefix.length+body.length);canonical.set(prefix);canonical.set(body,prefix.length);
  const key=await crypto.subtle.importKey("raw",TXT.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signed=new Uint8Array(await crypto.subtle.sign("HMAC",key,canonical));
  const expected=Array.from(signed,x=>x.toString(16).padStart(2,"0")).join("");
  if(!secureEqual(expected,v[1].toLowerCase())){
    console.error("AUVRIUN WEBHOOK 401","HMAC_DIVERGENTE");
    return new Response("Assinatura inválida",{status:401});
  }
  let parsed;try{parsed=JSON.parse(new TextDecoder().decode(body));}catch{return new Response("JSON inválido",{status:400});}
  const events=Array.isArray(parsed)?parsed:[parsed];
  for(const e of events.slice(0,40)){
    const msg=e?.message||e?.data?.message||e?.data||{};
    const items=[...(Array.isArray(msg.contents)?msg.contents:[]),...(Array.isArray(msg.attachments)?msg.attachments:[])];
    const states=items.flatMap(x=>Array.isArray(x.state_items)?x.state_items:[])
      .map(x=>String(x?.state?.name||x?.state||"")).filter(Boolean);
    const id=String(msg._id||msg.messageId||e?.messageId||msg.id||"").slice(0,120);
    const state=limitText(e?.status||e?.state?.name||msg?.status||states.at(-1)||"UNKNOWN",60).toUpperCase();
    if(id){
      const histKey=await env.AUVRIUN_KV.get("message:"+id);
      if(histKey){
        const raw=await env.AUVRIUN_KV.get(histKey);
        if(raw){
          const existing=JSON.parse(raw);
          existing.status=state;existing.updatedAt=new Date().toISOString();
          await env.AUVRIUN_KV.put(histKey,JSON.stringify(existing),{expirationTtl:MAX_HISTORY_AGE});
        }
      }
    }
    console.log("AUVRIUN OMNI WEBHOOK",JSON.stringify({messageId:id,state,event:limitText(e?.type||e?.event||"status",70)}));
  }
  return new Response("ok",{status:200});
}
export default {
  async fetch(req,env){
    const u=new URL(req.url),origin=req.headers.get("origin")||"";
    const path=u.pathname.startsWith(PREFIX+"/")?u.pathname.slice(PREFIX.length):u.pathname===PREFIX?"/":u.pathname;
    if(req.method==="OPTIONS"){
      if(!ORIGINS.has(origin))return fail("Origem não autorizada",403,origin);
      return new Response(null,{status:204,headers:{"access-control-allow-origin":origin,
        "access-control-allow-methods":"GET, POST, PUT, DELETE, OPTIONS",
        "access-control-allow-headers":"Content-Type, Authorization, X-AUVRIUN-ADMIN-KEY",
        "access-control-max-age":"600","vary":"Origin"}});
    }
    if(path==="/webhook/omni"&&req.method==="POST"){
      try{return await webhook(req,env);}catch(e){console.error("AUVRIUN WEBHOOK",String(e));return new Response("Falha no webhook",{status:500});}
    }
    if(path==="/health"&&req.method==="GET")
      return json({ok:true,service:"AUVRIUN WhatsApp Hub",kv:!!env.AUVRIUN_KV,providerConfigured:!!(env.OMNI_SECRET_KEY&&env.OMNI_CHANNEL_ID),omniConfigured:!!(env.OMNI_SECRET_KEY&&env.OMNI_CHANNEL_ID),wapiConfigured:!!(env.WAPI_TOKEN&&env.WAPI_INSTANCE_ID)},200,origin);
    if(!env.AUVRIUN_KV)return fail("Vincule o KV AUVRIUN_KV ao Worker",503,origin);
    if(path.startsWith("/admin/")){
      if(!await authorizedAdmin(req,env))return fail("Chave administrativa inválida",401,origin);
      try {
        if(path==="/admin/apps"&&req.method==="GET"){
          const keys=await env.AUVRIUN_KV.list({prefix:"app:",limit:500});
          const apps=(await Promise.all(keys.keys.map(k=>appRead(env,k.name.slice(4))))).filter(Boolean);
          return json({ok:true,apps:apps.map(publicApp)},200,origin);
        }
        if(path==="/admin/history"&&req.method==="GET"){
          const listed=await env.AUVRIUN_KV.list({prefix:"hist:",limit:Math.min(500,Math.max(20,Number(u.searchParams.get("scan")||200)))});
          const rows=(await Promise.all(listed.keys.map(k=>env.AUVRIUN_KV.get(k.name)))).filter(Boolean).map(x=>JSON.parse(x));
          const only=u.searchParams.get("app");
          return json({ok:true,history:rows.filter(r=>!only||r.app===only).slice(0,100)},200,origin);
        }
        const providerRoute=path.match(/^\/admin\/apps\/([a-z][a-z0-9_-]{1,39})\/provider$/);
        if(providerRoute){
          const id=providerRoute[1],existing=await appRead(env,id);
          if(!existing)return fail("Aplicação não encontrada",404,origin);
          if(req.method==="GET"){
            const stored=await env.AUVRIUN_KV.get("provider:wapi:"+id);
            return json({ok:true,source:stored?"app":env.WAPI_TOKEN&&env.WAPI_INSTANCE_ID?"global":"none",
              configured:!!stored||!!(env.WAPI_TOKEN&&env.WAPI_INSTANCE_ID),
              instanceId:stored?"(instância própria)":env.WAPI_INSTANCE_ID||""},200,origin);
          }
          if(req.method==="PUT"){
            const data=await readJson(req);
            const instanceId=safeInstanceId(data.instanceId);
            const token=String(data.token||"").trim();
            if(token.length<16||token.length>1000)throw Error("Token W-API inválido: informe o Token de Acesso da instância");
            const sealed=await encryptCredentials(env,instanceId,token);
            await env.AUVRIUN_KV.put("provider:wapi:"+id,sealed);
            return json({ok:true,configured:true,source:"app",instanceId:"(instância própria)"},200,origin);
          }
          if(req.method==="DELETE"){
            await env.AUVRIUN_KV.delete("provider:wapi:"+id);
            return json({ok:true,configured:!!(env.WAPI_TOKEN&&env.WAPI_INSTANCE_ID),
              source:env.WAPI_TOKEN&&env.WAPI_INSTANCE_ID?"global":"none"},200,origin);
          }
        }
        const m=path.match(/^\/admin\/apps\/([a-z][a-z0-9_-]{1,39})(?:\/(key|test))?$/);
        if(m){
          const id=m[1],operation=m[2],existing=await appRead(env,id);
          if(!operation&&req.method==="PUT"){
            const app=validateApp(id,await readJson(req),existing);
            await env.AUVRIUN_KV.put("app:"+id,JSON.stringify(app));
            return json({ok:true,app:publicApp(app)},200,origin);
          }
          if(operation==="key"&&req.method==="POST"){
            if(!existing)return fail("Cadastre a aplicação antes de gerar a chave",404,origin);
            const apiKey=newKey();existing.keyHash=await hash(apiKey);existing.updatedAt=new Date().toISOString();
            await env.AUVRIUN_KV.put("app:"+id,JSON.stringify(existing));
            return json({ok:true,key:apiKey,warning:"Copie agora. Esta chave não será exibida novamente."},200,origin);
          }
          if(operation==="test"&&req.method==="POST"){
            if(!existing)return fail("Aplicação não encontrada",404,origin);
            const p=await readJson(req);
            const result=await dispatch(env,{...existing,keyHash:existing.keyHash||"admin"},{
              event:p.event,message:p.message,variables:p.variables||{},reference:"admin-test",__admin:true,
              only:p.only});
            return json(result,result.ok?200:502,origin);
          }
        }
        return fail("Rota administrativa não encontrada",404,origin);
      }catch(e){return fail(limitText(e?.message||e,200),400,origin);}
    }
    if(path==="/v1/send"&&req.method==="POST"){
      try{
        const p=await readJson(req);
        if(!validSlug(p?.app))return fail("Aplicação inválida",400,origin);
        const app=await appRead(env,p.app),key=(req.headers.get("authorization")||"").match(/^Bearer (auv_[A-Za-z0-9_-]{40,90})$/);
        if(!app||!app.keyHash||!key||!secureEqual(app.keyHash,await hash(key[1])))
          return fail("Credencial da aplicação inválida",401,origin);
        const result=await dispatch(env,app,p);
        return json(result,result.ok?200:502,origin);
      }catch(e){return fail(limitText(e?.message||e,200),400,origin);}
    }
    return fail("Rota não encontrada",404,origin);
  }
};
