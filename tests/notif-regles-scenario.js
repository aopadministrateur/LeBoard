// Regle des notifications (mode r_strict, miroir de firestore.rules) : creation reservee aux referents,
// en leur propre nom, champs autorises uniquement, texte < 500 caracteres ; la notification de l'app passe toujours.
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const log=(k,v)=>{window.__OUT=window.__OUT||{};__OUT[k]=v;};
window.addEventListener('error',e=>{(window.__ERR=window.__ERR||[]).push(e.message);});
function done(){const pre=document.createElement('pre');pre.id='testout';pre.textContent=JSON.stringify({out:window.__OUT,errors:window.__ERR||[]},null,1);document.body.appendChild(pre);}
const T='Dupont & Fils <SARL> "Nord" l\'atelier';
const fetch0=window.fetch;
async function jeton(email,pwd){const r=await fetch0('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=x',{method:'POST',body:JSON.stringify({email:email,password:pwd})});return (await r.json()).idToken;}
// Meme requete que sendPushNotif (POST sur la collection)
async function creer(tok,champs){const r=await fetch0(FB_BASE+'/notifications',{method:'POST',headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json'},body:JSON.stringify({fields:fbEncodeDoc(champs)})});return r.status;}
const notif=o=>Object.assign({title:'Nouveau chantier',body:'Texte',from:'florian',targetRole:'referent',read:[],ts:new Date().toISOString()},o);
const nbNotifs=()=>Object.keys(__RAW.notifications||{}).length;

async function scenario(){
  await wait(2700);
  const tTony=await jeton('tony@test.fr','pw-tony'),tFlo=await jeton('florian@test.fr','pw-flo'),tHenri=await jeton('henri@test.fr','pw-henri');
  const R={
    collaborateur:await creer(tTony,notif({from:'tony'})),
    referent:await creer(tFlo,notif({})),
    referent_au_nom_d_un_autre:await creer(tFlo,notif({from:'henri'})),
    champ_non_autorise:await creer(tFlo,notif({html:'x'})),
    texte_499:await creer(tFlo,notif({body:'a'.repeat(499)})),
    texte_500:await creer(tFlo,notif({body:'a'.repeat(500)})),
    sans_auteur:await creer(tFlo,{title:'Nouveau chantier',body:'Texte',targetRole:'all',read:[],ts:new Date().toISOString()})};
  log('1_creations_REST',R);
  log('1_collaborateur_refuse_ok',R.collaborateur===403);
  log('1_referent_accepte_ok',R.referent===200&&R.texte_499===200);
  log('1_controles_ok',R.referent_au_nom_d_un_autre===403&&R.champ_non_autorise===403&&R.texte_500===403&&R.sans_auteur===403);
  // 2. Notification de l'app : creation d'un chantier par un referent (sendPushNotif)
  await creer(tHenri,notif({from:'henri',targetRole:'all',body:T}));
  document.getElementById('au-email').value='florian@test.fr';document.getElementById('au-pwd').value='pw-flo';await authLogin();await wait(50);
  for(const d of '1234')pk(d);await wait(400);for(const d of '1234')pk(d);await wait(1800);nouvClose();
  const avant=nbNotifs();
  openModCh();document.getElementById('fnom').value='Chantier notif';document.getElementById('fdeb').value='2026-11-20';document.getElementById('ffin').value='2026-11-21';
  bldTypeSel();document.getElementById('ftyp').value='Facade';document.getElementById('fsta').value='Prevu';document.getElementById('fche').value='KGiR';document.getElementById('fctv').value='Florian';
  await saveCh();for(let i=0;i<40&&nbNotifs()===avant;i++)await wait(100);
  const der=Object.values(__RAW.notifications).map(n=>({from:n.from&&n.from.stringValue,body:n.body&&n.body.stringValue})).find(n=>/Chantier notif/.test(n.body||''));
  log('2_notification_app',{creee:nbNotifs()===avant+1,from:der&&der.from,refus:__NET.filter(l=>/^POST notifications .* 403$/.test(l)&&l.indexOf('@u-flo')>=0).length});
  log('2_notification_app_ok',nbNotifs()===avant+1&&!!der&&der.from==='florian');
  // 3. Notification au texte special (creee par Henri) : affichee en texte, rien d'interprete
  const t=document.getElementById('notifcont').textContent;
  log('3_affichage_texte_ok',t.indexOf('Nouveau chantier : '+T)>=0&&document.getElementsByTagName('sarl').length===0);
  done();
}
scenario().catch(e=>{(window.__ERR=window.__ERR||[]).push('SCENARIO '+e.stack);done();});
