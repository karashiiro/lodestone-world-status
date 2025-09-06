export interface WorldStatus {
  name: string;
  status: "online" | "offline" | "maintenance";
  population: "standard" | "preferred" | "congested" | "preferred+" | "new";
  newCharacterCreation: boolean;
}

export interface WorldStatusRaw {
  name: string;
  statusText: string;
}

export interface DataCenter {
  name: string;
  region: "na" | "eu" | "jp" | "oc";
  worlds: WorldStatus[];
}
