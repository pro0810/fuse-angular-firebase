import {
  Component,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ViewChild
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatSnackBar } from "@angular/material";
import "rxjs/add/operator/startWith";
import "rxjs/add/observable/merge";
import "rxjs/add/operator/map";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/observable/fromEvent";
import { Subscription } from "rxjs/Subscription";
import { Observable } from "rxjs/Observable";
import { fuseAnimations } from "@fuse/animations";
import { Location } from "@angular/common";
import { Emergency } from "./emergency.model";
import { EmergencyService } from "./emergency.service";
import { MapLoaderService } from "./map-loader.service.";
import { AuthService } from "../auth/auth.service";
import { ActivatedRoute, Router } from "@angular/router";
import { UserStatus } from "../user/user.model";
import { EmgBulkMsgComponent } from "./emg-bulk-msg/emg-bulk-msg.component";
import * as $ from "jquery";
import { ChatService } from "../chat/chat.service";
import * as firebase from "firebase";
import { DB_NAME } from "../../../app.constants";
import { Zone } from "../zone/zone.model";
import * as MarkerClusterer from "@google/markerclusterer";
declare var google: any;

import { User } from "../user/user.model";
import { UserPipe } from "../../../shared/pipes/user.pipe";

@Component({
  selector: "app-emergency",
  templateUrl: "./emergency.component.html",
  styleUrls: ["./emergency.component.scss"],
  animations: fuseAnimations
})
export class EmergencyComponent implements OnInit, AfterViewInit, OnDestroy {
  emergency = new Emergency();
  zone = new Zone();
  zone_data = {
    zone_name: "message from parent"
  };
  onEmergencyChanged: Subscription;
  pageType: string;
  emergencyForm: FormGroup;
  emergencyTypes: any[] = ["USERS", "AREA", "ZONE"];
  selectedType: string;
  userModel: User;

  //---- admin
  orgList: any[] = [];
  selectedOrg: any;
  isAdmin: boolean = false;
  //---- admin

  map: any;
  markerCluster: MarkerClusterer;

  drawingManager: any;
  polygon: any;
  markersArray = [];
  userRoutesArray = [];
  processRoutesCount = 0;
  clusterArray = [];
  alert=false;

  mapCenter: any = { lat: 0, lng: 0 };
  mapZoom: number = 15;
  paths: any[] = [];

  usersCombined: Observable<any>;
  usersCombinedSubscription: Subscription;

  markerUsersSubscription: Subscription;
  routeUsersSubscription: Subscription;

  serviceUserListSubscription: Subscription;
  serviceOrgSubscription: Subscription;
  emergencySubscription: Subscription;

  serviceUserUpdatedSubscription: Subscription;
  serviceZoneUpdatedSubscription: Subscription;

  onUserSelected: Subscription;
  selectedIndex: number = 0;
  areaListCall = 0;
  notifyToggle: boolean = false;

  message: string;
  roomId: string;
  contact: any;
  pinInfoWnd: any;
  dotInfoWnd: any;
  isProcessing = false;
  isAdding = false;
  toggle: boolean;

  constructor(
    public emergService: EmergencyService,
    private formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    private location: Location,
    private route: ActivatedRoute,
    private authService: AuthService,
    public chatService: ChatService,
    private router: Router,
    private usPipe: UserPipe
  ) {
    this.authService.isAdmin.subscribe(value => {
      this.isAdmin = value;
    });

    this.chatService.getUser().subscribe(user => {
      this.chatService.user = user;
    });
    this.pinInfoWnd = null;
    this.dotInfoWnd = null;
    this.contact = null;
    this.areaListCall = 0;
  }

  ngOnInit() {
    
    this.emergService.pageType = "";
    this.route.queryParams.subscribe(params => {
      let type = params["type"];
      this.onEmergencyChanged = this.emergService.onEmergencyChanged.subscribe(
        emergency => {
          if (emergency) {
            this.pageType = "edit";
            this.emergService.pageType = this.pageType;
            this.emergency = new Emergency(emergency);
            this.emergService.selectedUsers = null; //this.emergency.users || [];
            this.emergService.emergency = this.emergency;
            this.selectedType = this.emergency.type;
            if (this.selectedType == "AREA") {
              this.emergService.selectedUsers = null;
            }
            if (this.selectedType == "ZONE") {
              this.emergService.selectedUsers = null;
            }
            if (this.emergencySubscription) {
              this.emergencySubscription.unsubscribe();
            }
            this.emergencySubscription = this.emergService
              .trackEmergency(this.emergency.id)
              .subscribe(data => {
                if (data != null) {
                  this.emergency = data;
                  this.emergService.emergency = data;
                  this.clearMarkers();
                  this.clearUserRoutesArray();
                  this.initMarker();
                  var fillColor = "#cc3300"; // '#FF0000'
                  var strokeColor = "#cc3300"; //'#FF0000'
                  if (!this.emergency.active) {
                    fillColor = "gray";
                    strokeColor = "gray";
                  }
                  var polyOptions = {
                    fillColor: fillColor,
                    strokeColor: strokeColor,
                    strokeWeight: 0,
                    fillOpacity: 0.45,
                    editable: false
                  };
                  if (this.polygon) this.polygon.setOptions(polyOptions);
                }
              });
          } else {
            this.pageType = "new";
            this.emergService.pageType = this.pageType;
            this.emergency = new Emergency();
            this.emergService.selectedUsers = null;
          }
          this.emergencyForm = this.createEmergencyForm();
        }
      );

      this.serviceOrgSubscription = this.emergService
        .getOrganization()
        .subscribe(orgList => {
          this.orgList = orgList;
          if (orgList.length > 1) {
            for (var i = 0; i < this.orgList.length; i++) {
              let org = this.orgList[i];
              if (org.id == this.emergency.orgId) {
                this.selectedOrg = org;
                this.emergency.orgId = this.selectedOrg.id;
                break;
              }
            }
          } else if (orgList.length > 0 && orgList.length == 1) {
            this.selectedOrg = this.orgList[0];
            this.emergency.orgId = this.selectedOrg.id;

            this.updateMapLocation();
          }
        });
      this.serviceUserListSubscription = this.emergService.onUserListChanged.subscribe(
        (userList: any[]) => {
          if (this.emergency.type == "") {
            return;
          }
          if (this.emergency.type == "AREA") {
            if (this.areaListCall == 0) {
              this.areaListCall++;
              return;
            }
          } else if (this.emergency.type == "ZONE") {
            if (this.areaListCall == 0) {
              this.areaListCall++;
              return;
            }
          } else {
            if (this.pageType == "edit") {
              return;
            }
          }
          if (!(userList instanceof Array)) {
            return;
          }
          if (userList.length > 0) {
            var arrUser = [];
            for (let user of userList) {
              arrUser.push(user);
            }
            // this.emergency.users = arrUser; //NEED TO CHECK ERROR HERE
          } else {
            this.emergency.users = [];
          }
          if (this.areaListCall == 1) {
            this.clearMarkers();
            this.clearUserRoutesArray();
            this.initMarker();
          }
        }
      );
      // map center will be updated for selected user
      this.onUserSelected = this.emergService.onUserSelected.subscribe(user => {
        if (user) {
          this.selectedIndex = 0;
          if (this.map) {
            for (var i = 0; i < this.markersArray.length; i++) {
              let marker = this.markersArray[i];
              var markerId = marker.get("id");
              if (user.id == markerId) {
                let lat = marker.position.lat();
                let lng = marker.position.lng();
                var center = new google.maps.LatLng(lat, lng);
                this.map.panTo(center);
                break;
              }
            }
          }
        }
      });

      this.serviceUserUpdatedSubscription = this.emergService.onUserListUpdated.subscribe(
        (userList: any[]) => {
          if (this.map == null) return;
          if (this.emergency.type == "") {
            return;
          }
          if (!(userList instanceof Array)) return;
          if (this.pageType == "new") {
            if (userList.length > 0) {
              var arrUser = [];
              for (let user of userList) {
                arrUser.push(user);
              }
              this.emergency.users = arrUser;
            } else {
              this.emergency.users = [];
            }
            //this.reloadMapMarkerData(this.emergency.users);
            return;
          }
          this.emergService.selectedUsers = userList;
          if (this.emergService.emergency != null) {
            this.clearMarkers();
            this.clearUserRoutesArray();
            this.initMarker();
          }
        }
      );
      /* zone list */
      this.serviceZoneUpdatedSubscription = this.emergService.onZoneListUpdated.subscribe(
        (zoneList: any[]) => {
          if (this.map == null) return;
          if (this.emergency.type == "") {
            return;
          }
          if (!(zoneList instanceof Array)) return;

          if (this.pageType == "new") {
            if (zoneList.length > 0) {
              var arrZone = [];
              for (let zone of zoneList) {
                arrZone.push(zone);
              }
              this.emergency.zones = arrZone;
            } else {
              this.emergency.zones = [];
            }
            //this.reloadMapMarkerData(this.emergency.users);
            return;
          }
          this.emergService.selectedUsers = zoneList;
          if (this.emergService.emergency != null) {
            this.clearMarkers();
            this.clearUserRoutesArray();
            this.initMarker();
          }
        }
      );
      /* zone list */
    });
  }

