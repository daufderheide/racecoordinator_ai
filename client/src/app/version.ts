import { isDevMode } from "@angular/core";

export const CLIENT_VERSION_BUILD: string = "0.0.0_dev";

export function getClientVersion(
  serverVersion?: string,
  devModeFn: () => boolean = isDevMode,
): string {
  const windowOverride = (window as any)?.CLIENT_VERSION_OVERRIDE;
  if (windowOverride) {
    return windowOverride;
  }
  let inDevMode = true;
  try {
    inDevMode = devModeFn();
  } catch {
    inDevMode = true;
  }
  if (inDevMode) {
    return "0.0.0_dev";
  }
  if (CLIENT_VERSION_BUILD && CLIENT_VERSION_BUILD !== "0.0.0_dev") {
    return CLIENT_VERSION_BUILD;
  }
  if (serverVersion && serverVersion !== "unknown") {
    return serverVersion;
  }
  return CLIENT_VERSION_BUILD || "0.0.0_dev";
}

export const CLIENT_VERSION: string = getClientVersion();
