
import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup} from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { fuseAnimations } from '@fuse/animations';
import { Organization } from './organization.model';
import { OrganizationService } from './organization.service';
import { Location } from '@angular/common';

import {MatSnackBar, MatTabChangeEvent } from '@angular/material';

import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';
import { AuthService } from '../auth/auth.service';
import { isValidNumber, AsYouType } from 'libphonenumber-js';

@Component({
  selector: 'app-organization',
  templateUrl: './organization.component.html',
  styleUrls: ['./organization.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations   : fuseAnimations
})
export class OrganizationComponent implements OnInit, OnDestroy {

  org: Organization;
  onOrgChanged: Subscription;
  pageType: string;
  orgForm: FormGroup;

  map: any;
  mapCenter: any = {lat: -27.47094905, 
                    lng: 153.0545816};
  mapZoom = 15;

  selectedTabIndex = 0;

  isAdmin = false;
  selectedMaxMem = 5;

  localService = '919';
  coordPhone = '';
  configOrgMin = 1;

  get isValidPhone(): boolean {
    if (this.coordPhone != null) {
        const number = this.coordPhone.replace(/ /g, '');
        const p_number = '+' + number;
        return isValidNumber(p_number);
    } else {
        return false;
    }
  }

  constructor(
      private orgService: OrganizationService,
      private formBuilder: FormBuilder,
      public snackBar: MatSnackBar,
      private location: Location,
      private authService: AuthService
  )
  {
    this.authService.isAdmin.subscribe(value => {
        this.isAdmin = value;
    });
  }

  ngOnInit()
  {
      // Subscribe to update product on changes
        this.onOrgChanged =
            this.orgService.onOrgChanged
                .subscribe(org => {

                    if ( org )
                    {
                        this.org = new Organization(org);
                        this.pageType = 'edit';
                    }
                    else
                    {
                        this.pageType = 'new';
                        this.org = new Organization();
                    }

                    if (this.org.location.lat === 0) {
                        this.org.location.lat = this.mapCenter.lat;
                    }
                    if (this.org.location.lng === 0) {
                        this.org.location.lng = this.mapCenter.lng;
                    }
                    this.orgForm = this.createOrgForm();

                    this.selectedMaxMem = this.org.max_size;

                    this.localService = this.org.localService;
                    this.coordPhone = this.org.coordPhone;
                    this.configOrgMin = this.org.configOrgMin;
                    if (this.coordPhone != null) {
                        this.processPhoneNumber(this.coordPhone);
                    }
              });
  }

  ngOnDestroy()
  {
      this.onOrgChanged.unsubscribe();
  }

  mapClick(event): void {
      const coords = event.coords;
      this.org.location.lat = coords.lat;
      this.org.location.lng = coords.lng;
      this.orgForm.controls.location_lat.setValue(this.org.location.lat);
      this.orgForm.controls.location_lng.setValue(this.org.location.lng);
  }
  createOrgForm(): FormGroup
  {
      return this.formBuilder.group({
          id              : [this.org.id],
          name            : [this.org.name],
          ownerId         : [this.org.ownerId],
          description     : [this.org.description],
          coordinators    : [this.org.coordinators],
          users           : [this.org.users],
          mem_size        : [this.org.mem_size],
          max_size        : [this.org.max_size],
          location_name   : [this.org.location.name],
          location_addr   : [this.org.location.addr],
          location_lat    : [this.org.location.lat],
          location_lng    : [this.org.location.lng],
          active          : [this.org.active],
          localService    : [this.org.localService],
          coordPhone      : [this.org.coordPhone],
          configOrgMin    : [this.org.configOrgMin]
      });
  }

  saveOrg(): void
  {
    if (this.selectedMaxMem > this.org.max_size && !this.isAdmin) {
        alert('Please contact Llamagard to add more than the Maximum Number of User Accounts Permitted.');
        return;
    }

    if (this.localService === '') {
        alert('Please Input Services Phone Number');
        return;
    }

    if (!this.isValidPhone) {
        alert('Please Input Coordinator Phone Number correctly');
        return;
    }

    const data = this.orgForm.getRawValue();
    this.org.updateData(data);
    this.org.coordPhone = this.coordPhone;
    this.org.configOrgMin = this.configOrgMin;
    this.orgService.saveOrg(this.org)
        .then(() => {

            // Trigger the subscription with new data
            this.orgService.onOrgChanged.next(this.org);

            // Show the success message
            this.snackBar.open('Organization saved', 'OK', {
                verticalPosition: 'top',
                duration        : 2000
            });
        });
  }

  addOrg(): void
  {
    if (this.selectedMaxMem > this.org.max_size && !this.isAdmin) {
        alert('You have reached the maximum number of users allocated to your RapidAssist account. Please contact Llamagard to allow additional users to be created.');
        return;
    }

    if (this.localService === '') {
        alert('Please Input Services Phone Number');
        return;
    }

    if (!this.isValidPhone) {
        alert('Please Input Coordinator Phone Number correctly');
        return;
    }

    const data = this.orgForm.getRawValue();
    this.org.updateData(data);
    this.org.id = this.orgService.newId;
    this.org.coordPhone = this.coordPhone;
    this.org.configOrgMin = this.configOrgMin;
    this.orgService.addOrg(this.org)
        .then(() => {

            // Trigger the subscription with new data
            this.orgService.onOrgChanged.next(this.org);

            // Show the success message
            this.snackBar.open('Organization added', 'OK', {
                verticalPosition: 'top',
                duration        : 2000
            });

            // Change the location with new one
            this.location.go('orgs/' + this.org.id);
        });
  }

  onLinkClick(event: MatTabChangeEvent): void {
    this.selectedTabIndex = event.index;
  }

  onMaxSizeChange(value): void {
    this.selectedMaxMem = value;
  }

  contact(): void {
    window.location.href = 'mailto:rwarcup@hotmail.com?subject=Subject&body=message%20goes%20here';
  }

  onLocalPhoneChange(event: any): void {
    const number = event.target.value.replace(/ /g, '');
    this.localService = number;
  }

  onPhoneChange(event: any): void {
    const number = event.target.value.replace(/ /g, '');
    const p_number = '+' + number;
    this.processPhoneNumber(number);
  }

  processPhoneNumber(p_number): void {
      const asYouType = new AsYouType().input(p_number);
      const num = asYouType.replace(/[+]/g, '');
      this.orgForm.controls['coordPhone'].setValue(num);
      
      this.coordPhone = p_number;
      if (isValidNumber(p_number)) {
      } 
  }


  onConfigOrgChange(event: any): void {
    const number = event.target.value.replace(/ /g, '');
    this.configOrgMin = number;
  }

}
