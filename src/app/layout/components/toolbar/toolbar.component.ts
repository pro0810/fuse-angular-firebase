import { Component, OnDestroy, OnInit } from "@angular/core";
import { NavigationEnd, NavigationStart, Router } from "@angular/router";
import { Subject } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";
import { TranslateService } from "@ngx-translate/core";
import * as _ from "lodash";

import { FuseConfigService } from "@fuse/services/config.service";
import { FuseSidebarService } from "@fuse/components/sidebar/sidebar.service";

import { navigation_admin } from "app/navigation/navigation-admin";
import { AuthService } from "../../../main/content/auth/auth.service";

import { MatDialog, MatDialogRef } from "@angular/material";
import { ProfileFormComponent } from "./profile-form/profile-form.component";

import * as firebase from "firebase";
import { DB_NAME } from "../../../app.constants";
import { Coordinator } from "../../../main/content/coordinator/coordinator.model";

@Component({
  selector: "toolbar",
  templateUrl: "./toolbar.component.html",
  styleUrls: ["./toolbar.component.scss"]
})
export class ToolbarComponent implements OnInit, OnDestroy {
  horizontalNavbar: boolean;
  rightNavbar: boolean;
  hiddenNavbar: boolean;
  languages: any;
  navigation: any;
  selectedLanguage: any;
  showLoadingBar: boolean;
  userStatusOptions: any[];

  currentUser: any;
  account: Coordinator;
  isAdmin: boolean = false;

  // Private
  private _unsubscribeAll: Subject<any>;

  dialogRef: any;

  /**
   * Constructor
   *
   * @param {FuseConfigService} _fuseConfigService
   * @param {FuseSidebarService} _fuseSidebarService
   * @param {Router} _router
   * @param {TranslateService} _translateService
   */
  constructor(
    private _fuseConfigService: FuseConfigService,
    private _fuseSidebarService: FuseSidebarService,
    private _router: Router,
    private _translateService: TranslateService,
    private authService: AuthService,
    public _matDialog: MatDialog
  ) {
    // Set the defaults
    this.userStatusOptions = [
      {
        title: "Online",
        icon: "icon-checkbox-marked-circle",
        color: "#4CAF50"
      },
      {
        title: "Away",
        icon: "icon-clock",
        color: "#FFC107"
      },
      {
        title: "Do not Disturb",
        icon: "icon-minus-circle",
        color: "#F44336"
      },
      {
        title: "Invisible",
        icon: "icon-checkbox-blank-circle-outline",
        color: "#BDBDBD"
      },
      {
        title: "Offline",
        icon: "icon-checkbox-blank-circle-outline",
        color: "#616161"
      }
    ];

    this.languages = [
      {
        id: "en",
        title: "English",
        flag: "us"
      },
      {
        id: "tr",
        title: "Turkish",
        flag: "tr"
      }
    ];

    this.navigation = navigation_admin;

    // Set the private defaults
    this._unsubscribeAll = new Subject();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Subscribe to the router events to show/hide the loading bar
    this._router.events
      .pipe(
        filter(event => event instanceof NavigationStart),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe(event => {
        this.showLoadingBar = true;
      });

    this._router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        this.showLoadingBar = false;
      });

    // Subscribe to the config changes
    this._fuseConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(settings => {
        this.horizontalNavbar = settings.layout.navbar.position === "top";
        this.rightNavbar = settings.layout.navbar.position === "right";
        this.hiddenNavbar = settings.layout.navbar.hidden === true;
      });

    // Set the selected language from default languages
    this.selectedLanguage = _.find(this.languages, {
      id: this._translateService.currentLang
    });

    this.authService.isAdmin.subscribe(value => {
      this.isAdmin = value;
    });

    this.authService.currentUser.subscribe(data => {
      this.currentUser = data;
      if (this.currentUser == null || this.currentUser.uid == null) {
        return;
      }
      const db = firebase.firestore();
      const docRef = db
        .collection(`${DB_NAME.COORS}`)
        .doc(this.currentUser.uid);
      docRef
        .get()
        .then(doc => {
          if (doc.exists) {
            this.account = new Coordinator(doc.data());
          } else {
            // doc.data() will be undefined in this case
          }
        })
        .catch(function(error) {});
    });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Toggle sidebar open
   *
   * @param key
   */
  toggleSidebarOpen(key): void {
    this._fuseSidebarService.getSidebar(key).toggleOpen();
  }

  /**
   * Search
   *
   * @param value
   */
  search(value): void {
    // Do your search here...
  }

  /**
   * Set the language
   *
   * @param langId
   */
  setLanguage(langId): void {
    // Set the selected language for toolbar
    this.selectedLanguage = _.find(this.languages, { id: langId });

    // Use the selected language for translations
    this._translateService.use(langId);
  }

  signOut() {
    this.authService.signOut().then(() => {
      this._router.navigate(["/login"]);
    });
  }

  onProfile() {
    this.dialogRef = this._matDialog.open(ProfileFormComponent, {
      panelClass: "contact-form-dialog",
      data: {
        account: this.account,
        action: "edit"
      }
    });

    this.dialogRef.afterClosed().subscribe(response => {
      if (!response) {
        return;
      }
      const actionType: string = response[0];
      // const formData: FormGroup = response[1];
      switch (actionType) {
        case "save":
          break;
        case "delete":
          break;
      }
    });
  }
}
