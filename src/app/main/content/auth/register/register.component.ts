import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { FuseConfigService } from '@fuse/services/config.service';
import { fuseAnimations } from '@fuse/animations';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { OrganizationListService } from '../../organizations/organization-list.service';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material';
import { PrivacyDialogComponent } from './privacy/privacy.component';
import { privacy } from './privacy/privacy';
import { LocationDialogComponent } from './location/location.component';
import { database } from 'firebase';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  animations : fuseAnimations
})
export class RegisterComponent implements OnInit, OnDestroy{
  registerForm: FormGroup;
  registerFormErrors: any;

  orgList: any[] = [];
  selectedOrg : any;

  defaultLocation : any = {lat: -27.470125, lng: 153.021072};
  defaultMapZoom  : number = 15.0;

  isAcceptedTerms : boolean = false;

  registerSubscription : Subscription

  constructor(
      private fuseConfigService: FuseConfigService,
      private formBuilder: FormBuilder,
      private authService: AuthService,
      private router: Router,
      private _matDialog: MatDialog,
      private http: HttpClient
  )
  {
      // Configure the layout
      this.fuseConfigService.config = {
        layout: {
            navbar : {
                hidden: true
            },
            toolbar: {
                hidden: true
            },
            footer : {
                hidden: true
            }
        }
    };

      this.registerFormErrors = {
          orgName        : {},
          name           : {},
          email          : {},
          password       : {},
          passwordConfirm: {}
      };
  }

  ngOnInit()
  {
      this.registerForm = this.formBuilder.group({
          orgName        : ['', Validators.required],
          name           : ['', Validators.required],
          email          : ['', [Validators.required, Validators.email]],
          password       : ['', [Validators.required, Validators.minLength(6)]],
          passwordConfirm: ['', [Validators.required, confirmPassword]],
      });

      this.registerForm.valueChanges.subscribe(() => {
          this.onRegisterFormValuesChanged();
      });

  }

  ngOnDestroy()
  {
      if (this.registerSubscription) this.registerSubscription.unsubscribe();
  }

  readPrivacyPolicy()
  {
    this._matDialog.open(PrivacyDialogComponent, {
        panelClass: 'privacy-dialog',
        data      : {article: privacy}
    });
  }

  locationDialogRef: MatDialogRef<LocationDialogComponent>;
  onClickLocation()
  {
      this.locationDialogRef = this._matDialog.open(LocationDialogComponent, {
        panelClass: 'location-dialog',
        data      : {location: this.defaultLocation, mapZoom: this.defaultMapZoom}
      });

      this.locationDialogRef.afterClosed().subscribe(response => {
        if(!response) {
            return;
        }

        this.defaultLocation = response[0];
        this.defaultMapZoom  = response[1];
      });
  }

  onRegisterFormValuesChanged()
  {
      for ( const field in this.registerFormErrors )
      {
          if ( !this.registerFormErrors.hasOwnProperty(field) )
          {
              continue;
          }

          // Clear previous errors
          this.registerFormErrors[field] = {};

          // Get the control
          const control = this.registerForm.get(field);

          if ( control && control.dirty && !control.valid )
          {
              this.registerFormErrors[field] = control.errors;
          }
      }
  }

  onCheckTerms(event)
  { 
    this.isAcceptedTerms = event.checked
  }

