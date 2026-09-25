const wait=ms=>new Promise(r=>setTimeout(r,ms));
const log=(k,v)=>{window.__OUT=window.__OUT||{};__OUT[k]=v;};
const txt=id=>document.getElementById(id).innerText.replace(/\s+/g,' ').trim();
window.confirm=()=>true;window.prompt=()=>'proximite geographique';
window.addEventListener('error',e=>{(window.__ERR=window.__ERR||[]).push(e.message);});
async function importFile(content,name){openImport();leadImpFile({target:{files:[new File([content],name)]}});for(let i=0;i<50&&!(leadImp&&leadImp.plan);i++)await wait(100);return txt('imp-prev');}
function done(){const pre=document.createElement('pre');pre.id='testout';pre.textContent=JSON.stringify({out:window.__OUT,errors:window.__ERR||[]},null,1);document.body.appendChild(pre);}
async function scenario(){
  await wait(2600);
  const mode=location.hash.slice(1);
  CU='florian';['acc','pol','lref'].forEach(i=>document.getElementById(i).style.display='none');
  launchApp();showPg('leads',document.getElementById('nvl'));
  await wait(400);
  if(mode==='q429'){
    await wait(300);
    log('avant',{CH:CH.length,ls:JSON.parse(localStorage.getItem('lb_ch')||'[]').length,sync:txt('syntxt')});
    window.__FAIL=true;await fbPoll();await wait(100);
    log('pendant_429',{CH:CH.length,ls:JSON.parse(localStorage.getItem('lb_ch')||'[]').length,planning:document.querySelectorAll('#plbody tr').length,sync:txt('syntxt'),requetes_429:__NET.filter(x=>x.startsWith('429')).length});
    showPg('leads',document.getElementById('nvl'));await wait(100);
    log('leads_pendant_429',txt('ld-body').slice(0,60));
    window.__FAIL=false;await fbPoll();await wait(100);
    log('apres_retour',{CH:CH.length,sync:txt('syntxt')});
    const n0=__NET.length;Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});await fbPoll();
    log('arriere_plan_aucune_requete',__NET.length===n0);
    done();return;
  }
  if(mode==='m'){JSON.parse(__SEED).forEach(r=>{LEADS[r.id]=leadClean(r,{});LEADS[r.id].id=r.id;});LEADS_OK=true;renderLeads();await wait(200);
    log('egalite_badges_prochain',[...document.querySelectorAll('#ld-rota .ldtag')].map(e=>e.textContent));
    log('egalite_alerte',txt('ld-alerts'));
    openLead();log('egalite_form',{membre:document.getElementById('ld-membre').value,suggestion:txt('ld-sugg')});closeM('modlead');
    openLead('L001');log('egalite_form_L001',{membre:document.getElementById('ld-membre').value,suggestion:txt('ld-sugg')});closeM('modlead');
    const etat=async(k)=>{renderLeads();await wait(50);
      log(k+'_badges',[...document.querySelectorAll('#ld-rota .ldm')].filter(e=>e.querySelector('.ldtag')).map(e=>e.querySelector('.ldtag').textContent+' '+e.innerText.split('\n')[2]));
      log(k+'_alerte',txt('ld-alerts'));
      openLead();log(k+'_form',{membre:document.getElementById('ld-membre').value,suggestion:txt('ld-sugg')});closeM('modlead');};
    const signe=(id,m,v)=>{Object.assign(LEADS[id],{membre:m,valeur:v,statut:'Signé',dateSignature:isoDay()});};
    // Egalite partielle : Franck 2 pts, les 5 autres a 0
    signe('L015','Franck','Moyen');await etat('partielle5');
    // Egalite partielle a deux : Florian, Franck, Frederic, Thomas a 2 ; Henri et Yoan a 0
    signe('L001','Florian','Moyen');signe('L002','Frederic','Moyen');signe('L004','Thomas','Moyen');await etat('partielle2');
    // Un seul strictement au plus bas : Henri a 1, Yoan a 0
    signe('L010','Henri','Petit');await etat('seul');
    done();return;
    log('m_leads',__measure());showPg('planning',document.getElementById('mnp'));await wait(200);log('m_planning',__measure());showPg('leads',document.getElementById('mnl'));await wait(200);log('m_leads2',__measure());done();document.getElementById('testout').style.cssText='position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font-size:11px;width:100vw;white-space:pre-wrap;';return;}
  log('nav_leads',getComputedStyle(document.getElementById('nvl')).display);
  log('topbar',txt('tbact'));
  log('vide',txt('ld-body'));
  log('preview_seed',await importFile(__SEED,'leads-seed.json'));
  await runImport();await wait(100);
  log('nb_leads',Object.keys(LEADS).length);
  log('preview_reimport',await importFile(__SEED,'leads-seed.json'));closeM('modimp');
  // La ligne de fusion reprend l'email du lead L010 lu dans le seed local, en majuscules (aucune donnee reelle ici)
  const mailL010=JSON.parse(__SEED).find(x=>x.id==='L010').email.toUpperCase();
  log('preview_csv',await importFile('contact;societe;email;telephone;membre;zone\nNouveau Gars;Acme;nouveau@acme.fr;600000104;Frédéric;\nContact Test;Societe Test;'+mailL010+';;;31 Toulouse\n','sepem.csv'));
  await runImport();await wait(100);
  log('L024',LEADS.L024);log('L010_zone_completee',LEADS.L010.zone);
  if(mode==='fresh'){closeM('modimp');done();return;}
  // Signature simple L015 + creation du chantier
  openLead('L015',{statut:'Signé'});document.getElementById('ld-montant').value='4 500,50';
  await saveLead();await wait(100);
  log('modlink_ouvert',document.getElementById('modlink').classList.contains('open'));
  leadToChantier('L015');
  log('modch_prerempli',['fnom','fcli','fadr','fche','fsta','fcanaop','fnot'].map(i=>document.getElementById(i).value).concat([document.getElementById('faop').checked,document.getElementById('modchtit').textContent]));
  document.getElementById('fdeb').value='2026-11-02';document.getElementById('ffin').value='2026-11-03';bldTypeSel();document.getElementById('ftyp').value='Facade';document.getElementById('fctv').value='Franck';
  saveCh();await wait(200);
  const nc=CH.find(c=>c.leadId==='L015');
  log('chantier_cree',nc&&{chef:nc.chef,origineAOP:nc.origineAOP,canal:nc.canalAOP,leadId:nc.leadId});
  log('L015',{statut:LEADS.L015.statut,montant:LEADS.L015.montant,dateSignature:LEADS.L015.dateSignature,lien_ok:!!nc&&LEADS.L015.chantierId===nc.id});
  // Chantier suivant cree normalement : ne doit PAS etre lie a un lead
  openModCh();document.getElementById('fnom').value='Chantier perso';document.getElementById('fdeb').value='2026-12-01';document.getElementById('ffin').value='2026-12-02';document.getElementById('ftyp').value='Facade';document.getElementById('fsta').value='Prevu';document.getElementById('fche').value='KGiR';document.getElementById('fctv').value='Henri';
  saveCh();await wait(100);
  log('chantier_perso_sans_lead',!CH.find(c=>c.nom==='Chantier perso').leadId);
  // Groupement L014 + liaison a un chantier existant
  openLead('L014',{statut:'Signé'});leadParts=[{membre:'Florian',prorata:'60'},{membre:'Henri',prorata:'40'}];
  await saveLead();await wait(50);document.getElementById('lk-sel').value='c1';leadLinkSel();await wait(100);
  log('L014',{participants:LEADS.L014.participants,chantierId:LEADS.L014.chantierId,c1_leadId:CH.find(c=>c.id==='c1').leadId});
  // L019 (Franck, Gros) signe -> Franck 2+3 = 5 pts
  openLead('L019',{statut:'Signé'});await saveLead();await wait(50);closeM('modlink');
  // Reattribution en ligne L021 Franck -> Yoan
  let sel=document.querySelector('select[data-lf="membre"][data-id="L021"]');sel.value='Yoan';sel.dispatchEvent(new Event('change',{bubbles:true}));await wait(100);
  log('L021',{membre:LEADS.L021.membre,notes:LEADS.L021.notes});
  // Signe -> En cours puis re-signe
  sel=document.querySelector('select[data-lf="statut"][data-id="L019"]');sel.value='En cours';sel.dispatchEvent(new Event('change',{bubbles:true}));await wait(100);
  log('L019_designe',{statut:LEADS.L019.statut,dateSignature:LEADS.L019.dateSignature===undefined});
  openLead('L019',{statut:'Signé'});await saveLead();await wait(50);closeM('modlink');
  const s=leadStats(Object.values(LEADS));log('rotation',{pts:s.pts,next:s.next,plafond:s.plafond,ecart:s.ecart});
  log('alertes',txt('ld-alerts'));log('kpis',txt('ld-kpis'));
  // Relecture depuis la base : types preserves
  LEADS_OK=false;await pollLeads();
  log('relu',{participants:LEADS.L014.participants,montant:LEADS.L015.montant,nb:Object.keys(LEADS).length});
  log('brut_firestore',{montant:__RAW.leads.L015.montant,part0:__RAW.leads.L014.participants.arrayValue.values[0],c1:__RAW.chantiers.c1.leadId});
  // Filtre
  const fm=document.getElementById('ld-fm');fm.value='Franck';fm.dispatchEvent(new Event('input'));
  log('filtre_franck',txt('ld-count'));fm.value='';fm.dispatchEvent(new Event('input'));
  // Echappement HTML
  LEADS.L099={id:'L099',contact:'<img src=x onerror="window.__XSS=1">',type:'Lead client',statut:'Nouveau'};renderLeads();await wait(100);
  log('xss_bloque',!window.__XSS);delete LEADS.L099;renderLeads();
  // Chantiers existants toujours rendus
  log('planning_lignes',document.querySelectorAll('#plbody tr').length);
  if(mode==='measure'){log('m_leads',__measure());showPg('planning',document.getElementById('mnp'));await wait(100);log('m_planning',{vw:innerWidth,main:document.querySelector('.main').getBoundingClientRect().width});}
if(mode==='modal')openLead('L014');
  if(mode==='link')openLink('L015');
  if(mode==='logout'){retAcc();log('leads_apres_deconnexion',Object.keys(LEADS).length);}
  log('requetes_leads',__NET.filter(x=>x.indexOf('leads')>=0).length);
  done();
}
scenario().catch(e=>{(window.__ERR=window.__ERR||[]).push('SCENARIO '+e.stack);done();});
window.__measure=function(){
  const vw=window.innerWidth,res={vw:vw,main:document.querySelector('.main').getBoundingClientRect().width};
  const wide=[];document.querySelectorAll('#pg-leads *, .mnav, .topbar *').forEach(e=>{const r=e.getBoundingClientRect();if(r.right>vw+1&&r.width>0)wide.push((e.id||e.className||e.tagName).toString().slice(0,30)+':'+Math.round(r.width));});
  res.wide=wide.slice(0,12);return res;
};
setTimeout(()=>{if(!document.getElementById('testout')){log('WATCHDOG',Object.keys(window.__OUT||{}).pop());done();}},50000);
