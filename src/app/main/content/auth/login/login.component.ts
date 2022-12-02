import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { FuseConfigService } from "@fuse/services/config.service";
import { fuseAnimations } from "@fuse/animations";
import { AuthService } from "../auth.service";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  animations: fuseAnimations
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loginFormErrors: any;
  loginSubscription: Subscription;
  constructor(
    private fuseConfigService: FuseConfigService,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Configure the layout
    this.fuseConfigService.config = {
      layout: {
        navbar: {
          hidden: true
        },
        toolbar: {
          hidden: true
        },
        footer: {
          hidden: true
        }
      }
    };

    this.loginFormErrors = {
      email: {},
      password: {}
    };
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required]
    });

    this.loginForm.valueChanges.subscribe(() => {
      this.onLoginFormValuesChanged();
    });
  }

  ngOnDestroy() {
    if (this.loginSubscription) this.loginSubscription.unsubscribe();
  }

  onLoginFormValuesChanged() {
    for (const field in this.loginFormErrors) {
      if (!this.loginFormErrors.hasOwnProperty(field)) {
        continue;
      }

      // Clear previous errors
      this.loginFormErrors[field] = {};

      // Get the control
      const control = this.loginForm.get(field);

      if (control && control.dirty && !control.valid) {
        this.loginFormErrors[field] = control.errors;
      }
    }
  }

  signInWithEmailAndPassword() {
    this.authService
      .signInWithEmailAndPassword(
        this.loginForm.value.email,
        this.loginForm.value.password
      )
      .then(
        () => {
          this.goHome();
        },
        error => {
          alert(error);
        }
      );
  }

  signInWithGoogleplus() {
    this.authService.signInWithGoogleplus().then(
      () => {
        this.goHome();
      },
      error => {
        alert(error);
      }
    );
  }

  private goHome() {
    this.loginSubscription = this.authService.checkPermission.subscribe(
      permission => {
        if (permission) {
          this.router.navigate(["/"]);
        } else {
          alert("need permission.");
        }
      }
    );
  }
}