  createWithEmailAndPassword()
  {
    if (!this.isAcceptedTerms) {
        alert('Please read our privacy policy and accept to proceed.');
    }

    const orgName = this.registerForm.value.orgName;
    const name = this.registerForm.value.name;
    const email = this.registerForm.value.email;
    const password = this.registerForm.value.password;
    this.authService.registerWithEmailAndPassword(orgName, this.defaultLocation, name, email, password).then(() => {
        let emailTemplate = `
        <!DOCTYPE html>
        <html
          lang="en"
          xmlns="http://www.w3.org/1999/xhtml"
          xmlns:v="urn:schemas-microsoft-com:vml"
          xmlns:o="urn:schemas-microsoft-com:office:office"
        >
          <head>
            <meta charset="utf-8" />
            <!-- utf-8 works for most cases -->
            <meta name="viewport" content="width=device-width" />
            <!-- Forcing initial-scale shouldn't be necessary -->
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <!-- Use the latest (edge) version of IE rendering engine -->
            <meta name="x-apple-disable-message-reformatting" />
            <!-- Disable auto-scale in iOS 10 Mail entirely -->
            <title></title>
            <!-- The title tag shows in email notifications, like Android 4.4. -->
        
            <link
              href="https://fonts.googleapis.com/css?family=Work+Sans:200,300,400,500,600,700"
              rel="stylesheet"
            />
        
            <!-- CSS Reset : BEGIN -->
            <style>
              /* What it does: Remove spaces around the email design added by some email clients. */
              /* Beware: It can remove the padding / margin and add a background color to the compose a reply window. */
              html,
              body {
                margin: 0 auto !important;
                padding: 0 !important;
                height: 100% !important;
                width: 100% !important;
        
              }
        
              /* What it does: Stops email clients resizing small text. */
              * {
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%;
              }
        
              /* What it does: Centers email on Android 4.4 */
              div[style*="margin: 16px 0"] {
                margin: 0 !important;
              }
        
              /* What it does: Stops Outlook from adding extra spacing to tables. */
              table,
              td {
                mso-table-lspace: 0pt !important;
                mso-table-rspace: 0pt !important;
              }
        
              /* What it does: Fixes webkit padding issue. */
              table {
                border-spacing: 0 !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
                margin: 0 auto !important;
              }
        
              /* What it does: Uses a better rendering method when resizing images in IE. */
              img {
                -ms-interpolation-mode: bicubic;
              }
        
            
              *[x-apple-data-detectors],  /* iOS */
        .unstyle-auto-detected-links *,
        .aBn {
                border-bottom: 0 !important;
                cursor: default !important;
                color: inherit !important;
                text-decoration: none !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
              }
        
              /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
              .a6S {
                display: none !important;
                opacity: 0.01 !important;
              }
        
              /* What it does: Prevents Gmail from changing the text color in conversation threads. */
              .im {
                color: inherit !important;
              }
        
              /* If the above doesn't work, add a .g-img class to any image in question. */
              img.g-img + div {
                display: none !important;
              }
        
              /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
              /* Create one of these media queries for each additional viewport size you'd like to fix */
        
              /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
              @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                u ~ div .email-container {
                  min-width: 320px !important;
                }
              }
              /* iPhone 6, 6S, 7, 8, and X */
              @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                u ~ div .email-container {
                  min-width: 375px !important;
                }
              }
              /* iPhone 6+, 7+, and 8+ */
              @media only screen and (min-device-width: 414px) {
                u ~ div .email-container {
                  min-width: 414px !important;
                }
              }
            </style>
        
            <!-- CSS Reset : END -->
        
            <!-- Progressive Enhancements : BEGIN -->
            <style>
              .primary {
                background: #17bebb;
              }
              .bg_white {
                background: #ffffff;
              }
              .bg_light {
                background: #f7fafa;
              }
              .bg_black {
                background: #000000;
              }
              .bg_dark {
                background: rgba(0, 0, 0, 0.8);
              }
              .email-section {
                padding: 2.5em;
              }
        
              /*BUTTON*/
              .btn {
                padding: 10px 15px;
                display: inline-block;
              }
              .btn.btn-primary {
                border-radius: 5px;
                background: #17bebb;
                color: #ffffff;
              }
              .btn.btn-white {
                border-radius: 5px;
                background: #ffffff;
                color: #000000;
              }
              .btn.btn-white-outline {
                border-radius: 5px;
                background: transparent;
                border: 1px solid #fff;
                color: #fff;
              }
              .btn.btn-black-outline {
                border-radius: 0px;
                background: transparent;
                border: 2px solid #000;
                color: #000;
                font-weight: 700;
              }
              .btn-custom {
                color: rgba(0, 0, 0, 0.3);
                text-decoration: underline;
              }
        
              h1,
              h2,
              h3,
              h4,
              h5,
              h6 {
                font-family: "Arial";
                color: #000000;
                margin-top: 0;
                font-weight: 400;
              }
        
              body {
                font-family: "Arial";
                font-weight: 400;
                font-size: 15px;
                line-height: 1.8;
                color: rgba(0, 0, 0, 0.4);
              }
        
              a {
                color: #17bebb;
              }
        
              table {
              }
              /*LOGO*/
        
              .logo h1 {
                margin: 0;
              }
              .logo h1 a {
                color: #010105;
                font-size: 25px;
                font-weight: 500;
                font-family: "Arial";
              }
        
              /*HERO*/
              .hero {
                position: relative;
                z-index: 0;
              }
        
              .hero .text {
                color: rgba(0, 0, 0, 0.3);
              }
              .hero .text h2 {
                color: #000;
                font-size: 34px;
                margin-bottom: 15px;
                font-weight: 300;
                line-height: 1.2;
              }
              .hero .text h3 {
                font-size: 24px;
                font-weight: 200;
              }
              .hero .text h2 span {
                font-weight: 600;
                color: #000;
              }
        
              /*PRODUCT*/
              .product-entry {
                display: block;
                position: relative;
                float: left;
                padding-top: 20px;
              }
              .product-entry .text {
                width: calc(100% - 125px);
                padding-left: 20px;
              }
              .product-entry .text h3 {
                margin-bottom: 0;
                padding-bottom: 0;
              }
              .product-entry .text p {
                margin-top: 0;
              }
              .product-entry img,
              .product-entry .text {
                float: left;
              }
        
              ul.social {
                padding: 0;
              }
              ul.social li {
                display: inline-block;
                margin-right: 10px;
              }
        
              /*FOOTER*/
        
              .footer {
                border-top: 1px solid rgba(0, 0, 0, 0.05);
                color: rgba(0, 0, 0, 0.5);
              }
              .footer .heading {
                color: #000;
                font-size: 20px;
              }
              .footer ul {
                margin: 0;
                padding: 0;
              }
              .footer ul li {
                list-style: none;
                margin-bottom: 10px;
              }
              .footer ul li a {
                color: rgba(0, 0, 0, 1);
              }
        
              @media screen and (max-width: 500px) {
              }
            </style>
          </head>
        
          <body
            width="100%"
            style="
              margin: 0;
              padding: 0 !important;
              mso-line-height-rule: exactly;
             
            "
          >
            <center style="width: 100%;">
              <div
                style="
                  display: none;
                  font-size: 1px;
                  max-height: 0px;
                  max-width: 0px;
                  opacity: 0;
                  overflow: hidden;
                  mso-hide: all;
                  font-family: sans-serif;
                "
              >
        
              </div>
              <div style="max-width: 800px; margin: 0 auto" class="email-container">
                <!-- BEGIN BODY -->
                <table
                  align="center"
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  width="100%"
                  style="margin: auto"
                >
                  <tr>
                    <td
                      valign="top"
                      class="bg_white"
                      style="padding: 1em 2.5em 0 2.5em"
                    >
                      <table
                        role="presentation"
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                      >
                       
                      </table>
                    </td>
                  </tr>
                  <!-- end tr -->
                  <tr>
                    <td
                      valign="middle"
                      class="hero bg_white"
                      style="padding: 2em 0 2em 0"
                    >
                      <table
                        role="presentation"
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                      >
                        <tr>
                          <td style="padding: 0 2.5em; text-align: left">
                            <div class="text">
                              <h4>Hi ${name},</h4>
                              <h4>Welcome to RapidAssist!</h4>
                              <h4>
                                
                                Thank you for registering ${orgName.trim()}, the first step in making sure everyone’s safe in an emergency.
                                <br/>
                                <br/>
                                <b>Login</b> to RapidAssist here:
                                <br/>
                                <a href="https://ecc.rapidassist.co/login">https://ecc.rapidassist.co/login</a>
                                <br/>
                                <br/>
                                You can find the <b>FastStart Guide</b> here:
                                <br/>
                                <a href="https://www.rapidassist.co/faststart">https://www.rapidassist.co/faststart</a>
                                <br/>
                                The FastStart Guide will help you to set-up everything quickly and easily.
                                <br/>
                                Here’s our technical and business support page for some of the common questions we get:
                                <br/>
                                <a href="https://www.rapidassist.co/support">https://www.rapidassist.co/support</a>
                                <br/>
                                <br/>
                                Thank you again and welcome!
                                <br/>
                                If you have any questions you can also contact me directly.
                                <br/>
                                <br/>
                                Regards,
                                <br/>
                                <b>Rob Warcup</b>
                                <br/>
                                Managing Director RapidAssist LLC
                                <br/>
                                ...........................................................................................................
                                <br/>
                                13894 S. Bangerter Parkway Suite 200 | Draper, Utah 84020, United States of America
                                <br/>
                                Office: +1 801 448 9997
                                <br/>
                                Mobile: +61 41 207 2595
                                <br/>
                                Email: rob@rapidassist.co
                                <br/>
                                Web: www.rapidassist.co
                                <br/>
                                ...........................................................................................................
                                <br/>
                                Locate, track and help your people in an emergency or crisis
                              </h4>
                              <img src="https://trello-attachments.s3.amazonaws.com/5c6f8237e4363770200b4ba2/5ca185e204687776b4c65e34/dbaa7ee63927fe2c066d879049c55a4c/RapidAssist_logo_%5Bp%5D.jpg" width="200px" height="60px"/>
                             
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- end tr -->
                </table>
              </div>
            </center>
          </body>
        </html>
        `
        let headers = new HttpHeaders({
            "Content-Type": "application/x-www-form-urlencoded",
            "Access-Control-Allow-Origin": "*"
          });
          let body = new URLSearchParams();
                  body.set("email", email);
                  body.set("subject", "Welcome to RapidAssist!" );
                  body.set("emailBody", emailTemplate);
                  this.http
                  .post("https://us-central1-ruok-8ea00.cloudfunctions.net/sendMailOverHTTP", body.toString(), { headers: headers})
                  .toPromise()
                  .then(res => {
                    console.log(res);
                    // this.snackBar.open("Email sent", "OK", {
                    //   verticalPosition: "top",
                    //   duration: 2000
                    // });
                  })
                  
                  .catch(err => {
                    console.log(err);
                    // this.snackBar.open("SMS failed", "ERROR", {
                    //   verticalPosition: "top",
                    //   duration: 2000
                    // });
                  });
      this.goHome();
    }, (error) => {
        alert(error);
    });
  }

