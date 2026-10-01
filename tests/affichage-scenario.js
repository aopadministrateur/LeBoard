// Affichage sur : textes ordinaires contenant < > & " ' affiches tels quels (jamais interpretes comme du HTML),
// photos de profil invalides rejetees, couleurs invalides remplacees. Mode x_strict (regles strictes).
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const log=(k,v)=>{window.__OUT=window.__OUT||{};__OUT[k]=v;};
window.addEventListener('error',e=>{(window.__ERR=window.__ERR||[]).push(e.message);});
function done(){const pre=document.createElement('pre');pre.id='testout';pre.textContent=JSON.stringify({out:window.__OUT,errors:window.__ERR||[]},null,1);document.body.appendChild(pre);}
// Texte ordinaire avec les cinq caracteres speciaux ; interprete comme du HTML, il creerait un element <sarl>
const T='Dupont & Fils <SARL> "Nord" l\'atelier';
const nbSarl=()=>document.getElementsByTagName('sarl').length;
const textes=sel=>[...document.querySelectorAll(sel)].map(e=>e.textContent);
const enc=v=>Array.isArray(v)?{arrayValue:{values:v.map(i=>({stringValue:String(i)}))}}:{stringValue:String(v)};
function photoValide(){const c=document.createElement('canvas');c.width=c.height=8;const x=c.getContext('2d');x.fillStyle='#4A90D9';x.fillRect(0,0,8,8);return c.toDataURL('image/png');}

