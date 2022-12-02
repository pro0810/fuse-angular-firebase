import { Injectable } from "@angular/core";
import { AngularFirestore } from "angularfire2/firestore";
import * as firebase from "firebase";
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot
} from "@angular/router";
import { Observable } from "rxjs/Observable";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { switchMap, map, tap } from "rxjs/operators";
import { HttpHeaders, HttpClient } from "@angular/common/http";
import { DB_NAME, ENDPOINT, TW } from "../../../app.constants";
import { AuthService } from "../auth/auth.service";
import { combineLatest } from "rxjs/observable/combineLatest";
import { AngularFireDatabase } from "../../../../../node_modules/angularfire2/database";
import { NgxXml2jsonService } from "ngx-xml2json";
import { of } from "rxjs";
// import {Http, Headers, Response} from '@angular/http';

@Injectable()
export class EmergencyService implements Resolve<any> {
  user: any;
  routeParams: any;
  emergency: any;
  userList: any[] = [];
  selectedUsers: any[] = [];
  pageType = "";
  onEmergencyChanged: BehaviorSubject<any> = new BehaviorSubject({});
  onUserListChanged: BehaviorSubject<any> = new BehaviorSubject({});
  onUserSelected: BehaviorSubject<any> = new BehaviorSubject({});
  onUserListUpdated: BehaviorSubject<any> = new BehaviorSubject({});

  onZoneListUpdated: BehaviorSubject<any> = new BehaviorSubject({});

  onOrgChanged: BehaviorSubject<any> = new BehaviorSubject(null);

  constructor(
    private authService: AuthService,
    private afs: AngularFirestore,
    private db: AngularFireDatabase,
    private httpClient: HttpClient,
    private x2jService: NgxXml2jsonService
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
    this.routeParams = route.params;
    return new Promise((resolve, reject) => {
      Promise.all([this.getEmergency()]).then(() => {
        resolve();
      }, reject);
    });
  }

  getSummary() {
    return this.afs.collection("/EMERG").valueChanges();
  }

  getUser(): Observable<any> {
    let curUser = firebase.auth().currentUser;
    return this.authService.isAdmin.pipe(
      switchMap(isAdmin =>
        isAdmin
          ? this.afs.doc(`${DB_NAME.ADMIN}/${curUser.uid}`).valueChanges()
          : this.afs.doc(`${DB_NAME.COORS}/${curUser.uid}`).valueChanges()
      ),
      map((user: any) => {
        if (user.id)
          user.chatList = this.db
            .list(`${DB_NAME.CHAT_ROOMS}/${user.id}`)
            .valueChanges();
        this.user = user;
        return this.user;
      })
    );
  }

