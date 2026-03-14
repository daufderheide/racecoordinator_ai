export abstract class DefaultRacedaySetupHarnessBase {
  abstract clickDriverItem(): Promise<void>;
  abstract doubleClickDriverItem(): Promise<void>;
}
