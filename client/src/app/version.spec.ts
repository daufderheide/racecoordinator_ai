import {
  CLIENT_VERSION,
  CLIENT_VERSION_BUILD,
  getClientVersion,
} from "./version";

describe("CLIENT_VERSION & getClientVersion", () => {
  const originalOverride = (window as any)?.CLIENT_VERSION_OVERRIDE;

  afterEach(() => {
    if (originalOverride !== undefined) {
      (window as any).CLIENT_VERSION_OVERRIDE = originalOverride;
    } else {
      delete (window as any).CLIENT_VERSION_OVERRIDE;
    }
  });

  it("should export CLIENT_VERSION as a non-empty string", () => {
    expect(CLIENT_VERSION).toBeDefined();
    expect(typeof CLIENT_VERSION).toBe("string");
    expect(CLIENT_VERSION.length).toBeGreaterThan(0);
  });

  it("should return window override when CLIENT_VERSION_OVERRIDE is set", () => {
    (window as any).CLIENT_VERSION_OVERRIDE = "CUSTOM_OVERRIDE_V1";
    expect(getClientVersion()).toBe("CUSTOM_OVERRIDE_V1");
    expect(getClientVersion("2.0.0", () => false)).toBe("CUSTOM_OVERRIDE_V1");
  });

  it("should return 0.0.0_dev in development mode when no window override is set", () => {
    delete (window as any).CLIENT_VERSION_OVERRIDE;
    expect(getClientVersion(undefined, () => true)).toBe("0.0.0_dev");
    expect(getClientVersion("1.5.0", () => true)).toBe("0.0.0_dev");
  });

  it("should return 0.0.0_dev if devModeFn throws an error", () => {
    delete (window as any).CLIENT_VERSION_OVERRIDE;
    expect(
      getClientVersion("1.5.0", () => {
        throw new Error("test error");
      }),
    ).toBe("0.0.0_dev");
  });

  it("should return server version in production mode when build version is 0.0.0_dev", () => {
    delete (window as any).CLIENT_VERSION_OVERRIDE;
    expect(getClientVersion("1.2.3", () => false)).toBe("1.2.3");
  });

  it("should return fallback when in production mode and server version is unknown", () => {
    delete (window as any).CLIENT_VERSION_OVERRIDE;
    const expectedFallback =
      CLIENT_VERSION_BUILD && CLIENT_VERSION_BUILD !== "0.0.0_dev"
        ? CLIENT_VERSION_BUILD
        : "0.0.0_dev";

    expect(getClientVersion("unknown", () => false)).toBe(expectedFallback);
    expect(getClientVersion(undefined, () => false)).toBe(expectedFallback);
  });
});
