export enum DsType {
  DS_030 = 0,
  DS_200 = 1,
  DS_200B = 2,
  DS_300 = 3,
  DS_300RC = 4,
}

export interface DsConfig {
  name: string;
  commPort: string;
  type: DsType;
  baudRate?: number;
}
