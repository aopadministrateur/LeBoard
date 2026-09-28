// Tests de la detection des conflits (detectCf) : dates de debut et de fin inclusives.
// Usage : node tests/test-conflits.js
const fs=require('fs'),assert=require('assert'),path=require('path');
const H=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').replace(/\r\n/g,'\n');  // CRLF ou LF selon la copie de travail
const src=H.slice(H.indexOf('function detectCf(){'),H.indexOf('\n}\n',H.indexOf('function detectCf(){'))+2);
if(!src.startsWith('function detectCf(){')||!src.endsWith('}\n'))throw new Error('detectCf introuvable dans index.html');
var STATOK=['Confirme','Prevu'],CH=[];eval(src.replace('function detectCf(){','var detectCf=function(){'));
let n=0;const t=(name,fn)=>{fn();n++;console.log('ok -',name);};
const C=(id,debut,fin,o)=>Object.assign({id,nom:'Chantier '+id,statut:'Confirme',ctv:'',collabs:[],debut,fin},o);
const cf=list=>{CH=list;const r=detectCf();return Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v.col]));};

t('meme journee : deux chantiers d\'un jour a la meme date',()=>{
  const r=cf([C('A','2026-10-01','2026-10-01',{collabs:['Tony']}),C('B','2026-10-01','2026-10-01',{collabs:['Tony']})]);
  assert.equal(r.A,'Conflit collab. : Tony déjà sur "Chantier B"');assert.equal(r.B,'Conflit collab. : Tony déjà sur "Chantier A"');
});
t('bord a bord : l\'un finit le jour ou l\'autre commence',()=>{
  const r=cf([C('A','2026-10-01','2026-10-03',{ctv:'Henri'}),C('B','2026-10-03','2026-10-05',{ctv:'Henri'})]);
  assert.equal(r.A,'Conflit chargé de travaux : Henri déjà sur "Chantier B"');assert.equal(r.B,'Conflit chargé de travaux : Henri déjà sur "Chantier A"');
});
t('bord a bord, charge sur l\'un et collaborateur sur l\'autre',()=>{
  const r=cf([C('A','2026-09-23','2026-09-24',{ctv:'Yoan'}),C('B','2026-09-24','2026-09-25',{collabs:['Yoan']})]);
  assert.equal(r.A,'Conflit : Yoan déjà sur "Chantier B"');assert.equal(r.B,'Conflit : Yoan déjà sur "Chantier A"');
});
t('un jour d\'ecart : pas de conflit',()=>{
  const r=cf([C('A','2026-10-01','2026-10-03',{collabs:['Tony'],ctv:'Henri'}),C('B','2026-10-04','2026-10-05',{collabs:['Tony'],ctv:'Henri'})]);
  assert.equal(r.A,null);assert.equal(r.B,null);
});
t('chevauchement de plusieurs jours : toujours detecte',()=>{
  const r=cf([C('A','2026-10-01','2026-10-05',{collabs:['Tony']}),C('B','2026-10-03','2026-10-08',{collabs:['Tony']})]);
  assert.ok(r.A&&r.B);
});
t('Option exclue',()=>{
  const r=cf([C('A','2026-10-01','2026-10-01',{collabs:['Tony']}),C('B','2026-10-01','2026-10-01',{collabs:['Tony'],statut:'Option'})]);
  assert.equal(r.A,null);assert.equal(r.B,null);
});
t('Termine exclu',()=>{
  const r=cf([C('A','2026-10-01','2026-10-03',{ctv:'Henri'}),C('B','2026-10-03','2026-10-03',{ctv:'Henri',statut:'Termine'})]);
  assert.equal(r.A,null);assert.equal(r.B,null);
});
t('meme dates sans personne commune : pas de conflit',()=>{
  const r=cf([C('A','2026-10-01','2026-10-01',{collabs:['Tony'],ctv:'Henri'}),C('B','2026-10-01','2026-10-01',{collabs:['Camille'],ctv:'Franck'})]);
  assert.equal(r.A,null);assert.equal(r.B,null);
});
console.log(n+' tests OK');
