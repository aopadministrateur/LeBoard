// Ecritures conditionnelles (updateTime) : un second appareil (Henri) ecrit dans la base fictive pendant que
// l'app (Florian) garde une copie perimee. Modes : e_indispo_strict, e_membres_strict, e_chantiers_strict.
// 1. copie perimee  2. ecriture concurrente entre la lecture et l'ecriture  3. echec apres 3 essais
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const log=(k,v)=>{window.__OUT=window.__OUT||{};__OUT[k]=v;};
window.addEventListener('error',e=>{(window.__ERR=window.__ERR||[]).push(e.message);});
function done(){const pre=document.createElement('pre');pre.id='testout';pre.textContent=JSON.stringify({out:window.__OUT,errors:window.__ERR||[]},null,1);document.body.appendChild(pre);}
const MODE_E=location.hash.slice(1);
const TOASTS=[];const toast0=window.toast;window.toast=function(m){TOASTS.push(m);return toast0(m);};

// Appareil B : ecrit directement dans la base fictive avec son propre compte (sans precondition)
const fetch0=window.fetch;let tokB=null;
async function entrerB(){const r=await fetch0('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=x',{method:'POST',body:JSON.stringify({email:'henri@test.fr',password:'pw-henri'})});tokB=(await r.json()).idToken;}
async function lireB(col,id){const r=await fetch0(FB_BASE+'/'+col+'/'+id,{headers:{Authorization:'Bearer '+tokB}});return r.ok?fbParseDoc((await r.json()).fields||{}):null;}
async function ecrireB(col,id,champs){const r=await fetch0(FB_BASE+'/'+col+'/'+id+'?updateMask.fieldPaths='+Object.keys(champs).join('&updateMask.fieldPaths='),{method:'PATCH',headers:{Authorization:'Bearer '+tokB},body:JSON.stringify({fields:fbEncodeDoc(champs)})});return r.ok;}
async function supprimerB(col,id){const r=await fetch0(FB_BASE+'/'+col+'/'+id,{method:'DELETE',headers:{Authorization:'Bearer '+tokB}});return r.ok;}

// Interception des ecritures de l'app : avant chacune des n prochaines, B ecrit (concurrence) ou le reseau tombe
let piege=null;
window.fetch=async function(url,opt){
  if(piege&&piege.n>0&&opt&&opt.method==='PATCH'&&String(url).indexOf('/'+piege.cible+'?')>=0){
    piege.n--;
    if(piege.type==='reseau')throw new TypeError('Failed to fetch');
    await piege.avant();
  }
  return fetch0.apply(this,arguments);
};
// Journal du faux Firebase : lectures et ecritures de l'app depuis un repere
const repere=()=>__NET.length;
const compte=(depuis,re)=>__NET.slice(depuis).filter(l=>re.test(l)&&l.indexOf('@u-henri')<0).length;
const ids=l=>l.map(c=>c.id).sort().join(',');

async function entrer(){
  await wait(2700);
  document.getElementById('au-email').value='florian@test.fr';document.getElementById('au-pwd').value='pw-flo';await authLogin();await wait(50);
  for(const d of '1234')pk(d);await wait(400);for(const d of '1234')pk(d);await wait(800);
  for(let i=0;i<50&&!CH.find(c=>c.id==='c1');i++)await wait(100);
  clearInterval(fbPollInterval);fbPollInterval=null; // plus de relecture : la copie locale reste perimee
  await entrerB();
}

