export interface CustomUI {
  _id?: string;
  entity_id: string;
  name: string;
  is_default: boolean;
  layoutJson?: string;
  columnsJson?: string;
  columnLayoutsJson?: string;
  columnVisibilityJson?: string;
  columnWidthsJson?: string;
  columnAnchorsJson?: string;
}