  ngAfterViewInit() {
    this.markersArray = [];
    this.userRoutesArray = [];
    this.processRoutesCount = 0;
    MapLoaderService.load().then(() => {
      this.initMap();

      this.onSelectType();
    });
  }

  ngOnDestroy() {
    this.emergService.selectedUsers = [];
    this.emergService.userList = [];
    this.emergency = null;
    this.onUserSelected.unsubscribe();
    this.onEmergencyChanged.unsubscribe();
    this.serviceUserListSubscription.unsubscribe();
    this.serviceOrgSubscription.unsubscribe();
    if (this.usersCombinedSubscription) {
      this.usersCombinedSubscription.unsubscribe();
    }
    if (this.emergencySubscription) {
      this.emergencySubscription.unsubscribe();
    }
    this.serviceUserUpdatedSubscription.unsubscribe();
    this.serviceZoneUpdatedSubscription.unsubscribe();
    if (this.markerUsersSubscription) {
      this.markerUsersSubscription.unsubscribe();
      this.markerUsersSubscription = null;
    }
    this.clearMarkers();
    this.clearUserRoutesArray();
  }
  getToggleData(e) {
    this.toggle = e;
  }

  updateMapLocation() {
    if (this.pageType == "new") {
      this.mapCenter = this.selectedOrg.location;
      if (this.map) {
        this.map.setCenter(
          new google.maps.LatLng(this.mapCenter.lat, this.mapCenter.lng)
        );
      }
    } else {
      if (this.emergency.type == "USERS") {
        this.mapCenter = this.selectedOrg.location;
        if (this.map) {
          this.map.setCenter(
            new google.maps.LatLng(this.mapCenter.lat, this.mapCenter.lng)
          );
        }
      }
    }
  }

  onSelectOrg() {
    if (this.selectedOrg.id != this.emergency.orgId) {
      this.emergency.orgId = this.selectedOrg.id;
      this.emergService.onOrgChanged.next(this.selectedOrg);

      this.updateMapLocation();
    }
  }

  onSelectType() {
    if (this.selectedType != null) {
      this.emergency.type = this.selectedType;
      this.initPolygon();
      this.clearMarkers();
      this.clearUserRoutesArray();
      this.initMarker();
    }
  }

  convertCaps(type) {
    if (type == "AREA") {
      return "Area";
    } else if (type == "ZONE") {
      return "Zones";
    } else {
      return "Users";
    }
  }

  onAction() {
    if (this.emergency) {
      if (this.emergency.active) {
        this.emergency.active = false;
        this.emergService.setActiveEmergency(this.emergency.id, false);
        this.sendStopEmergencySMS();
      } else {
        this.sendStartEmergencySMS();
        // if (this.emergency.type == "AREA") {
        //     if (this.routeUsersSubscription) this.routeUsersSubscription.unsubscribe();
        //     this.routeUsersSubscription = this.emergService.getAllUserList().subscribe(users => {
        //         this.resetUserRoutes(users);
        //         this.routeUsersSubscription.unsubscribe();
        //         this.routeUsersSubscription = null;
        //     });
        // } else {

        if (this.routeUsersSubscription)
          this.routeUsersSubscription.unsubscribe();
        this.routeUsersSubscription = this.emergService
          .getEmergUserList(this.emergency.users)
          .subscribe(users => {
            this.resetUserRoutes(users);
            this.routeUsersSubscription.unsubscribe();
            this.routeUsersSubscription = null;
          });
        // }

        this.emergency.active = true;
        this.emergService.setActiveEmergency(this.emergency.id, true);
      }
    }
  }

  sendStopEmergencySMS() {
    let emergencyService = this.emergService;
    if (emergencyService.emergency == null) return;

    let msg =
      "Emergency Over. The emergency " +
      emergencyService.emergency.name +
      " is now over.";

    emergencyService.userList.forEach(user => {
      // if (this.getUserStatus(user.id) != UserStatus.NOT_RESPOND) {

      var userSub = emergencyService
        .getUserFromId(emergencyService.emergency.id, user.id)
        .subscribe(data => {
          // if (data.sms_time != null) {
          // emergencyService.sendSMS(data.phone, msg, error => {});
          // }

          userSub.unsubscribe();
        });
      // }
    });
    /*
        let smsResponse = emergencyService.emergency.smsResponse || [];
        
        let msg = 'The emergency ' + emergencyService.emergency.name +' is now over.';

        emergencyService.userList.forEach((user) => {
            if (this.getUserRepliedStatus(user.id) != UserStatus.NOT_RESPOND) {

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
            }
        });*/
  }

  sendStartEmergencySMS() {
    let emergencyService = this.emergService;
    if (emergencyService.emergency == null) return;

    let msg =
      "The emergency is " +
      emergencyService.emergency.name +
      ". Please respond with your status.";

    emergencyService.userList.forEach(user => {
      // if (this.getUserStatus(user.id) != UserStatus.NOT_RESPOND) {
      var userSub = emergencyService
        .getUserFromId(emergencyService.emergency.id, user.id)
        .subscribe(data => {
          // if (data.sms_time != null) {
          // emergencyService.sendSMS(data.phone, msg, error => {});
          // }
          userSub.unsubscribe();
        });
      // }
    });
    /*
        let smsResponse = emergencyService.emergency.smsResponse || [];
        
        let msg = 'The emergency ' + emergencyService.emergency.name +' is now over.';

        emergencyService.userList.forEach((user) => {
            if (this.getUserRepliedStatus(user.id) != UserStatus.NOT_RESPOND) {

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
            }
        });*/
  }

  @ViewChild(EmgBulkMsgComponent)
  emgBulkMsgComponent: EmgBulkMsgComponent;
  onSend() {
    this.emgBulkMsgComponent.onSend();
  }

