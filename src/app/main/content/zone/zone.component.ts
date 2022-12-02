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
import { Zone } from "./zone.model";
import { ZoneService } from "./zone.service";
import { Location } from "@angular/common";
import { isValidNumber } from "libphonenumber-js";
import { AuthService } from "../auth/auth.service";
import { BulkUserComponent } from "../user/bulk-user/bulk-user.component";
/* map import file start  */
import * as MarkerClusterer from "@google/markerclusterer";
import { MapLoaderService } from "./zone-map-loader.service";
import { DB_NAME } from "../../../app.constants";
import * as firebase from "firebase";
import "rxjs/add/operator/startWith";
import "rxjs/add/observable/merge";
import "rxjs/add/operator/map";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import { Observable } from "rxjs/Observable";
import { ActivatedRoute, Router } from "@angular/router";
// import { } from "../"
declare var google: any;
@Component({
  selector: "app-zone",
  templateUrl: "./zone.component.html",
  styleUrls: ["./zone.component.scss"],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations
})
export class ZoneComponent implements OnInit {
  zone = new Zone();
  onZoneChanged: Subscription;
  onFileAttached: Subscription;
  pageType: string;
  zoneForm: FormGroup;
  phoneNumber = null;
  /* map variable start */
  clusterArray = [];
  polygon: any;
  mapCenter: any = {
    lat: 0,
    lng: 0
  };
  map: any;
  markerCluster: MarkerClusterer;
  mapZoom: number = 10;
  pinInfoWnd: any;
  dotInfoWnd: any;
  userRoutesArray = [];
  markersArray = [];
  processRoutesCount = 0;
  markerUsersSubscription: Subscription;
  routeUsersSubscription: Subscription;
  isProcessing = false;
  isAdding = false;
  contact: any;
  usersCombined: Observable<any>;
  usersCombinedSubscription: Subscription;
  serviceUserListSubscription: Subscription;
  serviceOrgSubscription: Subscription;
  emergencySubscription: Subscription;
  onEmergencyChanged: Subscription;
  serviceUserUpdatedSubscription: Subscription;
  drawingManager: any;
  onUserSelected: Subscription;
  selectedIndex: number = 0;
  areaListCall = 0;
  message: string;
  roomId: string;
  paths: any[] = [];
  // ---- admin
  isAdmin: any;
  orgList: any[] = [];
  selectedOrg: any;
  // ---- admin
  orgId: string;
  attachedFile: any;
  onCoordinatorChanged: Subscription;
  organizationsListener: Subscription;
  ZoneForm: FormGroup;
  registerFormErrors: any;
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
    private zoneService: ZoneService,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    public snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.isAdmin = this.authService.isAdmin;
  }
  /* map start */
  initPolygon() {
    var fillColor = "#cc3300"; // '#FF0000'
    var strokeColor = "#cc3300"; //'#FF0000'
    var polyOptions = {
      fillColor: fillColor,
      strokeColor: strokeColor,
      strokeWeight: 0,
      fillOpacity: 0.45,
      editable: true
    };
    if (this.zone.area.length > 2) {
      this.paths = this.zone.area;
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

      google.maps.event.addListener(this.polygon.getPath(), "set_at", event => {
        this.updatePolygonPath(this.polygon.getPath());
      });

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

  updateMapLocation() {
    this.mapCenter = this.selectedOrg.location;
    if (this.map) {
      this.map.setCenter(
        new google.maps.LatLng(this.mapCenter.lat, this.mapCenter.lng)
      );
    }
  }

  ngOnInit() {
    this.zoneService.pageType = "";
    this.route.queryParams.subscribe(params => {
      let type = params["type"];
      this.onEmergencyChanged = this.zoneService.onEmergencyChanged.subscribe(
        emergency => {
          if (emergency) {
            // this.pageType = 'edit';
            // this.emergService.pageType = this.pageType;
            // this.emergency = new Emergency(emergency);
            // this.emergService.selectedUsers = null;//this.emergency.users || [];
            // this.emergService.emergency = this.emergency;
            // this.selectedType = this.emergency.type;
            // if (this.selectedType == "AREA") {
            //     this.emergService.selectedUsers = null;
            // }

            if (this.emergencySubscription) {
              this.emergencySubscription.unsubscribe();
            }

            this.emergencySubscription = this.zoneService
              .trackEmergency(this.zone.zone_id)
              .subscribe(data => {
                if (data != null) {
                  this.zone = data;
                  this.zoneService.emergency = data;
                  this.clearMarkers();
                  this.clearUserRoutesArray();
                  this.initMarker();

                  var fillColor = "#cc3300"; // '#FF0000'
                  var strokeColor = "#cc3300"; //'#FF0000'

                  if (!this.zone.active) {
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
            // this.pageType = 'new';
            // this.emergService.pageType = this.pageType;
            // this.emergency = new Emergency();
            // this.emergService.selectedUsers = null;
          }
          // this.emergencyForm = this.createEmergencyForm();
        }
      );

      this.serviceOrgSubscription = this.zoneService
        .getOrganization()
        .subscribe(orgList => {
          this.orgList = orgList;
          if (orgList.length > 1) {
            for (var i = 0; i < this.orgList.length; i++) {
              let org = this.orgList[i];
              if (org.id == this.zone.orgId) {
                this.selectedOrg = org;
                this.zone.orgId = this.selectedOrg.id;
                break;
              }
            }
          } else if (orgList.length > 0 && orgList.length == 1) {
            this.selectedOrg = this.orgList[0];
            this.zone.orgId = this.selectedOrg.id;

            this.updateMapLocation();
          }
        });

      this.serviceUserListSubscription = this.zoneService.onUserListChanged.subscribe(
        (userList: any[]) => {
          if (this.zone.type == "") {
            return;
          }
          if (this.zone.type == "AREA") {
            // alert("45zone");
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
            this.zone.users = arrUser;
          } else {
            this.zone.users = [];
          }
          if (this.areaListCall == 1) {
            this.clearMarkers();
            this.clearUserRoutesArray();

            this.initMarker();
          }
        }
      );

      // map center will be updated for selected user
      this.onUserSelected = this.zoneService.onUserSelected.subscribe(user => {
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

      this.serviceUserUpdatedSubscription = this.zoneService.onUserListUpdated.subscribe(
        (userList: any[]) => {
          if (this.map == null) return;
          if (this.zone.type == "") {
            return;
          }
          if (!(userList instanceof Array)) return;

          if (this.pageType == "new") {
            if (userList.length > 0) {
              var arrUser = [];
              for (let user of userList) {
                arrUser.push(user);
              }
              this.zone.users = arrUser;
            } else {
              this.zone.users = [];
            }
            //this.reloadMapMarkerData(this.emergency.users);
            return;
          }
          this.zoneService.selectedUsers = userList;
          if (this.zoneService.emergency != null) {
            this.clearMarkers();
            this.clearUserRoutesArray();
            this.initMarker();
          }
        }
      );
    });

    /* map ngOnOnit */

    this.onZoneChanged = this.zoneService.onZonesChanged.subscribe(user => {
      if (user) {
        this.zone = new Zone(user);
        this.pageType = "edit";
        this.phoneNumber = user.phone;
        this.orgId = user.belongsTo;
      } else {
        this.pageType = "add_zone";
        this.zone = new Zone();
        this.orgId = this.zoneService.orgId;
      }

      this.zoneForm = this.createZoneForm();
    });

    this.onFileAttached = this.zoneService.onFileAttached.subscribe(file => {
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

  initMap() {
    if (this.map != null) return;

    var latlng = new google.maps.LatLng(this.mapCenter.lat, this.mapCenter.lng);
    this.map = new google.maps.Map(document.getElementById("mapView"), {
      center: latlng,
      zoom: this.mapZoom
    });

    this.pinInfoWnd = new google.maps.InfoWindow();
    this.dotInfoWnd = new google.maps.InfoWindow();

    this.markerCluster = new MarkerClusterer(this.map, this.clusterArray, {
      imagePath:
        "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m"
    });

    var tmap = this.map;
    var mRoutesArray = this.userRoutesArray;
    //google.maps.event.removeEventListener(this.map, 'zoom_changed');
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

  ngAfterViewInit() {
    this.markersArray = [];
    this.userRoutesArray = [];
    this.processRoutesCount = 0;
    MapLoaderService.load().then(() => {
      this.initMap();
      this.onSelectType();
    });
  }

  onSelectType() {
    this.initPolygon();
    this.clearMarkers();
    this.clearUserRoutesArray();
    this.initMarker();
  }

  decimal5(val) {
    return Number.parseFloat(val).toFixed(5);
  }

  readyToReply(): void {
    if (this.pinInfoWnd) this.pinInfoWnd.close();
    this.contact = null;
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
  }

  addUserRoutes(user, index, showed) {
    var dotInfo = this.dotInfoWnd;
    var thiz = this;

    let emergency = this.zoneService.emergency || this.zone;
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

  getMapMarker(user, marker) {
    var emergency = this.zoneService.emergency;
    if (emergency == null) {
      emergency = this.zone;
      if (emergency == null) {
        return null;
      }
    }
    // var icon = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
    var fillColor = "27ae60";
    var strokeColor = "#green";
    // if (emergency.active)
    // {
    //     const userStatus = this.getUserStatus(user.id)
    //     if (userStatus == UserStatus.UNKNOWN && user.status == UserStatus.NEED_HELP) {
    //         fillColor = 'red'
    //         strokeColor = '#cf4b3e'
    //     } else if (userStatus == UserStatus.UNKNOWN && user.status == UserStatus.NORMAL) {
    //         fillColor = '#27ae60'
    //         strokeColor = 'green'
    //     } else if (userStatus == UserStatus.REPLIED && user.status == UserStatus.NORMAL) {
    //         fillColor = '#27ae60'
    //         strokeColor = 'green'
    //     } else if (userStatus == UserStatus.REPLIED && user.status == UserStatus.NEED_HELP) {
    //         fillColor = 'red'
    //         strokeColor = '#cf4b3e'
    //     }
    //     // else if (userStatus == UserStatus.NOTIFIED) {
    //     //     fillColor = 'yellow'
    //     //     strokeColor = '#cca506'
    //     // }
    //     else if (userStatus == UserStatus.NOT_RESPOND) {
    //         fillColor = '#bdc3c7'
    //         strokeColor = 'gray'
    //     } else {
    //         fillColor = 'red'
    //         strokeColor = '#cf4b3e'
    //     }
    // }
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
          scale: 1
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
        scale: 1
      });
    }

    return marker;
  }

  reloadMapMarkerData(users) {
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
    if (this.zoneService.selectedUsers instanceof Array) {
      selectedUsers = this.zoneService.selectedUsers;
    }

    var showType = 0; // 0 - show selected pos & dot, 1 - all pos and selected dot
    this.clusterArray.length = 0;

    let emergency = this.zoneService.emergency || this.zone;

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

  clearUserRoutesArray() {
    for (var i = 0; i < this.userRoutesArray.length; i++) {
      this.clearMaps(this.userRoutesArray[i]);
    }
    this.userRoutesArray.length = 0;
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

  addMapMarker(user, location, i) {
    var thiz = this;
    var marker = this.getMapMarker(user, this.markersArray[i]);
    if (marker == null) return;
    this.markersArray[i] = marker;

    var infowindow = this.pinInfoWnd;
    // var chatServ = this.chatService;

    let username = user.name || "";
    let loc = location || user.location;
    let lat = this.decimal5(loc.lat);
    let lng = this.decimal5(loc.lng);

    marker.setOptions({
      position: new google.maps.LatLng(lat, lng)
    });
    marker.set("id", user.id);

    if (thiz.contact != null && thiz.contact.id == user.id) {
      google.maps.event.addListenerOnce(infowindow, "domready", () => {
        if (thiz.dotInfoWnd != null) thiz.dotInfoWnd.close();

        let btn = document.getElementById("btn");
        if (btn != null) {
          if (btn.getAttribute("listener") !== "true") {
            btn.addEventListener("click", () => {
              // thiz.sendMsg();
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
          // thiz.roomId = chatServ.getGeneratedRoomId(user.id, chatServ.user.id);
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
                  // thiz.sendMsg();
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

            iwBackground.children(":nth-child(1)").css({ display: "none" });
            iwBackground
              .children(":nth-child(2)")
              .attr("style", function(i, s) {
                return s + "background-color: rgba(47, 82, 143, 0.8);";
              });

            // Moves the arrow 76px to the left margin.
            iwBackground.children(":nth-child(3)").css({ display: "none" });

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
          });

          infowindow.open(this.map, marker);
        };
      })(marker, i)
    );
  }

  initMarker() {
    // // if (this.pageType == 'new') {
    // if (this.markerUsersSubscription)
    //   this.markerUsersSubscription.unsubscribe();
    // this.markerUsersSubscription = this.zoneService
    //   .getAllUserList()
    //   .subscribe(users => {
    //     this.reloadMapMarkerData(users);
    //   });
    // // } else {
    // //     if (this.markerUsersSubscription) this.markerUsersSubscription.unsubscribe();
    // //     this.markerUsersSubscription = this.zoneService.getEmergUserList0(this.zone.users).subscribe(users => {
    // //         this.reloadMapMarkerData(users);
    // //     });
    // // }
  }

  checkValidation(): boolean {
    if (this.zone.type == "ZONE") {
      if (this.paths.length < 3) {
        alert("Please select zone area.");
        return false;
      }
    } else {
      return true;
    }
    return true;
  }

  addZone() {
    if (!this.checkValidation()) return;
    this.isAdding = true;
    const data = this.zoneForm.getRawValue();
    this.zone.updateZoneData(data);
    this.zone.zone_id = this.zoneService.new_zone_ID;
    this.zone.orgId = this.selectedOrg.id;
    this.zone.area = this.paths;
    if (this.markerUsersSubscription) {
      this.markerUsersSubscription.unsubscribe();
      this.markerUsersSubscription = null;
    }

    this.zoneService.addZone(this.zone).then(() => {
      if (this.zone.type == "ZONE") {
        this.snackBar.open("Zone added", "OK", {
          verticalPosition: "top",
          duration: 500
        });

        this.clearMarkers();
        this.clearUserRoutesArray();

        this.router.navigate(["coordinators"]);

        this.isAdding = false;
      } else {
        // this.zoneService.addEmergUsers(this.zone, (eid) => {
        //     if (eid != null) {
        //         // Show the success message
        //         this.snackBar.open('Emergency added', 'OK', {
        //             verticalPosition: 'top',
        //             duration        : 500
        //         });
        //         this.clearMarkers();
        //         this.clearUserRoutesArray();
        //         this.router.navigate(['emergencies/' + this.zone.zone_id]);
        //         this.isAdding = false;
        //     }
        //     else {
        //         this.zoneService.deleteEmergency(this.zone);
        //     }
        // });
      }
    });
  }

  /* Map End  */

  ngOnDestroy() {
    if (this.onFileAttached) this.onFileAttached.unsubscribe();
    if (this.onZoneChanged) this.onZoneChanged.unsubscribe();
    if (this.serviceOrgSubscription) this.serviceOrgSubscription.unsubscribe();
  }

  createZoneForm() {
    return this.formBuilder.group({
      id: [this.zone.zone_id],
      zone_name: [
        this.zone.zone_name,
        Validators.compose([Validators.required])
      ],
      zone_description: [this.zone.zone_description]
    });
  }

  onSelectOrg() {}

  saveZone() {
    if (!this.isValidPhone) {
      alert("Invalid Phone Number!");
      return;
    }

    const data = this.zoneForm.getRawValue();
    this.zone.updateZoneData(data);

    this.zoneService.saveZone(this.zone).then(() => {
      // Trigger the subscription with new data
      this.zoneService.onZonesChanged.next(this.zone);

      // Show the success message
      this.snackBar.open("User saved", "OK", {
        verticalPosition: "top",
        duration: 2000
      });
    });
  }

  uploadZone() {
    this.bulkUserComponent.onUpload();
  }
}
