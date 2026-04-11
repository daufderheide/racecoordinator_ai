declare global {
  interface Window {
    mockRaceDataBuffer?: ArrayBuffer | Uint8Array;
    allMockSockets?: any[];
    mockSocket?: any;
    disableMockHeartbeat?: boolean;
    WATCHDOG_TIMEOUT?: number;
    MockWebSocket?: any;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export {};
