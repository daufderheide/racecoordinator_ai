export interface TTSDriverData {
  name: string;
  nickname: string;
}

export interface TTSLapData {
  lastLapTime: number;
  bestLapTime: number;
  averageLapTime: number;
  lapCount: number;
}

export interface TTSContext {
  driver: TTSDriverData & TTSLapData;
}

export function playSound(
  type: 'preset' | 'tts' | undefined,
  url: string | undefined,
  text: string | undefined,
  serverUrl: string,
  data?: any
): void {
  if (type === 'preset' && url) {
    // Ensure absolute URL if it's relative
    let playableUrl = url;
    if (url.startsWith('/')) {
      playableUrl = `${serverUrl}${url}`;
    }
    console.log('Playing audio from URL:', playableUrl);
    const audio = new Audio(playableUrl);
    audio.play().catch(err => console.error('Error playing sound', err));
  } else if (type === 'tts' && text) {
    let interpolatedText = text;
    if (data) {
      interpolatedText = interpolate(text, data);
    }

    console.log('Playing TTS:', interpolatedText);
    if (window.speechSynthesis) {
      // Cancel any current speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(interpolatedText);
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Text-to-speech not supported in this browser.');
    }
  } else {
    console.log('No sound to play (missing type, url, or text)');
  }
}

function interpolate(text: string, data: any): string {
  return text.replace(/\{([^}]+)\}/g, (match, path) => {
    const parts = path.toLowerCase().split('.');
    let value = data;
    for (const part of parts) {
      if (value === undefined || value === null) break;

      // Case-insensitive property lookup
      const keys = Object.keys(value);
      const key = keys.find(k => k.toLowerCase() === part);
      value = key ? value[key] : undefined;
    }

    if (value === undefined || value === null) {
      return match;
    }

    if (typeof value === 'number') {
      // Format numbers to 3 decimal places if they have decimals
      return Number.isInteger(value) ? value.toString() : value.toFixed(3);
    }

    return value.toString();
  });
}

export function createTTSContext(driver: TTSDriverData, driverData: TTSLapData): TTSContext {
  return {
    driver: {
      name: driver.name,
      nickname: driver.nickname || driver.name,
      lastLapTime: driverData.lastLapTime,
      bestLapTime: driverData.bestLapTime,
      averageLapTime: driverData.averageLapTime,
      lapCount: driverData.lapCount
    }
  };
}

export function mockTTSContext(): TTSContext {
  return createTTSContext(
    { name: 'Dave', nickname: 'Dave' },
    { lastLapTime: 1.234, bestLapTime: 1.234, averageLapTime: 1.5, lapCount: 10 }
  );
}
