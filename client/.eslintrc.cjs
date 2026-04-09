module.exports = {
  "root": true,
  "ignorePatterns": [
    "projects/**/*"
  ],
  "overrides": [
    {
      "files": [
        "*.ts"
      ],
      "parserOptions": {
        "project": [
          "tsconfig.app.json",
          "tsconfig.spec.json"
        ],
        "tsconfigRootDir": __dirname,
        "createDefaultProgram": true
      },
      "extends": [
        "plugin:@angular-eslint/recommended",
        "plugin:@angular-eslint/template/process-inline-templates"
      ],
      "rules": {
        "@angular-eslint/directive-selector": [
          "error",
          {
            "type": "attribute",
            "prefix": "app",
            "style": "camelCase"
          }
        ],
        "@angular-eslint/component-selector": [
          "error",
          {
            "type": "element",
            "prefix": "app",
            "style": "kebab-case"
          }
        ],
        "@angular-eslint/no-output-native": "off",
        "simple-import-sort/imports": "error",
        "simple-import-sort/exports": "error"
      },
      "plugins": ["simple-import-sort"]
    },
    {
      "files": [
        "*.html"
      ],
      "extends": [
        "plugin:@angular-eslint/template/recommended",
        "plugin:@angular-eslint/template/accessibility"
      ],
      "rules": {
        "@angular-eslint/template/click-events-have-key-events": "off",
        "@angular-eslint/template/interactive-supports-focus": "off",
        "@angular-eslint/template/label-has-associated-control": "off",
        "@angular-eslint/template/eqeqeq": "off"
      }
    }
  ]
};
