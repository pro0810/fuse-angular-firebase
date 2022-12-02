import { Injectable } from "@angular/core";
import { AngularFirestore } from "angularfire2/firestore";
import { DB_NAME } from "../../../app.constants";
import { BehaviorSubject } from "rxjs";
@Injectable({
  providedIn: "root"
})
export class ZoneListService {
  getSingleZone: BehaviorSubject<any>;
  constructor(public afs: AngularFirestore) {}
  deleteZone(zoneKey) {
    return this.afs
      .collection("/Zones")
      .doc(zoneKey)
      .delete();
  }

  getZoneData() {
    this.getSingleZone.asObservable();
  }

  sendZoneData(zone) {
    return this.getSingleZone.next(zone);
  }

  getZone() {
    return this.afs.collection("/Zones").valueChanges();
  }

  onCLick_zonedata(zoneclick_id) {
    return this.afs.doc(`${DB_NAME.ZONES}/${zoneclick_id}`).valueChanges();
  }

  getOrgName(id) {
    return this.afs.doc(`${DB_NAME.ORGAS}/${id}`).valueChanges();
  }
}
