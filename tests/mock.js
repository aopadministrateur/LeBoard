// Faux Firebase (Auth REST + Firestore REST) en memoire : aucun appel reseau vers la production.
// window.__STRICT=true applique les memes regles que firestore.rules.
(function(){
const MODE=location.hash.slice(1);
localStorage.clear();localStorage.setItem('lb_pol','1');localStorage.setItem('lb_tuto_roulement','1');localStorage.setItem('lb_pins_reset','1');
if(MODE==='a_reload'){localStorage.setItem('lb_auth',JSON.stringify({uid:'u-flo',refresh:'rt-u-flo',membre:'florian',role:'referent'}));localStorage.setItem('lb_pins',JSON.stringify({florian:'1234'}));}
if(MODE==='a_revoked'){localStorage.setItem('lb_auth',JSON.stringify({uid:'u-flo',refresh:'rt-REVOQUE',membre:'florian',role:'referent'}));localStorage.setItem('lb_pins',JSON.stringify({florian:'1234'}));}
window.__STRICT=MODE.indexOf('strict')>=0||MODE==='a_reads'||MODE==='a_reload'||MODE==='a_revoked';
window.__SEED=__SEED_JSON__;
const enc=v=>Array.isArray(v)?{arrayValue:{values:v.map(i=>({stringValue:String(i)}))}}:typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?{integerValue:String(v)}:{stringValue:String(v)};
const init={
  chantiers:{c1:{id:'c1',nom:'Chantier Safran',client:'SAFRAN',adresse:'Blagnac',type:'Facade',statut:'Prevu',chef:'Drone Opérations',ctv:'Yoan',collabs:['Tony'],debut:'2026-10-05',fin:'2026-10-06',materiel:'',notes:'',origineAOP:true,decompte:true}},
  acces:{'u-flo':{membre:'florian',role:'referent'},'u-tony':{membre:'tony',role:'collaborateur'}}
};
if(MODE==='a_reads'){for(let i=2;i<=40;i++)init.chantiers['c'+i]={id:'c'+i,nom:'Chantier '+i,client:'C'+i,adresse:'',type:'Facade',statut:'Prevu',chef:'KGiR',ctv:'Henri',collabs:[],debut:'2026-11-0'+(i%9+1),fin:'2026-11-0'+(i%9+1),materiel:'',notes:''};
  init.profiles={};['florian','henri','franck','yoan','frederic','thomas','tony','camille','sebastien','alexandre'].forEach(k=>init.profiles[k]={avatar:'data:x',user:k});
  init.notifications={};for(let i=0;i<150;i++)init.notifications['old'+i]={title:'Ancienne',body:'vieille '+i,from:'henri',targetRole:'all',ts:'2026-0'+(1+i%8)+'-10T10:00:00.000Z'};
  init.notifications.recent={title:'Nouveau chantier',body:'Recente de Henri',from:'henri',targetRole:'all',ts:new Date(Date.now()+60000).toISOString()};
  init.indispo={data:{list:'[]'}};}
const RAW={};for(const c in init){RAW[c]={};for(const id in init[c])RAW[c][id]=Object.fromEntries(Object.entries(init[c][id]).map(([k,v])=>[k,enc(v)]));}
window.__RAW=RAW;window.__NET=[];window.__READS=0;window.__REFRESH=0;
const ACCOUNTS={'florian@test.fr':{pwd:'pw-flo',uid:'u-flo'},'tony@test.fr':{pwd:'pw-tony',uid:'u-tony'},'intrus@test.fr':{pwd:'pw-x',uid:'u-x'}};
const TOK={};let n=0;window.__TOK=TOK;
const newTok=uid=>{const t='tok-'+uid+'-'+(++n);TOK[t]={uid:uid,exp:Date.now()+3600e3};return t;};
const J=(st,body)=>new Response(JSON.stringify(body||{}),{status:st,headers:{'Content-Type':'application/json'}});
const S=(f)=>f&&f.stringValue;
function allowed(uid,col,id,op){ // miroir de firestore.rules
  const a=uid&&RAW.acces&&RAW.acces[uid];const member=!!a;const ref=member&&S(a.role)==='referent';
  switch(col){
    case 'acces':return op==='read'&&uid===id;
    case 'leads':return ref;
    case 'chantiers':case 'membres':return op==='read'?member:ref;
    case 'indispo':return member;
    case 'profiles':return op==='read'?member:(member&&S(a.membre)===id);
    case 'notifications':return (op==='read'||op==='create')?member:ref;
  }
  return false;
}
const _f=window.fetch;
window.fetch=async function(url,opt){
  url=String(url);opt=opt||{};
  if(url.indexOf('identitytoolkit.googleapis.com')>=0){
    const b=JSON.parse(opt.body||'{}');
    if(url.indexOf('sendOobCode')>=0){__NET.push('AUTH reset '+b.email);return J(200,{email:b.email});}
    const acc=ACCOUNTS[b.email];__NET.push('AUTH signIn '+b.email);
    if(!acc||acc.pwd!==b.password)return J(400,{error:{message:'INVALID_LOGIN_CREDENTIALS'}});
    return J(200,{localId:acc.uid,idToken:newTok(acc.uid),refreshToken:'rt-'+acc.uid,expiresIn:'3600'});
  }
  if(url.indexOf('securetoken.googleapis.com')>=0){
    const rt=decodeURIComponent((opt.body||'').split('refresh_token=')[1]||'');__REFRESH++;
    const uid=rt.startsWith('rt-u-')?rt.slice(3):null;__NET.push('AUTH refresh '+(uid||'refuse'));
    if(!uid||!Object.values(ACCOUNTS).some(a=>a.uid===uid))return J(400,{error:{message:'INVALID_REFRESH_TOKEN'}});
    return J(200,{id_token:newTok(uid),refresh_token:rt,expires_in:'3600',user_id:uid});
  }
  if(url.indexOf('firestore.googleapis.com')<0)return _f.apply(this,arguments);
  const m=(opt.method||'GET').toUpperCase();const u=new URL(url);
  const h0=(opt.headers||{}).Authorization||'';const tk0=h0.replace('Bearer ','');
  if(u.pathname.endsWith(':runQuery')){
    const q=JSON.parse(opt.body).structuredQuery;const col=q.from[0].collectionId;const ff=q.where.fieldFilter;
    if(tk0&&(!TOK[tk0]||TOK[tk0].revoked))return J(401,{});
    const uid=tk0?TOK[tk0].uid:null;
    if(window.__FAIL){__NET.push('QUERY '+col+' 429');return J(429,{});}
    if(window.__STRICT&&!allowed(uid,col,null,'read')){__NET.push('QUERY '+col+' 403');return J(403,{});}
    const docs=Object.keys(RAW[col]||{}).filter(k=>{const f=(RAW[col][k][ff.field.fieldPath]||{}).stringValue;return f!==undefined&&f>=ff.value.stringValue;});
    __READS+=Math.max(1,docs.length)+(window.__STRICT?1:0);__NET.push('QUERY '+col+' '+docs.length+' docs');
    return J(200,docs.length?docs.map(k=>({document:{name:'x/'+col+'/'+k,fields:RAW[col][k]}})):[{readTime:'now'}]);
  }
  const parts=decodeURIComponent(u.pathname).split('/documents/')[1].split('/');const col=parts[0],id=parts[1];
  RAW[col]=RAW[col]||{};
  const h=(opt.headers||{}).Authorization||'';const tk=h.replace('Bearer ','');
  const log=st=>__NET.push(m+' '+col+(id?'/'+id:'')+' @'+(tk?(TOK[tk]?TOK[tk].uid:'invalide'):'anonyme')+' '+st);
  if(window.__FAIL){log(429);return J(429,{error:{code:429,status:'RESOURCE_EXHAUSTED'}});}
  if(tk&&(!TOK[tk]||TOK[tk].exp<Date.now()||TOK[tk].revoked)){log(401);return J(401,{error:{status:'UNAUTHENTICATED'}});}
  const uid=tk?TOK[tk].uid:null;
  const op=m==='GET'?'read':m==='POST'?'create':(m==='PATCH'&&!RAW[col][id])?'create':m==='DELETE'?'delete':'update';
  if(window.__STRICT&&!allowed(uid,col,id,op)){log(403);return J(403,{error:{status:'PERMISSION_DENIED'}});}
  log(200);
  if(m==='GET'){__READS+=(id?1:Math.max(1,Object.keys(RAW[col]).length))+(window.__STRICT?1:0);}
  if(m==='GET'&&!id)return J(200,{documents:Object.keys(RAW[col]).map(k=>({name:'projects/x/databases/(default)/documents/'+col+'/'+k,fields:RAW[col][k]}))});
  if(m==='GET'){return RAW[col][id]?J(200,{name:col+'/'+id,fields:RAW[col][id]}):J(404,{error:{status:'NOT_FOUND'}});}
  if(m==='DELETE'){delete RAW[col][id];return J(200);}
  if(m==='POST'){RAW[col]['n'+Date.now()+Math.random()]=JSON.parse(opt.body).fields;return J(200);}
  if(m==='PATCH'){
    const f=JSON.parse(opt.body).fields||{};
    if(u.searchParams.get('currentDocument.exists')==='false'&&RAW[col][id])return J(409,{error:'exists'});
    const mask=u.searchParams.getAll('updateMask.fieldPaths');
    if(mask.length){const d=RAW[col][id]||{};mask.forEach(k=>{if(k in f)d[k]=f[k];else delete d[k];});RAW[col][id]=d;}
    else RAW[col][id]=f;
    return J(200);
  }
  return J(400);
};
})();
