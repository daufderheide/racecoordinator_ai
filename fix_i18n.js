const fs = require('fs');
const path = require('path');

const dir = 'client/src/assets/i18n';
const enPath = path.join(dir, 'en.json');
let enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// 1. Add new language key to EN
enData['RDS_LANG_NL'] = 'Dutch (nl)';

function sortObjectKeys(obj) {
  return Object.keys(obj).sort().reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {});
}

enData = sortObjectKeys(enData);
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

const missingTranslations = {
  de: {
    "RDS_MENU_TEAM_MANAGER": "Team-Manager",
    "RDS_TEAM_DRIVERS": "Fahrer",
    "RDS_LANG_NL": "Niederländisch (nl)"
  },
  es: {
    "RDS_MENU_TEAM_MANAGER": "Gestor de Equipos",
    "RDS_TEAM_DRIVERS": "Pilotos",
    "RDS_LANG_NL": "Neerlandés (nl)"
  },
  it: {
    "RDS_MENU_TEAM_MANAGER": "Gestore Squadre",
    "RDS_TEAM_DRIVERS": "Piloti",
    "RDS_LANG_NL": "Olandese (nl)"
  },
  pt: {
    "RDS_MENU_TEAM_MANAGER": "Gestor de Equipas",
    "RDS_TEAM_DRIVERS": "Pilotos",
    "UI_EDITOR_COL_FUEL_CAPACITY": "CAPACIDADE DE COMBUSTÍVEL",
    "UI_EDITOR_COL_FUEL_LEVEL": "NÍVEL DE COMBUSTÍVEL",
    "UI_EDITOR_COL_FUEL_PERCENTAGE": "PERCENTAGEM DE COMBUSTÍVEL",
    "RDS_LANG_NL": "Holandês (nl)"
  },
  fr: {
    "RDS_MENU_TEAM_MANAGER": "Gestionnaire d'équipes",
    "RDS_TEAM_DRIVERS": "Pilotes",
    "RDS_LANG_NL": "Néerlandais (nl)",
    "RDS_HELP_DRIVER_ACTIONS_CONTENT": "Utilisez ces boutons pour ajouter tous les pilotes à la course, les retirer tous, ou randomiser l'ordre des pilotes (seed).",
    "RDS_HELP_DRIVER_ACTIONS_TITLE": "Actions des Pilotes",
    "RDS_HELP_DRIVER_SELECTION_CONTENT": "Ici, vous pouvez sélectionner qui va courir. <br><br><b>Pilotes Disponibles</b> : Tous les pilotes dans votre base de données.<br><b>Pilotes Sélectionnés</b> : Pilotes participant à cette course. Glissez-déposez pour réorganiser ou définir les positions de départ.",
    "RDS_HELP_DRIVER_SELECTION_TITLE": "Sélection des Pilotes",
    "RDS_HELP_RACE_SELECTION_CONTENT": "Sélectionnez le format de course que vous souhaitez lancer.",
    "RDS_HELP_RACE_SELECTION_TITLE": "Sélection de la Course",
    "RDS_HELP_RECENT_RACE_CONTENT": "Cliquez pour sélectionner une course récemment lancée.",
    "RDS_HELP_RECENT_RACE_MOST_RECENT_CONTENT": "Cliquez pour sélectionner la course lancée la plus récemment.",
    "RDS_HELP_RECENT_RACE_TITLE": "Course Récemment Lancée",
    "RDS_HELP_START_DEMO_CONTENT": "Lorsque vous êtes prêt, utilisez ce bouton pour tester votre configuration sans interface de piste.",
    "RDS_HELP_START_DEMO_TITLE": "Démarrer la Course Démo",
    "RDS_HELP_START_RACE_CONTENT": "Lorsque vous êtes prêt, commence la course officielle avec la configuration sélectionnée. Votre interface de piste doit être configurée et allumée.",
    "RDS_HELP_START_RACE_TITLE": "Démarrer la Course",
    "RDS_HELP_WALKTHROUGH_CONTENT": "Vous pouvez cliquer ici sur n'importe quelle page pour recommencer le tutoriel.",
    "RDS_HELP_WALKTHROUGH_TITLE": "Tutoriel",
    "RDS_HELP_WELCOME_CONTENT": "C'est ici que vous configurez et démarrez vos courses. Vous pouvez sélectionner des pilotes, choisir un format de course et personnaliser les paramètres.",
    "RDS_HELP_WELCOME_TITLE": "Bienvenue dans la configuration du jour de course"
  }
};

const enKeys = Object.keys(enData);

['de.json', 'es.json', 'fr.json', 'it.json', 'pt.json'].forEach(file => {
  const filePath = path.join(dir, file);
  const langId = file.split('.')[0];
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Patch known missing translations
  if (missingTranslations[langId]) {
    for (const [key, val] of Object.entries(missingTranslations[langId])) {
      data[key] = val;
    }
  }

  // Ensure all strictly match EN keys
  enKeys.forEach(key => {
    if (!data[key]) {
      // If still missing, fallback to English value so at least it exists
      console.warn(`Fallback for ${langId} on key ${key}`);
      data[key] = enData[key];
    }
  });

  // Remove extra keys not in EN
  Object.keys(data).forEach(key => {
    if (!enData[key]) {
      delete data[key];
    }
  });

  // Sort and save
  data = sortObjectKeys(data);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
});

console.log('Fixed translations and alphabetized existing JSON files.');
