export enum AnchorPoint {
  TopLeft = 'top-left',
  TopCenter = 'top-center',
  TopRight = 'top-right',
  CenterLeft = 'center-left',
  CenterCenter = 'center-center', // default
  CenterRight = 'center-right',
  BottomLeft = 'bottom-left',
  BottomCenter = 'bottom-center',
  BottomRight = 'bottom-right'
}

/**
 * A column definition for the heat driver table that can be used to customize
 * the display of the race day screens.
 */
export class ColumnDefinition {
  readonly labelKey: string;
  readonly propertyName: string;
  readonly width: number;
  readonly scaleToFit: boolean;
  readonly textAnchor: 'start' | 'middle' | 'end';
  readonly padding: number;
  readonly formatter: (value: any, hd: any) => string;
  readonly anchor: AnchorPoint;
  readonly layout: { [A in AnchorPoint]?: string };

  constructor(
    labelKey: string,
    propertyName: string,
    width: number,
    scaleToFit: boolean = false,
    textAnchor: 'start' | 'middle' | 'end' = 'middle',
    padding: number = 0,
    anchor: AnchorPoint = AnchorPoint.CenterCenter,
    formatter: (value: any, hd: any) => string = (v) => v?.toString() ?? '',
    layout: { [A in AnchorPoint]?: string } = {}
  ) {
    this.labelKey = labelKey;
    this.propertyName = propertyName;
    this.width = width;
    this.scaleToFit = scaleToFit;
    this.textAnchor = textAnchor;
    this.padding = padding;
    this.anchor = anchor;
    this.formatter = formatter;
    this.layout = layout;
  }

}
