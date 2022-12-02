import { Component, OnInit, ViewEncapsulation, Input, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { UserService } from '../user.service';

import { parse, format, AsYouType, isValidNumber, parseNumber } from 'libphonenumber-js';
import { MatSnackBar } from '@angular/material';
import { User } from '../user.model';
import { Subscription } from 'rxjs/Subscription';
import { EmergencyService } from '../../emergency/emergency.service';

@Component({
  selector: 'app-bulk-user',
  templateUrl: './bulk-user.component.html',
  styleUrls: ['./bulk-user.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations   : fuseAnimations
})
export class BulkUserComponent implements OnInit, OnDestroy {

  constructor(
    private userService: UserService, 
    private emergencyService: EmergencyService,
    public snackBar: MatSnackBar) { 

    }

  userlist: any[] = [];
  
  fileSelectionError: string;
  fileSelected: any;
  
  isProcessing = false;
  
  // @Input() selectedOrg : any;

  serviceOrgSubscription: Subscription;

  @Input() orgId: string;
  // ---- admin
  orgList: any[] = [];
  selectedOrg: any;
  isAdmin: any;
  // ---- admin

  @ViewChild('myInput')
  myInputVariable: ElementRef;

  ngOnInit() {

    this.serviceOrgSubscription = this.emergencyService.getOrganization().subscribe(orgList => {
      this.orgList = orgList;
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
  }

  ngOnDestroy()
  {
    if (this.serviceOrgSubscription) { this.serviceOrgSubscription.unsubscribe(); }
  }

  onFileChange(event) {
    const reader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (file.type === '.csv' || 
            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.type === 'application/vnd.ms-excel') {
          this.fileSelectionError = null;
          this.fileSelected = file;
          this.preProcessingFile(file);
        } else {
          this.fileSelected = null;
          this.fileSelectionError = 'Error: The .csv file did not import correctly. Please ensure the data is in the correct format.'
        }

        this.userService.onFileAttached.next(this.fileSelected);
      };
    }
  }

  preProcessingFile(file)
  {
    this.isProcessing = true;
    const fileReader = new FileReader();
    fileReader.onload = ((fileLoadedEvent: any) => {
      this.userlist = [];
      const textFromFileLoaded = fileLoadedEvent.target.result;
      const array = textFromFileLoaded.replace(/(\r\n|\n|\r)/gm, '\n').split('\n');
      array.map(element => {
        const data = element.split(',');
        const name = data[0];
        const phone = data[1];
        const userData = {name: name, phone: phone, isValid: false};
        if (name && phone) {
          if (isValidNumber(phone)) { userData.isValid = true; }
          this.userlist.push(userData);
        }
      });
  
      this.isProcessing = false;
    });

    fileReader.readAsText(file, 'UTF-8');

  }

  isValidPhone(phoneNumber) {
    if (phoneNumber != null) {
        return isValidNumber(phoneNumber);
    } else {
        return false;
    }
  }

  onUpload()
  {
    if (this.selectedOrg == null) {
      alert('You must belong to an organization!');
      return;
    }

    
    this.addUser(0);
  }

  resetFile()
  {
    this.myInputVariable.nativeElement.value = '';
    this.fileSelected = null;
    this.userService.onFileAttached.next(this.fileSelected);
  }

  addUser(index)
  {
    this.isProcessing = true;
    if (index < this.userlist.length) {
      const user = this.userlist[index];
      if (!user.isValid) {
        this.addUser(index + 1);
      } 
      else 
      {
        const org_max_size = this.selectedOrg.max_size;
        this.userService.getUsersBelongsTo(this.selectedOrg.id).then(list => {
          if (list.length >= org_max_size) {
              this.isProcessing = false;
              alert('You have reached the maximum number of users allocated to your RapidAssist account. Please contact Llamagard to allow additional users to be created.');
          } else {
              this.userService.checkExistingUser(user.phone).then(users => {
                  if (users.length > 0) {
                    const content = `The User (${user.phone}) already exists.`;
                    alert(content);
                    user.uploadStatus = 2;
                    this.addUser(index + 1);
                  } else {
                    const newUser = new User(user);
                    newUser.id = this.userService.newId;
                    newUser.belongsTo = this.selectedOrg.id;
                    this.userService.addUser(newUser)
                        .then(() => {
                          user.uploadStatus = 1;
                          this.snackBar.open('User upload successful', 'OK', {
                            verticalPosition: 'top',
                            duration        : 500
                          });
                          this.addUser(index + 1);
                        });
                  }
              });
          }
        });
      }
      
    }
    else
    {
      // Show the success message
      this.snackBar.open('User uploading completed', 'OK', {
        verticalPosition: 'top',
        duration        : 1000
      });

      this.isProcessing = false;

      this.resetFile();
    }

  }

  onSelectOrg(): void {
      
  }
}
