import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  Input,
  OnDestroy,
  Output,
  EventEmitter
} from "@angular/core";
import { MatPaginator, MatSort, MatDialog } from "@angular/material";
import { DataSource } from "@angular/cdk/collections";
import { SelectionModel } from "@angular/cdk/collections";
import "rxjs/add/operator/startWith";
import "rxjs/add/observable/merge";
import "rxjs/add/operator/map";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/observable/fromEvent";
import { Observable } from "rxjs/Observable";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { fuseAnimations } from "@fuse/animations";
import { FuseUtils } from "@fuse/utils";
import { UserStatus } from "../../user/user.model";
import { EmergencyService } from "../emergency.service";
import { Emergency } from "../emergency.model";
import { EmgUserFormComponent } from "../emg-user-form/emg-user-form.component";
import { Router } from "@angular/router";
import { switchMap, retryWhen } from "rxjs/operators";
import { of, Subscription } from "rxjs";
import * as inside from "point-in-polygon";
import { UserService } from "../../user/user.service";
import { OrganizationListService } from "../../organizations/organization-list.service";
import { Zone } from "../../zone/zone.model";
import { UserPipe } from "../../../../shared/pipes/user.pipe";

@Component({
  selector: "app-emg-user-list",
  templateUrl: "./emg-user-list.component.html",
  styleUrls: ["./emg-user-list.component.scss"],
  animations: fuseAnimations
})
export class EmgUserListComponent implements OnInit, OnDestroy {
  selection = new SelectionModel<string>(true, []);

  userStatus = UserStatus;
  statusArray = [
    { id: 0, name: "I'm OK" },
    { id: 1, name: "Need Help" },
    { id: 2, name: "No Response" },
    { id: 3, name: "Acknowledged" }
  ];
  selectedStatus = {};

  onEmergencyUpdated: Subscription;

  dataSource: UsersDataSource | null;
  displayedColumns = [
    "checkbox",
    "photo",
    "name",
    "phone",
    "response",
    "message",
    "status",
    "ack"
  ];
  alert: boolean=false

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("filter") filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;
  @Input() disable: boolean = false;

  dialogRef: any;

  @Input() emergency: Emergency;
  @Input() zone: Zone;
  @Output() toggleListAndMap = new EventEmitter<any>();

  mInterval: any = null;
  mConfigMins = 0;
  orgListener: Subscription;
  toggle: boolean = false;
  pageType: any;
  usersData: any = [];

  constructor(
    private router: Router,
    public emergencyService: EmergencyService,
    private orgListService: OrganizationListService,
    private userService: UserService,
    private dialog: MatDialog,
    private usPipe: UserPipe
  ) {}

