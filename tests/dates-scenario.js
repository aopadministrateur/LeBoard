// Enregistrement d'un chantier : fin avant debut refusee, fin = debut acceptee (chantier d'une journee)
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const log=(k,v)=>{window.__OUT=window.__OUT||{};__OUT[k]=v;};
window.addEventListener('error',e=>{(window.__ERR=window.__ERR||[]).push(e.message);});
function done(){const pre=document.createElement('pre');pre.id='testout';pre.textContent=JSON.stringify({out:window.__OUT,errors:window.__ERR||[]},null,1);document.body.appendChild(pre);}
const nbBase=()=>Object.keys(__RAW.chantiers||{}).length;
async function creer(nom,debut,fin){
  openModCh();await wait(30);
  document.getElementById('fnom').value=nom;document.getElementById('fdeb').value=debut;document.getElementById('ffin').value=fin;
  bldTypeSel();document.getElementById('ftyp').value='Facade';document.getElementById('fsta').value='Prevu';
  document.getElementById('fche').value='Polydrones';document.getElementById('fctv').value='Florian';
  const n0=CH.length,b0=nbBase();saveCh();await wait(300);
  return {memoire:CH.length-n0,base:nbBase()-b0,toast:document.getElementById('toastel').textContent,modale_ouverte:document.getElementById('modch').classList.contains('open')};
}
async function scenario(){
  await wait(2700);
  document.getElementById('au-email').value='florian@test.fr';document.getElementById('au-pwd').value='pw-flo';await authLogin();await wait(50);
  for(const d of '1234')pk(d);await wait(400);for(const d of '1234')pk(d);await wait(800);nouvClose();
  for(let i=0;i<50&&!CH.find(c=>c.id==='c1');i++)await wait(100);
  const r1=await creer('Fin avant debut','2026-11-10','2026-11-09');closeM('modch');
  log('1_fin_avant_debut_refuse',r1);log('1_ok',r1.memoire===0&&r1.base===0&&r1.toast==='La date de fin doit être après le début'&&r1.modale_ouverte);
  const r2=await creer('Une journee','2026-11-12','2026-11-12');
  log('2_fin_egale_debut_accepte',r2);log('2_ok',r2.memoire===1&&r2.base===1&&!r2.modale_ouverte);
  const r3=await creer('Cas normal','2026-11-16','2026-11-18');
  log('3_normal_accepte',r3);log('3_ok',r3.memoire===1&&r3.base===1&&!r3.modale_ouverte);
  // Edition d'un chantier existant valide (c1) : non bloquee
  editCh('c1');await wait(30);document.getElementById('fnot').value='Note modifiee';saveCh();await wait(300);
  const n=__RAW.chantiers.c1.notes;const r4={notes_en_base:n&&n.stringValue,modale_ouverte:document.getElementById('modch').classList.contains('open')};
  log('4_edition_existant',r4);log('4_ok',r4.notes_en_base==='Note modifiee'&&!r4.modale_ouverte);
  done();
}
scenario().catch(e=>{(window.__ERR=window.__ERR||[]).push('SCENARIO '+e.stack);done();});
