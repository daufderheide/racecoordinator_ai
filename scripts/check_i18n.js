const fs = require('fs');
const path = require('path');

const i18nDir = path.join(__dirname, '..', 'client/src/assets/i18n');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = obj[key];
  });
  return sorted;
}

function check() {
  if (!fs.existsSync(i18nDir)) {
    console.error(`Directory not found: ${i18nDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(i18nDir).filter(file => file.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('No i18n files found.');
    return;
  }

  const fileData = {};
  const allKeys = new Set();

  // 1. Load all files and collect all keys
  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(i18nDir, file), 'utf8'));
      fileData[file] = data;
      Object.keys(data).forEach(k => allKeys.add(k));
    } catch (e) {
      console.error(`Error parsing ${file}:`, e.message);
      process.exit(1);
    }
  });

  const targetKeys = Array.from(allKeys).sort();
  let hasSyncError = false;
  let hasSortError = false;

  files.forEach(file => {
    const data = fileData[file];
    const keys = Object.keys(data);
    const sortedKeys = [...keys].sort();

    const missing = targetKeys.filter(k => !(k in data));
    const extra = keys.filter(k => !allKeys.has(k)); 
    const isUnsorted = JSON.stringify(keys) !== JSON.stringify(sortedKeys);

    if (missing.length > 0) {
      console.error(`ERROR: ${file} is missing keys: ${missing.join(', ')}`);
      hasSyncError = true;
    }

    if (isUnsorted) {
      if (fix) {
        const sortedData = sortObject(data);
        fs.writeFileSync(path.join(i18nDir, file), JSON.stringify(sortedData, null, 2) + '\n', 'utf8');
        console.log(`Alphabetized ${file}`);
      } else {
        console.error(`ERROR: ${file} is not alphabetized`);
        hasSortError = true;
      }
    }
  });

  if (hasSyncError) {
    console.error('\nI18n synchronization failed! All language files must have the exact same set of keys.');
    console.error('Please manually add the missing translations to the files listed above.');
    process.exit(1);
  }

  if (hasSortError && !fix) {
    console.error('\nI18n alphabetization failed! Run "node scripts/check_i18n.js --fix" from the repo root to sort them automatically.');
    process.exit(1);
  }

  if (!hasSyncError && !hasSortError) {
    console.log('I18n validation passed (All files are in sync and alphabetized).');
  }
}

check();
