export abstract class AudioSelectorHarnessBase {
  static readonly hostSelector = 'app-audio-selector';

  static readonly selectors = {
    label: '.audio-header label',
    toggleSpans: '.toggle-group span',
    selectWrapper: '.select-wrapper',
    selectedSoundName: '.dm-select',
    ttsInput: 'input.dm-input',
    playButton: '.btn-play'
  };

  /** Gets the label text */
  abstract getLabel(): Promise<string>;

  /** Gets the currently selected audio type ('preset' or 'tts') */
  abstract getAudioType(): Promise<'preset' | 'tts'>;

  /** Clicks the preset type toggle */
  abstract clickPresetType(): Promise<void>;

  /** Clicks the TTS type toggle */
  abstract clickTtsType(): Promise<void>;

  /** Clicks the select wrapper to open the item selector */
  abstract clickSelectSound(): Promise<void>;

  /** Gets the name of the currently selected sound from the select wrapper */
  abstract getSelectedSoundName(): Promise<string>;

  /** Gets the value of the TTS text input */
  abstract getTtsText(): Promise<string>;

  /** Sets the value of the TTS text input */
  abstract setTtsText(text: string): Promise<void>;

  /** Clicks the play button */
  abstract clickPlay(): Promise<void>;
}
