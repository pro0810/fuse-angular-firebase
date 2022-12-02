import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import * as firebase from "firebase";
import { DB_NAME } from "../../../../app.constants";
import { Emergency } from "../emergency.model";
import { fuseAnimations } from "@fuse/animations";
import { EmergencyService } from "../emergency.service";
import { MatSnackBar } from "@angular/material";

@Component({
  selector: "app-emg-bulk-msg",
  templateUrl: "./emg-bulk-msg.component.html",
  styleUrls: ["./emg-bulk-msg.component.scss"],
  animations: fuseAnimations
})
export class EmgBulkMsgComponent implements OnInit, OnDestroy {
  @Input() emergency: Emergency;

  user: any;
  message: string;
  messages: any[] = [];
  messagesRef: any;
  sendAll: boolean = false;
  constructor(
    private emergService: EmergencyService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.emergService
      .getUser()
      .take(1)
      .subscribe(user => {
        this.user = user;
      });
    this.trackMessages();
  }

  ngOnDestroy() {
    if (this.messagesRef) {
      this.messagesRef.off();
    }
  }

  trackMessages() {
    var messagesAddedEvent = snapshot => {
      let message = snapshot.val();
      if (message.emergId == this.emergency.id) {
        this.sendAll = true;
        var found = this.messages.some(element => {
          return element.id === message.id;
        });
        if (!found) {
          this.messages.push(message);
        } else {
        }
        this.messages.sort((a, b) => {
          return a.timestamp > b.timestamp ? -1 : 1;
        });
      }
    };

    this.messagesRef = firebase
      .database()
      .ref(`${DB_NAME.EMERG_MSGES}`)
      .child(this.emergency.orgId);
    this.messagesRef.on("child_added", messagesAddedEvent);
  }

  onSend() {
    if (this.messages.length === 0) {
      this.sendAll = true;
    }
    if (this.message != null && this.message.length > 0) {
      var key = this.messagesRef.push().key;
      var content = this.message;
      content = content.replace(/\s*$/, "");
      const message = {
        id: key,
        emergId: this.emergency.id,
        content: content,
        timestamp: Date.now(),
        type: 0,
        sender: {
          id: this.user.id,
          name: this.user.name,
          photo: this.user.photo || ""
        },
        sendAll: this.sendAll
      };
      this.messagesRef
        .child(key)
        .update(message)
        .then(res => {
          this.snackBar.open("sent successfully", null, { duration: 500 });
          this.message = "";
          this.trackMessages();
        })
        .catch(error => {
          this.snackBar.open(error, null, { duration: 1500 });
        });
      this.sendSMS();
    } else {
      alert("Message content cannot be blank. Please try again.");
    }
  }

  sendSMS() {
    let emergencyService = this.emergService;
    if (emergencyService.emergency == null) return;
    //let smsResponse = emergencyService.emergency.smsResponse || [];

    let msg = this.message;

    emergencyService.userList.forEach(user => {
      var userSub = emergencyService
        .getUserFromId(emergencyService.emergency.id, user.id)
        .subscribe(data => {
          if (data.sms_time != null && data.sms_time != 0) {
            // emergencyService.sendSMS(data.phone, msg, error => {});
          }
          userSub.unsubscribe();
        });
      /*
        var info = null;
        for (var i = 0; i < smsResponse.length; i++) {
            if (smsResponse[i].id == user.id) {
                info = smsResponse[i];
                break;
            }
        }
        if (info != null && info.sms_time != null) {
          var userSub = emergencyService.getSelectUser(user.id).subscribe(data => {
            emergencyService.sendSMS(data.phone, msg, (error) => {              
            });
            userSub.unsubscribe();
          }); 
        }
        */
    });
  }

  updateMsg(key, message) {
    // this.messagesRef.child(key).update(message)
  }
}
