import { Component, Inject, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";

import * as firebase from "firebase";
import { DB_NAME } from "../../../../app.constants";
import { Coordinator } from "../../../../main/content/coordinator/coordinator.model";
import { MatSnackBar } from "@angular/material";

@Component({
  selector: "app-profile-form",
  templateUrl: "./profile-form.component.html",
  styleUrls: ["./profile-form.component.scss"],
  encapsulation: ViewEncapsulation.None
})
export class ProfileFormComponent {
  action: string;
  account: Coordinator;
  accountForm: FormGroup;
  dialogTitle: string;

  isUploading = false;

  constructor(
    public matDialogRef: MatDialogRef<ProfileFormComponent>,
    @Inject(MAT_DIALOG_DATA) private _data: any,
    private _formBuilder: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.account = _data.account;
    this.accountForm = this.createAccountForm();
  }

  ngOnInit() {}

  createAccountForm(): FormGroup {
    return this._formBuilder.group({
      name: [this.account.name || ""],
      email: [this.account.email || ""],
      phone: [this.account.phone || ""]
    });
  }

  onFileChange(event) {
    let reader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      let file = event.target.files[0];
      reader.readAsDataURL(file);
      reader.onload = () => {
        //   {filename: file.name,
        //   filetype: file.type,
        //   value: reader.result.split(',')[1]}

        this.onUploadProfile(file);
      };
    }
  }

  onUploadProfile(file) {
    this.isUploading = true;
    var db = firebase.firestore();
    var docRef = db.collection(`${DB_NAME.COORS}`).doc(this.account.id);

    const name = this.account.id + ".png";
    const metadata = { contentType: file.type };
    const fileRef = firebase
      .storage()
      .ref()
      .child("profile")
      .child(name);
    fileRef
      .child(name)
      .put(file, metadata)
      .then(snapshot => snapshot.ref.getDownloadURL())
      .then(url => {
        this.isUploading = false;
        docRef
          .update({
            photo: url
          })
          .then(success => {
            this.account.photo = url;
          });
      })
      .catch(error => {
        this.isUploading = false;
        alert(error);
      });
  }

  onSave() {
    const data = this.accountForm.getRawValue();
    var db = firebase.firestore();
    var docRef = db.collection(`${DB_NAME.COORS}`).doc(this.account.id);
    docRef
      .update(data)
      .then(success => {
        this.snackBar.open("data has been updated successfully!", null, {
          duration: 1500
        });
      })
      .catch(error => {
        this.snackBar.open(error, null, { duration: 1500 });
      });
  }
}
