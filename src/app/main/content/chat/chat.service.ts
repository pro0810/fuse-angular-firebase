import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot
} from "@angular/router";

import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import { Subject } from "rxjs/Subject";
import { BehaviorSubject } from "rxjs/BehaviorSubject";

import * as firebase from "firebase";

// import * as $ from 'jquery';

import { AngularFirestore } from "angularfire2/firestore";
import { AngularFireDatabase } from "angularfire2/database";
import { DB_NAME, ENDPOINT } from "../../../app.constants";
import { AuthService } from "../auth/auth.service";
import { switchMap, map } from "rxjs/operators";
import { of } from "rxjs";

@Injectable()
export class ChatService implements Resolve<any> {
  user: any;
  routeParams: any;

  onChatSelected = new BehaviorSubject<any>(null);
  onChatFrom = new BehaviorSubject<any>(null);
  onContactSelected = new BehaviorSubject<any>(null);
  onChatsUpdated = new Subject<any>();
  onUserUpdated = new Subject<any>();
  onLeftSidenavViewChanged = new Subject<any>();
  onRightSidenavViewChanged = new Subject<any>();

  constructor(
    private http: HttpClient,
    private afs: AngularFirestore,
    private db: AngularFireDatabase,
    private authService: AuthService
  ) {}

  getGeneratedRoomId(publisherId, subscriberId): string {
    if (publisherId < subscriberId) {
      return publisherId + "_" + subscriberId;
    } else {
      return subscriberId + "_" + publisherId;
    }
  }

  getChat(roomId): Observable<any> {
    // return this.db.list(`${DB_NAME.CHAT_MSGES}/${roomId}`, ref => ref.orderByChild('timestamp')).valueChanges(['child_added']);
    return this.db
      .list(`${DB_NAME.CHAT_MSGES}/${roomId}`, ref =>
        ref.orderByChild("timestamp")
      )
      .valueChanges();
  }

  loadDialog(roomId): Promise<any> {
    return firebase
      .database()
      .ref(`${DB_NAME.CHAT_MSGES}`)
      .child(roomId)
      .orderByChild("timestamp")
      .once("value");
  }

  trackAddedMessages(roomId): Observable<any> {
    return Observable.create(observer => {
      firebase
        .database()
        .ref(`${DB_NAME.CHAT_MSGES}`)
        .child(roomId)
        .orderByChild("timestamp")
        .on("child_added", snapshot => {
          observer.next(snapshot);
        });
    });
  }

  trackRemovedMessages(roomId): Observable<any> {
    return Observable.create(observer => {
      firebase
        .database()
        .ref(`${DB_NAME.CHAT_MSGES}`)
        .child(roomId)
        .orderByChild("timestamp")
        .on("child_removed", snapshot => {
          observer.next(snapshot);
        });
    });
  }

  selectContact(contact) {
    this.onContactSelected.next(contact);
  }

  setUserStatus(status) {
    let curUser = firebase.auth().currentUser;
    return this.authService.isAdmin.subscribe(isAdmin => {
      isAdmin
        ? this.afs
            .doc(`${DB_NAME.ADMIN}/${curUser.uid}`)
            .update({ status: status })
        : this.afs
            .doc(`${DB_NAME.COORS}/${curUser.uid}`)
            .update({ status: status });
    });
  }

  updateUserData(userData) {
    this.http
      .post("api/chat-user/" + this.user.id, userData)
      .subscribe((response: any) => {
        this.user = userData;
      });
  }

  sendMessage(roomId, message, receivers: any[]): Promise<any> {
    let sender = {
      id: this.user.id,
      name: this.user.name,
      photo: this.user.photo || ""
    };
    receivers.push(sender);
    var ref = firebase
      .app()
      .database()
      .ref()
      .child(DB_NAME.CHAT_MSGES)
      .child(roomId)
      .push();
    message.id = ref.key;

    let roomData = { id: roomId, users: receivers, lastMsg: message };
    receivers.forEach(user => {
      firebase
        .database()
        .ref(DB_NAME.CHAT_ROOMS)
        .child(user.id)
        .child(roomId)
        .update(roomData);
    });

    return ref.update(message);
  }

  clearUnreadCount(userId, roomId) {
    firebase
      .database()
      .ref()
      .child(DB_NAME.CHAT_ROOMS)
      .child(userId)
      .child(roomId)
      .child("unread")
      .set(0);
  }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    this.routeParams = route.params;
  }

  getContacts(): Observable<any> {
    let curUser = firebase.auth().currentUser;
    return this.authService.isAdmin.pipe(
      switchMap(isAdmin =>
        isAdmin
          ? this.afs.collection(`${DB_NAME.USERS}`).valueChanges()
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
          return of([]);
        }
      })
    );
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

  // getUserFromId(userId): Observable<any>
  // {
  //     return this.afs.doc(`${DB_NAME.USERS}/${userId}`).valueChanges();
  // }

  sendSMS(text, phone) {
    var sms = {
      body: text,
      from: "+610413979054",
      to: phone,
      authKey: "4cf57408b891c8d5809a4728cdb4f069"
    };

    var body = JSON.stringify(sms);

    // $.ajax({
    //     url: `${ENDPOINT.SMS}`,
    //     method: 'POST',
    //     data: {data: body},
    //     success: (Response) => {
    //     }
    // });

    /*let url = `https://your-cloud-function-url/function`
        let params: URLSearchParams = new URLSearchParams();
        const httpOptions = {
            headers: new HttpHeaders({
              'Content-Type':  'application/json',
              'Access-Control-Allow-Origin': '*'
            })
          };

        params.set('to', phone);
        params.set('from', 'you@yoursupercoolapp.com');
        params.set('subject', 'test');
        params.set('content', text);

        return this.http.post(url, params, httpOptions)
                        .toPromise()
                        .then( res => {
                        })
                        .catch(err => {
                        })*/
  }

  updateInUserTable(userId, value, emerId) {
    return this.afs
      .doc(`${DB_NAME.USERS}/${userId}`)
      .set({ isIndividual: value, emerId: emerId }, { merge: true });
  }
}
