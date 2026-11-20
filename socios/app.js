"use strict";
(() => {
 const survey=window.AUVRIUN_SURVEY, API=String(window.AUVRIUN_SOCIOS_API||"").replace(/\/+$/,"");
 const questions=survey.sections.flatMap(s=>s.questions), Q=new Map(questions.map(q=>[q.id,q]));
 const el=id=>document.getElementById(id);
 const norm=s=>String(s||"").trim().replace(/\s+/g," ").toLocaleLowerCase("pt-BR");
 const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const data={slot:0,name:"",answers:{},completed:false,revision:0,section:0,code:"",records:[null,null,null],filtered:[],remoteBusy:false,adminKey:"",decisions:{}};
 let saveTimer, saveQueue=Promise.resolve(), lastError="";
 const setMsg=(id,s,error=false)=>{el(id).textContent=s;el(id).classList.toggle("error",!!error)};
 function localKey(id){return "auvriun-socios-v1-"+id}
 function getLocal(id){try{return JSON.parse(localStorage.getItem(localKey(id))||"null")}catch{return null}}
 function keepLocal(){if(!data.slot)return;try{localStorage.setItem(localKey(data.slot),JSON.stringify({format:"auvriun-acordo-v1",partner_id:data.slot,name:data.name,answers:data.answers,completed:data.completed,revision:data.revision,updated_at:new Date().toISOString()}))}catch{setMsg("saveStatus","Não foi possível guardar o rascunho neste dispositivo.",true)}}
 function isAnswered(q){return !!(data.answers[q.id]&&data.answers[q.id].choice)}
 function answered(){return questions.filter(isAnswered).length}
 function currentSectionComplete(i){return survey.sections[i].questions.every(isAnswered)}
 function showTab(tab){const response=tab==="response";el("responsePane").classList.toggle("hidden",!response);el("comparePane").classList.toggle("hidden",response);el("tabResponse").classList.toggle("active",response);el("tabCompare").classList.toggle("active",!response);if(!response)renderReport();}
 function activateMode(){
  el("onlineAuth").classList.toggle("hidden",!API);
  el("adminAuth").classList.toggle("hidden",!API);
  el("importArea").classList.toggle("hidden",!!API);
  el("modeNotice").textContent=API ? "Acesso protegido: informe seu código individual. O rascunho será sincronizado com o servidor e poderá ser retomado de outro dispositivo." : "Modo local provisório: suas respostas ficam somente neste navegador. Para entregá-las, use “Exportar resposta” e envie o arquivo JSON ao responsável. O salvamento central está pendente de configuração.";
  el("compareMode").textContent=API ? "Somente o administrador autorizado consegue visualizar a conciliação. A comparação online é liberada após as três respostas serem concluídas." : "Conciliação local: importe até três arquivos JSON exportados pelos sócios. Nenhuma resposta é publicada no GitHub ou enviada a um servidor.";
 }
 async function request(method,path,code,body){
  const r=await fetch(API+path,{method,headers:{"Authorization":"Bearer "+code, ...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined,cache:"no-store",mode:"cors"});
  let output={};try{output=await r.json()}catch{}if(!r.ok)throw new Error(output.error||("Erro HTTP "+r.status));
  return output;
 }
 async function enter(){
  const id=Number(el("partner").value),name=el("partnerName").value.trim(),code=el("partnerCode").value.trim();
  if(![1,2,3].includes(id))return setMsg("welcomeMsg","Escolha Sócio 1, 2 ou 3.",true);
  if(name.length<2)return setMsg("welcomeMsg","Informe seu nome.",true);
  if(API&&!code)return setMsg("welcomeMsg","Informe seu código de acesso.",true);
  el("start").disabled=true;setMsg("welcomeMsg","Abrindo resposta...");
  try{
   let remote=null;
   if(API){const me=await request("GET","/api/me",code);if(me.role!=="partner"||me.partner_id!==id)throw Error("O código informado não pertence ao sócio selecionado.");const output=await request("GET","/api/response",code);remote=output.response;}
   const draft=getLocal(id);
   data.slot=id;data.code=code;data.name=remote?.name || draft?.name || name;data.answers=remote?.answers||draft?.answers||{};
   data.completed=!!(remote?.completed ?? draft?.completed);data.revision=remote?.revision||0;data.section=0;
   if(!remote && !draft)data.name=name;
   el("partnerName").value=data.name;
   el("welcome").classList.add("hidden");el("surveyView").classList.remove("hidden");
   keepLocal();renderSurvey();setMsg("welcomeMsg","");
  }catch(e){setMsg("welcomeMsg",e.message,true)}finally{el("start").disabled=false}
 }
 function renderSurvey(){
  const s=survey.sections[data.section],done=answered(),all=done===questions.length;
  el("currentUser").textContent="Sócio "+data.slot+" • "+data.name;
  el("sectionTitle").textContent=(data.section+1)+". "+s.title;
  el("sectionDescription").textContent=s.description;
  el("sectionPosition").textContent="Tema "+(data.section+1)+" de "+survey.sections.length;
  el("answeredCount").textContent=done+" de "+questions.length+" perguntas respondidas";
  el("progressFill").style.width=(100*done/questions.length).toFixed(1)+"%";
  el("draftTag").textContent=data.completed?"Concluído":"Rascunho";
  el("draftTag").className="pill "+(data.completed?"green":"orange");
  const nav=el("sectionNav");nav.replaceChildren();
  survey.sections.forEach((sec,i)=>{const b=document.createElement("button");b.type="button";b.className="sectionbutton "+(i===data.section?"current " :"")+(currentSectionComplete(i)?"complete":"");b.textContent=(i+1)+". "+sec.title;b.onclick=()=>{data.section=i;renderSurvey();window.scrollTo({top:215,behavior:"smooth"})};nav.append(b)});
  const box=el("questions");box.replaceChildren();
  s.questions.forEach((q,i)=>{
   const card=document.createElement("article");card.className="question";
   const idx=questions.indexOf(q)+1, val=data.answers[q.id]||{};
   card.innerHTML="<h3>"+idx+". "+safe(q.prompt)+"</h3><p>"+safe(q.help)+"</p>";
   const choices=document.createElement("div");choices.className="choices";
   q.options.forEach((option,j)=>{
    const label=document.createElement("label");label.className="choice";
    const inp=document.createElement("input");inp.type="radio";inp.name="q_"+q.id;inp.value=option;inp.checked=val.choice===option;inp.disabled=data.completed;
    const span=document.createElement("span");span.textContent=option;
    inp.addEventListener("change",()=>{data.answers[q.id]={...(data.answers[q.id]||{}),choice:option};changed();renderSurveyPreservingFocus(q.id)});
    label.append(inp,span);choices.append(label);
   });
   const note=document.createElement("div");note.className="note field";const noteLabel=document.createElement("span");noteLabel.textContent="Comentários e proposta específica (opcional)";const area=document.createElement("textarea");area.rows=2;area.maxLength=2000;area.placeholder="Explique sua visão, valores, percentuais, prazos ou exceções...";area.value=val.comment||"";area.disabled=data.completed;
   area.addEventListener("input",()=>{data.answers[q.id]={...(data.answers[q.id]||{}),comment:area.value};changed(false)});
   note.append(noteLabel,area);card.append(choices,note);box.append(card);
  });
  el("prev").disabled=data.section===0;el("next").disabled=data.section===survey.sections.length-1;
  el("save").disabled=data.completed;el("finish").disabled=data.completed || !all;
  el("finish").textContent=data.completed?"Resposta concluída":"Concluir "+(all?"("+questions.length+"/"+questions.length+")":"("+done+"/"+questions.length+")");
  el("download").textContent="Exportar resposta";
 }
 function renderSurveyPreservingFocus(qid){const item=el("questions").querySelector('[name="q_'+qid+'"]:checked');const y=item?.getBoundingClientRect().top;renderSurvey();if(y!==undefined){const next=el("questions").querySelector('[name="q_'+qid+'"]:checked');if(next)window.scrollBy(0,next.getBoundingClientRect().top-y)}}
 function changed(schedule=true){keepLocal();setMsg("saveStatus",API?"Alterações locais pendentes de sincronização.":"Rascunho salvo neste navegador.");if(schedule&&API&&!data.completed){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveQueue=saveQueue.then(()=>saveRemote(false)).catch(()=>{})},1050)}updateProgressWithoutRebuild();}
 function updateProgressWithoutRebuild(){const done=answered();el("answeredCount").textContent=done+" de "+questions.length+" perguntas respondidas";el("progressFill").style.width=100*done/questions.length+"%";el("finish").disabled=data.completed||done!==questions.length;el("finish").textContent=data.completed?"Resposta concluída":"Concluir ("+done+"/"+questions.length+")";}
 async function saveRemote(finalize){
  if(!API)return true;
  const snapshot=JSON.stringify(data.answers),name=data.name;
  try{
   setMsg("saveStatus",finalize?"Finalizando resposta...":"Sincronizando...");
   const result=await request("PUT","/api/response",data.code,{name,answers:JSON.parse(snapshot),revision:data.revision,finalize:!!finalize});
   data.revision=result.response.revision;data.completed=!!result.response.completed;
   keepLocal();setMsg("saveStatus",data.completed?"Resposta concluída e salva no servidor.":"Salvo no servidor às "+new Date().toLocaleTimeString("pt-BR")+".");
   if(snapshot!==JSON.stringify(data.answers)&&!data.completed){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveQueue=saveQueue.then(()=>saveRemote(false)).catch(()=>{})},1000)}
   return true;
  }catch(e){setMsg("saveStatus","Não foi possível salvar no servidor: "+e.message,true);return false}
 }
 async function saveManually(){keepLocal();clearTimeout(saveTimer);if(API){await saveQueue;await saveRemote(false)}else setMsg("saveStatus","Rascunho salvo neste navegador. Exporte o JSON para compartilhar.");}
 async function finalize(){
  const pending=questions.filter(q=>!isAnswered(q));
  if(pending.length){data.section=survey.sections.findIndex(s=>s.questions.some(q=>pending.includes(q)));renderSurvey();return setMsg("saveStatus","Responda todas as questões, inclusive escolhendo “A definir em conjunto” quando necessário.",true)}
  if(!confirm("Concluir sua resposta? Após concluir, ela ficará bloqueada. O administrador poderá reabri-la se necessário."))return;
  clearTimeout(saveTimer);
  if(API){await saveQueue;const ok=await saveRemote(true);if(!ok)return;renderSurvey();}
  else{data.completed=true;keepLocal();renderSurvey();downloadAnswer();setMsg("saveStatus","Concluído localmente. O arquivo JSON foi gerado: envie ao responsável pela conciliação.")}
 }
 function filename(s){return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_-]+/gi,"_").slice(0,40)}
 function downloadBlob(content,filename,mime){const a=document.createElement("a"),blob=new Blob([content],{type:mime});a.href=URL.createObjectURL(blob);a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
 function downloadAnswer(){if(!data.slot)return;const out={format:"auvriun-acordo-v1",partner_id:data.slot,name:data.name,answers:data.answers,completed:data.completed,revision:data.revision,exported_at:new Date().toISOString()};downloadBlob(JSON.stringify(out,null,2),"AUVRIUN_socio_"+data.slot+"_"+filename(data.name)+".json","application/json;charset=utf-8")}
 function back(){clearTimeout(saveTimer);keepLocal();data.slot=0;data.code="";el("partnerCode").value="";el("welcome").classList.remove("hidden");el("surveyView").classList.add("hidden");setMsg("welcomeMsg","")}
 function statusFor(q,records){
  const picks=records.map(r=>r?.answers?.[q.id]?.choice||"");
  if(picks.some(v=>!v||v===survey.unassigned))return "pendente";
  const unique=new Set(picks.map(norm));
  return unique.size===1?"consenso":unique.size===2?"maioria":"divergencia";
 }
 function renderReport(){
  const records=data.records;
  if(!records.some(Boolean)){el("report").classList.add("hidden");return}
  el("report").classList.remove("hidden");
  el("reportDate").textContent="Gerado em "+new Date().toLocaleString("pt-BR");
  el("threeNames").textContent=[1,2,3].map(id=>"Sócio "+id+": "+(records[id-1]?.name||"Aguardando resposta")+(records[id-1]&&!records[id-1].completed?" (rascunho)":"")).join(" • ");
  const groups={consenso:0,maioria:0,divergencia:0,pendente:0},filter=el("filter").value,term=norm(el("search").value);
  for(const q of questions)groups[statusFor(q,records)]++;
  const names=[["consenso","Consensos"],["maioria","Posições 2 × 1"],["divergencia","Divergências"],["pendente","Pendências"]];
  el("counts").innerHTML=names.map(([key,label])=>'<div><strong>'+groups[key]+'</strong><span>'+label+'</span></div>').join("");
  const results=el("results");results.replaceChildren();
  const canConsolidate=records.every(r=>r&&r.completed);
  survey.sections.forEach((section,sidx)=>{
   let printedHeading=false;
   section.questions.forEach(q=>{
    const status=statusFor(q,records);
    if(filter!=="all"&&status!==filter)return;
    if(term&&!norm(section.title+" "+q.prompt+" "+q.help).includes(term))return;
    if(!printedHeading){const h=document.createElement("h2");h.style.marginTop="27px";h.textContent=(sidx+1)+". "+section.title;results.append(h);printedHeading=true;}
    const div=document.createElement("article");div.className="comparecard";
    const badges={consenso:["Consenso","green"],maioria:["2 × 1: discutir","orange"],divergencia:["Divergência","red"],pendente:["Pendente","orange"]};
    div.innerHTML="<span class='pill "+badges[status][1]+"'>"+badges[status][0]+"</span><h3>"+safe(q.prompt)+"</h3><div class='muted small'>"+safe(q.help)+"</div>";
    const cols=document.createElement("div");cols.className="comparecols";
    records.forEach((record,i)=>{
     const val=record?.answers?.[q.id]||{},cell=document.createElement("div");cell.className="comparecol";
     const who=document.createElement("div");who.className="who";who.textContent="SÓCIO "+(i+1)+(record?.name?" · "+record.name:"");
     const answer=document.createElement("div");answer.className="answer";answer.textContent=val.choice||"Sem resposta";if(!val.choice)answer.classList.add("missing");
     cell.append(who,answer);
     if(val.comment){const c=document.createElement("div");c.className="comment";c.textContent=val.comment;cell.append(c)}
     cols.append(cell);
    });
    div.append(cols);
    if(canConsolidate){
      const saved=data.decisions[q.id]||{decision_text:"",state:"pendente"};
      const editor=document.createElement("div");editor.className="stack";editor.style.marginTop="14px";
      const caption=document.createElement("label");caption.className="small";caption.style.fontWeight="800";caption.textContent="Decisão conciliada (registrada em reunião)";
      const textarea=document.createElement("textarea");textarea.rows=2;textarea.maxLength=4000;textarea.value=saved.decision_text||"";textarea.placeholder="Qual foi o texto negociado pelos três sócios?";
      const foot=document.createElement("div");foot.className="row";
      const selector=document.createElement("select");selector.style.maxWidth="300px";
      [["pendente","Ainda não negociado"],["proposta","Proposta para discussão"],["confirmado","Consenso confirmado em reunião"]].forEach(([value,label])=>{const opt=document.createElement("option");opt.value=value;opt.textContent=label;selector.append(opt)});
      selector.value=saved.state||"pendente";
      const save=document.createElement("button");save.type="button";save.className="btn secondary noprint";save.textContent="Salvar decisão";
      save.onclick=async()=>{save.disabled=true;try{await saveDecision(q.id,textarea.value,selector.value);save.textContent="Salvo";setTimeout(()=>{save.textContent="Salvar decisão"},1300)}catch(e){setMsg("compareMsg","Falha ao salvar decisão: "+e.message,true)}finally{save.disabled=false}};
      foot.append(selector,save);editor.append(caption,textarea,foot);
      const disclaimer=document.createElement("p");disclaimer.className="footnote";disclaimer.textContent="“Consenso confirmado” é registro administrativo, não assinatura dos sócios.";editor.append(disclaimer);
      div.append(editor);
    }
    results.append(div);
   });
  });
  if(!results.children.length){const p=document.createElement("p");p.className="muted";p.textContent="Nenhuma pergunta encontrada com esse filtro.";results.append(p)}
 }
 async function saveDecision(question_id,decision_text,state){
  const value={decision_text:decision_text.trim(),state};
  if(state!=="pendente"&&!value.decision_text)throw Error("Escreva a decisão antes de marcar como proposta ou confirmada.");
  if(API)await request("PUT","/api/decision",data.adminKey,{question_id,...value});
  data.decisions[question_id]=value;
  if(!API)localStorage.setItem("auvriun-socios-decisions-v1",JSON.stringify(data.decisions));
  setMsg("compareMsg","Decisão salva: "+(Q.get(question_id)?.prompt||question_id));
 }
 function exportJsonReport(){
  const out={format:"auvriun-conciliacao-v1",company:survey.company,generated_at:new Date().toISOString(),responses:data.records,decisions:data.decisions,questions:survey.sections};
  downloadBlob(JSON.stringify(out,null,2),"AUVRIUN_acordo_base_"+new Date().toISOString().slice(0,10)+".json","application/json;charset=utf-8");
 }
 async function compareOnline(){
  const code=el("adminCode").value.trim();
  if(!code)return setMsg("compareMsg","Informe o código de administração.",true);
  el("loadOnline").disabled=true;setMsg("compareMsg","Consultando respostas...");
  try{
   const me=await request("GET","/api/me",code);if(me.role!=="admin")throw Error("Código sem permissão de administrador.");
   data.adminKey=code;el("adminActions").classList.remove("hidden");
   const stats=await request("GET","/api/status",code);
   const done=stats.statuses.filter(x=>x.completed).length;
   if(done!==3){data.records=[null,null,null];el("report").classList.add("hidden");return setMsg("compareMsg",done+" de 3 sócios concluíram. A comparação ficará disponível quando os três finalizarem. "+stats.statuses.map(x=>"Sócio "+x.partner_id+": "+(x.completed?"concluído":"pendente")).join(" • "));}
   const out=await request("GET","/api/reconcile",code);data.records=[1,2,3].map(id=>out.responses.find(r=>r.partner_id===id)||null);
   data.adminKey=code;const records=await request("GET","/api/decisions",code);data.decisions=Object.fromEntries(records.decisions.map(d=>[d.question_id,d]));
   setMsg("compareMsg","Três respostas concluídas. Comparativo pronto.");renderReport();
  }catch(e){setMsg("compareMsg",e.message,true)}finally{el("loadOnline").disabled=false}
 }
 async function reopenPartner(){
  if(!API||!data.adminKey)return setMsg("compareMsg","Entre como administrador primeiro.",true);
  const id=Number(el("reopenPartner").value);
  if(!confirm("Reabrir a resposta do Sócio "+id+"? A conciliação ficará suspensa até que os três estejam concluídos novamente."))return;
  el("reopen").disabled=true;
  try{
   await request("POST","/api/reopen",data.adminKey,{partner_id:id});
   data.records=[null,null,null];el("report").classList.add("hidden");
   setMsg("compareMsg","Resposta do Sócio "+id+" reaberta com sucesso. Peça a ele para entrar novamente no questionário.");
  }catch(e){setMsg("compareMsg","Não foi possível reabrir: "+e.message,true)}
  finally{el("reopen").disabled=false}
 }
 async function importFiles(files){
  let good=0,errors=[];
  for(const f of files){
   try{
    if(f.size>150000)throw Error("arquivo muito grande");
    const obj=JSON.parse(await f.text());
    if(obj.format!=="auvriun-acordo-v1"||![1,2,3].includes(Number(obj.partner_id))||!obj.answers||typeof obj.answers!=="object"||Array.isArray(obj.answers))throw Error("formato inválido");
    const answers={};
    for(const [key,v] of Object.entries(obj.answers))if(Q.has(key)&&v&&typeof v.choice==="string"){answers[key]={choice:v.choice.slice(0,250),comment:typeof v.comment==="string"?v.comment.slice(0,2000):""}}
    data.records[Number(obj.partner_id)-1]={partner_id:Number(obj.partner_id),name:String(obj.name||"").slice(0,100),answers,completed:!!obj.completed};
    good++;
   }catch(e){errors.push(f.name+": "+e.message)}
  }
  const count=data.records.filter(Boolean).length;
  setMsg("compareMsg",good+" arquivo(s) importado(s). "+count+"/3 sócios representados."+(errors.length?" Erros: "+errors.join(" | "):""),errors.length>0);
  renderReport();
 }
 function csvEscape(value){
  let v=String(value??"");
  if(/^[=+\-@\t\r]/.test(v))v="'"+v;
  return '"'+v.replace(/"/g,'""')+'"';
 }
 function exportCsv(){
  const rows=[["Bloco","Pergunta","Situação","Sócio 1","Comentário 1","Sócio 2","Comentário 2","Sócio 3","Comentário 3","Decisão negociada","Estado da decisão"]];
  for(const section of survey.sections)for(const q of section.questions){
   const parts=data.records.map(r=>r?.answers?.[q.id]||{});
   rows.push([section.title,q.prompt,statusFor(q,data.records),parts[0].choice||"",parts[0].comment||"",parts[1].choice||"",parts[1].comment||"",parts[2].choice||"",parts[2].comment||"",data.decisions[q.id]?.decision_text||"",data.decisions[q.id]?.state||"pendente"]);
  }
  downloadBlob("\ufeff"+rows.map(row=>row.map(csvEscape).join(";")).join("\r\n"),"AUVRIUN_conciliacao_"+new Date().toISOString().slice(0,10)+".csv","text/csv;charset=utf-8");
 }
 el("tabResponse").addEventListener("click",()=>showTab("response"));el("tabCompare").addEventListener("click",()=>showTab("compare"));
 el("start").addEventListener("click",enter);el("save").addEventListener("click",saveManually);el("download").addEventListener("click",downloadAnswer);el("finish").addEventListener("click",finalize);
 el("prev").addEventListener("click",()=>{if(data.section>0){data.section--;renderSurvey();window.scrollTo({top:220,behavior:"smooth"})}});
 el("next").addEventListener("click",()=>{if(data.section<survey.sections.length-1){data.section++;renderSurvey();window.scrollTo({top:220,behavior:"smooth"})}});
 el("back").addEventListener("click",back);
 el("reopen").addEventListener("click",reopenPartner);
 el("loadOnline").addEventListener("click",compareOnline);el("files").addEventListener("change",e=>importFiles([...e.target.files]));
 el("filter").addEventListener("change",renderReport);el("search").addEventListener("input",renderReport);
 el("csv").addEventListener("click",exportCsv);el("reportJson").addEventListener("click",exportJsonReport);el("print").addEventListener("click",()=>window.print());
 try{data.decisions=JSON.parse(localStorage.getItem("auvriun-socios-decisions-v1")||"{}")}catch{};
 activateMode();
})();