    private goHome(){
        this.registerSubscription = this.authService.checkPermission.subscribe(hasPermission => {
            if (hasPermission) {
                this.router.navigate(['/']);
            } else {
                // alert('You are not allowed as admin yet.');
            }
        })
    }

    convertDMS(lat, lng) {
        var latitude = this.toDegreesMinutesAndSeconds(lat);
        var latitudeCardinal = Math.sign(lat) >= 0 ? "N" : "S";
    
        var longitude = this.toDegreesMinutesAndSeconds(lng);
        var longitudeCardinal = Math.sign(lng) >= 0 ? "E" : "W";
    
        return latitude + " " + latitudeCardinal + " " + longitude + " " + longitudeCardinal;
    }

    toDegreesMinutesAndSeconds(coordinate) {
        var absolute = Math.abs(coordinate);
        var degrees = Math.floor(absolute);
        var minutesNotTruncated = (absolute - degrees) * 60;
        var minutes = Math.floor(minutesNotTruncated);
        var seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    
        return degrees + "°" + minutes + "'" + seconds + '"';
    }
}

function confirmPassword(control: AbstractControl)
{
  if ( !control.parent || !control )
  {
      return;
  }

  const password = control.parent.get('password');
  const passwordConfirm = control.parent.get('passwordConfirm');

  if ( !password || !passwordConfirm )
  {
      return;
  }

  if ( passwordConfirm.value === '' )
  {
      return;
  }

  if ( password.value !== passwordConfirm.value )
  {
      return {
          passwordsNotMatch: true
      };
  }
}
