module.exports = {
  "root": true,
  "ignorePatterns": [
    "projects/**/*",
    "scripts/**/*",
    "src/app/proto/message.d.ts",
    "src/app/proto/message.js",
    "src/app/proto/antigravity.ts"
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
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            "vars": "all",
            "args": "after-used",
            "ignoreRestSiblings": true,
            "argsIgnorePattern": "^(_.*|e)$",
            "varsIgnorePattern": "^(_.*|e)$",
            "caughtErrors": "all",
            "caughtErrorsIgnorePattern": "^(_.*|e)$"
          }
        ],
        "no-restricted-syntax": [
          "error",
          {
            "selector": "MemberExpression[object.name='com'], MemberExpression[object.name='antigravity']",
            "message": "Do not qualify protobuf messages (e.g., com.antigravity.X or antigravity.X). Use direct imports instead."
          },
          {
            "selector": "ImportEqualsDeclaration[moduleReference.type='QualifiedName']",
            "message": "Use standard ES6 imports (import { ... } from '...') instead of namespace aliases (import X = Y.X)."
          },
          {
            "selector": "Decorator[expression.callee.name='Input']",
            "message": "Use signal-based input() instead of @Input()."
          },
          {
            "selector": "Decorator[expression.callee.name='Output']",
            "message": "Use signal-based output() instead of @Output()."
          }
        ],
        "@angular-eslint/prefer-inject": "off",
        "@angular-eslint/prefer-standalone": "error",
        "no-restricted-imports": ["error", {
          "patterns": [
            {
              "group": ["../*"],
              "message": "Use absolute imports (@app/...) instead of relative parent imports (../)."
            }
          ]
        }],
        "simple-import-sort/imports": [
          "error",
          {
            "groups": [
              ["^\\u0000", "^@?\\w", "^@app"],
              ["^\\."]
            ]
          }
        ],
        "max-lines": ["error", { "max": 1000, "skipBlankLines": true, "skipComments": true }],
        "max-lines-per-function": ["error", { "max": 100, "skipBlankLines": true, "skipComments": true }]
      },
      "plugins": [
        "@typescript-eslint",
        "simple-import-sort"
      ]
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
        "@angular-eslint/template/eqeqeq": "off",
        "@angular-eslint/template/alt-text": "off",
        "@angular-eslint/template/prefer-control-flow": "error"
      }
    },
    {
      "files": ["*.js", "*.cjs"],
      "env": {
        "node": true,
        "es2021": true
      },
      "parserOptions": {
        "ecmaVersion": 2021
      }
    },
    {
      "files": ["**/testing/**/*.ts", "**/*.spec.ts", "**/*_test.ts"],
      "rules": {
        "no-restricted-imports": "off",
        "max-lines": "off",
        "max-lines-per-function": "off"
      }
    },
    {
      "files": ["**/components/raceday/components/**/*.ts"],
      "rules": {
        "no-restricted-syntax": "off",
        "no-restricted-imports": "off"
      }
    },
    {
      "files": ["**/components/raceday/components/**/*.html"],
      "rules": {
        "@angular-eslint/template/prefer-control-flow": "off"
      }
    }
  ]
};
