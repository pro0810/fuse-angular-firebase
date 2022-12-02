import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  OnDestroy
} from "@angular/core";
import {
  MatPaginator,
  MatSort,
  MatSnackBar,
  MatDialog,
  MatTabChangeEvent,
  MatTableDataSource
} from "@angular/material";
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
import { ZoneListService } from "./zone-list.service";
// import { AssemplyPointService } from "./assembly-point-list.service";
import { fuseAnimations } from "@fuse/animations";
import { FuseUtils } from "@fuse/utils";
import {
  CoordinatorListService,
  CoordinatorStatus
} from "./coordinator-list.service";
import { switchMap } from "rxjs/operators";
import { of, Subscription } from "rxjs";
import { FormGroup, FormBuilder } from "@angular/forms";
import { isValidNumber, AsYouType } from "libphonenumber-js";
import { Organization } from "../organization/organization.model";
import { AuthService } from "../auth/auth.service";
import { OrganizationListService } from "../organizations/organization-list.service";
import { Router, ActivatedRoute, Params } from "@angular/router";
import { AngularFirestore } from "angularfire2/firestore";

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
import { Zone } from "../zone/zone.model";
import { ZoneService } from "../zone/zone.service";

declare var google: any;
/* map import file end */

@Component({
  selector: "app-coordinators",
  templateUrl: "./coordinators.component.html",
  styleUrls: ["./coordinators.component.scss"],
  animations: fuseAnimations
})
export class CoordinatorsComponent implements OnInit, OnDestroy {
  /* map variable start */
  orgList: any[] = [];
  selectedOrg: any;
  pageType: string;
  zone = new Zone();
  clusterArray = [];
  location = {lat: -27.470125, lng: 153.021072};
  tempLocation = {lat: -27.470125, lng: 153.021072};
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
  allShapes = [];
  polygon1: any[] = [];
  paths1: any[] = [];
  /* map variable close */
  items: Array<any>;
  dataSourcezone: any;
  zone_data_latlng: Array<any>;
  selection = new SelectionModel<string>(true, []);
  assemblySelection = new SelectionModel<string>(true, []);
  coordinatorStatus = CoordinatorStatus;
  dataSource: CoordinatorsDataSource | null;
  displayedColumns = ["checkbox", "photo", "name", "org", "email"];
  displayedzoneColumns = ["zone_checkbox", "zone_name", "zone_description"];
  displayedassembleColumns = ["zone_checkbox", "zone_name"];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("filter") filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;
  categories: string[];
  selectedCategory: string;
  dialogRef: any;
  isAdmin = false;
  orgListener: Subscription;
  epnOrg: Organization;
  onOrgChanged: Subscription;
  epnForm: FormGroup;
  isEditPhone = false;
  localService = "919";
  coordPhone = "";
  configOrgMin = 1;
  selectedTabIndex = 0;
  obserlocation: any;
  constructor(
    private dataService: CoordinatorListService,
    private orgListService: OrganizationListService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    public ZoneDATAService: ZoneListService,
    public dialog: MatDialog,
    private router: Router,
    private zoneService: ZoneService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private afs: AngularFirestore,
  ) {
    this.authService.isAdmin.subscribe(value => {
      this.isAdmin = value;
    });
  }