  initMap() {
    if (this.map != null) return;
    var latlng = new google.maps.LatLng(this.mapCenter.lat, this.mapCenter.lng);
    this.map = new google.maps.Map(document.getElementById("mapView"), {
      center: latlng,
      zoom: this.mapZoom
    });
    // if (this.pageType === "edit") {
    //   this.drawPolyLine(latlng, this.mapZoom);
    //   setInterval(() => {
    //     this.sendPathData();
    //   }, 60000);
    // }
    this.pinInfoWnd = new google.maps.InfoWindow();
    this.dotInfoWnd = new google.maps.InfoWindow();
    this.markerCluster = new MarkerClusterer(this.map, this.clusterArray, {
      imagePath:
        "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m"
    });
    var tmap = this.map;
    var mRoutesArray = this.userRoutesArray;
    google.maps.event.addListener(this.map, "zoom_changed", function() {
      let zoom = tmap.getZoom();
      var pixelSizeAtZoom0 = 2; //the size of the icon at zoom level 0
      var maxPixelSize = 16; //restricts the maximum size of the icon, otherwise the browser will choke at higher zoom levels trying to scale an image to millions of pixels
      var relativePixelSize = Math.round(
        pixelSizeAtZoom0 * Math.pow(2, zoom - 12)
      );
      if (relativePixelSize > maxPixelSize) {
        //restrict the maximum size of the icon
        relativePixelSize = maxPixelSize;
      }

      var size1 = relativePixelSize / 2;
      var size2 = relativePixelSize / 4;

      let url1 = `data:image/svg+xml;utf8,<svg x='0' y='0' width='${relativePixelSize}' height='${relativePixelSize}' xmlns='http://www.w3.org/2000/svg' xml:space='preserve'><circle cx='${size1}' cy='${size1}' r='${size1 -
        1}' stroke='rgb(193,31,54)' stroke-width='2' fill='rgb(255,255,255)' stroke-opacity='0.8' fill-opacity='0.3'/></svg>`;
      let url2 = `data:image/svg+xml;utf8,<svg x='0' y='0' width='${size1}' height='${size1}' xmlns='http://www.w3.org/2000/svg' xml:space='preserve'><circle cx='${size2}' cy='${size2}' r='${size2}' stroke='rgb(48, 53, 64)' stroke-width='1' fill='rgb(48, 53, 64)' stroke-opacity='0.3' fill-opacity='0.3'/></svg>`;

      // let url1 = `data:image/svg+xml;utf8,<svg x='0' y='0' width='${relativePixelSize}' height='${relativePixelSize}' xmlns='http://www.w3.org/2000/svg'><circle cx='${size1}' cy='${size1}' r='${size1-1}' stroke='#C11F36' stroke-width='2' fill='#FFFFFF' stroke-opacity='.8' fill-opacity='.3'/></svg>`;
      // let url2 = `data:image/svg+xml;utf8,<svg x='0' y='0' width='${size1}' height='${size1}' xmlns='http://www.w3.org/2000/svg'><circle cx='${size2}' cy='${size2}' r='${size2}' stroke='#303540' stroke-width='1' fill='#303540' stroke-opacity='.3' fill-opacity='.3'/></svg>`;

      for (var i = 0; i < mRoutesArray.length; i++) {
        var routeArray = mRoutesArray[i];
        if (routeArray != null) {
          for (var j = 0; j < routeArray.length; j++) {
            if (j == 0) {
              // routeArray[j].setRadius(p * 2);
              routeArray[j].setIcon({
                url: url1
              });
              //routeArray[j].setOptions({strokeWeight: p});
            } else {
              //routeArray[j].setRadius(p);
              routeArray[j].setIcon({
                url: url2
              });
            }
          }
        }
      }
    });
  }

