import { Injectable } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { AngularFireAuth } from "angularfire2/auth";
import * as firebase from "firebase";

import "rxjs/add/operator/take";
import { BehaviorSubject } from "rxjs/BehaviorSubject";

@Injectable()
export class MessagingService {
  messaging = firebase.messaging();
  currentMessage = new BehaviorSubject(null);

  constructor(
    private db: AngularFireDatabase,
    private afAuth: AngularFireAuth
  ) {}

  updateToken(token) {
    this.afAuth.authState.take(1).subscribe(user => {
      if (!user) return;

      this.db
        .list(`fcmTokens/${user.uid}`)
        .valueChanges()
        .take(1)
        .subscribe((tokens: string[]) => {
          if (tokens) {
            if (tokens.length > 0) {
              var isOld = false;
              for (var i = 0; i < tokens.length; i++) {
                var oldToken = tokens[i];
                if (oldToken == token) {
                  isOld = true;
                  break;
                }
              }
              if (!isOld) {
                tokens.push(token);
                this.db.object("fcmTokens/").update({ [user.uid]: tokens });
              }
            } else {
              this.db.object("fcmTokens/").update({ [user.uid]: [token] });
            }
          } else {
            this.db.object("fcmTokens/").update({ [user.uid]: [token] });
          }
        });
    });
  }

  getPermission() {
    this.messaging
      .requestPermission()
      .then(() => {
        return this.messaging.getToken();
      })
      .then(token => {
        this.updateToken(token);
      })
      .catch(err => {});
  }

  receiveMessage() {
    this.messaging.onMessage(payload => {
      this.playAudio();
      this.currentMessage.next(payload);
    });
  }

  playAudio() {
    let audio = new Audio();
    //audio.src = "assets/newMessage.wav";
    audio.src = "assets/newemersound.wav";
    audio.load();
    audio.play();
  }
}
