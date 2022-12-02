import { MatChipInputEvent } from "@angular/material";

import { FuseUtils } from "@fuse/utils";

export enum UserStatus {
  NORMAL = 0,
  NEED_HELP,
  ACKNOWLEDGED,
  NOTIFIED,
  REPLIED,
  NOT_RESPOND,
  UNKNOWN
}

export class User {
  id: string;
  name: string;
  phone: string;
  photo: string;
  description: string;
  belongsTo: String;
  favorites: string[];
  tags: string[];
  images: {
    default: boolean;
    id: string;
    url: string;
    type: string;
  }[];
  height: number;
  weight: number;
  location: {
    name: string;
    addr: string;
    lat: number;
    lng: number;
  };
  status: number;
  active: boolean;
  enroll: boolean;
  sms_time: number;
  app_time: number;
  currentlat: number;
  currentlng: number;
  // firstResponse: any;

  constructor(user?) {
    user = user || {};
    this.id = user.id || "?";
    this.name = user.name || "";
    this.photo = user.photo || "";
    this.phone = user.phone || "";
    this.description = user.description || "";
    this.belongsTo = user.belongsTo || "?";
    this.favorites = user.favorites || [];
    this.tags = user.tags || [];
    this.images = user.images || [];
    this.height = user.height || 0;
    this.weight = user.weight || 0;
    this.location = user.location || { name: "", addr: "", lat: 0.0, lng: 0.0 };
    this.status = user.status || 0;
    this.active = user.active || false;
    this.enroll = user.enroll || false;
    this.sms_time = user.sms_time;
    this.app_time = user.app_time;
    this.currentlat = user.currentlat || 0.0;
    this.currentlng = user.currentlng || 0.0;
    // this.firstResponse = user.firstResponse;
  }

  addFavorite(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add category
    if (value) {
      this.favorites.push(value);
    }

    // Reset the input value
    if (input) {
      input.value = "";
    }
  }

  addOrgId(orgId) {
    // if (!this.isExistOrgId(orgId)[0]) this.belongsTo.push(orgId);
  }

  removeOrgId(orgId) {
    let check = this.isExistOrgId(orgId);
    // if (check[0]) this.belongsTo.splice(check[1], 1);
  }

  isExistOrgId(orgId): [boolean, number] {
    var isExist = false;
    var indexOf = -1;
    for (var i = 0; i < this.belongsTo.length; i++) {
      let oldId = this.belongsTo[i];
      if (orgId === oldId) {
        isExist = true;
        indexOf = i;
        break;
      }
    }
    return [isExist, indexOf];
  }

  removeFavorite(category) {
    const index = this.favorites.indexOf(category);
    if (index >= 0) {
      this.favorites.splice(index, 1);
    }
  }

  addTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add tag
    if (value) {
      this.tags.push(value);
    }

    // Reset the input value
    if (input) {
      input.value = "";
    }
  }

  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  updateData(data) {
    this.name = data.name || "";
    this.phone = data.phone || "";
    this.description = data.description || "";
    this.belongsTo = data.belongsTo || "?";
    this.favorites = data.favorites || [];
    this.tags = data.tags || [];
    this.images = data.images || [];
    this.height = parseFloat(data.height) || 0.0;
    this.weight = parseFloat(data.weight) || 0.0;
    this.location = {
      name: data.location_name,
      addr: data.location_addr,
      lat: parseFloat(data.location_lat),
      lng: parseFloat(data.location_lng)
    } || { name: "", addr: "", lat: 0.0, lng: 0.0 };
    this.active = data.active || false;
    this.enroll = data.enroll || false;
    this.sms_time = null;
    this.app_time = null;
  }
}
