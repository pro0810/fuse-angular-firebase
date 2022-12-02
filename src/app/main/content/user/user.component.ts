import { Component, OnInit, ViewEncapsulation, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatSnackBar } from "@angular/material";
import "rxjs/add/operator/startWith";
import "rxjs/add/observable/merge";
import "rxjs/add/operator/map";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/observable/fromEvent";
import { Subscription } from "rxjs/Subscription";
import { fuseAnimations } from "@fuse/animations";
import { User } from "./user.model";
import { UserService } from "./user.service";
import { Location } from "@angular/common";
import { AsYouType, isValidNumber } from "libphonenumber-js";
import { AuthService } from "../auth/auth.service";
import { EmergencyService } from "../emergency/emergency.service";
import { BulkUserComponent } from "./bulk-user/bulk-user.component";
import { map } from "rxjs/operators";
import * as firebase from "firebase";
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: "app-user",
  templateUrl: "./user.component.html",
  styleUrls: ["./user.component.scss"],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations
})
export class UserComponent implements OnInit {
  user = new User();
  onUserChanged: Subscription;
  onFileAttached: Subscription;
  pageType: string;
  userForm: FormGroup;

  phoneNumber = null;

  // ---- admin
  orgList: any[] = [];
  selectedOrg: any;
  isAdmin: any;
  // ---- admin

  orgId: string;

  serviceOrgSubscription: Subscription;

  selectedIndex = 0;

  attachedFile: any;

  @ViewChild(BulkUserComponent)
  bulkUserComponent: BulkUserComponent;

  get isValidPhone() {
    if (this.phoneNumber != null) {
      return isValidNumber(this.phoneNumber);
    } else {
      return false;
    }
  }

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private emergencyService: EmergencyService,
    private formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    private location: Location,
    private http: HttpClient
  ) {
    this.isAdmin = this.authService.isAdmin;
  }

  ngOnInit() {
    this.onUserChanged = this.userService.onUsersChanged.subscribe(user => {
      if (user) {
        this.user = new User(user);
        this.pageType = "edit";
        this.phoneNumber = user.phone;
        this.orgId = user.belongsTo;
      } else {
        this.pageType = "new";
        this.user = new User();
        this.orgId = this.userService.orgId;
      }

      this.userForm = this.createUserForm();

      if (this.phoneNumber != null) {
        this.processPhoneNumber(this.phoneNumber);
      }

      this.serviceOrgSubscription = this.emergencyService
        .getOrganization()
        .subscribe(orgList => {
          this.orgList = orgList;
          // console.log(this.orgList)
          if (this.orgId != null) {
            for (var i = 0; i < this.orgList.length; i++) {
              const org = this.orgList[i];
              if (org.id === this.orgId) {
                this.selectedOrg = org;
                break;
              }
            }
          }
        });
    });

    

    this.onFileAttached = this.userService.onFileAttached.subscribe(file => {
      if (file != null) {
        if (file.name) {
          this.attachedFile = file;
        } else {
          this.attachedFile = null;
        }
      } else {
        this.attachedFile = null;
      }
    });
  }

  ngOnDestroy() {
    if (this.onFileAttached) this.onFileAttached.unsubscribe();
    if (this.onUserChanged) this.onUserChanged.unsubscribe();
    if (this.serviceOrgSubscription) this.serviceOrgSubscription.unsubscribe();
  }

  createUserForm() {
    return this.formBuilder.group({
      id: [this.user.id],
      name: [this.user.name],
      phone: [this.user.phone],
      description: [this.user.description],
      belongsTo: [this.user.belongsTo],
      favorites: [this.user.favorites],
      tags: [this.user.tags],
      images: [this.user.images],
      height: [this.user.height],
      weight: [this.user.weight],
      location_name: [this.user.location.name],
      location_addr: [this.user.location.addr],
      location_lat: [this.user.location.lat],
      location_lng: [this.user.location.lng],
      active: [this.user.active],
      organization: [this.selectedOrg, Validators.required]
    });
  }

  onSelectOrg() {}

  saveUser() {
    if (!this.isValidPhone) {
      alert("Invalid Phone Number!");
      return;
    }

    const data = this.userForm.getRawValue();
    this.user.updateData(data);
    this.user.phone = this.phoneNumber;
    this.userService.saveUser(this.user).then(() => {
      // Trigger the subscription with new data
      this.userService.onUsersChanged.next(this.user);

      // Show the success message
      this.snackBar.open("User saved", "OK", {
        verticalPosition: "top",
        duration: 2000
      });
    });
  }

  addUser() {
    if (!this.isValidPhone) {
      alert("Invalid Phone Number!");
      return;
    }

    if (this.selectedOrg == null) {
      alert("You must belong to an organization!");
      return;
    }

    const org_max_size = this.selectedOrg.max_size;
    this.userService.getUsersBelongsTo(this.selectedOrg.id).then(list => {
      if (list.length >= org_max_size) {
        alert(
          "You have reached the maximum number of users allocated to your RapidAssist account. Please contact Llamagard to allow additional users to be created."
        );
      } else {
        this.userService.checkExistingUser(this.phoneNumber).then(users => {
          if (users.length > 0) {
            alert("The user already exists.");
          } else {
            const data = this.userForm.getRawValue();
            this.user.updateData(data);
            this.user.id = this.userService.newId;
            this.user.phone = this.phoneNumber;
            this.user.belongsTo = this.selectedOrg.id;
            this.userService.addUser(this.user).then(() => {
              // Trigger the subscription with new data
              this.userService.onUsersChanged.next(this.user);
              console.log(this.user.belongsTo)
              this.orgList.map((item, index)=>{
                if(item.id===this.user.belongsTo){
                  const curUser = firebase.auth().currentUser;
                  console.log(item.name)
                  console.log(curUser.displayName)

                  let headers = new HttpHeaders({
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Access-Control-Allow-Origin": "*"
                  });

                  let body = new URLSearchParams();
                  body.set("phone", "+"+data.phone);
                  body.set("name", data.name );
                  body.set("coordinatorName", curUser.displayName);
                  body.set("organizationName", item.name);

                  this.http
                  .post("https://us-central1-ruok-8ea00.cloudfunctions.net/sendSMSOverHTTP", body.toString(), { headers: headers})
                  .toPromise()
                  .then(res => {
                    console.log(res);
                    this.snackBar.open("SMS sent", "OK", {
                      verticalPosition: "top",
                      duration: 2000
                    });
                  })
                  
                  .catch(err => {
                    console.log(err);
                    this.snackBar.open("SMS failed", "ERROR", {
                      verticalPosition: "top",
                      duration: 2000
                    });
                  });
                }
              })
              

              // Show the success message
              this.snackBar.open("User added", "OK", {
                verticalPosition: "top",
                duration: 2000
              });

              // Change the location with new one
              // this.location.go('users/' + this.user.id + '/' + this.user.handle);
              this.location.go("users/" + this.user.id);
            });
          }
        });
      }
    });
  }

  uploadUser() {
    this.bulkUserComponent.onUpload();
  }

  onPhoneChange(event: any) {
    var number = event.target.value.replace(/ /g, "");
    let p_number = "+" + number;
    this.processPhoneNumber(p_number);
  }

  processPhoneNumber(p_number) {
    let asYouType = new AsYouType().input(p_number);
    this.userForm.controls["phone"].setValue(asYouType.replace(/[+]/g, ""));
    // this.format = format('2133734253', 'US', 'International');
    // this.parse = parse('(0777) 844 822', 'RO');
    this.phoneNumber = p_number;
    if (isValidNumber(p_number)) {
    }
  }
}
