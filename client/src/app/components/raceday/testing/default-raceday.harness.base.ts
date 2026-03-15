export abstract class DefaultRacedayHarnessBase {
  abstract getDriverRowCount(): Promise<number>;
  abstract getDriverRowText(index: number): Promise<string>;
  abstract clickMenuButton(name: string): Promise<void>;
  abstract clickMenuItem(name: string): Promise<void>;
  abstract isHeaderColumnVisible(text: string): Promise<boolean>;
}
