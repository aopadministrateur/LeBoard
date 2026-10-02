// Politique de confidentialite : un appareil qui a accepte l'ancienne version (p_ancienne) la revoit une fois ;
// apres acceptation, la nouvelle version est enregistree et l'app continue normalement. Mode p_nouvelle : rien ne s'affiche.
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const log=(k,v)=>{window.__OUT=window.__OUT||{};__OUT[k]=v;};
window.addEventListener('error',e=>{(window.__ERR=window.__ERR||[]).push(e.message);});
function done(){const pre=document.createElement('pre');pre.id='testout';pre.textContent=JSON.stringify({out:window.__OUT,errors:window.__ERR||[]},null,1);document.body.appendChild(pre);}
const vis=id=>getComputedStyle(document.getElementById(id)).display!=='none';
async function scenario(){
  await wait(2700);
  const ancienne=location.hash.slice(1)==='p_ancienne';
  const t=document.querySelector('#pol .polscr').textContent;
  log('1_contenu_ok',/Base légale/.test(t)&&/limitation/.test(t)&&/portabilité/.test(t)&&/CNIL/.test(t)&&/europe-west9/.test(t));
  log('2_affichage',{politique:vis('pol'),connexion:vis('lauth')});
  if(ancienne){
    log('2_reacceptation_affichee_ok',vis('pol')&&!vis('lauth'));
    document.getElementById('chkpol').click();document.getElementById('btnpol').click();await wait(300);
    log('3_apres_acceptation_ok',!vis('pol')&&vis('lauth')&&localStorage.getItem('lb_pol')===POL_VERSION&&POL_VERSION==='2');
  } else {
    log('2_deja_acceptee_rien_ok',!vis('pol')&&vis('lauth'));
  }
  done();
}
scenario().catch(e=>{(window.__ERR=window.__ERR||[]).push('SCENARIO '+e.stack);done();});