  getEmergency(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.routeParams.id === "new") {
        this.emergency = null;
        this.onEmergencyChanged.next(null);
        resolve(false);
      } else {
        this.afs
          .doc(`${DB_NAME.EMERG}/${this.routeParams.id}`)
          .valueChanges()
          .take(1)
          .subscribe(response => {
            this.emergency = response;
            this.onEmergencyChanged.next(this.emergency);
            resolve(response);
          }, reject);
      }
    });
  }

  saveEmergency(emergency) {
    if (emergency.id) {
      return this.afs
        .doc(`${DB_NAME.EMERG}/${emergency.id}`)
        .update({ ...emergency });
    }
  }

  addEmergency(emergency) {
    // emergency.users.forEach(user => {
    //   this.afs
    //     .doc(`${DB_NAME.USERS}/${user.id}`)
    //     .set({ firstResponse: false }, { merge: true })
    //     .then(res => {});
    // });
    return this.afs
      .doc(`${DB_NAME.EMERG}/${emergency.id}`)
      .set({ ...emergency });
  }

  deleteEmergency(emergency) {
    return this.afs.doc(`${DB_NAME.EMERG}/${emergency.id}`).delete();
  }

  addEmergUsers(emergency, func) {
    if (emergency.users == null || emergency.users.length == 0) {
      func(emergency.id);
      return;
    }
    var usrSub = this.getEmergUserList(emergency.users).subscribe(
      users => {
        users.forEach((user: any, i) => {
          // alert(user.id);
          this.afs
            .doc(`${DB_NAME.EMERG}/${emergency.id}/users/${user.id}`)
            .set({ ...user });
          this.updateCurrentLatLng(
            user.id,
            user.location.lat,
            user.location.lng
          );
        });
        usrSub.unsubscribe();
        usrSub = null;
        func(emergency.id);
      },
      error => {
        func(null);
      }
    );
  }

  updateCurrentLatLng(id, currentlat, currentlng) {
    return this.afs
      .doc(`${DB_NAME.USERS}/${id}`)
      .set({ currentlat, currentlng }, { merge: true })
      .then();
  }

  addSingleUser(emergency, addingUser) {
    var usrSub = this.getEmergUserList(addingUser).subscribe(users => {
      this.afs.firestore
        .collection("Emergencies")
        .doc(emergency.id)
        .set({ users }, { merge: true });
      users.forEach(res => {
        this.afs.firestore
          .collection("Emergencies")
          .doc(`${emergency.id}/users/${res.id}`)
          .set({ ...res });
      });
      usrSub.unsubscribe();
      usrSub = null;
      return "success";
    });
    // return this.afs.firestore
    //   .collection("Emergencies")
    //   .doc(emergency.id)
    //   .set({ users: user }, { merge: true });
  }

  get newId() {
    return this.afs.createId();
  }

  getUserData(userId) {
    return this.afs.doc(`${DB_NAME.USERS}/${userId}`).valueChanges();
  }

  getEmergUserList(userList: any[]): Observable<any> {
    return combineLatest(
      userList.map(u => this.afs.doc(`${DB_NAME.USERS}/${u.id}`).valueChanges())
    );
  }

  getEmergUserList0(userList: any[]): Observable<any> {
    return combineLatest(
      userList.map(u =>
        this.afs
          .doc(`${DB_NAME.EMERG}/${this.emergency.id}/users/${u.id}`)
          .valueChanges()
      )
    );
  }

  getAllOrgUserList(orgId): Observable<any> {
    return this.afs
      .collection(`${DB_NAME.USERS}`, ref =>
        ref.where("belongsTo", "==", orgId)
      )
      .valueChanges();
  }

  getAllUserList(): Observable<any> {
    let curUser = firebase.auth().currentUser;
    return this.authService.isAdmin.pipe(
      switchMap(isAdmin =>
        isAdmin
          ? this.afs.doc(`${DB_NAME.ADMIN}/${curUser.uid}`).valueChanges()
          : this.afs.doc(`${DB_NAME.COORS}/${curUser.uid}`).valueChanges()
      ),
      switchMap((admin: any) => {
        if (admin.belongsTo) {
          return this.afs
            .collection(`${DB_NAME.USERS}`, ref =>
              ref.where("belongsTo", "==", admin.belongsTo)
            )
            .valueChanges();
        } else {
          return this.afs.collection(`${DB_NAME.USERS}`).valueChanges();
        }
      })
    );
  }

  loadAllUserList(orgId): Promise<any> {
    var db = firebase.firestore();
    return db
      .collection("UserList")
      .where("belongsTo", "==", orgId)
      .get();
  }

  loadAllZoneList(orgId): Promise<any> {
    var db = firebase.firestore();
    return db
      .collection("Zones")
      .where("belongsTo", "==", orgId)
      .get();
  }

  getEmergencyList(belongsTo) {
    return firebase
      .firestore()
      .collection("Emergencies")
      .where("orgId", "==", belongsTo)
      .where("type", "==", "AREA")
      .get()
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          const emergency = doc.data();
        });
        return querySnapshot;
      })
      .catch(error => {
        return error;
      });
  }

  getOrganization(): Observable<any> {
    let curUser = firebase.auth().currentUser;
    return this.authService.isAdmin.pipe(
      switchMap(isAdmin =>
        isAdmin
          ? this.afs.doc(`${DB_NAME.ADMIN}/${curUser.uid}`).valueChanges()
          : this.afs.doc(`${DB_NAME.COORS}/${curUser.uid}`).valueChanges()
      ),
      switchMap((admin: any) => {
        if (admin.belongsTo) {
          return this.afs
            .collection(`${DB_NAME.ORGAS}`, ref =>
              ref.where("id", "==", admin.belongsTo)
            )
            .valueChanges();
        } else {
          return this.afs.collection(`${DB_NAME.ORGAS}`).valueChanges();
        }
      })
    );
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

  setUsersReplied(id: any, data: string[]) {
    this.afs.doc(`${DB_NAME.EMERG}/${id}`).update({ usersReplied: data });
  }

  // setSmsResponse(id:any, data:string[]) {
  //     this.afs.doc(`${DB_NAME.EMERG}/${id}`).update({'smsResponse': data});
  // }

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

  updateUserSmsTime(emergId, userId, smsTime) {
    if (emergId && userId) {
      this.afs
        .doc(`${DB_NAME.EMERG}/${emergId}/${DB_NAME.USER}/${userId}`)
        .update({ sms_time: smsTime });
    }
  }

  updateUserStatus(emergId, userId, status) {
    emergId = emergId || this.emergency.id;
    if (emergId && userId) {
      this.afs
        .doc(`${DB_NAME.EMERG}/${emergId}/${DB_NAME.USER}/${userId}`)
        .update({ status: status });
      return this.afs
        .doc(`${DB_NAME.USERS}/${userId}`)
        .update({ status: status });
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

  pad(n) {
    return n < 10 ? "0" + n : n;
  }

  recvSMS(phone, timestamp, func) {
    var myDate = new Date(timestamp);
    var yyyymmdd =
      myDate.getFullYear() +
      "-" +
      this.pad(myDate.getMonth() + 1) +
      "-" +
      this.pad(myDate.getDate());

    let path = `${ENDPOINT.SMS}?From=${phone}&DateSent>=${yyyymmdd}&PageSize=200`;
    var auth = btoa(`${TW.ACCID}:${TW.TOKEN}`);

    let headers = new HttpHeaders({
      "Content-Type": "text/xml",
      Authorization: "Basic " + auth
    });

    this.httpClient
      .get(path, { headers: headers, responseType: "text" })
      .subscribe(
        res => {
          var ret = null;
          var com_time = 0;
          const parser = new DOMParser();
          const xml = parser.parseFromString(res, "text/xml");
          const json = this.x2jService.xmlToJson(xml);

          if (json != null) {
            let twResp = json["TwilioResponse"];
            if (twResp != null) {
              let twMsg = twResp["Messages"];
              if (twMsg != null) {
                let msges = twMsg["Message"];
                if (msges instanceof Array) {
                  com_time = timestamp;
                  msges.forEach(msg => {
                    var msg_date = Date.parse(msg["DateSent"]);
                    if (msg_date > com_time) {
                      com_time = msg_date;
                      ret = msg["Body"];
                    }
                  });
                } else if (msges != undefined && msges != null) {
                  com_time = timestamp;
                  var msg_date = Date.parse(msges["DateSent"]);
                  if (msg_date > com_time) {
                    com_time = msg_date;
                    ret = msges["Body"];
                  }
                }
              }
            }
          }

          func(ret, com_time);
        },
        error => {
          func(null, 0);
        }
      );
  }
  // setFirstResponse(user, firstResponse) {
  //   return this.afs
  //     .doc(`${DB_NAME.USERS}/${user.id}`)
  //     .set({ firstResponse }, { merge: true });
  // }
  getUsersInfo(id) {
    return this.afs.doc(`${DB_NAME.USERS}/${id}`).valueChanges();
  }

  // setLocationOfUsers(emergId, user) {
  //   return this.afs
  //     .doc(`${DB_NAME.LOCATION}/${emergId}/users/${user.id}`)
  //     .set({ ...user })
  //     .then();
  // }

  // updateLocationOfUsers(emergId, user) {
  //   return this.afs
  //     .doc(`${DB_NAME.LOCATION}/${emergId}/users/${user.id}`)
  //     .update({ location: user.location })
  //     .then();
  // }

  // getUsersLocation(emerId, user) {
  //   return this.afs
  //     .doc(`${DB_NAME.LOCATION}/${emerId}/users/${user.id}`)
  //     .valueChanges()
  //     .pipe(map(res => res));
  // }
}
