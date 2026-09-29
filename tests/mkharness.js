// Construit une copie de l'app avec un faux Firestore en memoire + un scenario de test automatique.
const fs=require('fs'),path=require('path');
const [,,repo,out]=process.argv;
const html=fs.readFileSync(path.join(repo,'index.html'),'utf8');
// Leads FICTIFS versionnes (tests/fixtures) : aucun test ne lit les vraies donnees de prospects
const seedPath=path.join(__dirname,'fixtures','leads-fictifs.json');
const seed=fs.readFileSync(seedPath,'utf8');
const mock=fs.readFileSync(path.join(__dirname,'mock.js'),'utf8').replace('__SEED_JSON__',JSON.stringify(seed));
const scen=fs.readFileSync(path.join(__dirname,process.env.SCEN||'scenario.js'),'utf8');
const h=html.replace('<head>','<head><script>'+mock+'</script>').replace('</body>','<script>'+scen+'</script></body>');
fs.writeFileSync(out,h);
