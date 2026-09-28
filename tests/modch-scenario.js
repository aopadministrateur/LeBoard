// Formulaire chantier : une creation ouverte apres une edition doit repartir de champs vides
// (dates, case AOP et canal compris), sans casser le pre-remplissage depuis un lead signe.
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const log=(k,v)=>{window.__OUT=window.__OUT||{};__OUT[k]=v;};
const val=id=>document.getElementById(id).value;
const vis=id=>getComputedStyle(document.getElementById(id)).display!=='none';
window.addEventListener('error',e=>{(window.__ERR=window.__ERR||[]).push(e.message);});
function done(){const pre=document.createElement('pre');pre.id='testout';pre.textContent=JSON.stringify({out:window.__OUT,errors:window.__ERR||[]},null,1);document.body.appendChild(pre);}
const etat=()=>({nom:val('fnom'),debut:val('fdeb'),fin:val('ffin'),aop:document.getElementById('faop').checked,canal:val('fcanaop'),canal_visible:vis('fcanaop'),collabs:getSelCollabs()});

async function scenario(){
  await wait(2700);
  document.getElementById('au-email').value='florian@test.fr';document.getElementById('au-pwd').value='pw-flo';await authLogin();await wait(50);
  for(const d of '1234')pk(d);await wait(400);for(const d of '1234')pk(d);await wait(800);
  for(let i=0;i<50&&!CH.find(c=>c.id==='c1');i++)await wait(100);
  // 1. Edition du chantier c1 (dates, AOP coche, collaborateur) puis fermeture
  const c1=CH.find(c=>c.id==='c1');c1.canalAOP='salon';
  editCh('c1');await wait(50);
  log('1_edition',etat());
  closeM('modch');
  // 2. Nouvelle creation : tout doit etre vide
  openModCh();await wait(50);
  const e=etat();log('2_creation',e);
  log('2_creation_vide',!e.nom&&!e.debut&&!e.fin&&!e.aop&&!e.canal&&!e.canal_visible&&!e.collabs.length);
  closeM('modch');
  // 3. Creation depuis un lead signe : le pre-remplissage AOP est conserve
  LEADS.L999={id:'L999',contact:'Contact test',membre:'Florian',source:'Salon test',statut:'Signé'};
  leadToChantier('L999');await wait(50);
  const l=etat();log('3_depuis_lead',l);
  log('3_depuis_lead_aop',l.aop&&l.canal==='salon'&&l.canal_visible&&!l.debut);
  closeM('modch');
  done();
}
scenario().catch(e=>{(window.__ERR=window.__ERR||[]).push('SCENARIO '+e.stack);done();});
