/**
 * AUVRIUN · Questionário de acordo societário
 * Cloudflare Worker + D1. Não colocar códigos individuais no repositório.
 * Endpoint de diagnóstico: GET /api/health.
 */
const ALLOWED_ORIGINS = new Set(["https://auvriun.com","https://www.auvriun.com"]);
const REQUIRED_ANSWERS = 61;
const PARTNER_NAMES={1:"Adivelto",2:"Julio",3:"Richard"};
const enc = new TextEncoder();

function headers(origin){
 const h={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Vary":"Origin"};
 if(ALLOWED_ORIGINS.has(origin)){
  h["Access-Control-Allow-Origin"]=origin;
  h["Access-Control-Allow-Methods"]="GET, PUT, POST, OPTIONS";
  h["Access-Control-Allow-Headers"]="Authorization, Content-Type";
  h["Access-Control-Max-Age"]="600";
 }
 return h;
}
function respond(data,status=200,origin=""){return new Response(JSON.stringify(data),{status,headers:headers(origin)})}
async function hash(s){return new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(s)))}
function equal(a,b){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff |=a[i]^b[i];return diff===0}
async function identify(request,env){
 const auth=request.headers.get("Authorization")||"";
 const match=/^Bearer ([A-Za-z0-9_\-.]{16,256})$/.exec(auth);
 if(!match)return null;
 const digest=await hash(match[1]);
 const list=[["admin",0,env.ADMIN_KEY],["partner",1,env.SOCIO_1_KEY],["partner",2,env.SOCIO_2_KEY],["partner",3,env.SOCIO_3_KEY]];
 let selected=null;
 for(const [role,partner_id,secret] of list){
  if(typeof secret==="string" && secret.length>=16 && equal(digest,await hash(secret)))selected={role,partner_id};
 }
 return selected;
}
async function readBody(req){
 const text=await req.text();
 if(text.length>140000)throw Error("O envio excede o tamanho permitido.");
 try{return JSON.parse(text)}catch{throw Error("JSON inválido.")}
}
function validAnswers(answers){
 if(!answers||Array.isArray(answers)||typeof answers!=="object")return false;
 const keys=Object.keys(answers);
 if(keys.length>100)return false;
 return keys.every(k=>{
  const a=answers[k];
  return /^[a-z][a-z0-9_]{1,70}$/.test(k)&&a&&!Array.isArray(a)&&typeof a==="object"&&typeof a.choice==="string"&&a.choice.length<=240&&(a.comment===undefined||(typeof a.comment==="string"&&a.comment.length<=2000));
 });
}
function parseResponse(row){
 return row?{partner_id:row.partner_id,name:PARTNER_NAMES[row.partner_id],answers:JSON.parse(row.answers),completed:!!row.completed,revision:row.revision,updated_at:row.updated_at,completed_at:row.completed_at}:null;
}
async function statusData(env){
 const rows=(await env.DB.prepare("SELECT partner_id,completed,updated_at,answers FROM societary_answers ORDER BY partner_id").all()).results||[];
 return [1,2,3].map(id=>{
  const r=rows.find(x=>x.partner_id===id);
  let answered_count=0;
  if(r){
   try{
    const a=JSON.parse(r.answers);
    if(a&&typeof a==="object"&&!Array.isArray(a))answered_count=Object.values(a).filter(item=>item&&typeof item.choice==="string"&&item.choice.trim()!=="").length;
   }catch{answered_count=0}
  }
  return {partner_id:id,name:PARTNER_NAMES[id],completed:!!r?.completed,has_draft:!!r,answered_count:Math.min(REQUIRED_ANSWERS,answered_count),total_questions:REQUIRED_ANSWERS,updated_at:r?.updated_at||null};
 });
}
async function audit(env,partner_id,action,revision){
 await env.DB.prepare("INSERT INTO societary_audit (partner_id,action,revision) VALUES (?,?,?)").bind(partner_id,action,revision).run();
}
export default {
 async fetch(request,env){
  const origin=request.headers.get("Origin")||"";
  const url=new URL(request.url);
  if(origin&&!ALLOWED_ORIGINS.has(origin))return respond({error:"Origem não permitida."},403,origin);
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:headers(origin)});
  if(url.pathname==="/api/health"){
   let database_configured=false;
   let keys_configured=!!(env.ADMIN_KEY&&env.SOCIO_1_KEY&&env.SOCIO_2_KEY&&env.SOCIO_3_KEY);
   if(env.DB){
    try{
     const rows=(await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('societary_answers','societary_audit','societary_decisions','societary_decision_history')").all()).results||[];
     database_configured=rows.length===4;
    }catch{database_configured=false}
   }
   return respond({ok:database_configured&&keys_configured,service:"auvriun-socios",database_configured,access_configured:keys_configured},database_configured&&keys_configured?200:503,origin);
  }
  if(!env.DB)return respond({error:"Banco D1 ainda não configurado."},503,origin);
  try{
   const actor=await identify(request,env);
   if(!actor)return respond({error:"Código de acesso inválido."},401,origin);
   if(url.pathname==="/api/me"&&request.method==="GET")return respond(actor,200,origin);
   if(url.pathname==="/api/status"&&request.method==="GET"){
     if(actor.role!=="admin")return respond({error:"Acompanhamento restrito ao administrador."},403,origin);
     return respond({statuses:await statusData(env)},200,origin);
    }
   if(url.pathname==="/api/response"&&request.method==="GET"){
    if(actor.role!=="partner")return respond({error:"Somente os sócios podem acessar a própria resposta."},403,origin);
    const row=await env.DB.prepare("SELECT * FROM societary_answers WHERE partner_id=?").bind(actor.partner_id).first();
    return respond({response:parseResponse(row)},200,origin);
   }
   if(url.pathname==="/api/response"&&request.method==="PUT"){
    if(actor.role!=="partner")return respond({error:"Administrador não edita respostas dos sócios."},403,origin);
    const body=await readBody(request);
    const name=PARTNER_NAMES[actor.partner_id];
    const revision=body.revision;
    const finalize=body.finalize===true;
    if(name.length<2||name.length>100)return respond({error:"Nome inválido."},400,origin);
    if(!Number.isInteger(revision)||revision<0)return respond({error:"Revisão inválida."},400,origin);
    if(!validAnswers(body.answers))return respond({error:"Formato das respostas inválido."},400,origin);
    if(finalize&&Object.values(body.answers).filter(v=>v.choice&&v.choice.trim()).length<REQUIRED_ANSWERS)return respond({error:"Responda as 61 perguntas antes de concluir."},400,origin);
    const old=await env.DB.prepare("SELECT revision,completed FROM societary_answers WHERE partner_id=?").bind(actor.partner_id).first();
    if(old?.completed)return respond({error:"Sua resposta está concluída e bloqueada. Solicite reabertura ao administrador."},409,origin);
    const answers=JSON.stringify(body.answers);const completed=finalize?1:0;
    let newrevision;
    if(!old){
     if(revision!==0)return respond({error:"Conflito de revisão: recarregue sua resposta."},409,origin);
     try{
      await env.DB.prepare("INSERT INTO societary_answers(partner_id,display_name,answers,completed,revision,updated_at,completed_at) VALUES(?,?,?,?,1,datetime('now'),CASE WHEN ?=1 THEN datetime('now') ELSE NULL END)")
       .bind(actor.partner_id,name,answers,completed,completed).run();
      newrevision=1;
     }catch{return respond({error:"Resposta alterada em outro dispositivo. Recarregue antes de salvar."},409,origin)}
    }else{
     const result=await env.DB.prepare("UPDATE societary_answers SET display_name=?,answers=?,completed=?,revision=revision+1,updated_at=datetime('now'),completed_at=CASE WHEN ?=1 THEN datetime('now') ELSE NULL END WHERE partner_id=? AND revision=? AND completed=0")
      .bind(name,answers,completed,completed,actor.partner_id,revision).run();
     if(!result.meta?.changes)return respond({error:"Sua resposta foi alterada em outro dispositivo. Recarregue para evitar sobrescrever."},409,origin);
     newrevision=revision+1;
    }
    await audit(env,actor.partner_id,finalize?"finalize":"save",newrevision);
    const latest=await env.DB.prepare("SELECT * FROM societary_answers WHERE partner_id=?").bind(actor.partner_id).first();
    return respond({response:parseResponse(latest)},200,origin);
   }
   if(url.pathname==="/api/reconcile"&&request.method==="GET"){
    if(actor.role!=="admin")return respond({error:"Conciliação restrita ao administrador."},403,origin);
    const statuses=await statusData(env);
    if(statuses.some(s=>!s.completed))return respond({error:"A conciliação só será aberta após os três sócios concluírem as respostas.",statuses},409,origin);
    const rows=(await env.DB.prepare("SELECT * FROM societary_answers ORDER BY partner_id").all()).results||[];
    return respond({responses:rows.map(parseResponse)},200,origin);
   }
   if(url.pathname==="/api/decisions"&&request.method==="GET"){
    if(actor.role!=="admin")return respond({error:"Decisões restritas ao administrador."},403,origin);
    const rows=(await env.DB.prepare("SELECT question_id,decision_text,state,updated_at FROM societary_decisions ORDER BY question_id").all()).results||[];
    return respond({decisions:rows},200,origin);
   }
   if(url.pathname==="/api/decision"&&request.method==="PUT"){
    if(actor.role!=="admin")return respond({error:"Decisões restritas ao administrador."},403,origin);
    const statuses=await statusData(env);
    if(statuses.some(s=>!s.completed))return respond({error:"Finalize as três respostas antes de registrar a conciliação."},409,origin);
    const body=await readBody(request);
    const question=String(body.question_id||""),decision=String(body.decision_text||"").trim(),state=String(body.state||"pendente");
    if(!/^[a-z][a-z0-9_]{1,70}$/.test(question)||decision.length>4000||!["pendente","proposta","confirmado"].includes(state)||((state==="proposta"||state==="confirmado")&&!decision))return respond({error:"Informações da decisão inválidas."},400,origin);
    await env.DB.prepare("INSERT INTO societary_decisions (question_id,decision_text,state,updated_at) VALUES (?,?,?,datetime('now')) ON CONFLICT(question_id) DO UPDATE SET decision_text=excluded.decision_text,state=excluded.state,updated_at=datetime('now')").bind(question,decision,state).run();
    await env.DB.prepare("INSERT INTO societary_decision_history (question_id,decision_text,state) VALUES (?,?,?)").bind(question,decision,state).run();
    return respond({ok:true,question_id:question,state},200,origin);
   }
   if(url.pathname==="/api/reopen"&&request.method==="POST"){
    if(actor.role!=="admin")return respond({error:"Operação restrita ao administrador."},403,origin);
    const body=await readBody(request);const id=Number(body.partner_id);
    if(![1,2,3].includes(id))return respond({error:"Identificador de sócio inválido."},400,origin);
    const result=await env.DB.prepare("UPDATE societary_answers SET completed=0,completed_at=NULL,revision=revision+1,updated_at=datetime('now') WHERE partner_id=? AND completed=1").bind(id).run();
    if(!result.meta?.changes)return respond({error:"O sócio ainda não concluiu ou não tem resposta."},409,origin);
    const row=await env.DB.prepare("SELECT revision FROM societary_answers WHERE partner_id=?").bind(id).first();
    await audit(env,id,"reopen",row.revision);
    return respond({ok:true,partner_id:id,message:"Resposta reaberta. O sócio deverá acessar novamente para recarregá-la."},200,origin);
   }
   return respond({error:"Endpoint não encontrado."},404,origin);
  }catch(e){
   if(e.message==="JSON inválido."||e.message.includes("excede"))return respond({error:e.message},400,origin);
   return respond({error:"Falha ao processar a solicitação. Verifique a configuração e tente novamente."},500,origin);
  }
 }
};