import { playSound, createTTSContext, mockTTSContext } from './audio';

describe('playSound Utility', () => {
  let originalAudio: any;
  let mockAudioInstance: any;
  let mockSpeechSynthesis: any;
  let originalSpeechSynthesis: any;

  const SERVER_URL = 'http://localhost:8080';

  beforeAll(() => {
    // Save original implementations
    originalAudio = window.Audio;
    originalSpeechSynthesis = window.speechSynthesis;

    // Mock SpeechSynthesisUtterance if it doesn't exist (e.g. in some text environments)
    if (!window.SpeechSynthesisUtterance) {
      (window as any).SpeechSynthesisUtterance = class {
        text: string;
        constructor(text: string) { this.text = text; }
      };
    }
  });

  afterAll(() => {
    // Restore original implementations
    window.Audio = originalAudio;
    if (originalSpeechSynthesis) {
      Object.defineProperty(window, 'speechSynthesis', {
        value: originalSpeechSynthesis,
        writable: true,
        configurable: true
      });
    }
  });

  beforeEach(() => {
    // Mock Audio
    mockAudioInstance = jasmine.createSpyObj('Audio', ['play']);
    mockAudioInstance.play.and.returnValue(Promise.resolve());
    // Mock the constructor
    (window as any).Audio = jasmine.createSpy('Audio').and.returnValue(mockAudioInstance);

    // Mock SpeechSynthesis
    mockSpeechSynthesis = jasmine.createSpyObj('SpeechSynthesis', ['cancel', 'speak']);
    // Use Object.defineProperty to overwrite read-only property if necessary, 
    // or just direct assignment if allowed in the test env.
    // Usually safer to use defineProperty for window properties.
    Object.defineProperty(window, 'speechSynthesis', {
      value: mockSpeechSynthesis,
      writable: true,
      configurable: true
    });
  });

  describe('Preset Audio', () => {
    it('should play absolute URL as-is', () => {
      const url = 'http://example.com/sound.mp3';
      playSound('preset', url, undefined, SERVER_URL);

      expect(window.Audio).toHaveBeenCalledWith(url);
      expect(mockAudioInstance.play).toHaveBeenCalled();
    });

    it('should play relative URL with server prefix', () => {
      const path = '/sounds/beep.mp3';
      playSound('preset', path, undefined, SERVER_URL);

      expect(window.Audio).toHaveBeenCalledWith(`${SERVER_URL}${path}`);
      expect(mockAudioInstance.play).toHaveBeenCalled();
    });

    it('should catch play errors', async () => {
      const path = '/error.mp3';
      const errorSpy = spyOn(console, 'error');
      mockAudioInstance.play.and.returnValue(Promise.reject('Play error'));

      playSound('preset', path, undefined, SERVER_URL);

      // Wait for promise resolution
      await Promise.resolve();

      expect(mockAudioInstance.play).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith('Error playing sound', 'Play error');
    });

    it('should do nothing if URL is missing', () => {
      playSound('preset', undefined, undefined, SERVER_URL);
      expect(window.Audio).not.toHaveBeenCalled();
    });
  });

  describe('Text-to-Speech', () => {
    it('should speak provided text', () => {
      const text = 'Lap 5';
      playSound('tts', undefined, text, SERVER_URL);

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled(); // Should cancel previous
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();

      const callArgs = mockSpeechSynthesis.speak.calls.mostRecent().args;
      expect(callArgs[0].text).toBe(text);
    });

    it('should warn if TTS not supported', () => {
      // Remove synthesis support
      Object.defineProperty(window, 'speechSynthesis', {
        value: undefined,
        writable: true,
        configurable: true
      });
      const warnSpy = spyOn(console, 'warn');

      playSound('tts', undefined, 'Hello', SERVER_URL);

      expect(warnSpy).toHaveBeenCalledWith('Text-to-speech not supported in this browser.');
    });

    it('should do nothing if text is missing', () => {
      playSound('tts', undefined, undefined, SERVER_URL);
      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });

    it('should interpolate driver fields', () => {
      const text = "{driver.nickname}'s last lap was {driver.lastLapTime}";
      const data = {
        driver: {
          nickname: 'Dave',
          lastLapTime: 1.234
        }
      };
      playSound('tts', undefined, text, SERVER_URL, data);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const callArgs = mockSpeechSynthesis.speak.calls.mostRecent().args;
      expect(callArgs[0].text).toBe("Dave's last lap was 1.234");
    });

    it('should format decimals to 3 places', () => {
      const text = "Time: {time}";
      const data = { time: 1.2345678 };
      playSound('tts', undefined, text, SERVER_URL, data);

      const callArgs = mockSpeechSynthesis.speak.calls.mostRecent().args;
      expect(callArgs[0].text).toBe("Time: 1.235");
    });

    it('should leave unknown placeholders alone', () => {
      const text = "Hello {unknown}";
      playSound('tts', undefined, text, SERVER_URL, {});

      const callArgs = mockSpeechSynthesis.speak.calls.mostRecent().args;
      expect(callArgs[0].text).toBe("Hello {unknown}");
    });
  });

  describe('TTS Helpers', () => {
    it('should create a valid TTS context', () => {
      const driver = { name: 'Alice', nickname: 'Ali' };
      const data = { lastLapTime: 1.1, bestLapTime: 1.0, averageLapTime: 1.2, lapCount: 5 };
      const context = createTTSContext(driver, data);

      expect(context.driver.name).toBe('Alice');
      expect(context.driver.nickname).toBe('Ali');
      expect(context.driver.lastLapTime).toBe(1.1);
      expect(context.driver.lapCount).toBe(5);
    });

    it('should use name if nickname is missing', () => {
      const driver = { name: 'Bob', nickname: '' };
      const data = { lastLapTime: 0, bestLapTime: 0, averageLapTime: 0, lapCount: 0 };
      const context = createTTSContext(driver, data);

      expect(context.driver.nickname).toBe('Bob');
    });

    it('should create a mock context', () => {
      const context = mockTTSContext();
      expect(context.driver.name).toBeDefined();
      expect(context.driver.lastLapTime).toBeGreaterThan(0);
    });
  });
});