  initPolygon() {
    // var latlng = new google.maps.LatLng(this.mapCenter.lat, this.mapCenter.lng);
    // this.map = new google.maps.Map(document.getElementById("mapView"), {
    //   center: latlng,
    //   zoom: this.mapZoom
    // });
    if (this.emergency.type == "ZONE") {
      var fillColor = "#cc3300"; // '#FF0000'
      var strokeColor = "#cc3300"; //'#FF0000'
      if (!this.emergency.active) {
        fillColor = "gray";
        strokeColor = "gray";
      }
      var polyOptions = {
        fillColor: fillColor,
        strokeColor: strokeColor,
        strokeWeight: 0,
        fillOpacity: 0.45,
        editable: true
      };
      this.emergency.zones.forEach(element => {
        if (element.area.length > 2) {
          this.paths = element.area;
          this.polygon = new google.maps.Polygon({
            paths: this.paths,
            strokeColor: strokeColor,
            strokeOpacity: 0.8,
            strokeWeight: 3,
            fillColor: fillColor,
            fillOpacity: 0.35,
            editable: true
          });
          this.polygon.setMap(this.map);
          // Create the bounds object
          var bounds = new google.maps.LatLngBounds();

          // Get paths from polygon and set event listeners for each path separately
          this.polygon.getPath().forEach(function(path, index) {
            bounds.extend(path);
          });

          // Fit Polygon path bounds
          this.map.fitBounds(bounds);

          google.maps.event.addListener(
            this.polygon.getPath(),
            "set_at",
            event => {
              this.updatePolygonPath(this.polygon.getPath());
            }
          );

          google.maps.event.addListener(
            this.polygon.getPath(),
            "insert_at",
            event => {
              this.updatePolygonPath(this.polygon.getPath());
            }
          );

          google.maps.event.addListener(
            this.polygon.getPath(),
            "insert_at",
            event => {
              this.updatePolygonPath(this.polygon.getPath());
            }
          );
        } else {
          if (!this.drawingManager) {
            this.drawingManager = new google.maps.drawing.DrawingManager({
              drawingMode: google.maps.drawing.OverlayType.POLYGON,
              drawingControl: true,
              drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: ["polygon"]
              },
              markerOptions: {
                draggable: true
              },
              polygonOptions: polyOptions
            });

            this.drawingManager.setMap(this.map);
            google.maps.event.addListener(
              this.drawingManager,
              "overlaycomplete",
              event => {
                // Polygon drawn
                if (event.type === google.maps.drawing.OverlayType.POLYGON) {
                  this.polygon = event.overlay;
                  this.polygon.type = event.type;
                  google.maps.event.addListener(
                    this.polygon.getPath(),
                    "set_at",
                    event => {
                      this.updatePolygonPath(this.polygon.getPath());
                    }
                  );

                  google.maps.event.addListener(
                    this.polygon.getPath(),
                    "insert_at",
                    event => {
                      this.updatePolygonPath(this.polygon.getPath());
                    }
                  );

                  google.maps.event.addListener(
                    this.polygon.getPath(),
                    "insert_at",
                    event => {
                      this.updatePolygonPath(this.polygon.getPath());
                    }
                  );

                  this.updatePolygonPath(event.overlay.getPath());
                }
              }
            );
          } else {
            this.drawingManager.setDrawingMode(
              google.maps.drawing.OverlayType.POLYGON
            );
            this.drawingManager.setOptions({
              drawingControl: true
            });
          }
        }
      });
    } else if (this.emergency.type == "AREA") {
      var fillColor = "#cc3300"; // '#FF0000'
      var strokeColor = "#cc3300"; //'#FF0000'

      if (!this.emergency.active) {

        fillColor = "gray";
        strokeColor = "gray";
      }

      var polyOptions = {
        fillColor: fillColor,
        strokeColor: strokeColor,
        strokeWeight: 0,
        fillOpacity: 0.45,
        editable: true
      };

      if (this.emergency.area.length > 2) {
        this.paths = this.emergency.area;
        this.polygon = new google.maps.Polygon({
          paths: this.paths,
          strokeColor: strokeColor,
          strokeOpacity: 0.8,
          strokeWeight: 3,
          fillColor: fillColor,
          fillOpacity: 0.35,
          editable: true
        });
        this.polygon.setMap(this.map);
        // Create the bounds object
        var bounds = new google.maps.LatLngBounds();

        // Get paths from polygon and set event listeners for each path separately
        this.polygon.getPath().forEach(function(path, index) {
          bounds.extend(path);
        });

        // Fit Polygon path bounds
        this.map.fitBounds(bounds);

        google.maps.event.addListener(
          this.polygon.getPath(),
          "set_at",
          event => {
            this.updatePolygonPath(this.polygon.getPath());
          }
        );

        google.maps.event.addListener(
          this.polygon.getPath(),
          "insert_at",
          event => {
            this.updatePolygonPath(this.polygon.getPath());
          }
        );

        google.maps.event.addListener(
          this.polygon.getPath(),
          "insert_at",
          event => {
            this.updatePolygonPath(this.polygon.getPath());
          }
        );
      } else {
        if (!this.drawingManager) {
          this.drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: google.maps.drawing.OverlayType.POLYGON,
            drawingControl: true,
            drawingControlOptions: {
              position: google.maps.ControlPosition.TOP_CENTER,
              drawingModes: ["polygon"]
            },
            markerOptions: {
              draggable: true
            },
            polygonOptions: polyOptions
          });

          this.drawingManager.setMap(this.map);
          google.maps.event.addListener(
            this.drawingManager,
            "overlaycomplete",
            event => {
              // Polygon drawn
              if (event.type === google.maps.drawing.OverlayType.POLYGON) {
                this.polygon = event.overlay;
                this.polygon.type = event.type;
                google.maps.event.addListener(
                  this.polygon.getPath(),
                  "set_at",
                  event => {
                    this.updatePolygonPath(this.polygon.getPath());
                  }
                );

                google.maps.event.addListener(
                  this.polygon.getPath(),
                  "insert_at",
                  event => {
                    this.updatePolygonPath(this.polygon.getPath());
                  }
                );

                google.maps.event.addListener(
                  this.polygon.getPath(),
                  "insert_at",
                  event => {
                    this.updatePolygonPath(this.polygon.getPath());
                  }
                );

                this.updatePolygonPath(event.overlay.getPath());
              }
            }
          );
        } else {
          this.drawingManager.setDrawingMode(
            google.maps.drawing.OverlayType.POLYGON
          );
          this.drawingManager.setOptions({
            drawingControl: true
          });
        }
      }
    } else {
      if (this.polygon != null) {
        this.polygon.setMap(null);
        this.polygon = null;
      }
      if (this.drawingManager) {
        this.drawingManager.setDrawingMode(null);
        // To hide:
        this.drawingManager.setOptions({
          drawingControl: false
        });
      }
    }
  }

  initMarker() {
    if (this.pageType == "new") {
      if (this.markerUsersSubscription)
        this.markerUsersSubscription.unsubscribe();
      this.markerUsersSubscription = this.emergService
        .getAllUserList()
        .subscribe(users => {
          this.reloadMapMarkerData(users);
        });
    } else {
      if (this.markerUsersSubscription)
        this.markerUsersSubscription.unsubscribe();
      this.markerUsersSubscription = this.emergService
        .getEmergUserList(this.emergency.users)
        .subscribe(users => {
          this.reloadMapMarkerData(users);
        });
    }
  }

  reloadMapMarkerData(users) {
    //  alert("222");
    if (this.isAdding) {
      return;
    }
    if (this.isProcessing || this.processRoutesCount > 0) {
      return;
    }
    if (this.map == null) return;
    this.processRoutesCount = users.length;
    this.isProcessing = true;

    if (this.pinInfoWnd == null) {
      this.pinInfoWnd = new google.maps.InfoWindow();
    }

    var selectedUsers = null;
    if (this.emergService.selectedUsers instanceof Array) {
      selectedUsers = this.emergService.selectedUsers;
    }

    var showType = 0; // 0 - show selected pos & dot, 1 - all pos and selected dot
    this.clusterArray.length = 0;

    let emergency = this.emergService.emergency || this.emergency;

    users.forEach((user: any, i) => {
      if (user == undefined || user == null) {
        this.processRoutesCount--;
        return;
      }
      var isSel = false;
      if (this.pageType != "new") {
        if (selectedUsers == null || selectedUsers.length == 0) {
          if (showType == 0) {
            // this.addUserRoutes(user, i, true);
            isSel = true;
          } else {
            if (!emergency.active) {
              this.addUserRoutes(user, i, false);
            }

            this.clearMaps(this.userRoutesArray[i]);
            this.userRoutesArray[i] = [];
          }
          this.processRoutesCount--;
        } else {
          var findUser = selectedUsers.find(u => u.id == user.id) || null;
          if (findUser != null) {
            this.addUserRoutes(user, i, true);
            isSel = true;
          } else {
            if (showType == 0) {
            } else {
              if (!emergency.active) {
                this.addUserRoutes(user, i, false);
              }
            }
            this.clearMaps(this.userRoutesArray[i]);
            this.userRoutesArray[i] = [];
            this.processRoutesCount--;
          }
        }
      } else {
        this.clearMaps(this.userRoutesArray[i]);
        this.userRoutesArray[i] = [];
        this.processRoutesCount--;
      }
      if (showType == 1) {
        isSel = true;
      }
      if (emergency != null) {
        if (emergency.active) {
          if (this.pageType != "new") {
            if (isSel == true) {
              this.addMapMarker(user, null, i);
            } else {
              this.clearMap(this.markersArray[i]);
              this.markersArray[i] = null;
            }
          } else {
            this.addMapMarker(user, null, i);
          }
        } else {
          if (isSel == true) {
            this.addMapMarker(user, null, i);
          } else {
            this.clearMap(this.markersArray[i]);
            this.markersArray[i] = null;
          }
        }
      } else {
        this.clearMap(this.markersArray[i]);
        this.markersArray[i] = null;
      }
    });

    this.isProcessing = false;
  }

  clearMaps(routeArray) {
    if (routeArray != null) {
      for (var j = 0; j < routeArray.length; j++) {
        this.clearMap(routeArray[j]);
      }
    }
  }

  clearMap(marker) {
    if (marker != null) {
      google.maps.event.clearInstanceListeners(marker);
      marker.setMap(null);
    }
  }

  sendMsg() {
    if (this.message != null && this.message.length > 0) {
      var user = this.chatService.user;
      var info = null;
      let smsResponse = this.emergService.emergency.smsResponse || [];
      for (var i = 0; i < smsResponse.length; i++) {
        if (smsResponse[i].id == user.id) {
          info = smsResponse[i];
          break;
        }
      }

      if (info != null && info.sms_time != null) {
        // this.emergService.sendSMS(
        //   this.contact.phone,
        //   this.message,
        //   error => {}
        // );
        return;
      }

      var content = this.message;
      content = content.replace(/\s*$/, "");

      var ref = firebase
        .app()
        .database()
        .ref()
        .child(DB_NAME.CHAT_MSGES)
        .child(this.roomId)
        .push();
      var messageId = ref.key;

      const message = {
        id: messageId,
        content: content,
        timestamp: Date.now(),
        media: "",
        type: 0,
        isRead: false,
        sender: { id: user.id, name: user.name, photo: user.photo || "" }
      };
      this.chatService
        .sendMessage(this.roomId, message, [this.contact])
        .then(response => {
          this.readyToReply();
        });
    }
  }

  readyToReply(): void {
    if (this.pinInfoWnd) this.pinInfoWnd.close();
    this.contact = null;
  }

  getMapMarker(user, marker) {
    var emergency = this.emergService.emergency;
    if (emergency == null) {
      emergency = this.emergency;
      if (emergency == null) {
        return null;
      }
    }
    // var icon = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
    var fillColor = "27ae60";
    var strokeColor = "#green";
    console.log(emergency)
    // if (emergency.active)
    {
      const userStatus = this.getUserStatus(user.id);
      if (
        userStatus == UserStatus.UNKNOWN &&
        user.status == UserStatus.NEED_HELP
      ) {
        fillColor = "red";
        strokeColor = "#cf4b3e";
      } else if (
        userStatus == UserStatus.UNKNOWN &&
        user.status == UserStatus.NORMAL
      ) {
        fillColor = "#27ae60";
        strokeColor = "green";
      } else if (
        userStatus == UserStatus.REPLIED &&
        user.status == UserStatus.NORMAL
      ) {
        fillColor = "#27ae60";
        strokeColor = "green";
      } else if (
        userStatus == UserStatus.REPLIED &&
        user.status == UserStatus.NEED_HELP
      ) {
        fillColor = "red";
        strokeColor = "#cf4b3e";
      }
      
      else if (userStatus == UserStatus.NOT_RESPOND) {
        fillColor = "gray";
        strokeColor = "gray";
      } else {
        fillColor = "red";
        strokeColor = "#cf4b3e";
      }


    }
    if (emergency.notify) {
        this.alert = true
        fillColor = 'orange'
        strokeColor = '#cca506'
    }
    // else {
    //     fillColor = '#bdc3c7'
    //     strokeColor = 'gray'
    // }
    if (marker == null) {
      marker = new google.maps.Marker({
        icon: {
          path:
            "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0",
          fillColor: fillColor,
          fillOpacity: 1,
          strokeColor: strokeColor,
          strokeWeight: 2,          
          scale: 1,
          draggable: true
        },
        zIndex: 8,
        map: this.map
      });
    } else {
      marker.setIcon({
        path:
          "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0",
        fillColor: fillColor,
        fillOpacity: 1,
        strokeColor: strokeColor,        
        strokeWeight: 2,
        scale: 1,
        draggable: true
      });
    }

    return marker;
  }

  decimal5(val) {
    return Number.parseFloat(val).toFixed(5);
  }

  addMapMarker(user, location, i) {
    //  alert("111");
    console.log(user);
    var thiz = this;
    var marker = this.getMapMarker(user, this.markersArray[i]);
    if (marker == null) return;
    this.markersArray[i] = marker;

    var infowindow = this.pinInfoWnd;
    var chatServ = this.chatService;

    let username = user.name || "";
    let loc = location || user.location;
    let lat;
    let lng;

    if (user.currentlat) {
      lat = this.decimal5(user.currentlat);
      lng = this.decimal5(user.currentlng);
    } else {
      lat = this.decimal5(loc.lat);
      lng = this.decimal5(loc.lng);
    }
    //MARER HERE
    console.log(user)
    marker.setOptions({
      position: new google.maps.LatLng(lat, lng),
      label:user.name
    });
    marker.set("id", user.id);
    if (thiz.contact != null && thiz.contact.id == user.id) {
      google.maps.event.addListenerOnce(infowindow, "domready", () => {
        if (thiz.dotInfoWnd != null) thiz.dotInfoWnd.close();
        let btn = document.getElementById("btn");
        if (btn != null) {
          if (btn.getAttribute("listener") !== "true") {
            btn.addEventListener("click", () => {
              thiz.sendMsg();
            });
            btn.setAttribute("listener", "true");
          }
        }
        const textInput = <HTMLInputElement>document.getElementById("txtInput");
        if (textInput != null) {
          Observable.fromEvent(textInput, "input")
            .debounceTime(150)
            .distinctUntilChanged()
            .subscribe(() => {
              thiz.message = textInput.value;
            });
        }
        // Reference to the DIV that wraps the bottom of infowindow
        var iwOuter = $(".gm-style-iw");

        iwOuter.attr("style", function(i, s) {
          return s + "text-align: center;";
        });
        /* Since this div is in a position prior to .gm-div style-iw.
         * We use jQuery and create a iwBackground variable,
         * and took advantage of the existing reference .gm-style-iw for the previous div with .prev().
         */
        var iwBackground = iwOuter.prev();

        // // Removes background shadow DIV
        // iwBackground.children(':nth-child(2)').css({'display' : 'none'});

        // // Removes white background DIV
        // iwBackground.children(':nth-child(1)').attr('style', function(i,s){ return s + 'background-color: #002288;'});

        // Moves the shadow of the arrow 76px to the left margin.
        iwBackground.append(`<div style="width: 0px; height: 0px;
                                    border-right: 11px solid transparent; border-left: 11px solid transparent; border-top: 24px solid rgba(47, 82, 143, 0.8);
                                    position: absolute; left: 106px; top: -24px;
                                    transform: rotate(180deg); -ms-transform: rotate(180deg);  -webkit-transform: rotate(180deg);"></div>`);

        iwBackground.append(`<div style="border-top-width: 24px;position: absolute;left: 127px;top: 0px; transform: rotate(180deg);-ms-transform: rotate(180deg); -webkit-transform: rotate(180deg);">
                                        <div style="position: absolute; overflow: hidden; left: -6px; top: -1px; width: 16px; height: 30px;">
                                            <div style="position: absolute; left: 6px; background-color: rgb(255, 255, 255); transform: skewX(22.6deg);  transform-origin: 0px 0px 0px; height: 24px; width: 10px; box-shadow: rgb(47, 82, 143) 0px 1px 6px; z-index: 1;"></div>
                                        </div>
                                        <div style="position: absolute; overflow: hidden; top: -1px; left: 10px; width: 16px; height: 30px;">
                                            <div style="position: absolute; left: 0px; background-color: rgb(255, 255, 255); transform: skewX(-22.6deg);  transform-origin: 10px 0px 0px; height: 24px; width: 10px; box-shadow: rgb(47, 82, 143) 0px 1px 6px; z-index: 1;"></div>
                                        </div>
                                    </div>`);
        // iwBackground.children(':nth-child(1)').css({width: '0px', height: '0px',
        //                                         'border-right': '12px solid transparent',
        //                                         'border-left': '12px solid transparent',
        //                                         'border-top': '24px solid rgba(47, 82, 143, 0.8)',
        //                                         position: 'absolute',
        //                                         left: '106px', top: '120px !important',
        //                                         transform: 'rotate(180deg)'});
        iwBackground.children(":nth-child(1)").css({ display: "none" });
        iwBackground.children(":nth-child(2)").attr("style", function(i, s) {
          return s + "background-color: rgba(47, 82, 143, 0.8);";
        });

        // Moves the arrow 76px to the left margin.
        iwBackground.children(":nth-child(3)").css({ display: "none" });

        // // Changes the desired tail shadow color.
        // iwBackground.children(':nth-child(3)').find('div').children().css({'box-shadow': 'rgba(47, 82, 143, 1) 0px 1px 6px', 'z-index' : '1'});

        // Moves the infowindow 115px to the right.
        iwOuter
          .parent()
          .parent()
          .css({ left: "-1px", top: "270px", position: "absolute" });

        // // Reference to the div that groups the close button elements.
        var iwCloseBtn = iwOuter.next();
        iwCloseBtn.click(function() {
          //other things you want to do when close btn is click
          thiz.readyToReply();
        });

        // // Apply the desired effect to the close button
        // // iwCloseBtn.css({opacity: '1', right: '38px', top: '3px', border: '7px solid #48b5e9', 'border-radius': '13px', 'box-shadow': '0 0 5px #3990B9'});

        // // If the content of infowindow not exceed the set maximum height, then the gradient is removed.
        // if($('.iw-content').height() < 140){
        //     $('.iw-bottom-gradient').css({display: 'none'});
        // }

        // The API automatically applies 0.7 opacity to the button after the mouseout event. This function reverses this event to the desired value.
        // iwCloseBtn.mouseout(function(){
        //     $(this).css({opacity: '1'});
        // });
      });
      infowindow.open(this.map, marker);
    }

    google.maps.event.addListenerOnce(
      marker,
      "click",
      ((marker, i) => {
        return function() {
          if (thiz.dotInfoWnd != null) thiz.dotInfoWnd.close();

          infowindow.close();

          if (thiz.isAdmin) {
            infowindow.setContent(username);
            infowindow.open(this.map, marker);
            return;
          }
          thiz.contact = user;
          thiz.roomId = chatServ.getGeneratedRoomId(user.id, chatServ.user.id);
          // <br><span style="font-size:12px">Time: ${timeStr}</span>
          var content = `<div style="text-align:left;"><h3>${username}</h3></div>
                        <div class="" fxLayout="row">
                        <mat-form-field fxFlex floatPlaceholder="never">
                        <textarea matInput id="txtInput"
                                    style="border: none; border-bottom: dotted 2px #c9c9c9;
                                    overflow: auto;outline: none;
                                    -webkit-box-shadow: none; -moz-box-shadow: none; box-shadow: none; font-size:12pt"
                                    placeholder="Enter message"
                                    [(ngModel)]="message"
                                    rows="4"></textarea>
                        </mat-form-field>
                        </div>
                        <div style="text-align:right; padding-top:4px;">      
                        <button id="btn" mat-raised-button 
                        style="box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);
                                background: white;
                                box-sizing: border-box;
                                position: relative;
                                -webkit-user-select: none;
                                -moz-user-select: none;
                                -ms-user-select: none;
                                user-select: none;
                                cursor: pointer;
                                outline: 0;
                                border: none;
                                -webkit-tap-highlight-color: transparent;
                                display: inline-block;
                                white-space: nowrap;
                                text-decoration: none;
                                vertical-align: baseline;
                                text-align: center;
                                margin: 1px;
                                min-width: 48px;
                                line-height: 28px;
                                padding: 0 12px;
                                border-radius: 2px;
                                overflow: visible;
                                transform: translate3d(0,0,0);
                                transition: background .4s cubic-bezier(.25,.8,.25,1),box-shadow 280ms cubic-bezier(.4,0,.2,1)">
                            <span style="font-family: Roboto; font-size:14px; font-weight:500;">SEND</span></button>                            
                        </div>
                        `;

          //<button id="btn" mat-button style="font-size: 12pt; background-color: #f0f0f0; padding: 4px 4px !important;
          //border-radius: 4px; border-width: 1px; border-color: #c0c0c0; border-style: solid;">SEND</button>

          infowindow.setContent(content);

          google.maps.event.addListenerOnce(infowindow, "domready", () => {
            let btn = document.getElementById("btn");
            if (btn != null) {
              if (btn.getAttribute("listener") !== "true") {
                btn.addEventListener("click", () => {
                  thiz.sendMsg();
                });
                btn.setAttribute("listener", "true");
              }
            }

            const textInput = <HTMLInputElement>(
              document.getElementById("txtInput")
            );
            Observable.fromEvent(textInput, "input")
              .debounceTime(150)
              .distinctUntilChanged()
              .subscribe(() => {
                thiz.message = textInput.value;
              });

            // Reference to the DIV that wraps the bottom of infowindow
            var iwOuter = $(".gm-style-iw");

            iwOuter.attr("style", function(i, s) {
              return s + "text-align: center;";
            });

            var iwBackground = iwOuter.prev();

            // // Removes background shadow DIV
            // iwBackground.children(':nth-child(2)').css({'display' : 'none'});

            // // Removes white background DIV
            // iwBackground.children(':nth-child(1)').attr('style', function(i,s){ return s + 'background-color: #002288;'});

            // Moves the shadow of the arrow 76px to the left margin.
            iwBackground.append(`<div style="width: 0px; height: 0px;
                                        border-right: 11px solid transparent; border-left: 11px solid transparent; border-top: 24px solid rgba(47, 82, 143, 0.8);
                                        position: absolute; left: 106px; top: -24px;
                                        transform: rotate(180deg); -ms-transform: rotate(180deg);  -webkit-transform: rotate(180deg);"></div>`);

            iwBackground.append(`<div style="border-top-width: 24px;position: absolute;left: 127px;top: 0px; transform: rotate(180deg);-ms-transform: rotate(180deg); -webkit-transform: rotate(180deg);">
                                            <div style="position: absolute; overflow: hidden; left: -6px; top: -1px; width: 16px; height: 30px;">
                                                <div style="position: absolute; left: 6px; background-color: rgb(255, 255, 255); transform: skewX(22.6deg);  transform-origin: 0px 0px 0px; height: 24px; width: 10px; box-shadow: rgb(47, 82, 143) 0px 1px 6px; z-index: 1;"></div>
                                            </div>
                                            <div style="position: absolute; overflow: hidden; top: -1px; left: 10px; width: 16px; height: 30px;">
                                                <div style="position: absolute; left: 0px; background-color: rgb(255, 255, 255); transform: skewX(-22.6deg);  transform-origin: 10px 0px 0px; height: 24px; width: 10px; box-shadow: rgb(47, 82, 143) 0px 1px 6px; z-index: 1;"></div>
                                            </div>
                                        </div>`);
            // iwBackground.children(':nth-child(1)').css({width: '0px', height: '0px',
            //                                         'border-right': '12px solid transparent',
            //                                         'border-left': '12px solid transparent',
            //                                         'border-top': '24px solid rgba(47, 82, 143, 0.8)',
            //                                         position: 'absolute',
            //                                         left: '106px', top: '120px !important',
            //                                         transform: 'rotate(180deg)'});
            iwBackground.children(":nth-child(1)").css({ display: "none" });
            iwBackground
              .children(":nth-child(2)")
              .attr("style", function(i, s) {
                return s + "background-color: rgba(47, 82, 143, 0.8);";
              });

            // Moves the arrow 76px to the left margin.
            iwBackground.children(":nth-child(3)").css({ display: "none" });

            // // Changes the desired tail shadow color.
            // iwBackground.children(':nth-child(3)').find('div').children().css({'box-shadow': 'rgba(47, 82, 143, 1) 0px 1px 6px', 'z-index' : '1'});

            // Moves the infowindow 115px to the right.
            iwOuter
              .parent()
              .parent()
              .css({ left: "-1px", top: "270px", position: "absolute" });

            // // Reference to the div that groups the close button elements.
            var iwCloseBtn = iwOuter.next();
            iwCloseBtn.click(function() {
              //other things you want to do when close btn is click
              thiz.readyToReply();
            });

            // // Apply the desired effect to the close button
            // // iwCloseBtn.css({opacity: '1', right: '38px', top: '3px', border: '7px solid #48b5e9', 'border-radius': '13px', 'box-shadow': '0 0 5px #3990B9'});

            // // If the content of infowindow not exceed the set maximum height, then the gradient is removed.
            // if($('.iw-content').height() < 140){
            //     $('.iw-bottom-gradient').css({display: 'none'});
            // }

            // The API automatically applies 0.7 opacity to the button after the mouseout event. This function reverses this event to the desired value.
            // iwCloseBtn.mouseout(function(){
            //     $(this).css({opacity: '1'});
            // });
          });

          infowindow.open(this.map, marker);
        };
      })(marker, i)
    );
  }

  clearMarkers() {
    for (var i = 0; i < this.markersArray.length; i++) {
      if (this.markersArray[i] != null) {
        google.maps.event.clearInstanceListeners(this.markersArray[i]);
        this.markersArray[i].setMap(null);
      }
    }
    this.markersArray.length = 0;
  }

  addUserRoutes(user, index, showed) {
    var dotInfo = this.dotInfoWnd;
    var thiz = this;

    let emergency = this.emergService.emergency || this.emergency;
    if (emergency == null || emergency.id == "") {
      this.userRoutesArray[index] = [];
      return;
    }

    if (
      this.userRoutesArray[index] == undefined ||
      this.userRoutesArray[index] == null
    ) {
      this.userRoutesArray[index] = [];
    }

    let ref = firebase
      .app()
      .database()
      .ref()
      .child(DB_NAME.LOCS)
      .child(emergency.id)
      .child(user.id);
    ref
      .orderByChild("timestamp")
      .once("value")
      .then(snapshot => {
        var count = 0;
        var trackCount = snapshot.numChildren();
        if (
          thiz.userRoutesArray[index] == undefined ||
          thiz.userRoutesArray[index] == null
        ) {
          thiz.userRoutesArray[index] = [];
        }
        var routes = thiz.userRoutesArray[index];
        var procCount = routes.length;
        if (trackCount > procCount) {
          snapshot.forEach(childSnapshot => {
            var childData = childSnapshot.val();
            if (childSnapshot.numChildren() == 4) {
              if (showed == true) {
                if (count >= procCount) {
                  let loc = new google.maps.LatLng(
                    this.decimal5(childData["lat"]),
                    this.decimal5(childData["lng"])
                  );
                  let rot = thiz.getRoute(loc, count);
                  rot.setOptions({
                    position: loc
                  });
                  routes.push(rot);
                  var ts = childData.timestamp || 0;
                  var timeStr = "";
                  if (ts != 0) {
                    let dt: Date = new Date(ts);
                    timeStr = dt.toLocaleTimeString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                  }
                  timeStr = user.name + "<br>" + timeStr;

                  google.maps.event.addListener(
                    rot,
                    "mouseover",
                    ((rot, i) => {
                      return function() {
                        thiz.readyToReply();
                        dotInfo.close();

                        dotInfo.setContent(timeStr);
                        dotInfo.open(thiz.map, rot);

                        google.maps.event.addListenerOnce(
                          dotInfo,
                          "domready",
                          () => {
                            var iwOuter = $(".gm-style-iw");
                            iwOuter.next().hide();
                            iwOuter
                              .parent()
                              .parent()
                              .css({
                                left: "-1px",
                                top: "0px",
                                position: "absolute"
                              });
                          }
                        );
                      };
                    })(rot, count)
                  );

                  google.maps.event.addListener(
                    rot,
                    "mouseout",
                    ((rot, i) => {
                      return function() {
                        dotInfo.close();
                      };
                    })(rot, count)
                  );

                  thiz.clusterArray.push(rot);
                }
              }
              count++;

              if (count == trackCount) {
                if (!emergency.active) {
                  //const userStatus = thiz.getUserStatus(user.id);
                  //if (userStatus != UserStatus.NOT_RESPOND) {
                  thiz.addMapMarker(user, childData, index);
                  //}
                } else {
                  // if (this.pageType != 'new') {
                  //     const userStatus = this.getUserStatus(user.id);
                  //     if (userStatus == UserStatus.NOT_RESPOND) {
                  //         thiz.addMapMarker(user, childData, index);
                  //     }
                  // }
                }
              }
            } else {
              trackCount--;
            }
          });
        }
        if (trackCount == 0) {
          if (!emergency.active) {
            thiz.addMapMarker(user, null, index);
          }
        }
        thiz.processRoutesCount--;
      });
  }

  resetUserRoutes(users) {
    users.forEach((user: any, i) => {
      let ref = firebase
        .app()
        .database()
        .ref()
        .child(DB_NAME.LOCS)
        .child(user.id);
      ref.remove();
    });
    this.clearUserRoutesArray();
  }

  getRoute(location, index) {
    let zoom = this.map.getZoom();
    var pixelSizeAtZoom0 = 2; //the size of the icon at zoom level 0
    var maxPixelSize = 16; //restricts the maximum size of the icon, otherwise the browser will choke at higher zoom levels trying to scale an image to millions of pixels

    var relativePixelSize = Math.round(
      pixelSizeAtZoom0 * Math.pow(2, zoom - 12)
    );
    if (relativePixelSize > maxPixelSize)
      //restrict the maximum size of the icon
      relativePixelSize = maxPixelSize;

    var size1 = relativePixelSize / 2;
    var size2 = relativePixelSize / 4;

    var url;
    var zIndex = 6;
    if (index == 0) {
      url = `data:image/svg+xml;utf8,<svg x='0' y='0' width='${relativePixelSize}' height='${relativePixelSize}' xmlns='http://www.w3.org/2000/svg' xml:space='preserve'><circle cx='${size1}' cy='${size1}' r='${size1 -
        1}' stroke='rgb(193,31,54)' stroke-width='2' fill='rgb(255,255,255)' stroke-opacity='0.8' fill-opacity='0.3'/></svg>`;
      zIndex = 7;
    } else {
      url = `data:image/svg+xml;utf8,<svg x='0' y='0' width='${size1}' height='${size1}' xmlns='http://www.w3.org/2000/svg' xml:space='preserve'><circle cx='${size2}' cy='${size2}' r='${size2}' stroke='rgb(48, 53, 64)' stroke-width='1' fill='rgb(48, 53, 64)' stroke-opacity='0.3' fill-opacity='0.3'/></svg>`;
    }
    var route = new google.maps.Marker({
      icon: {
        url: url
      },
      zIndex: zIndex,
      center: location,
      map: this.map
    });

    return route;

    // var route;
    // var p = Math.pow(2, (21 - this.map.getZoom()));
    // var radius = p * 0.25;
    /*
        if (index == 0) {
            // route = new google.maps.Circle({
            //     strokeColor: '#C11F36',
            //     strokeOpacity: 0.8,
            //     strokeWeight: 2,
            //     fillColor: '#FFFFFF',
            //     fillOpacity: 0.3,
            //     map: this.map,
            //     center: location,
            //     radius: 2 * radius
            // });
            route = new google.maps.Marker({
                icon: {
                    url: 'data:image/svg+xml;utf-8,<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="8" stroke="#C11F36" stroke-width="2" fill="#FFFFFF" stroke-opacity=".8" fill-opacity=".3"/></svg>'
                },
                zIndex: 7,
                map: this.map
              });
        }
        else {
            route = new google.maps.Marker({
                icon: {
                  url: 'data:image/svg+xml;utf-8,<svg width="8" height="8" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="4" r="4" stroke="#303540" stroke-width="1" fill="#303540" stroke-opacity=".3" fill-opacity=".3"/></svg>'
                },
                zIndex: 6,
                map: this.map
              });
              
            // route = new google.maps.Circle({
            //     strokeColor: '#303540',
            //     strokeOpacity: 0.3,
            //     strokeWeight: 1,
            //     fillColor: '#303540',
            //     fillOpacity: 0.3,
            //     map: this.map,
            //     center: location,
            //     radius: radius
            // });
        }
        return route;*/
  }

  clearUserRoutesArray() {
    for (var i = 0; i < this.userRoutesArray.length; i++) {
      this.clearMaps(this.userRoutesArray[i]);
    }
    this.userRoutesArray.length = 0;
  }

  updatePolygonPath(path) {
    this.paths = [];
    for (var i = 0; i < path.getArray().length; i++) {
      let pt = path.getArray()[i];
      let point = { lat: pt.lat(), lng: pt.lng() };
      this.paths.push(point);
    }

    if (this.drawingManager != null) {
      if (this.paths.length > 2) {
        // Switch back to non-drawing mode after drawing a shape.
        this.drawingManager.setDrawingMode(null);
        // To hide:
        this.drawingManager.setOptions({
          drawingControl: false
        });
      }
    }
  }

  createEmergencyForm() {
    return this.formBuilder.group({
      id: [this.emergency.id],
      name: [this.emergency.name],
      emergencyType: [this.selectedType, Validators.required],
      description: [this.emergency.description],
      notificationMsg: [null],
      notify: [null],
      sound: [false]
    });
  }

  checkValidation(): boolean {
    if (this.emergency.type == "AREA") {
      if (this.paths.length < 3) {
        alert("Please select emergency area.");
        return false;
      }
    } else if (this.emergency.type == "USERS") {
      if (this.emergency.users.length == 0) {
        alert("Emergency needs a User at least.");
        return false;
      }
    } else if (this.emergency.type == "ZONE") {
      if (this.emergency.zones.length == 0) {
        alert("Emergency needs a Zone at least.");
        return false;
      }
    } else {
      return true;
    }

    return true;
  }

  saveEmergency() {
    if (!this.checkValidation()) return;
    const data = this.emergencyForm.getRawValue();
    this.emergency.updateData(data);
    this.emergency.orgId = this.selectedOrg.id;
    this.emergency.area = this.paths;
    this.emergService.saveEmergency(this.emergency).then(() => {
      // Trigger the subscription with new data
      this.emergService.onEmergencyChanged.next(this.emergency);
      // Show the success message
      this.snackBar.open("Emergency saved", "OK", {
        verticalPosition: "top",
        duration: 2000
      });
    });
  }

  addEmergency() {
    if (!this.checkValidation()) return;
    this.isAdding = true;
    const data = this.emergencyForm.getRawValue();
    console.log("DATA",data)
    this.emergency.updateData(data);
    this.emergency.id = this.emergService.newId;
    this.emergency.orgId = this.selectedOrg.id;
    this.emergency.area = this.paths;
    if (this.markerUsersSubscription) {
      this.markerUsersSubscription.unsubscribe();
      this.markerUsersSubscription = null;
    }
    this.emergService.addEmergency(this.emergency).then(() => {
      if (this.emergency.type == "AREA") {
        this.snackBar.open("Emergency added", "OK", {
          verticalPosition: "top",
          duration: 500
        });
        this.clearMarkers();
        this.clearUserRoutesArray();
        this.router.navigate(["emergencies/" + this.emergency.id]);
        this.isAdding = false;
      } else if (this.emergency.type == "ZONE") {
        this.snackBar.open("Emergency added", "OK", {
          verticalPosition: "top",
          duration: 500
        });
        this.clearMarkers();
        this.clearUserRoutesArray();
        this.router.navigate(["emergencies/" + this.emergency.id]);
        this.isAdding = false;
        var latlng = new google.maps.LatLng(
          this.mapCenter.lat,
          this.mapCenter.lng
        );
        this.map = new google.maps.Map(document.getElementById("mapView"), {
          center: latlng,
          zoom: 10
        });
        if (this.emergency.type == "ZONE") {
          var fillColor = "#cc3300"; // '#FF0000'
          var strokeColor = "#cc3300"; //'#FF0000'

          if (!this.emergency.active) {
            fillColor = "gray";
            strokeColor = "gray";
          }
          var polyOptions = {
            fillColor: fillColor,
            strokeColor: strokeColor,
            strokeWeight: 0,
            fillOpacity: 0.45,
            editable: true
          };
          this.emergency.zones.forEach(element => {
            if (element.area.length > 2) {
              this.paths = element.area;
              this.polygon = new google.maps.Polygon({
                paths: this.paths,
                strokeColor: strokeColor,
                strokeOpacity: 0.8,
                strokeWeight: 3,
                fillColor: fillColor,
                fillOpacity: 0.35,
                editable: true
              });
              this.polygon.setMap(this.map);
              // Create the bounds object
            }
          });
        }
      } else {
        // alert(this.emergency.users[0].name);
        this.emergService.addEmergUsers(this.emergency, eid => {
          // alert("hiiiting");
          if (eid != null) {
            // Show the success message
            this.snackBar.open("Emergency added", "OK", {
              verticalPosition: "top",
              duration: 500
            });
            this.clearMarkers();
            this.clearUserRoutesArray();
            this.router.navigate(["emergencies/" + this.emergency.id]);
            this.isAdding = false;
          } else {
            this.emergService.deleteEmergency(this.emergency);
          }
        });
      }
    });
  }
  toggleEvent(e) {
    this.toggle = false;
  }
  getUserStatus(userId) {
    var emergency = this.emergService.emergency || this.emergency;
    if (emergency == null) {
      return;
    }
    var isExistReplied = false;
    if (emergency.type == "AREA") {
      const usersReplied = emergency.usersReplied || [];
      isExistReplied = usersReplied.some(element => {
        return element === userId;
      });

      if (isExistReplied) {
        return UserStatus.REPLIED;
      } else {
        return UserStatus.NOT_RESPOND;
      }
    } else if (emergency.type == "ZONE") {
      const usersReplied = emergency.usersReplied || [];
      isExistReplied = usersReplied.some(element => {
        return element === userId;
      });

      if (isExistReplied) {
        return UserStatus.REPLIED;
      } else {
        return UserStatus.NOT_RESPOND;
      }
    } else {
      if (emergency.users.length == 0) {
        return UserStatus.UNKNOWN;
      } else {
        const usersReplied = emergency.usersReplied || [];
        isExistReplied = usersReplied.some(element => {
          return element === userId;
        });

        if (isExistReplied) {
          return UserStatus.REPLIED;
        } else {
          return UserStatus.NOT_RESPOND;
        }
      }
    }
  }
  changeStatus() {
    this.notifyToggle = !this.notifyToggle;
    if (this.notifyToggle) {
      this.emergencyForm.patchValue({
        notify: "notifySelected"
      });
    } else {
      this.emergencyForm.patchValue({
        notify: null
      });
    }
  }
  checkChecked() {
    const x = this.emergencyForm.get("notify").value;
    if (x === "notifyAllUsers") {
      return;
    } else {
      if (this.emergency.type === "USERS") {
        return "notifySelected";
      }
      if (this.emergency.type === "ZONE") {
        return "notifySelected";
      }
      if (this.emergency.type === "AREA") {
        return "notifySelected";
      }
    }
  }
  // sendPathData() {
  //   let latlng: any = [];
  //   this.emergency.users.forEach(user => {
  //     this.emergService.getUsersInfo(user.id).subscribe((res: any) => {
  //       latlng.push({
  //         lat: res["location"]["lat"],
  //         lng: res["location"]["lng"]
  //       });
  //       let main = { id: res.id, location: latlng, name: res.name };
  //       this.emergService
  //         .getUsersLocation(this.emergency.id, user)
  //         .subscribe((res2: any) => {
  //           if (res2 === undefined) {
  //             this.emergService.setLocationOfUsers(this.emergency.id, main);
  //           } else {
  //             if (res2.id === user.id) {
  //               const status = this.removeDuplicates(res2, latlng);
  //               if (status === false) {
  //                 this.emergService.updateLocationOfUsers(
  //                   this.emergency["id"],
  //                   res2
  //                 );
  //                 return;
  //               } else {
  //                 res2.location.push(...latlng);
  //                 this.emergService.updateLocationOfUsers(
  //                   this.emergency["id"],
  //                   res2
  //                 );
  //                 return;
  //               }
  //             } else {
  //               this.emergService.setLocationOfUsers(this.emergency.id, main);
  //             }
  //           }
  //         });
  //     });
  //   });
  // }
  // drawPolyLine(center, zoom) {
  //   let directionsService = new google.maps.DirectionsService();
  //   let directionsRenderer = new google.maps.DirectionsRenderer();
  //   let map = new google.maps.Map(document.getElementById("mapView"), {
  //     zoom,
  //     mapTypeId: google.maps.MapTypeId.ROADMAP,
  //     center
  //   });
  //   directionsRenderer.setMap(map);
  //   let latlngArr;
  //   this.emergency.users.forEach(user => {
  //     let waypoints: any[];
  //     this.emergService
  //       .getUsersLocation(this.emergency.id, user)
  //       .subscribe(res => {
  //         if (res) {
  //           latlngArr = res["location"];
  //           waypoints = latlngArr.map(x => {
  //             return {
  //               location: new google.maps.LatLng(x.lat, x.lng),
  //               stopover: false
  //             };
  //           });
  //           waypoints.shift();
  //           waypoints.pop();
  //           const y = waypoints.slice(1, 25);
  //           let request = {
  //             origin: latlngArr[0],
  //             destination: latlngArr[latlngArr.length - 1],
  //             waypoints: y,
  //             optimizeWaypoints: false,
  //             travelMode: "WALKING"
  //           };
  //           directionsService.route(request, function(response, status) {
  //             if (status == google.maps.DirectionsStatus.OK) {
  //               directionsRenderer.setDirections(response);
  //               let route = response.routes[0];
  //               let summaryPanel = document.getElementById("directions_panel");
  //               summaryPanel.innerHTML = "";
  //               for (let i = 0; i < route.legs.length; i++) {
  //                 let routeSegment = i + 1;
  //                 summaryPanel.innerHTML +=
  //                   "<b>Route Segment: " + routeSegment + "</b><br />";
  //                 summaryPanel.innerHTML +=
  //                   route.legs[i].start_address + " to ";
  //                 summaryPanel.innerHTML +=
  //                   route.legs[i].end_address + "<br />";
  //                 summaryPanel.innerHTML +=
  //                   route.legs[i].distance.text + "<br /><br />";
  //               }
  //             } else {
  //               console.warn("directions response " + status);
  //             }
  //           });
  //         }
  //       });
  //   });
  // }

  removeDuplicates(arr, latlng) {
    let x: boolean;
    arr.location.forEach(l => {
      latlng.forEach(ll => {
        if (l.lat === ll.lat && l.lng === ll.lng) {
          x = false;
        } else {
          x = true;
        }
      });
    });
    return x;
  }
}
