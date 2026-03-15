export abstract class HelpOverlayHarnessBase {
  static readonly hostSelector = 'app-help-overlay';

  static readonly selectors = {
    overlayContainer: '.help-overlay-container',
    title: '.popover-header h3',
    content: '.popover-content',
    nextButton: '.btn-next',
    prevButton: '.btn-prev',
    finishButton: '.btn-finish',
    closeButton: '.close-btn',
    stepCounter: '.step-counter',
    highlightMask: '.highlight-mask',
    popover: '.help-popover'
  };

  /** Checks if the help overlay container is present and visible */
  abstract isVisible(): Promise<boolean>;
  
  /** Gets the title text of the current help step */
  abstract getTitle(): Promise<string>;
  
  /** Gets the text content of the current help step */
  abstract getContent(): Promise<string>;
  
  /** Clicks the "Next" button */
  abstract clickNext(): Promise<void>;
  
  /** Clicks the "Back/Previous" button */
  abstract clickPrevious(): Promise<void>;
  
  /** Clicks the "Finish" button */
  abstract clickFinish(): Promise<void>;
  
  /** Clicks the "X" close button in the header */
  abstract clickClose(): Promise<void>;
  
  /** Gets the step counter text (e.g. "1 / 3") */
  abstract getStepCounter(): Promise<string>;
  
  /** Checks if the highlight mask (hole effect) is currently active */
  abstract hasHighlightMask(): Promise<boolean>;

  /** Wait for the popover and mask animations to stabilize (useful for visual testing) */
  abstract waitForStable(): Promise<void>;
}
