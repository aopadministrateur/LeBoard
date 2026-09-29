// Deux appareils sur la meme base fictive : deux pages Chrome isolees (stockage local separe, comme deux
// telephones) dont les appels Firebase sont relayes vers une page « base » unique qui porte tests/mock.js.
// Aucun appel vers la production. Usage : node tests/deux-appareils.js   (code 1 si un seul point n'est pas vert)
const {spawn,execFileSync}=require('child_process'),fs=require('fs'),path=require('path');
const T=__dirname,REPO=path.dirname(T),OUT=path.join(T,'.out');fs.mkdirSync(OUT,{recursive:true});
const CHROME=process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',PORT=+process.env.PORT_CDP||9335;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const fileUrl=p=>'file:///'+p.split(path.sep).join('/');

// Pages : l'app (outils de tests/deux-appareils-page.js) et la base (le faux Firebase seul, regles strictes)
execFileSync(process.execPath,[path.join(T,'mkharness.js'),REPO,path.join(OUT,'deux.html')],{env:Object.assign({},process.env,{SCEN:'deux-appareils-page.js'})});
const seed=fs.readFileSync(path.join(T,'fixtures','leads-fictifs.json'),'utf8');
fs.writeFileSync(path.join(OUT,'base.html'),'<!doctype html><meta charset="utf-8"><script>'+fs.readFileSync(path.join(T,'mock.js'),'utf8').replace('__SEED_JSON__',JSON.stringify(seed))+'</script>');

