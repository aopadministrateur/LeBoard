// Tests de la logique du module Leads (rotation, import, normalisation).
// Usage : node tests/test-leads.js   (le test du seed est ignore si leads-seed.json est absent)
const fs=require('fs'),assert=require('assert'),path=require('path');
const REF_ORDER=['Florian','Henri','Franck','Yoan','Frederic','Thomas'];
const REF_SOC={'Florian':'Polydrones','Henri':'KGiR','Franck':'Flight Drone Service','Yoan':'Drone Opérations','Frederic':'W-Drones','Thomas':'OrizonDrone'};
const H=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const SEED=process.env.SEED||path.join(__dirname,'..','leads-seed.json');
eval(H.slice(H.indexOf('// ═══ LEADS ═══'),H.indexOf('// ═══ FIN LEADS ═══')).replace(/^let /mg,'var ').replace(/^const /mg,'var '));
let n=0;const t=(name,fn)=>{fn();n++;console.log('ok -',name);};
const L=(o)=>Object.assign({type:'Lead client',statut:'Nouveau',membre:'',valeur:''},o);

t('normalisation membres et tel',()=>{
  assert.equal(leadMembre('Frédéric'),'Frederic');assert.equal(leadMembre('  yoan '),'Yoan');assert.equal(leadMembre('Bob'),'');
  assert.equal(leadTel('600000101.0'),'0600000101');assert.equal(leadTel('600000101'),'0600000101');
  assert.equal(leadTel('06 00 00 01 02'),'06 00 00 01 02');assert.equal(leadTel('0600000103'),'0600000103');
});
t('rotation : points signes 12 mois seulement',()=>{
  const s=leadStats([
    L({membre:'Franck',statut:'Signé',valeur:'Gros',dateSignature:'2026-06-01'}),
    L({membre:'Franck',statut:'Signé',valeur:'Moyen',dateSignature:'2025-09-24'}), // > 12 mois
    L({membre:'Franck',statut:'Signé',valeur:'Petit',dateSignature:'2025-09-25'}), // pile 12 mois : compte
    L({membre:'Yoan',statut:'Attribué',valeur:'Gros'}),
    L({membre:'Henri',statut:'En cours',valeur:'Gros'}),
    L({type:'Société utile',statut:'Contact',membre:'Thomas',valeur:'Gros'}),
  ],'2026-09-25');
  assert.equal(s.pts.Franck,4);assert.equal(s.pts.Yoan,0);assert.equal(s.attrib.Yoan,1);assert.equal(s.encours.Henri,1);
  assert.deepEqual(s.plafond,['Franck']);assert.equal(s.next,'');assert.deepEqual(s.egaux,['Florian','Henri','Yoan','Frederic','Thomas']);assert.equal(s.ecart,100);assert.equal(s.clients.length,5);
});
t('rotation : plafond >=3, egalite ordre stable, seuil 30% strict',()=>{
  const mk=p=>REF_ORDER.map((n,i)=>L({membre:n,statut:'Signé',valeur:['Petit','Moyen','Gros'][p[i]-1],dateSignature:'2026-09-01'})).filter((x,i)=>p[i]);
  let s=leadStats(mk([3,3,3,3,3,3]),'2026-09-25');assert.equal(s.next,'');assert.equal(s.plafond.length,0);assert.equal(s.ecart,0);
  s=leadStats(mk([2,3,3,3,3,3]).concat([L({membre:'Henri',statut:'Signé',valeur:'Gros',dateSignature:'2026-09-01'})]),'2026-09-25');
  assert.equal(s.pts.Henri,6);assert.deepEqual(s.plafond,['Henri']);assert.equal(s.next,'Florian');assert.equal(s.ecart,67);
  s=leadStats(mk([2,3,3,3,3,3]),'2026-09-25'); assert.equal(s.ecart,33);assert.equal(s.next,'Florian');
  s=leadStats(mk([0,0,0,0,0,0]),'2026-09-25'); assert.equal(s.next,'');assert.equal(s.ecart,0);assert.equal(leadStats([],'2026-09-25').next,'');
  s=leadStats(mk([3,1,1,3,3,3]),'2026-09-25'); assert.equal(s.next,'');assert.deepEqual(s.egaux,['Henri','Franck']); // egalite partielle : pas de designation
  s=leadStats(mk([3,2,1,3,3,3]),'2026-09-25'); assert.equal(s.next,'Franck');assert.deepEqual(s.egaux,[]); // seul strictement au plus bas
  assert.match(leadSuggMsg(leadStats(mk([3,1,1,3,3,3]),'2026-09-25')),/entre <strong>Henri, Franck<\/strong> : pas de désignation/);
  assert.match(leadSuggMsg(leadStats([],'2026-09-25')),/tous les membres/);
});
t('CSV : ; et guillemets, BOM, colonnes seed',()=>{
  const r=leadParseCSV('﻿contact;Société;telephone;E-mail;besoin;saisi_par;notes\r\n"Dupont; Jean";ACME;600000101;j@a.fr;"Façade ""nord""";Frédéric;"ligne1\nligne2"\r\n;;;;;;\r\n');
  assert.equal(r.length,1);assert.equal(r[0].contact,'Dupont; Jean');assert.equal(r[0].societe,'ACME');assert.equal(r[0].email,'j@a.fr');
  assert.equal(r[0].besoin,'Façade "nord"');assert.equal(r[0].notes,'ligne1\nligne2');assert.equal(r[0].saisiPar,'Frédéric');
  const c=leadClean(r[0],{source:'Salon X',dateCreation:'2026-10-01'});
  assert.equal(c.saisiPar,'Frederic');assert.equal(c.telephone,'0600000101');assert.equal(c.source,'Salon X');assert.equal(c.statut,'Nouveau');assert.equal(c.dateCreation,'2026-10-01');
  assert.throws(()=>leadParseCSV('a,b\n1,2'));
});
if(fs.existsSync(SEED))t('seed : 23 leads, conventions Board',()=>{
  const rows=leadRowsJSON(fs.readFileSync(SEED,'utf8')).map(r=>leadClean(r,{}));
  assert.equal(rows.length,23);
  const p=leadPlanImport(rows,[]);assert.equal(p.create.length,23);assert.equal(p.merge.length,0);
  assert.deepEqual(rows.map(r=>r.id),Array.from({length:23},(_,i)=>'L'+String(i+1).padStart(3,'0')));
  const u=rows.find(r=>r.id==='L023');assert.equal(u.type,'Société utile');assert.equal(u.statut,'Contact');assert.match(u.telephone,/^0\d{9}$/);
  assert.ok(rows.every(r=>r.source==='SEPEM Toulouse 2026'&&r.dateCreation==='2026-09-22'));
  assert.ok(rows.every(r=>!r.membre||REF_ORDER.includes(r.membre)));
  assert.equal(rows.filter(r=>r.statut==='Attribué').length,11);
});
t('import : dedoublonnage email + fusion sans ecrasement',()=>{
  const ex=[L({id:'L001',email:'A@x.fr',contact:'A',membre:'Yoan',statut:'Attribué',valeur:'Gros',notes:'n1',zone:''})];
  const rows=[
    leadClean({email:'a@X.fr',contact:'Autre',zone:'31',membre:'Franck',valeur:'Petit',notes:'n2'}),
    leadClean({email:'a@x.fr',telephone:'0600000000'}),
    leadClean({email:'b@x.fr',contact:'B'}),leadClean({email:'B@x.fr',zone:'33'}),
    leadClean({contact:'Sans mail'}),leadClean({}),
  ];
  const p=leadPlanImport(rows,ex);
  assert.equal(p.merge.length,1);assert.deepEqual(p.merge[0].upd,{zone:'31',notes:'n1\nn2',telephone:'0600000000'});
  assert.equal(p.create.length,2);assert.equal(p.create[0].zone,'33');assert.equal(p.dup,2);assert.equal(p.skip,1);
});
t('reattribution : trace dans les notes',()=>{
  global.MBR={florian:{name:'Florian'}};global.CU='florian';
  const u=leadReattrib(L({membre:'Franck',statut:'Attribué',notes:'x'}),'Yoan','proximite');
  assert.equal(u.membre,'Yoan');assert.match(u.notes,/^x\n\[\d{4}-\d\d-\d\d\] Réattribué de Franck à Yoan \(proximite\), par Florian$/);
});
console.log(n+' tests OK');
