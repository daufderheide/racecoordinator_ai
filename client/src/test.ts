import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Then we find all the tests.
declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
};
const context = require.context('./', true, /\.spec\.ts$/);
console.log('DEBUG: Found context keys:', context.keys());
// And load the modules.
context.keys().map((key) => {
  console.log('DEBUG: Loading test file:', key);
  return context(key);
});