(async()=>{
  const prof=path.join(OUT,'prof-deux-'+process.pid);
  const ch=spawn(CHROME,['--headless=new','--disable-gpu','--remote-debugging-port='+PORT,'--user-data-dir='+prof,'--allow-file-access-from-files','--no-first-run','about:blank'],{stdio:'ignore'});
  let ws,R={},ok=true;
  try{
    let v;for(let i=0;i<50&&!v;i++){await wait(200);try{v=await (await fetch('http://127.0.0.1:'+PORT+'/json/version')).json();}catch(e){}}
    ws=new WebSocket(v.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
    let n=0;const att={},ecoute=[];
    ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&att[d.id]){att[d.id](d);delete att[d.id];}else ecoute.forEach(f=>f(d));};
    const send=(method,params,sessionId)=>new Promise((res,rej)=>{const id=++n;att[id]=d=>d.error?rej(new Error(method+': '+d.error.message)):res(d.result);ws.send(JSON.stringify({id,method,params:params||{},sessionId}));});
    const ev=async(s,expr)=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true},s);if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?r.exceptionDetails.exception.description:r.exceptionDetails.text);return r.result.value;};
    const page=async(url,relais)=>{
      const {browserContextId}=await send('Target.createBrowserContext');
      const {targetId}=await send('Target.createTarget',{url:'about:blank',browserContextId});
      const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
      await send('Runtime.enable',{},sessionId);await send('Page.enable',{},sessionId);
      if(relais)await send('Runtime.addBinding',{name:'__relais'},sessionId);
      await send('Page.navigate',{url},sessionId);
      const pret=relais?'typeof __entrer':'typeof __RAW';
      for(let i=0;i<100;i++){await wait(100);try{if(await ev(sessionId,pret)!=='undefined')break;}catch(e){}}
      return sessionId;
    };
    const BASE=await page(fileUrl(path.join(OUT,'base.html'))+'#base_strict');
    // Relais : chaque appel Firebase d'un appareil est execute par la base, la reponse lui est rendue
    ecoute.push(async d=>{
      if(d.method!=='Runtime.bindingCalled'||d.params.name!=='__relais')return;
      const q=JSON.parse(d.params.payload);
      const r=await ev(BASE,'(async()=>{const r=await fetch('+JSON.stringify(q.url)+','+JSON.stringify(q.opt)+');return {s:r.status,t:await r.text()};})()');
      await ev(d.sessionId,'__relaisRep('+q.id+','+r.s+','+JSON.stringify(r.t)+')');
    });
    const A=await page(fileUrl(path.join(OUT,'deux.html'))+'#relais',true),B=await page(fileUrl(path.join(OUT,'deux.html'))+'#relais',true);
    R.connexion=await Promise.all([ev(A,"__entrer('florian@test.fr','pw-flo','1234')"),ev(B,"__entrer('henri@test.fr','pw-henri','4321')")]);
    R.connexion_ok=R.connexion.join()==='florian,henri';
    // Journal de la base : lectures du document par appareil depuis un repere
    const repere=()=>ev(BASE,'__NET.length');
    const lectures=async(depuis,doc,qui)=>ev(BASE,'__NET.slice('+depuis+').filter(l=>l.indexOf("GET '+doc+' @'+qui+'")===0).length');

    // ─── Indisponibilites ───
    const baseIndispo=async()=>ev(BASE,'JSON.parse(__RAW.indispo&&__RAW.indispo.data?__RAW.indispo.data.list.stringValue:"[]").map(c=>c.nom+" "+c.debut).sort().join(" | ")');
    await ev(A,'openProf()');await ev(B,'openProf()');
    let m=await repere();
    await ev(A,"__ajouterIndispo('2026-11-02','2026-11-03')");
    await ev(B,"__ajouterIndispo('2026-11-09','2026-11-10')"); // B n'a pas relu : sa copie ignore l'ajout de A
    R.i1_deux_ajouts={base:await baseIndispo(),lectures_A:await lectures(m,'indispo/data','u-flo'),lectures_B:await lectures(m,'indispo/data','u-henri')};
    R.i1_deux_ajouts_ok=R.i1_deux_ajouts.base==='Florian 2026-11-02 | Henri 2026-11-09'&&R.i1_deux_ajouts.lectures_A===1&&R.i1_deux_ajouts.lectures_B===1;
    m=await repere();
    await ev(A,"delConge(CONGES.find(c=>c.nom==='Florian').id)"); // A ignore l'ajout de B
    R.i2_suppression_perimee={base:await baseIndispo(),lectures_A:await lectures(m,'indispo/data','u-flo')};
    R.i2_suppression_perimee_ok=R.i2_suppression_perimee.base==='Henri 2026-11-09'&&R.i2_suppression_perimee.lectures_A===1;
    m=await repere();
    await Promise.all([ev(A,"__ajouterIndispo('2026-12-01','2026-12-02')"),ev(B,"__ajouterIndispo('2026-12-07','2026-12-08')")]);
    R.i3_simultanes={base:await baseIndispo(),refus_precondition:await ev(BASE,'__NET.slice('+m+').filter(l=>l.indexOf("PATCH indispo/data ")===0&&l.slice(-4)===" 400").length'),toasts_A:await ev(A,'__TOASTS.slice(-1)'),toasts_B:await ev(B,'__TOASTS.slice(-1)')};
    R.i3_simultanes_ok=R.i3_simultanes.base==='Florian 2026-12-01 | Henri 2026-11-09 | Henri 2026-12-07';

    // ─── Membres ───
    const baseMembres=async()=>ev(BASE,'Object.keys(JSON.parse(__RAW.membres.data.mbr.stringValue)).filter(k=>/^test|camille/.test(k)).sort().join(",")');
    m=await repere();
    await ev(A,"__ajouterMembre('Test A','collaborateur')");
    await ev(B,"__ajouterMembre('Test B','collaborateur')"); // B ignore l'ajout de A
    R.m1_deux_ajouts={base:await baseMembres(),lectures_A:await lectures(m,'membres/data','u-flo'),lectures_B:await lectures(m,'membres/data','u-henri')};
    R.m1_deux_ajouts_ok=R.m1_deux_ajouts.base==='camille,testa,testb'&&R.m1_deux_ajouts.lectures_A===1&&R.m1_deux_ajouts.lectures_B===1;
    await ev(A,"rmMbr('camille')"); // A ignore l'ajout de B
    R.m2_retrait_perime={base:await baseMembres()};
    R.m2_retrait_perime_ok=R.m2_retrait_perime.base==='testa,testb';
    m=await repere();
    await Promise.all([ev(A,"__ajouterMembre('Test C','collaborateur')"),ev(B,"__ajouterMembre('Test D','collaborateur')")]);
    R.m3_simultanes={base:await baseMembres(),refus_precondition:await ev(BASE,'__NET.slice('+m+').filter(l=>l.indexOf("PATCH membres/data ")===0&&l.slice(-4)===" 400").length'),toasts_A:await ev(A,'__TOASTS.slice(-1)'),toasts_B:await ev(B,'__TOASTS.slice(-1)')};
    R.m3_simultanes_ok=R.m3_simultanes.base==='testa,testb,testc,testd';

    // ─── Chantiers ───
    const baseC1=async()=>ev(BASE,'(()=>{const d=__RAW.chantiers.c1;const v=k=>d[k]?d[k].stringValue:"";return {statut:v("statut"),notes:v("notes"),client:v("client"),materiel:v("materiel")};})()');
    m=await repere();
    await ev(A,"editCh('c1')");await ev(B,"editCh('c1')"); // les deux ouvrent le meme chantier
    await ev(A,"document.getElementById('fnot').value='Notes de Florian';saveCh()");
    await ev(B,"document.getElementById('fsta').value='Confirme';saveCh()"); // le formulaire de B a les anciennes notes
    R.c1_deux_modifs={base:await baseC1(),lectures_A:await lectures(m,'chantiers/c1','u-flo'),lectures_B:await lectures(m,'chantiers/c1','u-henri')};
    R.c1_deux_modifs_ok=R.c1_deux_modifs.base.notes==='Notes de Florian'&&R.c1_deux_modifs.base.statut==='Confirme'&&R.c1_deux_modifs.lectures_A===1&&R.c1_deux_modifs.lectures_B===1;
    await ev(A,"editCh('c1')");await ev(B,"editCh('c1')");
    await Promise.all([ev(A,"document.getElementById('fcli').value='CLIENT A';saveCh()"),ev(B,"document.getElementById('fmat').value='Nacelle B';saveCh()")]);
    R.c2_simultanes={base:await baseC1(),refus_precondition:await ev(BASE,'__NET.slice('+m+').filter(l=>l.indexOf("PATCH chantiers/c1 ")===0&&l.slice(-4)===" 400").length'),ecritures_membres:await ev(BASE,'__NET.slice('+m+').filter(l=>l.indexOf("PATCH membres")===0).length')};
    R.c2_simultanes_ok=R.c2_simultanes.base.client==='CLIENT A'&&R.c2_simultanes.base.materiel==='Nacelle B'&&R.c2_simultanes.base.notes==='Notes de Florian'&&R.c2_simultanes.base.statut==='Confirme'&&R.c2_simultanes.ecritures_membres===0;

    R.erreurs_console_A=await ev(A,'(window.__ERR||[]).length');R.erreurs_console_B=await ev(B,'(window.__ERR||[]).length');
    R.console_ok=R.erreurs_console_A===0&&R.erreurs_console_B===0;
  }catch(e){R.exception=e.stack;ok=false;}
  for(const k in R)if(/_ok$/.test(k)&&R[k]!==true)ok=false;
  console.log(JSON.stringify(R,null,1));console.log(ok?'DEUX APPAREILS : OK':'DEUX APPAREILS : ECHEC');
  try{ws&&ws.close();}catch(e){}ch.kill();await wait(700);try{fs.rmSync(prof,{recursive:true,force:true});}catch(e){}
  process.exit(ok?0:1);
})();
