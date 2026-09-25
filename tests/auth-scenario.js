const wait=ms=>new Promise(r=>setTimeout(r,ms));
const log=(k,v)=>{window.__OUT=window.__OUT||{};__OUT[k]=v;};
const txt=id=>{const e=document.getElementById(id);return e?e.innerText.replace(/\s+/g,' ').trim():null;};
const vis=id=>{const e=document.getElementById(id);return !!e&&getComputedStyle(e).display!=='none';};
window.confirm=()=>true;window.prompt=()=>'';
window.addEventListener('error',e=>{(window.__ERR=window.__ERR||[]).push(e.message);});
function done(){const pre=document.createElement('pre');pre.id='testout';pre.textContent=JSON.stringify({out:window.__OUT,errors:window.__ERR||[]},null,1);document.body.appendChild(pre);}
async function login(email,pwd){document.getElementById('au-email').value=email;document.getElementById('au-pwd').value=pwd;await authLogin();await wait(50);}
async function pin(code){for(const d of code){pk(d);}await wait(400);}
const net=()=>__NET.slice();
const since=a=>__NET.slice(a.length);

async function scenario(){
  await wait(2700);
  const mode=location.hash.slice(1);

  if(mode==='a_reload'){
    log('ecran_pin_direct',{pin:vis('pin'),login:vis('lauth'),nom:txt('pinam')});
    const a=net();await pin('1234');await wait(300);
    log('app_ouverte',vis('app'));log('role',CR);
    log('requetes',since(a).filter(x=>!x.startsWith('GET notifications')).slice(0,8));
    done();return;
  }
  if(mode==='a_reads'){
    // 40 chantiers, 10 profils, 151 notifications (1 recente), regles strictes
    await login('florian@test.fr','pw-flo');await pin('1234');
    const r0=__READS,n0=__NET.length;await pin('1234');await wait(800);
    log('cycle_1_deverrouillage',{lectures:__READS-r0,requetes:__NET.slice(n0).filter(x=>!x.startsWith('AUTH'))});
    const r1=__READS,n1=__NET.length;await fbPoll();await wait(300);
    log('cycle_suivant',{lectures:__READS-r1,requetes:__NET.slice(n1)});
    log('notification_recente_affichee',txt('notifcont').indexOf('Recente de Henri')>=0);
    log('anciennes_ignorees',txt('notifcont').indexOf('vieille')<0);
    retAcc();await wait(100);const n2=__NET.length;await pin('1234');await wait(500);
    log('profils_relus_au_deverrouillage',__NET.slice(n2).some(x=>x.startsWith('GET profiles')));
    const avant=1+10+1+40+Math.min(151,200)+5;
    log('comparaison_par_cycle',{avant_optimisation:avant,apres:__OUT.cycle_suivant.lectures});
    done();return;
  }
  if(mode==='a_revoked'){
    await pin('1234');await wait(600);
    log('apres_revocation',{login_visible:vis('lauth'),app:vis('app'),lb_auth:localStorage.getItem('lb_auth')});
    done();return;
  }

  // 1. Premier lancement : ecran de connexion (plus de choix Referent/Collaborateur)
  log('1_ecran',{login:vis('lauth'),ancien_choix:vis('acc'),pin:vis('pin')});
  log('1_aucune_lecture_avant_connexion',__NET.filter(x=>/^(GET|PATCH|POST|DELETE) /.test(x)).length);
  if(mode==='a_shot'){await login('florian@test.fr','faux');return;}
  // 2. Mauvais mot de passe
  await login('florian@test.fr','faux');log('2_mauvais_mdp',txt('au-err'));
  // 3. Compte sans acces
  await login('intrus@test.fr','pw-x');log('3_sans_acces',{msg:txt('au-err'),lb_auth:localStorage.getItem('lb_auth')});
  // 4. Mot de passe oublie
  document.getElementById('au-email').value='florian@test.fr';await authReset();log('4_reset',__NET.filter(x=>x.startsWith('AUTH reset')).length);
  // 5. Florian : connexion -> creation du PIN -> app
  await login('florian@test.fr','pw-flo');
  log('5_pin_creation',{pin:vis('pin'),nom:txt('pinam'),etape:txt('pinlb')});
  await pin('1234');await pin('1234');
  let a=net();await wait(300);
  log('5_app',{app:vis('app'),CU:CU,CR:CR,leads_nav:vis('nvl'),lb_auth:JSON.parse(localStorage.getItem('lb_auth')||'{}').membre});
  // 6. Referent : leads (import + signature + chantier) sous regles strictes
  showPg('leads',document.getElementById('nvl'));await wait(300);
  openImport();leadImpFile({target:{files:[new File([__SEED],'leads-seed.json')]}});for(let i=0;i<50&&!(leadImp&&leadImp.plan);i++)await wait(100);
  await runImport();await wait(100);
  openLead('L015',{statut:'Signé'});await saveLead();await wait(50);leadToChantier('L015');
  document.getElementById('fdeb').value='2026-11-02';document.getElementById('ffin').value='2026-11-03';bldTypeSel();document.getElementById('ftyp').value='Facade';document.getElementById('fctv').value='Franck';
  saveCh();await wait(300);
  log('6_referent',{leads:Object.keys(LEADS).length,chantier_lie:!!CH.find(c=>c.leadId==='L015'),refus:__NET.filter(x=>/ (401|403)$/.test(x)),sans_jeton:__NET.filter(x=>/@anonyme/.test(x)).length});
  // 7. Jeton expire cote client -> renouvellement automatique
  const r0=__REFRESH;authExp=0;const ok7=await fbGet('chantiers',true);log('7_renouvellement',{refresh:__REFRESH-r0,lecture_ok:!!ok7});
  // 8. Jeton refuse par le serveur (401) -> renouvellement force + nouvelle tentative
  __TOK[authTok].revoked=true;const r1=__REFRESH;const ok8=await fbGet('chantiers',true);log('8_jeton_refuse',{refresh:__REFRESH-r1,lecture_ok:!!ok8});
  // 9. Verrouillage : retour au PIN du meme compte, synchro arretee
  retAcc();await wait(100);
  log('9_verrou',{pin:vis('pin'),login:vis('lauth'),nom:txt('pinam'),synchro:!!fbPollInterval,leads_memoire:Object.keys(LEADS).length});
  await pin('1234');await wait(200);log('9_deverrou',{app:vis('app'),synchro:!!fbPollInterval});
  // 10. Changer de compte -> Tony (collaborateur)
  retAcc();await wait(100);authSwitch();await wait(50);
  log('10_changer',{login:vis('lauth'),lb_auth:localStorage.getItem('lb_auth')});
  await login('tony@test.fr','pw-tony');await pin('5678');await pin('5678');await wait(300);
  log('10_tony',{CU:CU,CR:CR,leads_nav:vis('nvl'),planning_nav:vis('nvp'),mon_planning:vis('pg-moncal'),chantiers:CH.length,
    mon_planning_texte:txt('mccont').slice(0,40)});
  const leadsTony=await fbGet('leads',true);
  const ecritChantier=await fbSet('chantiers','c1',{nom:'pirate'});
  const ecritProfilAutre=await fbSet('profiles','florian',{avatar:'x'});
  const ecritProfil=await fbSet('profiles','tony',{avatar:'y',user:'tony'});
  document.getElementById('cong-deb').value='2026-12-01';document.getElementById('cong-fin').value='2026-12-05';addConge();await wait(200);
  log('10_droits_tony',{lire_leads:leadsTony!==null,modifier_chantier:ecritChantier,modifier_profil_florian:ecritProfilAutre,modifier_son_profil:ecritProfil,
    indispo_enregistree:!!(__RAW.indispo&&__RAW.indispo.data&&__RAW.indispo.data.list.stringValue.indexOf('Tony')>=0),nom_chantier:__RAW.chantiers.c1.nom.stringValue});
  // 11. Sans compte : refus, donnees conservees
  const nCH=CH.length;authForget();await fbPoll();await wait(100);
  log('11_sans_compte',{chantiers_conserves:CH.length===nCH&&nCH>0,synchro:txt('syntxt'),dernier:__NET[__NET.length-1]});
  done();
}
scenario().catch(e=>{(window.__ERR=window.__ERR||[]).push('SCENARIO '+e.stack);done();});
