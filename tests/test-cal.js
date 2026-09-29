// Tests des en-tetes de semaine du calendrier (numero ISO 8601, periode affichee).
// Usage : node tests/test-cal.js
const fs=require('fs'),assert=require('assert'),path=require('path');
const H=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
eval(H.slice(H.indexOf('// ═══ SEMAINES ═══'),H.indexOf('// ═══ FIN SEMAINES ═══')).replace(/^const /mg,'var '));
let n=0;const t=(name,fn)=>{fn();n++;console.log('ok -',name);};
const D=(y,m,d)=>new Date(y,m-1,d);
const W=(y,m,d)=>calSemaine(D(y,m,d));

t('1er janvier',()=>{
  assert.equal(W(2026,1,1),1);   // jeudi : semaine 1 de 2026
  assert.equal(W(2027,1,1),53);  // vendredi : encore dans la semaine 53 de 2026
  assert.equal(W(2021,1,1),53);  // vendredi : semaine 53 de 2020
  assert.equal(W(2023,1,1),52);  // dimanche : semaine 52 de 2022
  assert.equal(W(2024,1,1),1);   // lundi
});
t('31 decembre',()=>{
  assert.equal(W(2026,12,31),53); // jeudi : 2026 a 53 semaines
  assert.equal(W(2024,12,31),1);  // mardi : deja semaine 1 de 2025
  assert.equal(W(2025,12,31),1);  // mercredi : semaine 1 de 2026
  assert.equal(W(2023,12,31),52); // dimanche
});
t('annee a 53 semaines (2026) et changement d\'annee',()=>{
  assert.equal(W(2025,12,29),1);  // lundi de la semaine 1 de 2026
  assert.equal(W(2026,12,28),53); // lundi de la semaine 53
  assert.equal(W(2027,1,3),53);   // dimanche, fin de la semaine 53
  assert.equal(W(2027,1,4),1);    // lundi, semaine 1 de 2027
  assert.equal(W(2026,12,27),52);
});
t('semaines de septembre 2026 (captures)',()=>{
  assert.equal(W(2026,9,14),38);assert.equal(W(2026,9,20),38);assert.equal(W(2026,9,28),40);
});
t('periode affichee',()=>{
  assert.equal(calPeriode(D(2026,9,14),D(2026,9,20)),'14 – 20 sept.');
  assert.equal(calPeriode(D(2025,9,29),D(2025,10,5)),'29 sept. – 5 oct.');
  assert.equal(calPeriode(D(2026,12,28),D(2027,1,3)),'28 déc. – 3 janv.');
  assert.equal(W(2025,9,29),40);  // exemple du cahier des charges : « S40 · 29 sept. – 5 oct. »
});
console.log(n+' tests OK');
