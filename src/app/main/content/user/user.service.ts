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

import * as $ from "jquery";
import { DB_NAME } from "../../../app.constants";
import { AngularFireAuth } from "angularfire2/auth";
import { of } from "rxjs";

@Injectable()
export class UserService implements Resolve<any> {
  routeParams: any;
  user: any;
  orgId: any;
  onUsersChanged: BehaviorSubject<any> = new BehaviorSubject({});
  onFileAttached: BehaviorSubject<any> = new BehaviorSubject({});

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private http: HttpClient
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    this.routeParams = route.params;
    this.loadOrgId();
    return new Promise((resolve, reject) => {
      Promise.all([this.getUser()]).then(() => {
        resolve();
      }, reject);
    });
  }

  getUser(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.routeParams.id === "new") {
        this.onUsersChanged.next(false);
        resolve(false);
      } else {
        this.afs
          .doc(`${DB_NAME.USERS}/${this.routeParams.id}`)
          .valueChanges()
          .take(1)
          .subscribe(response => {
            this.user = response;
            this.onUsersChanged.next(this.user);
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

  getCurrentUser(){
    const curUser = firebase.auth().currentUser;
    return of(curUser)
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

  saveUser(user) {
    if (user.id) {
      return this.afs.doc(`${DB_NAME.USERS}/${user.id}`).update({ ...user });
    }
  }

  updateUserStatus(userId, status) {
    if (userId) {
      return this.afs
        .doc(`${DB_NAME.USERS}/${userId}`)
        .update({ status: status });
    }
  }

  addUser(user) {
    return this.afs.doc(`${DB_NAME.USERS}/${user.id}`).set({ ...user });
  }

  deleteUser(user) {
    return this.afs.doc(`${DB_NAME.USERS}/${user.id}`).delete();
  }

  updatelatlngStatus(userId, lat, lng) {
    if (userId) {
      return this.afs
        .doc(`${DB_NAME.USERS}/${userId}`)
        .update({ currentlat: lat, currentlng: lng });
    }
  }

  get newId() {
    return this.afs.createId();
  }
}
