export class Emergency {
  id: string;
  orgId: string;
  type: string;
  name: string;
  description: string;
  users: any[];
  usersNotified: any[];
  usersReplied: any[];
  smsResponse: any[];
  area: any[];
  notified: boolean;
  active: boolean;
  createdAt: number;
  startedAt: number;
  endedAt: number;
  zones: any[];
  notificationMsg: string;
  notify: string;
  sound: boolean;
  constructor(emergency?) {
    emergency = emergency || {};
    this.id = emergency.id || "?";
    this.orgId = emergency.orgId || "";
    this.type = emergency.type || "";
    this.name = emergency.name || "";
    this.description = emergency.description || "";
    this.notificationMsg = emergency.notificationMsg;
    this.notify = emergency.notify;
    this.users = emergency.users || [];
    this.usersNotified = emergency.usersNotified || [];
    this.usersReplied = emergency.usersReplied || [];
    this.smsResponse = emergency.smsResponse || [];
    this.area = emergency.area || [];
    if (emergency.active == null) {
      this.active = true;
    } else {
      this.active = emergency.active;
    }
    this.createdAt = emergency.createdAt || Date.now();
    this.startedAt = emergency.startedAt || Date.now();
    this.endedAt = emergency.endedAt || 0;
    this.zones = emergency.zones || [];
    this.sound = emergency.sound || false;
  }

  updateData(data) {
    this.name = data.name || "";
    this.description = data.description || "";
    this.active = data.active || true;
    this.notificationMsg = data.notificationMsg;
    this.notify = data.notify;
    this.sound = data.sound;
  }
}
