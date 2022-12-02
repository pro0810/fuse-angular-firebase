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
import { switchMap, map } from "rxjs/operators";
import { HttpHeaders, HttpClient } from "@angular/common/http";
import { AuthService } from "../auth/auth.service";
import * as $ from "jquery";
import { DB_NAME } from "../../../app.constants";
import { AngularFireAuth } from "angularfire2/auth";
import { of } from "rxjs";
import { combineLatest } from "rxjs/observable/combineLatest";

@Injectable({ providedIn: "root" })
export class ZoneService implements Resolve<any> {
  routeParams: any;
  user: any;
  orgId: any;
  onZonesChanged: BehaviorSubject<any> = new BehaviorSubject({});
  onFileAttached: BehaviorSubject<any> = new BehaviorSubject({});
  onEmergencyChanged: BehaviorSubject<any> = new BehaviorSubject({});
  onUserListChanged: BehaviorSubject<any> = new BehaviorSubject({});
  onUserSelected: BehaviorSubject<any> = new BehaviorSubject({});
  onUserListUpdated: BehaviorSubject<any> = new BehaviorSubject({});
  pageType = "";

  selectedUsers: any[] = [];
  emergency: any;

  constructor(
    private authService: AuthService,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private http: HttpClient
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
      Promise.all([this.getZone()]).then(() => {
        resolve();
      }, reject);
    });
  }

  getZone(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.routeParams.id === "new") {
        this.onZonesChanged.next(false);
        resolve(false);
      } else {
        this.afs
          .doc(`${DB_NAME.USERS}/${this.routeParams.id}`)
          .valueChanges()
          .take(1)
          .subscribe(response => {
            this.user = response;
            this.onZonesChanged.next(this.user);
            resolve(response);
          }, reject);
      }
    });
  }

  get isAdmin(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      switchMap(auth => {
        if (!auth) {
          return of(false);
        }

        return this.afs
          .doc(`${DB_NAME.ADMIN}/${auth.uid}`)
          .valueChanges()
          .take(1)
          .pipe(
            switchMap(response => {
              if (response != null) {
                return of(true);
              } else {
                return of(false);
              }
            })
          );
      })
    );
  }

  loadOrgId() {
    const curUser = firebase.auth().currentUser;
    return this.isAdmin
      .pipe(
        switchMap(isAdmin =>
          isAdmin
            ? this.afs.doc(`${DB_NAME.ADMIN}/${curUser.uid}`).valueChanges()
            : this.afs.doc(`${DB_NAME.COORS}/${curUser.uid}`).valueChanges()
        ),
        switchMap((admin: any) => {
          if (admin.belongsTo) {
            this.orgId = admin.belongsTo;
          } else {
            this.orgId = null;
          }
          return of(this.orgId);
        })
      )
      .subscribe(res => {});
  }

  checkExistingUser(phone): Promise<any> {
    return new Promise((resolve, reject) => {
      this.afs
        .collection(`${DB_NAME.USERS}`, ref => ref.where("phone", "==", phone))
        .valueChanges()
        .subscribe(res => resolve(res), reject);
    });
  }

  getUserById(userId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.afs
        .doc(`${DB_NAME.USERS}/${userId}`)
        .valueChanges()
        .subscribe(res => resolve(res), reject);
    });
  }

  getUsersBelongsTo(orgId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.afs
        .collection(`${DB_NAME.USERS}`, ref =>
          ref.where("belongsTo", "==", orgId)
        )
        .valueChanges()
        .subscribe(res => resolve(res), reject);
    });
  }

  getCoordinatorById(userId: string) {
    return this.afs.doc(`${DB_NAME.COORS}/${userId}`).valueChanges();
  }

  getAdminById(userId: string) {
    return this.afs.doc(`${DB_NAME.ADMIN}/${userId}`).valueChanges();
  }

  saveZone(user) {
    if (user.id) {
      return this.afs.doc(`${DB_NAME.USERS}/${user.id}`).update({ ...user });
    }
  }

  updateZoneStatus(userId, status) {
    if (userId) {
      return this.afs
        .doc(`${DB_NAME.USERS}/${userId}`)
        .update({ status: status });
    }
  }

  addZone(zone) {
    return this.afs.doc(`${DB_NAME.ZONES}/${zone.zone_id}`).set({ ...zone });
  }

  deleteZone(user) {
    return this.afs.doc(`${DB_NAME.USERS}/${user.id}`).delete();
  }

  get new_zone_ID() {
    return this.afs.createId();
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
  getEmergUserList0(userList: any[]): Observable<any> {
    return combineLatest(
      userList.map(u =>
        this.afs
          .doc(`${DB_NAME.EMERG}/${this.emergency.id}/users/${u.id}`)
          .valueChanges()
      )
    );
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

  trackEmergency(emergencyId): Observable<any> {
    return this.afs.doc(`${DB_NAME.EMERG}/${emergencyId}`).valueChanges();
  }
}