  ngOnInit() {
    this.dataSource = new UsersDataSource(
      this,
      this.emergencyService,
      this.paginator,
      this.sort
    );
    this.pageType = this.emergencyService.pageType;
    this.getAppResponse();
    Observable.fromEvent(this.filter.nativeElement, "keyup")
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.dataSource.filter = this.filter.nativeElement.value;
      });

    if (this.orgListService != null) {
      this.orgListener = this.orgListService
        .getOrganizations()
        .subscribe(data => {
          if (data.length > 0) {
            this.mConfigMins = data[0].configOrgMin || 0;
          } else {
            this.mConfigMins = 0;
          }
        });
    }

    if(this.emergency.notify){
      this.alert=true
    } else {
      this.alert=false
    }
    if (
      this.emergencyService.emergency == null ||
      this.emergency.type == "AREA"
    ) {
      this.displayedColumns = [
        "checkbox",
        "photo",
        "name",
        "phone",
        "response",
        "message",
        "status",
        "ack",
        "alert"
      ];
      const polygon = [];
      const area = this.emergency.area || [];
      const arrData = [];
      area.forEach(element => {
        const lat = element.lat;
        const lng = element.lng;
        polygon.push([lat, lng]);
      });
      this.emergencyService
        .loadAllUserList(this.emergency.orgId)
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            const userData = doc.data();
            const user = {
              id: userData.id,
              name: userData.name,
              photo: userData.photo || ""
            };
            if (this.emergency.type === "AREA") {
              if (this.emergency.usersNotified.length == 0) {
                this.userService.updatelatlngStatus(
                  userData.id,
                  userData.location.lat,
                  userData.location.lng
                );
              }
              // this.userService.updatelatlngStatus(
              //   userData.id,
              //   userData.location.lat,
              //   userData.location.lng
              // );
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
          this.emergencyService.onUserListChanged.next(arrData);
          this.startTimer();
        })
        .catch(error => {});
    }
    if (
      this.emergencyService.emergency == null ||
      this.emergency.type == "ZONE"
    ) {
      this.displayedColumns = [
        "checkbox",
        "photo",
        "name",
        "phone",
        "response",
        "message",
        "status",
        "ack",
        "alert"
      ];
      const arrData = [];
      this.emergency.zones.forEach(element => {
        const polygon = [];
        const area1 = element.area || [];
        area1.forEach(element => {
          const lat = element.lat;
          const lng = element.lng;
          polygon.push([lat, lng]);
        });
        this.emergencyService
          .loadAllUserList(this.emergency.orgId)
          .then(querySnapshot => {
            querySnapshot.forEach(doc => {
              // doc.data() is never undefined for query doc snapshots
              const userData = doc.data();
              const user = {
                id: userData.id,
                name: userData.name,
                photo: userData.photo || ""
              };
              if (this.emergency.type === "ZONE") {
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
            this.emergencyService.onUserListChanged.next(arrData);
            this.startTimer();
          })
          .catch(error => {});
      });
    } else {
      this.emergencyService.userList = this.emergency.users;
      this.displayedColumns = [
        "checkbox",
        "photo",
        "name",
        "phone",
        /*'location',*/ "response",
        "message",
        "status",
        "ack",
        "alert"
      ];
      // track emergency
      if (this.onEmergencyUpdated) {
        this.onEmergencyUpdated.unsubscribe();
      }
      this.onEmergencyUpdated = this.emergencyService
        .trackEmergency(this.emergency.id)
        .subscribe(data => {
          this.emergency = new Emergency(data);
        });
      this.startTimer();
    }
    this.emergencyService
      .loadAllUserList(this.emergency.orgId)
      .then(querySnapshot => {
        const data = [];
        querySnapshot.forEach(doc => {
          const userData = doc.data();
          data.push(userData);
        });
        this.usersData = data;
      });
  }

  toggleMapAndList() {
    this.toggle = !this.toggle;
    this.toggleListAndMap.emit(this.toggle);
  }

  ngOnDestroy() {
    if (this.onEmergencyUpdated) {
      this.onEmergencyUpdated.unsubscribe();
    }
    if (this.orgListener) {
      this.orgListener.unsubscribe();
    }
    this.stopTimer();
  }

  isAllSelected(): boolean {
    if (!this.dataSource) {
      return false;
    }

    if (this.selection.isEmpty()) {
      return false;
    }

    if (this.filter.nativeElement.value) {
      return (
        this.selection.selected.length === this.dataSource.filteredData.length
      );
    } else {
      return (
        this.selection.selected.length === this.dataSource.filteredData.length
      );
    }
  }

  userToggle(user) {
    this.selection.toggle(user);
    this.onSelectedUser(user);
  }

  masterToggle() {
    if (!this.dataSource) {
      return;
    }

    if (this.isAllSelected()) {
      this.selection.clear();
    } else if (this.filter.nativeElement.value) {
      this.dataSource.filteredData.forEach(data => this.selection.select(data));
    } else {
      this.dataSource.filteredData.forEach(data => this.selection.select(data));
    }

    this.updateUserSelection();
  }

  updateUserSelection() {
    const users = this.selection.selected;
    this.emergencyService.selectedUsers = users;
    //this.emergencyService.onUserListChanged.next(users);
    this.emergencyService.onUserListUpdated.next(users);
  }

  onSendMessage(user) {
    const from = "emergencies/" + this.emergency.id;
    this.router.navigate(["emergencies/chats"], {
      queryParams: {
        userId: user.id,
        name: user.name,
        photo: user.photo,
        phone: user.phone,
        from: from,
        emerId: this.emergency.id
      }
    });
  }

  onSelectedUser(user) {
    //this.emergencyService.onUserSelected.next(user);
    this.emergencyService.onUserListUpdated.next(this.selection.selected);
  }

  addUserList() {
    this.dialogRef = this.dialog.open(EmgUserFormComponent, {
      width: "80%",
      height: "80%",
      data: {
        emergency: this.emergency
      }
    });

    this.dialogRef.afterClosed().subscribe((response: any[]) => {
      if (!response) {
        return;
      }

      this.emergency = response[0];
      this.emergencyService.selectedUsers = this.emergency.users || [];
      this.emergencyService.onUserListChanged.next(this.emergency.users || []);

      this.emergencyService.pageType = "edit";
      this.startTimer();
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

    // if (
    //   !((user.sms_time != null && user.sms_time > 0) || user.app_time != null)
    // ) {
    //   return UserStatus.NOT_RESPOND;
    // }
    // if (user.status == null) {
    //   return UserStatus.NOT_RESPOND;
    // }

    // return user.status;
  }

  getUserStatus(userId) {
    var emergency = this.emergencyService.emergency || this.emergency;
    if (emergency == null) {
      return UserStatus.UNKNOWN;
    }
    if (emergency.type === "AREA") {
      if (emergency.users.length === 0) {
        return UserStatus.UNKNOWN;
      } else {
        const usersReplied = emergency.usersReplied || [];
        const isExistReplied = usersReplied.some(element => {
          return element === userId;
        });
        if (isExistReplied) {
          return UserStatus.REPLIED;
        } else {
          return UserStatus.NOT_RESPOND;
        }
      }
    }
    if (emergency.type === "ZONE") {
      if (emergency.users.length === 0) {
        return UserStatus.UNKNOWN;
      } else {
        const usersReplied = emergency.usersReplied || [];
        const isExistReplied = usersReplied.some(element => {
          return element === userId;
        });

        if (isExistReplied) {
          return UserStatus.REPLIED;
        } else {
          return UserStatus.NOT_RESPOND;
        }
      }
    } else {
      const usersReplied = emergency.usersReplied || [];
      const isExist = usersReplied.some(element => {
        return element === userId;
      });

      if (isExist) {
        return UserStatus.REPLIED;
      } else {
        return UserStatus.NOT_RESPOND;
      }
    }
  }
  getSmsResponse(user) {
    if (user.app_time != null) {
      if (user.sms_time != null) {
        if (user.sms_time > user.app_time) return "SMS";
      }
      return "APP";
    }
    if (user.sms_time != null) {
      if (user.sms_time > 0) return "SMS";
    }
    return " ";
  }

  onAcknowledge(user): void {
    //this.userService.updateUserStatus(user.id, 2);
    this.emergencyService.updateUserStatus(null, user.id, 2);

    this.sendAcknowledgeSMS(user);
  }

  onSelectStatus(user, value): void {
    var st = UserStatus.NORMAL;
    if (value == 1) st = UserStatus.NEED_HELP;
    else if (value == 2) return;
    else if (value == 3) st = UserStatus.ACKNOWLEDGED;

    //this.userService.updateUserStatus(user.id, st);
    this.emergencyService.updateUserStatus(null, user.id, st);

    if (value == 3) {
      this.sendAcknowledgeSMS(user);
    }
  }

  onSelectStatusUnresponse(user, value): void {
    if (value == 2) return;

    var st = UserStatus.NORMAL;
    if (value == 1) st = UserStatus.NEED_HELP;
    else if (value == 3) st = UserStatus.ACKNOWLEDGED;

    //this.userService.updateUserStatus(user.id, st);
    this.emergencyService.updateUserStatus(null, user.id, st);

    var data = this.emergency.usersReplied || [];

    var isFound = false;
    for (var i = 0; i < data.length; i++) {
      if (data[i] == user.id) {
        isFound = true;
        break;
      }
    }
    if (isFound == false) {
      data.push(user.id);
      this.emergency.usersReplied = data;
      this.emergencyService.setUsersReplied(this.emergency.id, data);
    }
  }

  sendAcknowledgeSMS(user) {
    let emergencyService = this.emergencyService;
    let msg =
      "We have seen your status. Please call emergency services if you need immediate help.";

    var userSub = emergencyService
      .getUserFromId(emergencyService.emergency.id, user.id)
      .subscribe(data => {
        if (data.sms_time != null && data.sms_time != 0) {
          // emergencyService.sendSMS(data.phone, msg, error => {});
        }

        userSub.unsubscribe();
      });

    /*
        let smsResponse = this.emergency.smsResponse || [];
        let emergencyService = this.emergencyService;
        let msg = 'We have seen your status. Please call emergency services if you need immediate help.';

        var userSub = emergencyService.getSelectUser(user.id).subscribe(data => {
            
            var info = null;
            var i;
            for (i = 0; i < smsResponse.length; i++) {
                if (smsResponse[i].id == user.id) {
                    info = smsResponse[i];
                    break;
                }
            }
            if (info != null && info.sms_time != null) {
                emergencyService.sendSMS(data.phone, msg, (error) => {
                    
                });
            }
            
            userSub.unsubscribe();
        });  
        */
  }

  startTimer() {
    this.stopTimer();
    if (this.emergency == null) return;
    if (!this.emergency.active) return;

    if (this.mInterval != null) return;

    if (this.emergencyService.pageType == "new") {
      return;
    }

    // check the user information every 20 secs
    this.processTimer(this);

    this.mInterval = setInterval(this.processTimer, 20000, this);
  }

  processTimer(thiz: EmgUserListComponent) {
    if (!thiz.emergency.active) {
      return;
    }

    if (thiz.mConfigMins <= 0) {
      return;
    }

    let emergencyService = thiz.emergencyService;
    if (emergencyService.pageType != "edit") {
      return;
    }

    // let emergSubscribe = emergencyService.trackEmergency(thiz.emergency.id).subscribe(data => {
    //     emergSubscribe.unsubscribe();

    //     thiz.emergency = new Emergency(data);
    //     emergencyService.emergency = thiz.emergency;

    let emergency = thiz.emergencyService.emergency || thiz.emergency;
    if (!emergency.active) {
      return;
    }
    let diff = Date.now() - emergency.startedAt;
    if (diff < thiz.mConfigMins * 60000) {
      return;
    }

    // if (emergency.smsResponse == null) {
    //     emergency.smsResponse = [];
    // }
    // var smsResponse = emergency.smsResponse;
    let msg =
      "There's an emergency in your area, " +
      emergency.name +
      ". Are you ok? Please reply with 'ok' if you are ok or 'need help' if you need help.";
    emergencyService.userList.forEach((user, idx) => {
      var userSub = emergencyService
        .getUserFromId(emergency.id, user.id)
        .subscribe(userInfo => {
          if (userInfo == undefined || userInfo == null) {
            userSub.unsubscribe();
            return;
          }
          if (userInfo.sms_time == null) {
            //
            if (userInfo.app_time == null) {
              // emergencyService.sendSMS(userInfo.phone, msg, error => {
              //   if (error == null) {
              //     emergencyService.updateUserSmsTime(
              //       emergency.id,
              //       userInfo.id,
              //       0
              //     );
              //   }
              // });
            }
          } else {
            emergencyService.recvSMS(
              userInfo.phone,
              emergency.startedAt,
              (msg, sms_time) => {
                if (msg != null) {
                  // success
                  if (userInfo.sms_time != 0) {
                    if (userInfo.sms_time === sms_time) {
                      return;
                    }
                  }
                  let str = msg.trim().toLowerCase();
                  let nNeed = str.indexOf("need help");
                  let nOk = str.indexOf("ok");
                  if (nNeed != -1 && nOk != -1) {
                    if (nNeed < nOk) {
                      emergencyService.updateUserStatus(null, user.id, 1);
                    } else {
                      emergencyService.updateUserStatus(null, user.id, 0);
                    }
                  } else {
                    if (nNeed != -1) {
                      emergencyService.updateUserStatus(null, user.id, 1);
                    } else if (nOk != -1) {
                      emergencyService.updateUserStatus(null, user.id, 0);
                    } else {
                      return;
                    }
                  }

                  emergencyService.updateUserSmsTime(
                    emergency.id,
                    userInfo.id,
                    sms_time
                  );

                  var usersReplied = emergency.usersReplied || [];

                  var isFound = false;
                  for (var j = 0; j < usersReplied.length; j++) {
                    if (usersReplied[j] == user.id) {
                      isFound = true;
                      break;
                    }
                  }
                  if (isFound == false) {
                    usersReplied.push(user.id);
                    emergency.usersReplied = usersReplied;
                    emergencyService.setUsersReplied(
                      emergency.id,
                      usersReplied
                    );

                    if (emergencyService.emergency != null) {
                      emergencyService.emergency.usersReplied = usersReplied;
                    }
                  } else {
                  }
                }
              }
            );
          }
          userSub.unsubscribe();
        });
    });
  }

  getAppResponse() {
    // this.getUserRepliedStatus(mUser)
    // this.emergency.users.forEach(user => {
    //   this.usPipe.transform(user.id, this.emergency.id).subscribe(x => {
    //     if (x.hasOwnProperty("firstResponse")) {
    //       // console.log("INSIDE FIRST IF", x.hasOwnProperty("firstResponse"));
    //       return;
    //     } else if (x.status === 1) {
    //       // console.log("INSIDE FIRST ELSE IF", x.status === 1);
    //       return;
    //     } else {
    //       // console.log("INSIDE ELSE");
    //       this.emergencyService.setFirstResponse(x, Date.now()).then(res => {
    //         // console.log("RESPONSE");
    //       });
    //     }
    //   });
    // });
  }

  stopTimer() {
    if (this.mInterval != null) {
      clearInterval(this.mInterval);
    }
  }
}

class UsersDataSource extends DataSource<any> {
  _filterChange = new BehaviorSubject("");
  _filteredDataChange = new BehaviorSubject("");
  _categoryChange = new BehaviorSubject("");

  get filteredData(): any {
    return this._filteredDataChange.value;
  }

  set filteredData(value: any) {
    this._filteredDataChange.next(value);
  }

  get filter(): string {
    return this._filterChange.value;
  }

  set filter(filter: string) {
    this._filterChange.next(filter);
  }

  get category(): string {
    return this._categoryChange.value;
  }

  set category(category: string) {
    this._categoryChange.next(category);
  }

  constructor(
    private component: EmgUserListComponent,
    private emergencyService: EmergencyService,
    private _paginator: MatPaginator,
    private _sort: MatSort
  ) {
    super();
  }

  connect(): Observable<any[]> {
    const displayDataChanges = [
      this.emergencyService.onUserListChanged,
      this._paginator.page,
      this._filterChange,
      this._sort.sortChange,
      this._categoryChange
    ];

    if (
      this.emergencyService.emergency == null ||
      this.emergencyService.emergency.type === "AREA"
    ) {
      return Observable.merge(...displayDataChanges).map(() => {
        const users = this.emergencyService.userList.slice();
        const data = this.processedData(users);
        return data;
      });
    }

    if (
      this.emergencyService.emergency == null ||
      this.emergencyService.emergency.type === "ZONE"
    ) {
      return Observable.merge(...displayDataChanges).map(() => {
        const users = this.emergencyService.userList.slice();
        const data = this.processedData(users);
        return data;
      });
    } else {
      return Observable.merge(...displayDataChanges).pipe(
        switchMap(() => {
          return this.emergencyService
            .trackEmergency(this.emergencyService.emergency.id)
            .pipe(
              switchMap(response => {
                const users = response.users || [];
                const data = this.processedData(users);
                return of(data);
              })
            );
        })
      );
    }
  }

  processedData(users) {
    var data = this.filterData(users);
    this.filteredData = [...data];
    data = this.sortData(data);
    const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
    data = data.splice(startIndex, this._paginator.pageSize);
    return data;
  }

  filterData(data) {
    if (!this.filter) {
      return data;
    }

    var arr = [];
    data.forEach(element => {
      if (
        element.name &&
        FuseUtils.searchInString(element.name, this.filter.toLowerCase())
      ) {
        arr.push(element);
      }
    });

    return arr;
    //   return FuseUtils.filterArrayByString(data, this.filter);
  }

  filterDataByCategory(data: any[], category: string) {
    if (!this.category || this.category === "all") {
      return data;
    }

    return data.filter(item => item.status === UserStatus.NEED_HELP);
  }

  sortData(data): any[] {
    if (!this._sort.active || this._sort.direction === "") {
      return data;
    }

    return data.sort((a, b) => {
      let propertyA: number | string = "";
      let propertyB: number | string = "";

      switch (this._sort.active) {
        case "name":
          [propertyA, propertyB] = [a.name, b.name];
          break;
        case "phone":
          [propertyA, propertyB] = [a.phone, b.phone];
          break;
        /*case 'location':
                [propertyA, propertyB] = [a.email, b.email];
                break;*/
        case "status":
          [propertyA, propertyB] = [a.status, b.status];
          break;
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (
        (valueA < valueB ? -1 : 1) * (this._sort.direction === "asc" ? 1 : -1)
      );
    });
  }

  disconnect() {}
}
