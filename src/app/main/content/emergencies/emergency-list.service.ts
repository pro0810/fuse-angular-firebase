import { Injectable } from "@angular/core";
import { AngularFirestore } from "angularfire2/firestore";
import * as firebase from "firebase";
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot
} from "@angular/router";
import { Observable } from "rxjs/Observable";
import { switchMap, map } from "rxjs/operators";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { HttpHeaders, HttpClient } from "@angular/common/http";

import { DB_NAME, ENDPOINT, TW } from "../../../app.constants";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class EmergencyListService implements Resolve<any> {
  emergencyList: any[] = [];
  onEmergencyListChanged: BehaviorSubject<any> = new BehaviorSubject({});

  constructor(
    private afs: AngularFirestore,
    private httpClient: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Resolve
   * @param {ActivatedRouteSnapshot} route
   * @param {RouterStateSnapshot} state
   * @returns {Observable<any> | Promise<any> | any}
   */
  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    // return this.getEmergencyList();
  }

  getEmergencyList(): Observable<any> {
    let curUser = firebase.auth().currentUser;
    return this.authService.isAdmin.pipe(
      switchMap(isAdmin =>
        isAdmin
          ? this.afs.collection(`${DB_NAME.EMERG}`).valueChanges()
          : this.afs.doc(`${DB_NAME.COORS}/${curUser.uid}`).valueChanges()
      ),
      switchMap((admin: any) => {
        if (admin.belongsTo) {
          return this.afs
            .collection(`${DB_NAME.EMERG}`, ref =>
              ref.where("orgId", "==", admin.belongsTo)
            )
            .valueChanges();
        } else {
          return this.afs.collection(`${DB_NAME.EMERG}`).valueChanges();
        }
      })
    );
  }

  getEmergencyList1(): Observable<any> {
    let curUser = firebase.auth().currentUser;
    return this.authService.isAdmin.pipe(
      switchMap(isAdmin =>
        isAdmin
          ? this.afs.collection(`${DB_NAME.EMERG}`).valueChanges()
          : this.afs.doc(`${DB_NAME.COORS}/${curUser.uid}`).valueChanges()
      ),
      switchMap((admin: any) => {
        if (admin.belongsTo) {
          return this.afs
            .collection(`${DB_NAME.EMERG}`, ref =>
              ref
                .where("orgId", "==", admin.belongsTo)
                .where("active", "==", true)
            )
            .valueChanges();
        } else {
          return this.afs.collection(`${DB_NAME.EMERG}`).valueChanges();
        }
      })
    );
  }

  firstDeleteUsers(emerId, userId) {
    return this.afs.doc(`${DB_NAME.EMERG}/${emerId}/users/${userId}`).delete();
  }

  deleteEmergency(id: any) {
    return this.afs.doc(`${DB_NAME.EMERG}/${id}`).delete();
  }

  deleteLocation(id: any) {
    let ref = firebase
      .app()
      .database()
      .ref()
      .child(DB_NAME.LOCS)
      .child(id);
    ref.remove();
  }

  setActiveEmergency(id: any, active: boolean) {
    if (active) {
      this.afs
        .doc(`${DB_NAME.EMERG}/${id}`)
        .update({ active: active, startedAt: Date.now() });
    } else {
      this.afs
        .doc(`${DB_NAME.EMERG}/${id}`)
        .update({ active: active, endedAt: Date.now() });
    }
  }

  trackEmergency(emergencyId): Observable<any> {
    return this.afs.doc(`${DB_NAME.EMERG}/${emergencyId}`).valueChanges();
  }

  getSelectUser(userId): Observable<any> {
    if (userId) {
      return this.afs.doc(`${DB_NAME.USERS}/${userId}`).valueChanges();
    }
  }

  getUserFromId(emergId, userId): Observable<any> {
    if (emergId && userId) {
      return this.afs
        .doc(`${DB_NAME.EMERG}/${emergId}/${DB_NAME.USER}/${userId}`)
        .valueChanges();
    }
  }

  sendSMS(phone, text, func) {
    let path = `${ENDPOINT.SMS}`;
    let auth = btoa(`${TW.ACCID}:${TW.TOKEN}`);

    let headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + auth
    });

    let body = new URLSearchParams();
    body.set("To", phone);
    body.set("From", TW.PHONE);
    body.set("Body", text);

    this.httpClient
      .post(path, body.toString(), { headers: headers, responseType: "text" })
      .toPromise()
      .then(res => {
        func(null);
      })
      .catch(err => {
        func("error");
      });
  }
}