  getLocationData (link) {
    return this.afs.doc(`${link}`).valueChanges();
  }
  ngOnInit(): void {
    this.categories = ["all", "active"];
    this.dataSource = new CoordinatorsDataSource(
      this.dataService,
      this.paginator,
      this.sort
    );

    this.getLocations().subscribe(a=>{
      console.log(a[0].payload.doc.id);
      this.getLocationData(`${DB_NAME.ORGAS}/${a[0].payload.doc.id}`).subscribe(res =>{
        
        this.obserlocation = res
        if(res !== null){
          this.tempLocation={lat:this.obserlocation.location.lat, lng: this.obserlocation.location.lng}
        }
        
      })      
    })
    Observable.fromEvent(this.filter.nativeElement, "keyup")
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.dataSource.filter = this.filter.nativeElement.value;
      });

    this.orgListener = this.orgListService
      .getOrganizations()
      .subscribe(data => {
        if (data.length > 0) {
          this.epnOrg = data[0];
          this.epnForm = this.createEpnForm();
          this.localService = this.epnOrg.localService;
          this.coordPhone = this.epnOrg.coordPhone;
          if (this.coordPhone != null) {
            this.processPhoneNumber(this.coordPhone);
          }
          this.configOrgMin = this.epnOrg.configOrgMin;
        } else {
          this.epnOrg = null;
          this.epnForm = this.formBuilder.group({
            id: [""],
            localService: [""],
            coordPhone: [""],
            configOrgMin: [1]
          });
        }
      });

    /* map ngOnInit */
    this.zoneService.pageType = "";
    this.route.queryParams.subscribe(params => {
      let type = params["type"];
      this.onEmergencyChanged = this.zoneService.onEmergencyChanged.subscribe(
        emergency => {
          if (emergency) {
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
                  // this.initMarker();

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

      this.serviceUserListSubscription = this.zoneService.onUserListChanged.subscribe(
        (userList: any[]) => {
          if (this.zone.type == "") {
            return;
          }
          if (this.zone.type == "AREA") {
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

            // this.initMarker();
          }
        }
      );

      this.getOrgnizationDetails();

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
            // this.initMarker();
          }
        }
      );
    });
  }

  centerChange(event)
  {    
    this.tempLocation = {lat: event.lat, lng: event.lng}
  }

  zoomChange(event)
  {
    this.mapZoom = event
  }

  // ZONE AREA HAS STARTED
  getOrgnizationDetails() {
    this.serviceOrgSubscription = this.zoneService
      .getOrganization()
      .subscribe(orgList => {
        this.orgList = orgList;
        this.getData(orgList[0].id);
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
  }

  applyFilter(filterValue: string) {
    this.dataSourcezone.filter = filterValue.trim().toLowerCase();
  }

  getData(orgID) {
    this.ZoneDATAService.getZone().subscribe(result => {
      const x = result.map(item => {
        return {
          orgId: item["orgId"],
          zone_description: item["zone_description"],
          zone_name: item["zone_name"],
          area: item["area"],
          active: item["active"],
          zone_id: item["zone_id"]
        };
      });
      if (!this.isAdmin) {
        const y = [];
        x.forEach(item => {
          if (item["orgId"] === orgID) {
            y.push(item);
          }
        });
        this.tableFunction(y);
      } else {
        this.displayedzoneColumns = [
          "zone_checkbox",
          "zone_name",
          "zone_description",
          "organization"
        ];
        this.tableFunction(x);
      }
    });
  }

  tableFunction(result) {
    this.items = result.sort(function(a, b) {
      return a["zone_name"].localeCompare(b["zone_name"]);
    });
    this.dataSourcezone = new MatTableDataSource(this.items);
    this.dataSourcezone.paginator = this.paginator;
  }

  // ZONE AREA CLOSE

  viewDetails(item) {
    this.router.navigate(["/details/" + item.payload.doc.id]);
  }

  ngOnDestroy() {
    this.orgListener.unsubscribe();
    // this.onOrgChanged.unsubscribe();
  }

  createEpnForm() {
    return this.formBuilder.group({
      id: [this.epnOrg.id],
      localService: [this.epnOrg.localService],
      coordPhone: [this.epnOrg.coordPhone],
      configOrgMin: [this.epnOrg.configOrgMin]
    });
  }

  filterByCategory(category: string): void {
    this.dataSource.category = this.selectedCategory = category;

    setTimeout(() => {
      if (
        !this.dataSource.filteredData ||
        !this.dataSource.filteredData.length
      ) {
        this.selection.clear();
      }
    });
  }

  isAllSelected(): boolean {
    // const x = this.dataSource.filteredData;
    const x = this.items;
    if (!x) {
      return false;
    }
    if (this.selection.isEmpty()) {
      return false;
    }
    if (this.filter.nativeElement.value) {
      return this.selection.selected.length === x.length;
    } else {
      return this.selection.selected.length === x.length;
    }
  }

  isAssemblyAllSelected(): boolean {
    // const x = this.dataSource.filteredData;
    const x = this.items;
    if (!x) {
      return false;
    }
    if (this.assemblySelection.isEmpty()) {
      return false;
    }
    if (this.filter.nativeElement.value) {
      return this.assemblySelection.selected.length === x.length;
    } else {
      return this.assemblySelection.selected.length === x.length;
    }
  }



  onZoneCheck(zone) {
    zone.checked();
    this.selection.isSelected(zone);
  }

  goToZone(z) {
    // if(z){
    //     this.ZoneDATAService.sendZoneData(z)
    //     this.router.navigateByUrl("/coordinators/add_zone")
    // }
  }

  masterToggle() {
    // const x = this.dataSource.filteredData;
    const x = this.items;
    if (!this.dataSource) {
      return;
    }
    if (this.isAllSelected()) {
      x.forEach(res => this.onChange(res, res.zone_id));
      this.selection.clear();
    } else if (this.filter.nativeElement.value) {
      x.forEach(data => {
        this.onChange(data, data.zone_id);
        this.selection.select(data);
      });
    } else {
      x.forEach(data => {
        this.onChange(data, data.zone_id);
        this.selection.select(data);
      });
    }
  }

  unBlockSelected() {}

  deleteSelected() {
    this.selection.selected.forEach(user => {
      this.initPolygondelete(user["zone_id"]);
      this.dataService.deleteCoordinator(user).then(res => {
        this.selection.clear();
        this.snackBar.open("Operation completed.", null, { duration: 500 });
      });
    });
  }

  onSendMessage(user): void {}

  toggleStar(userId): void {}

  onSave(): void {
    if (this.localService === "") {
      alert("Please Input Services Phone Number");
      return;
    }

    if (!this.isValidPhone) {
      alert("Please Input Coordinator Phone Number correctly.");
      return;
    }
    // this.epnOrg
    this.epnOrg.coordPhone = this.coordPhone;
    this.epnOrg.localService = this.localService;
    this.epnOrg.configOrgMin = this.configOrgMin;
    this.orgListService.saveOrg(this.epnOrg).then(() => {
      // Show the success message
      this.snackBar.open("Emergency Numbers Saved", "OK", {
        verticalPosition: "top",
        duration: 2000
      });
    });
  }

  getLocations(): Observable<any> {
    let curUser = firebase.auth().currentUser;
    
        
          return this.afs
            .collection(`${DB_NAME.ORGAS}`
            , ref =>
              ref
                .where("ownerId", "==", curUser.uid)
               
            )
            .snapshotChanges();
       
 
  }

  onSaveLocation(): void {
    console.log(this.tempLocation)
    console.log(this.authService.firebaseUser.uid)
    const id = this.authService.firebaseUser.uid
    console.log(`${DB_NAME.ORGAS}/${id}/location`)
   
    this.getLocations().subscribe(a=>{
      console.log(a[0].payload.doc.id);
      this.afs
        .doc(`${DB_NAME.ORGAS}/${a[0].payload.doc.id}`)
        
        .update({location:{...this.tempLocation, addr:'', name:''}})
        .then(res=>{
          this.snackBar.open("Location Saved", "OK", {
            verticalPosition: "top",
            duration: 2000
          });
        })
        .catch(res=>{
          this.snackBar.open("Location Saved", "OK", {
            verticalPosition: "top",
            duration: 2000
          });
        })
    })

    
     
    // console.log(organizationId)
  }


  onLinkClick(event: MatTabChangeEvent): void {
    this.selectedTabIndex = event.index;
  }

  get isValidPhone(): boolean {
    if (this.coordPhone != null) {
      const number = this.coordPhone.replace(/ /g, "");
      const p_number = "+" + number;
      return isValidNumber(p_number);
    } else {
      return false;
    }
  }

  onLocalPhoneChange(event: any): void {
    const number = event.target.value.replace(/ /g, "");
    this.localService = number;
  }

  onPhoneChange(event: any): void {
    const number = event.target.value.replace(/ /g, "");
    const p_number = "+" + number;
    this.processPhoneNumber(number);
  }

  onConfigOrgChange(event: any): void {
    const number = event.target.value.replace(/ /g, "");
    this.configOrgMin = number;
  }

  processPhoneNumber(p_number): void {
    const asYouType = new AsYouType().input(p_number);
    const num = asYouType.replace(/[+]/g, "");
    this.epnForm.controls["coordPhone"].setValue(num);
    this.coordPhone = p_number;
    if (isValidNumber(p_number)) {
    }
  }

  /* map start */
  onChange(item, zoneid) {
    item.checked = !item.checked;
    this.selection.toggle(item);
    this.items.forEach(user => {
      if (item.checked) {
        if (zoneid == user.zone_id) {
          this.initMap();
          this.initPolygon(zoneid);
          this.clearMarkers();
          this.clearUserRoutesArray();
        }
      } else {
        if (zoneid == user.zone_id) {
          this.initMap();
          this.initPolygondelete(zoneid);
          this.clearMarkers();
          this.clearUserRoutesArray();
        }
      }
    });
  }

  onAssemblyChange(item, zoneid) {
    item.checked = !item.checked;
    this.selection.toggle(item);
    this.items.forEach(user => {
      if (item.checked) {
        if (zoneid == user.zone_id) {
          this.initMap();
          this.initPolygon(zoneid);
          this.clearMarkers();
          this.clearUserRoutesArray();
        }
      } else {
        if (zoneid == user.zone_id) {
          this.initMap();
          this.initPolygondelete(zoneid);
          this.clearMarkers();
          this.clearUserRoutesArray();
        }
      }
    });
  }

  initPolygon(event) {
    var fillColor = "#cc3300"; // '#FF0000'
    var strokeColor = "#cc3300"; //'#FF0000'

    var polyOptions = {
      fillColor: fillColor,
      strokeColor: strokeColor,
      strokeWeight: 0,
      fillOpacity: 0.45,
      editable: true
    };

    this.items.forEach(user => {
      if (event == user.zone_id) {
        if (user.area.length > 2) {
          this.paths = user.area;
          this.polygon = new google.maps.Polygon({
            paths: this.paths,
            strokeColor: strokeColor,
            strokeOpacity: 0.8,
            strokeWeight: 3,
            fillColor: fillColor,
            fillOpacity: 0.35,
            editable: true,
            data: user.zone_id
          });

          this.polygon1.push(this.polygon);
          // this.paths1.push(user.zone_id);
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
      }
    });
  }

  initPolygondelete(event) {
    var fillColor = "#cc3300"; // '#FF0000'
    var strokeColor = "#cc3300"; //'#FF0000'

    var polyOptions = {
      fillColor: fillColor,
      strokeColor: strokeColor,
      strokeWeight: 0,
      fillOpacity: 0.45,
      editable: true
    };
    
    this.items.forEach(user => {
      
      if (event == user.zone_id) {
        // alert(event);
        if (user.area.length > 2) {
          this.paths = user.area;

          // if (this.polygon != null) {
          //     this.polygon.setMap(null);
          //     this.polygon = null;

          // }
          // this.polygon.setMap(null);

          this.polygon1.forEach(poly => {
            if (poly.data == user.zone_id) {
              poly.setMap(null);
            }
          });

          // // Create the bounds object
          // var bounds = new google.maps.LatLngBounds();

          // // Get paths from polygon and set event listeners for each path separately
          // this.polygon.getPath().forEach(function (path, index) {
          //     bounds.extend(path);
          // });

          // // Fit Polygon path bounds
          // this.map.fitBounds(bounds);

          // google.maps.event.addListener(this.polygon.getPath(), 'set_at', (event) => {
          //     this.updatePolygonPath(this.polygon.getPath());
          // });

          // google.maps.event.addListener(this.polygon.getPath(), 'insert_at', (event) => {
          //     this.updatePolygonPath(this.polygon.getPath());
          // });

          // google.maps.event.addListener(this.polygon.getPath(), 'insert_at', (event) => {
          //     this.updatePolygonPath(this.polygon.getPath());
          // });
        }
      }
    });
  }

  updatePolygonPath(path) {
    this.paths = [];
    for (var i = 0; i < path.getArray().length; i++) {
      let pt = path.getArray()[i];
      let point = {
        lat: pt.lat(),
        lng: pt.lng()
      };
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
    if (this.pageType == "new") {
      this.mapCenter = this.selectedOrg.location;
      if (this.map) {
        this.map.setCenter(
          new google.maps.LatLng(this.mapCenter.lat, this.mapCenter.lng)
        );
      }
    } else {
      if (this.zone.type == "USERS") {
        this.mapCenter = this.selectedOrg.location;
        if (this.map) {
          this.map.setCenter(
            new google.maps.LatLng(this.mapCenter.lat, this.mapCenter.lng)
          );
        }
      }
    }
  }

  initMap() {
    if (this.map != null) return;
    var latlng = new google.maps.LatLng(this.mapCenter.lat, this.mapCenter.lng);
    if (document.getElementById("mapView")) {
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
  }

  ngAfterViewInit() {
    this.markersArray = [];
    this.userRoutesArray = [];
    this.processRoutesCount = 0;
    MapLoaderService.load().then(() => {});
  }

  onSelectType() {
    // this.initPolygon();
    this.clearMarkers();
    this.clearUserRoutesArray();
    // this.initMarker();
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

          if (this.isAdmin) {
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
    lng;
  }

  checkValidation(): boolean {
    if (this.zone.type == "ZONE") {
      if (this.paths.length < 3) {
        alert("Please select emergency area.");
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
    const data = this.epnForm.getRawValue();
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

        this.router.navigate(["emergencies/" + this.zone.zone_id]);

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
}

export class CoordinatorsDataSource extends DataSource<any> {
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
    private _dataService: CoordinatorListService,
    private _paginator: MatPaginator,
    private _sort: MatSort
  ) {
    super();
  }

  connect(): Observable<any[]> {
    const displayDataChanges = [
      this._paginator.page,
      this._filterChange,
      this._sort.sortChange,
      this._categoryChange
    ];

    return Observable.merge(...displayDataChanges).pipe(
      switchMap(() => {
        return this._dataService.getCoordinators().pipe(
          switchMap(data => {
            data = this.filterDataByCategory(data, this.category);

            data = this.filterData(data);

            this.filteredData = [...data];

            data = this.sortData(data);

            const startIndex =
              this._paginator.pageIndex * this._paginator.pageSize;
            return of(data.splice(startIndex, this._paginator.pageSize));
          })
        );
      })
    );
  }

  filterData(data) {
    if (!this.filter) {
      return data;
    }
    const arr = [];
    data.forEach(element => {
      if (FuseUtils.searchInString(element.name, this.filter)) {
        arr.push(element);
      }
    });

    return arr;

    //   return FuseUtils.filterArrayByString(data, this.filter);
  }

  filterDataByCategory(data: any[], category: string): any[] {
    if (!this.category || this.category === "all") {
      return data;
    }

    return data.filter(item => item.appliedLoan === true);
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
        case "email":
          [propertyA, propertyB] = [a.email, b.email];
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
