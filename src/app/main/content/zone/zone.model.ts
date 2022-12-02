export class Zone {
  zone_id: string;
  zone_name: string;
  zone_description: string;
  createdAt: number;
  startedAt: number;
  endedAt: number;
  type: string = "ZONE";
  users: any[];
  area: any[];
  orgId: string;
  active: boolean;

  constructor(zone?) {
    zone = zone || {};
    this.zone_id = zone.zone_id || "?";
    this.zone_name = zone.zone_name || "";
    this.zone_description = zone.zone_description || "";
    this.createdAt = zone.createdAt || Date.now();
    this.startedAt = zone.startedAt || Date.now();
    this.endedAt = zone.endedAt || 0;
    this.area = zone.area || [];
    this.orgId = zone.orgId;
    if (zone.active == null) {
      this.active = true;
    } else {
      this.active = zone.active;
    }
  }

  updateZoneData(data) {
    this.zone_name = data.zone_name || "";
    this.zone_description = data.zone_description || "";
    this.active = data.active || true;
  }
}
