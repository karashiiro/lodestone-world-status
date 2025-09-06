export interface WorldStatus {
  name: string;
  status: "online" | "offline" | "maintenance";
  population?: "low" | "standard" | "preferred" | "congested";
  newCharacterCreation?: boolean;
}

export interface DataCenter {
  name: string;
  region: "na" | "eu" | "jp" | "oc";
  worlds: WorldStatus[];
}

export interface LodestoneResponse {
  dataCenters: DataCenter[];
  lastUpdated: Date;
}
