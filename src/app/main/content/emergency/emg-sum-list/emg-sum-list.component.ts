import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { fuseAnimations } from "@fuse/animations";
import { UserStatus } from "../../user/user.model";
import { EmergencyService } from "../emergency.service";
import { Emergency } from "../emergency.model";
import { Subscription } from "rxjs";
import * as inside from "point-in-polygon";
import { DatePipe } from "@angular/common";
import * as firebase from "firebase";
import { DB_NAME } from "../../../../app.constants";
import { MatTableDataSource } from "@angular/material/table";
import { UserPipe } from "../../../../shared/pipes/user.pipe";
@Component({
  selector: "app-emg-sum-list",
  templateUrl: "./emg-sum-list.component.html",
  styleUrls: ["./emg-sum-list.component.scss"],
  animations: fuseAnimations,
  providers: [DatePipe]
})
export class EmgSummaryComponent implements OnInit, OnDestroy {
  userStatus = UserStatus;
  onEmergencyUpdated: Subscription;
  dataSource: any;
  displayedColumns = [
    "name",
    "phone",
    "responded_time",
    "response_lag",
    "response",
    // "message_sent",
    "status"
  ];
  @Input() emergency: Emergency;
  messages: any[] = [];
  messagesRef: any;
  // sendAll: boolean = false;
  constructor(
    public emergencyService: EmergencyService,
    private datePipe: DatePipe,
    private usPipe: UserPipe
  ) {}

  ngOnInit() {
    if (
      this.emergencyService.emergency == null ||
      this.emergency.type == "AREA"
    ) {
      this.area();
    } else {
      this.otherThanArea();
    }
    this.checkAllMessage();
  }

  checkAllMessage() {
    var messagesAddedEvent = snapshot => {
      let message = snapshot.val();
      if (message.emergId == this.emergency.id) {
        // this.sendAll = true;
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

  ngOnDestroy() {
    if (this.onEmergencyUpdated) {
      this.onEmergencyUpdated.unsubscribe();
    }
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  area() {
    this.displayedColumns = [
      "name",
      "phone",
      "responded_time",
      "response_lag",
      "response",
      // "message_sent",
      "status"
    ];
    const polygon = [];
    const area = this.emergency.area || [];
    area.forEach(element => {
      const lat = element.lat;
      const lng = element.lng;
      polygon.push([lat, lng]);
    });
    this.emergencyService
      .loadAllUserList(this.emergency.orgId)
      .then(querySnapshot => {
        const arrData = [];
        querySnapshot.forEach(doc => {
          const userData = doc.data();
          const user = {
            id: userData.id,
            name: userData.name,
            photo: userData.photo || ""
          };
          if (this.emergency.type === "AREA") {
            const isInside = inside(
              [userData.location.lat, userData.location.lng],
              polygon
            );
            if (this.emergency.notify === "notifyAllUsers") {
              arrData.push(user);
            } else {
              if (isInside) {
                arrData.push(user);
              }
            }
          } else {
            arrData.push(user);
          }
        });
        this.emergencyService.userList = arrData;
        this.dataSource = new MatTableDataSource(
          this.emergencyService.userList
        );
        this.emergencyService.onUserListChanged.next(arrData);
      })
      .catch(error => {});
  }

  otherThanArea() {
    this.emergencyService.userList = this.emergency.users;
    this.dataSource = new MatTableDataSource(this.emergencyService.userList);
    this.displayedColumns = [
      "name",
      "phone",
      "responded_time",
      "response_lag",
      "response",
      // "message_sent",
      "status"
    ];
    if (this.onEmergencyUpdated) {
      this.onEmergencyUpdated.unsubscribe();
    }
    this.onEmergencyUpdated = this.emergencyService
      .trackEmergency(this.emergency.id)
      .subscribe(data => {
        this.emergency = new Emergency(data);
      });
  }

  getUserRepliedStatus(user) {
    if (user == null) {
      return UserStatus.NOT_RESPOND;
    }
    if (user.sms_time != null && user.sms_time > 0) {
      return user.status;
    }

    if (user.app_time != null) {
      return user.status;
    }
    return UserStatus.NOT_RESPOND;
  }
  public y = [];
  getResponseLag(user, i) {
    const ctime = this.emergency.startedAt;
    if (user.app_time !== null) {
      this.y[i] = user.app_time;
    }
    if (!this.emergency.active && user.app_time) {
      user.app_time = null;
      return "-";
    }
    if (!this.emergency.active) {
      if (this.y[i] === null || this.y[i] === undefined) {
        return "-";
      } else {
        var date1 = new Date(this.y[i]);
        var date2 = new Date(ctime);
        var res = Math.abs(date1.getTime() - date2.getTime()) / 1000;
        var minutes = Math.floor(res / 60) % 60;
        var seconds = res % 60;
        return minutes + "m " + Math.floor(seconds) + "s";
      }
    }
    if (this.emergency.startedAt > this.y[i]) {
      return "-";
    }
    if (user.app_time === null || user.app_time === undefined) {
      return "-";
    }
    if (user.app_time !== null) {
      var date1 = new Date(user.app_time);
      var date2 = new Date(ctime);
      var res = Math.abs(date1.getTime() - date2.getTime()) / 1000;
      var minutes = Math.floor(res / 60) % 60;
      var seconds = res % 60;
      return minutes + "m " + Math.floor(seconds) + "s";
    }
    return "-";
  }

  // checkIndividual(user) {
  //   if (this.sendAll === true) {
  //     return "Y";
  //   } else {
  //     if (user.emerId === this.emergency.id) {
  //       return "Y";
  //     } else {
  //       return "N";
  //     }
  //   }
  // }
  public x = [];
  getAppResponse(user, i) {
    if (user.app_time !== null) {
      this.x[i] = user.app_time;
    }
    if (!this.emergency.active && user.app_time) {
      user.app_time = null;
      return "-";
    }
    if (!this.emergency.active) {
      if (this.x[i] === null || this.x[i] === undefined) {
        return "-";
      } else {
        const todate = new Date(this.x[i]);
        const medium = this.datePipe.transform(todate, "MMM d, y HH:mm:ss");
        return medium;
      }
    }
    if (this.emergency.startedAt > this.x[i]) {
      return "-";
    }
    if (user.app_time === null || user.app_time === undefined) {
      return "-";
    }
    if (user.app_time !== null) {
      const todate = new Date(user.app_time);
      const medium = this.datePipe.transform(todate, "MMM d, y HH:mm:ss");
      return medium;
    }
    return "-";
  }

  getSmsResponse(user) {
    if (user.app_time != null) {
      if (user.sms_time != null) {
        if (user.sms_time > user.app_time) {
          return "SMS";
        }
      }
      return "APP";
    }
    if (user.sms_time != null) {
      if (user.sms_time > 0) {
        return "SMS";
      }
    }
    return "-";
  }
}
