// Ecran des nouveautes : une fois par version et par membre, "vu" enregistre dans profiles/{membre}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const log=(k,v)=>{window.__OUT=window.__OUT||{};__OUT[k]=v;};
const vis=id=>{const e=document.getElementById(id);return !!e&&getComputedStyle(e).display!=='none';};
window.addEventListener('error',e=>{(window.__ERR=window.__ERR||[]).push(e.message);});
function done(){const pre=document.createElement('pre');pre.id='testout';pre.textContent=JSON.stringify({out:window.__OUT,errors:window.__ERR||[]},null,1);document.body.appendChild(pre);}
async function login(email,pwd){document.getElementById('au-email').value=email;document.getElementById('au-pwd').value=pwd;await authLogin();await wait(50);}
async function pin(code){for(const d of code){pk(d);}await wait(400);}
const vu=k=>{const d=(__RAW.profiles||{})[k];return d&&d.nouveautesVues?d.nouveautesVues.integerValue:null;};

async function scenario(){
  await wait(2700);
  const mode=location.hash.slice(1);
  await login('florian@test.fr','pw-flo');await pin('1234');await pin('1234');await wait(800);
  if(mode.indexOf('shot')>=0)return;
  log('1_premiere_ouverture',{ecran:vis('nouv'),titre:document.getElementById('nouv-titre').textContent,blocs:document.querySelectorAll('#nouv-blocs .nvbl').length});
  log('1_badges_new',[...document.querySelectorAll('.ni,.mni')].some(b=>/NEW/.test(b.textContent)));
  log('1_ancien_tuto',!!document.getElementById('tuto-overlay'));
  nouvClose();await wait(200);
  log('2_apres_fermeture',{ecran:vis('nouv'),firestore_florian:vu('florian')});
  retAcc();await wait(100);await pin('1234');await wait(800);
  log('3_reouverture_meme_version',vis('nouv'));
  // Autre appareil : rien en local, Firestore dit deja vu
  delete PR.florian.nouveautesVues;localStorage.setItem('lb_pr',JSON.stringify(PR));
  retAcc();await wait(100);await pin('1234');await wait(800);
  log('4_autre_appareil_deja_vu',vis('nouv'));
  // Changement de version
  NOUVEAUTES.version++;
  retAcc();await wait(100);await pin('1234');await wait(800);
  log('5_version_suivante',vis('nouv'));
  nouvClose();await wait(200);log('5_firestore_florian',vu('florian'));
  retAcc();await wait(100);await pin('1234');await wait(800);
  log('5_version_suivante_reouverture',vis('nouv'));
  // Verrouillage pendant l'affichage : masque, pas marque vu
  NOUVEAUTES.version++;retAcc();await wait(100);await pin('1234');await wait(800);
  retAcc();await wait(100);log('6_verrou_pendant_ecran',{ecran:vis('nouv'),firestore_florian:vu('florian')});
  // Autre membre (collaborateur)
  authSwitch();await wait(50);await login('tony@test.fr','pw-tony');await pin('5678');await pin('5678');await wait(800);
  log('7_tony',{ecran:vis('nouv')});nouvClose();await wait(200);
  log('7_tony_firestore',{tony:vu('tony'),florian_inchange:vu('florian')});
  log('refus',__NET.filter(x=>/ (401|403)$/.test(x)));
  done();
}
scenario().catch(e=>{(window.__ERR=window.__ERR||[]).push('SCENARIO '+e.stack);done();});
