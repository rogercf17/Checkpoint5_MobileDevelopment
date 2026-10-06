const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Uso: node gerar-env.js "caminho\\do\\arquivo.json"');
  process.exit(1);
}

const k = JSON.parse(fs.readFileSync(file, 'utf8'));

const linhas = [
  `FIREBASE_PROJECT_ID=${k.project_id}`,
  `FIREBASE_CLIENT_EMAIL=${k.client_email}`,
  `FIREBASE_PRIVATE_KEY="${k.private_key.replace(/\n/g, '\\n')}"`,
  'FIREBASE_DATABASE_URL=https://checkpoint2-mobile-b26af-default-rtdb.firebaseio.com',
  'PORT=3000',
];

fs.writeFileSync('.env', linhas.join('\n') + '\n');
console.log('.env criado');