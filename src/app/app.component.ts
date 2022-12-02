import { Component, OnDestroy, OnInit } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { FuseConfigService } from "@fuse/services/config.service";
import { FuseNavigationService } from "@fuse/components/navigation/navigation.service";
import { FuseSidebarService } from "@fuse/components/sidebar/sidebar.service";
import { FuseSplashScreenService } from "@fuse/services/splash-screen.service";
import { FuseTranslationLoaderService } from "@fuse/services/translation-loader.service";

import { navigation_admin } from "app/navigation/navigation-admin";
import { navigation_coord } from "app/navigation/navigation-coord";

import { locale as navigationEnglish } from "app/navigation/i18n/en";
import { locale as navigationTurkish } from "app/navigation/i18n/tr";
import { AuthService } from "./main/content/auth/auth.service";

@Component({
  selector: "app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit, OnDestroy {
  navigation: any;
  fuseConfig: any;

  // Private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {FuseConfigService} _fuseConfigService
   * @param {FuseNavigationService} _fuseNavigationService
   * @param {FuseSidebarService} _fuseSidebarService
   * @param {FuseSplashScreenService} _fuseSplashScreenService
   * @param {FuseTranslationLoaderService} _fuseTranslationLoaderService
   * @param {TranslateService} _translateService
   */
  constructor(
    private _fuseConfigService: FuseConfigService,
    private _fuseNavigationService: FuseNavigationService,
    private _fuseSidebarService: FuseSidebarService,
    private _fuseSplashScreenService: FuseSplashScreenService,
    private _fuseTranslationLoaderService: FuseTranslationLoaderService,
    private _translateService: TranslateService,
    private _authService: AuthService
  ) {
    // Get default navigation
    // this.navigation = navigation;

    // Register the navigation to the service
    // this._fuseNavigationService.register('main', this.navigation);

    // Set the main navigation as our current navigation
    // this._fuseNavigationService.setCurrentNavigation('main');

    // Add languages
    this._translateService.addLangs(["en", "tr"]);

    // Set the default language
    this._translateService.setDefaultLang("en");

    // Set the navigation translations
    this._fuseTranslationLoaderService.loadTranslations(
      navigationEnglish,
      navigationTurkish
    );

    // Use a language
    this._translateService.use("en");

    // Set the private defaults
    this._unsubscribeAll = new Subject();

    // Custom Navigation Items
    this._authService.isAdmin.subscribe(result => {
      if (result) {
        this.navigation = navigation_admin;
      } else {
        this.navigation = navigation_coord;
      }

      this._fuseNavigationService.unregister("main");
      this._fuseNavigationService.register("main", this.navigation);
      this._fuseNavigationService.setCurrentNavigation("main");
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Subscribe to config changes
    this._fuseConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(config => {
        this.fuseConfig = config;
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
}
