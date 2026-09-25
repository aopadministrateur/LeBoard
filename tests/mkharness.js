// Construit une copie de l'app avec un faux Firestore en memoire + un scenario de test automatique.
const fs=require('fs'),path=require('path');
const [,,repo,out]=process.argv;
const html=fs.readFileSync(path.join(repo,'index.html'),'utf8');
const seedPath=path.join(repo,'leads-seed.json');
if(!fs.existsSync(seedPath)){console.error('leads-seed.json introuvable a la racine du depot (fichier local, jamais versionne).');process.exit(1);}
const seed=fs.readFileSync(seedPath,'utf8');
const mock=fs.readFileSync(path.join(__dirname,'mock.js'),'utf8').replace('__SEED_JSON__',JSON.stringify(seed));
const scen=fs.readFileSync(path.join(__dirname,process.env.SCEN||'scenario.js'),'utf8');
const h=html.replace('<head>','<head><script>'+mock+'</script>').replace('</body>','<script>'+scen+'</script></body>');
fs.writeFileSync(out,h);