// ─── Indisponibilites ───
async function indispo(){
  const H1={id:1,nom:'Henri',debut:'2026-11-02',fin:'2026-11-03'},H2={id:2,nom:'Henri',debut:'2026-11-09',fin:'2026-11-10'};
  const baseListe=async()=>JSON.parse((await lireB('indispo','data')||{}).list||'[]');
  const ajouter=async(d,f)=>{document.getElementById('cong-deb').value=d;document.getElementById('cong-fin').value=f;await addConge();};
  openProf();
  // 1. Copie perimee : B cree sa liste, l'app (qui ne l'a pas relue) ajoute puis supprime
  await ecrireB('indispo','data',{list:JSON.stringify([H1])});
  let n=repere();TOASTS.length=0;
  await ajouter('2026-12-01','2026-12-02');
  let b=await baseListe();const f1=b.find(c=>c.nom==='Florian');
  log('1_ajout',{base:ids(b),lectures:compte(n,/^GET indispo\/data /),ecritures:compte(n,/^PATCH indispo\/data .*200$/),toasts:TOASTS.slice()});
  log('1_ajout_ok',!!f1&&!!b.find(c=>c.id===1)&&b.length===2&&compte(n,/^GET indispo\/data /)===1&&compte(n,/^PATCH indispo/)===1&&ids(CONGES)===ids(b)&&TOASTS.join()==='Indisponibilité ajoutée !'&&document.getElementById('cong-deb').value==='');
  await ecrireB('indispo','data',{list:JSON.stringify(b.concat([H2]))});
  n=repere();TOASTS.length=0;
  await delConge(f1.id);
  b=await baseListe();
  log('1_suppression',{base:ids(b),lectures:compte(n,/^GET indispo\/data /),toasts:TOASTS.slice()});
  log('1_suppression_ok',ids(b)==='1,2'&&compte(n,/^GET indispo\/data /)===1&&ids(CONGES)==='1,2'&&TOASTS.join()==='Indisponibilité supprimée');
  // 2. B ecrit entre la lecture et l'ecriture de l'app : refus FAILED_PRECONDITION, nouvel essai, rien de perdu
  piege={cible:'indispo/data',n:1,avant:async()=>{const l=await baseListe();l.push({id:3,nom:'Henri',debut:'2026-11-16',fin:'2026-11-17'});await ecrireB('indispo','data',{list:JSON.stringify(l)});}};
  n=repere();TOASTS.length=0;
  await ajouter('2026-12-07','2026-12-08');
  b=await baseListe();
  log('2_concurrence',{base:ids(b),lectures:compte(n,/^GET indispo\/data /),refus:compte(n,/^PATCH indispo\/data .*400$/),toasts:TOASTS.slice()});
  log('2_concurrence_ok',b.length===4&&!!b.find(c=>c.id===3)&&b.filter(c=>c.nom==='Florian').length===1&&compte(n,/^GET indispo\/data /)===2&&compte(n,/^PATCH indispo\/data .*400$/)===1&&ids(CONGES)===ids(b)&&TOASTS.join()==='Indisponibilité ajoutée !');
  // 3a. Concurrence a chaque essai : echec apres 3 essais, message, copie locale realignee, aucun faux succes
  let k=10;
  piege={cible:'indispo/data',n:3,avant:async()=>{const l=await baseListe();l.push({id:k++,nom:'Henri',debut:'2026-12-20',fin:'2026-12-21'});await ecrireB('indispo','data',{list:JSON.stringify(l)});}};
  n=repere();TOASTS.length=0;
  await ajouter('2027-01-04','2027-01-05');
  b=await baseListe();
  log('3_echec_concurrence',{base:ids(b),local:ids(CONGES),essais:compte(n,/^PATCH indispo\/data /),toasts:TOASTS.slice(),champ:document.getElementById('cong-deb').value});
  log('3_echec_concurrence_ok',compte(n,/^PATCH indispo\/data .*400$/)===3&&!b.find(c=>c.debut==='2027-01-04')&&ids(CONGES)===ids(b)&&TOASTS.length===1&&/^Échec/.test(TOASTS[0])&&document.getElementById('cong-deb').value==='2027-01-04');
  // 3b. Reseau coupe a chaque essai : meme resultat, la base ne change pas
  const avant=ids(b);const fx=CONGES.find(c=>c.nom==='Florian');
  piege={cible:'indispo/data',n:3,type:'reseau'};
  TOASTS.length=0;
  await delConge(fx.id);
  b=await baseListe();
  log('3_echec_reseau',{base:ids(b),local:ids(CONGES),toasts:TOASTS.slice()});
  log('3_echec_reseau_ok',ids(b)===avant&&ids(CONGES)===avant&&TOASTS.length===1&&/^Échec/.test(TOASTS[0]));
  piege=null;
}

