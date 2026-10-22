import "zone.js/testing";
import { getTestBed } from "@angular/core/testing";
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from "@angular/platform-browser-dynamic/testing";

// Prevent accidental file downloads to host disk during automated tests
if (typeof HTMLAnchorElement !== "undefined") {
  const originalAnchorClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    if (this.hasAttribute("download") || this.download) {
      return;
    }
    return originalAnchorClick.apply(this, arguments as any);
  };
}

import { ConverterCache } from "./app/converters/converter_cache";

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Reset all converter caches before each test to prevent static cache pollution between tests
beforeEach(() => {
  ConverterCache.clearAll();
});

// Then we find all the tests.
declare const require: {
  context(
    path: string,
    deep?: boolean,
    filter?: RegExp,
  ): {
    keys(): string[];
    <T>(id: string): T;
  };
};
const context = require.context("./", true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);