async function scenario(){
  // Donnees de la base fictive (equivalent d'une saisie par un referent)
  const R=__RAW,PNG=photoValide();
  Object.assign(R.chantiers.c1,{nom:enc(T),client:enc(T),adresse:enc(T),materiel:enc(T),notes:enc(T),chef:enc(T),collabs:enc(['Tony','Florian',T])});
  const mbr={florian:{name:'Florian',color:'#E8722A',role:'referent'},henri:{name:'Henri',color:'#E24B4A',role:'referent'},franck:{name:'Franck',color:'#4A90D9',role:'referent'},yoan:{name:'Yoan',color:'#2D9E5F',role:'referent'},thomas:{name:'Thomas',color:'#8B7FD4',role:'referent'},frederic:{name:'Frederic',color:'#F5C842',role:'referent'},tony:{name:'Tony',color:'#D4A843',role:'collaborateur'},camille:{name:'Camille',color:'red',role:'collaborateur'},testchars:{name:T,color:'#3BB8A8',role:'collaborateur'}};
  const moe={testmoe:{name:T,color:'rgb(1,2,3)'}};
  R.membres={data:{mbr:enc(JSON.stringify(mbr)),moe:enc(JSON.stringify(moe))}};
  R.indispo={data:{list:enc(JSON.stringify([{id:1,nom:T,debut:'2026-10-05',fin:'2026-10-06'},{id:2,nom:'Florian',debut:'2026-10-20',fin:'2026-10-21'}]))}};
  R.profiles={
    henri:{avatar:enc('https://exemple.test/photo.png')},           // adresse externe : refusee
    tony:{avatar:enc('data:image/svg+xml;base64,PHN2Zy8+')},         // format non autorise : refuse
    camille:{avatar:enc('data:image/png;base64,'+'A'.repeat(200000))},// trop volumineuse : refusee
    yoan:{avatar:enc(PNG)}};                                         // valide : affichee
  // Notification creee par un referent (Henri), texte ordinaire
  R.notifications={n1:{title:enc('Nouveau chantier'),body:enc(T),from:enc('henri'),targetRole:enc('all'),ts:enc(new Date().toISOString())}};
  await wait(2700);
  document.getElementById('au-email').value='florian@test.fr';document.getElementById('au-pwd').value='pw-flo';await authLogin();await wait(50);
  for(const d of '1234')pk(d);await wait(400);for(const d of '1234')pk(d);await wait(1800);
  nouvClose();
  // 1. Notification
  const notif=document.getElementById('notifcont').textContent;
  log('1_notification',{contient_le_texte:notif.indexOf(T)>=0,elements_sarl:nbSarl()});
  log('1_notification_ok',notif.indexOf(T)>=0&&nbSarl()===0);
  // 2. Planning
  showPg('planning',document.getElementById('nvp'));await wait(300);
  const pl={nom:textes('#plbody .cn')[0],client_adresse:textes('#plbody .ca')[0],moe:textes('#plbody .tdmoe')[0],collabs:textes('#plbody .tdcol')[0]};
  log('2_planning',pl);
  log('2_planning_ok',pl.nom===T&&pl.client_adresse===T+' — '+T&&pl.moe===T&&pl.collabs==='Tony, Florian, '+T&&nbSarl()===0);
  // 3. Calendrier (octobre 2026) : chantier, indispo, legende
  showPg('cal',document.getElementById('nvc'));calY=2026;calM=9;renderCal();await wait(300);
  const cal={chantier:textes('#calgrd .calev:not(.calind)').some(t=>t===T),indispo:textes('#calgrd .calind').some(t=>t===T+' - Indispo'),legende:textes('#calleg span').indexOf(T)>=0};
  log('3_calendrier',cal);log('3_calendrier_ok',cal.chantier&&cal.indispo&&cal.legende&&nbSarl()===0);
  // 4. Equipe : nom, chantier, photos
  showPg('equipe',document.getElementById('nve'));await wait(300);
  const carte=nom=>[...document.querySelectorAll('#tgrd .tcrd')].find(c=>c.querySelector('.tcnm').textContent===nom);
  const ph=nom=>{const c=carte(nom);const i=c&&c.querySelector('.tcrh img');return i?i.getAttribute('src').slice(0,22):null;};
  const eq={carte_nom:!!carte(T),chantier:textes('#tgrd .tcn').indexOf(T)>=0,photo_henri:ph('Henri'),photo_tony:ph('Tony'),photo_camille:ph('Camille'),photo_yoan:ph('Yoan')};
  log('4_equipe',eq);
  log('4_equipe_ok',eq.carte_nom&&eq.chantier&&eq.photo_henri===null&&eq.photo_tony===null&&eq.photo_camille===null&&eq.photo_yoan==='data:image/png;base64,'&&nbSarl()===0);
  log('4_photos_refusees_a_la_relecture',{henri:!!(PR.henri&&PR.henri.avatar),tony:!!(PR.tony&&PR.tony.avatar),camille:!!(PR.camille&&PR.camille.avatar),yoan:!!(PR.yoan&&PR.yoan.avatar)});
  log('4_photos_refusees_a_la_relecture_ok',!(PR.henri&&PR.henri.avatar)&&!(PR.tony&&PR.tony.avatar)&&!(PR.camille&&PR.camille.avatar)&&!!(PR.yoan&&PR.yoan.avatar));
  // 5. Couleurs : invalide remplacee par le gris neutre, valide inchangee
  const fond=nom=>{const c=carte(nom);return c?getComputedStyle(c.querySelector('.tcrh .av')).backgroundColor:null;};
  const coul={camille_invalide:fond('Camille'),tony_valide:fond('Tony')};
  log('5_couleurs',coul);log('5_couleurs_ok',coul.camille_invalide==='rgb(125, 125, 133)'&&coul.tony_valide==='rgb(212, 168, 67)');
  // 6. Membres
  showPg('membres',document.getElementById('nvmb'));await wait(300);
  const mb=textes('#mblist .mbnm').filter(t=>t===T).length;
  log('6_membres',{occurrences:mb});log('6_membres_ok',mb===2&&nbSarl()===0);
  // 7. Formulaire chantier : listes et cases collaborateurs, valeurs relues a l'identique
  editCh('c1');await wait(200);
  const f={moe_option:[...document.getElementById('fche').options].some(o=>o.value===T&&o.text===T),moe_choisi:document.getElementById('fche').value,
    case_collab:textes('#cchks .cchk').indexOf(T)>=0,collabs_relus:getSelCollabs(),nom_champ:document.getElementById('fnom').value};
  log('7_formulaire',f);
  log('7_formulaire_ok',f.moe_option&&f.moe_choisi===T&&f.case_collab&&JSON.stringify(f.collabs_relus)===JSON.stringify(['Florian','Tony',T])&&f.nom_champ===T&&nbSarl()===0);
  closeM('modch');
  // 8. Mon planning (Florian est collaborateur du chantier)
  showPg('moncal',document.getElementById('nvmc'));renderMonCal();await wait(300);
  const mc=document.getElementById('mccont').textContent;
  log('8_mon_planning_ok',mc.split(T).length-1>=6&&nbSarl()===0);
  // 9. Photo : une photo valide (JPEG du profil) est acceptee, les autres formats refuses
  const c=document.createElement('canvas');c.width=c.height=120;c.getContext('2d').fillRect(0,0,120,120);const jpg=c.toDataURL('image/jpeg',0.7);
  const v={jpeg:safeImg(jpg)===jpg,https:safeImg('https://exemple.test/a.png'),svg:safeImg('data:image/svg+xml;base64,PHN2Zy8+'),trop_grande:safeImg('data:image/png;base64,'+'A'.repeat(200000)),guillemet:safeImg('data:image/png;base64,AAAA" x="1')};
  log('9_controle_photo',v);log('9_controle_photo_ok',v.jpeg&&v.https===''&&v.svg===''&&v.trop_grande===''&&v.guillemet==='');
  done();
}
scenario().catch(e=>{(window.__ERR=window.__ERR||[]).push('SCENARIO '+e.stack);done();});