// ─── Membres et maitres d'oeuvre (document membres/data) ───
async function membres(){
  window.askConfirm=async()=>true;
  const MBR0=JSON.parse(JSON.stringify(MBR)),MOE0=JSON.parse(JSON.stringify(MOE));
  const base=async()=>{const d=await lireB('membres','data');return {mbr:d&&d.mbr?JSON.parse(d.mbr):{},moe:d&&d.moe?JSON.parse(d.moe):{}};};
  // B modifie les listes en base (en partant de la base, ou des listes par defaut si le document n'existe pas)
  const modifB=async f=>{const d=await lireB('membres','data');const mbr=d&&d.mbr?JSON.parse(d.mbr):JSON.parse(JSON.stringify(MBR0));const moe=d&&d.moe?JSON.parse(d.moe):JSON.parse(JSON.stringify(MOE0));f(mbr,moe);await ecrireB('membres','data',{mbr:JSON.stringify(mbr),moe:JSON.stringify(moe)});};
  const ajouter=async(nom,role)=>{document.getElementById('newname').value=nom;document.getElementById('newrole').value=role;await addMbr();};
  const aligne=b=>JSON.stringify(Object.keys(MBR).sort())===JSON.stringify(Object.keys(b.mbr).sort())&&JSON.stringify(Object.keys(MOE).sort())===JSON.stringify(Object.keys(b.moe).sort());
  // 1. Copie perimee : B ajoute Zoe ; l'app (qui l'ignore) ajoute Test A, puis retire Zoe apres un ajout de B
  await modifB(m=>{m.zoe={name:'Zoe',color:'#3BB8A8',role:'collaborateur'};});
  let n=repere();TOASTS.length=0;
  await ajouter('Test A','collaborateur');
  let b=await base();
  log('1_ajout',{zoe:!!b.mbr.zoe,testa:!!b.mbr.testa,lectures:compte(n,/^GET membres\/data /),ecritures:compte(n,/^PATCH membres\/data .*200$/),toasts:TOASTS.slice()});
  log('1_ajout_ok',!!b.mbr.zoe&&!!b.mbr.testa&&compte(n,/^GET membres\/data /)===1&&compte(n,/^PATCH membres/)===1&&aligne(b)&&TOASTS.join()==='Test A ajouté !'&&document.getElementById('newname').value==='');
  await modifB((m,o)=>{o.societeb={name:'Société B',color:'#4A90D9'};});
  MBR.zoe=MBR.zoe||b.mbr.zoe; // l'app voit Zoe (liste affichee) mais ignore Société B
  n=repere();TOASTS.length=0;
  await rmMbr('zoe');
  b=await base();
  log('1_retrait',{zoe:!!b.mbr.zoe,testa:!!b.mbr.testa,societeb:!!b.moe.societeb,lectures:compte(n,/^GET membres\/data /),toasts:TOASTS.slice()});
  log('1_retrait_ok',!b.mbr.zoe&&!!b.mbr.testa&&!!b.moe.societeb&&compte(n,/^GET membres\/data /)===1&&aligne(b)&&TOASTS.join()==='Zoe retiré');
  // 1b. Maitre d'oeuvre cree depuis le formulaire chantier : enregistre tout de suite, sans perdre celui de B
  await modifB((m,o)=>{o.societec={name:'Société C',color:'#2D9E5F'};});
  openModCh();openM('modmoe');document.getElementById('moe-name').value='Société D';
  n=repere();TOASTS.length=0;
  await saveMoe();
  b=await base();
  log('1_moe_formulaire',{societec:!!b.moe.societec,societed:!!b.moe.societed,choisi:document.getElementById('fche').value,modale_moe_fermee:!document.getElementById('modmoe').classList.contains('open'),toasts:TOASTS.slice()});
  log('1_moe_formulaire_ok',!!b.moe.societec&&!!b.moe.societed&&document.getElementById('fche').value==='Société D'&&!document.getElementById('modmoe').classList.contains('open')&&compte(n,/^GET membres\/data /)===1&&TOASTS.join()==='Société D ajouté !');
  closeM('modch');
  // 1c. Deja ajoute par B : refus sans ecriture, copie locale realignee
  await modifB(m=>{m.lea={name:'Lea',color:'#C67AB8',role:'collaborateur'};});
  n=repere();TOASTS.length=0;
  await ajouter('Lea','collaborateur');
  b=await base();
  log('1_doublon',{ecritures:compte(n,/^PATCH membres/),lea_local:!!MBR.lea,toasts:TOASTS.slice()});
  log('1_doublon_ok',compte(n,/^PATCH membres/)===0&&!!MBR.lea&&aligne(b)&&TOASTS.join()==='Ce membre existe déjà');
  // 2. B ecrit entre la lecture et l'ecriture de l'app : nouvel essai, rien de perdu
  piege={cible:'membres/data',n:1,avant:()=>modifB(m=>{m.yann={name:'Yann',color:'#7BB5E8',role:'collaborateur'};})};
  n=repere();TOASTS.length=0;
  await ajouter('Test C','collaborateur');
  b=await base();
  log('2_concurrence',{yann:!!b.mbr.yann,testc:!!b.mbr.testc,lectures:compte(n,/^GET membres\/data /),refus:compte(n,/^PATCH membres\/data .*400$/),toasts:TOASTS.slice()});
  log('2_concurrence_ok',!!b.mbr.yann&&!!b.mbr.testc&&compte(n,/^GET membres\/data /)===2&&compte(n,/^PATCH membres\/data .*400$/)===1&&aligne(b)&&TOASTS.join()==='Test C ajouté !');
  // 3a. Concurrence a chaque essai : echec, message, copie realignee, saisie conservee
  let k=0;
  piege={cible:'membres/data',n:3,avant:()=>modifB(m=>{m['b'+(k++)]={name:'B'+k,color:'#7BB5E8',role:'collaborateur'};})};
  n=repere();TOASTS.length=0;
  await ajouter('Test D','collaborateur');
  b=await base();
  log('3_echec_concurrence',{testd:!!b.mbr.testd,refus:compte(n,/^PATCH membres\/data .*400$/),b2_local:!!MBR.b2,toasts:TOASTS.slice(),champ:document.getElementById('newname').value});
  log('3_echec_concurrence_ok',!b.mbr.testd&&!MBR.testd&&compte(n,/^PATCH membres\/data .*400$/)===3&&!!MBR.b2&&aligne(b)&&TOASTS.length===1&&/^Échec/.test(TOASTS[0])&&document.getElementById('newname').value==='Test D');
  // 3b. Reseau coupe : le retrait echoue, rien ne change
  piege={cible:'membres/data',n:3,type:'reseau'};
  TOASTS.length=0;
  await rmMbr('testa');
  b=await base();
  log('3_echec_reseau',{testa_base:!!b.mbr.testa,testa_local:!!MBR.testa,toasts:TOASTS.slice()});
  log('3_echec_reseau_ok',!!b.mbr.testa&&!!MBR.testa&&aligne(b)&&TOASTS.length===1&&/^Échec/.test(TOASTS[0]));
  piege=null;
  // 4. Enregistrer un chantier (modification ou creation) n'ecrit plus la liste des membres
  n=repere();
  editCh('c1');document.getElementById('fnot').value='Note test membres';await saveCh();
  openModCh();document.getElementById('fnom').value='Chantier test';document.getElementById('fdeb').value='2026-11-20';document.getElementById('ffin').value='2026-11-21';
  bldTypeSel();document.getElementById('ftyp').value='Facade';document.getElementById('fsta').value='Prevu';document.getElementById('fche').value='KGiR';document.getElementById('fctv').value='Florian';
  await saveCh();
  log('4_chantier_sans_membres',{ecritures_membres:compte(n,/^PATCH membres/),ecritures_chantiers:compte(n,/^PATCH chantiers/)});
  log('4_chantier_sans_membres_ok',compte(n,/^PATCH membres/)===0&&compte(n,/^PATCH chantiers\/.* 200$/)===2);
}

async function scenario(){
  await entrer();
  if(MODE_E.indexOf('e_indispo')===0)await indispo();
  if(MODE_E.indexOf('e_membres')===0)await membres();
  done();
}
scenario().catch(e=>{(window.__ERR=window.__ERR||[]).push('SCENARIO '+e.stack);done();});
