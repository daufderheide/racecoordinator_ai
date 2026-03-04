const fs = require('fs');
const path = require('path');

const dir = 'client/src/assets/i18n';
const enPath = path.join(dir, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const enKeys = Object.keys(enData).sort();

const files = ['de.json', 'es.json', 'fr.json', 'it.json', 'pt.json'];

console.log('Total EN keys:', enKeys.length);

files.forEach(file => {
  const filePath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const keys = Object.keys(data);
  const missing = enKeys.filter(k => !keys.includes(k));
  console.log(`${file} missing keys:`, missing);
});
