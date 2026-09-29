// Outils injectes dans les pages des deux appareils simules (pilotes par tests/deux-appareils.js)
window.__entrer=async function(email,pwd,pin){
  const w=ms=>new Promise(r=>setTimeout(r,ms));
  await w(2700);
  document.getElementById('au-email').value=email;document.getElementById('au-pwd').value=pwd;await authLogin();await w(50);
  for(const d of pin)pk(d);await w(400);for(const d of pin)pk(d);await w(1500);
  for(let i=0;i<50&&!CH.length;i++)await w(100);
  if(typeof nouvClose==='function')nouvClose();
  clearInterval(fbPollInterval);fbPollInterval=null; // plus de relecture : chaque appareil garde sa copie
  return CU;
};
window.__TOASTS=[];(function(){const t0=window.toast;window.toast=function(m){__TOASTS.push(m);return t0(m);};})();
window.__ajouterIndispo=async function(d,f){document.getElementById('cong-deb').value=d;document.getElementById('cong-fin').value=f;await addConge();return CONGES.length;};
