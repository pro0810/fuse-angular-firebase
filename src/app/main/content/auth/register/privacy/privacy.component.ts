import { Component, ViewEncapsulation, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PrivacyDialogComponent {

  /**
     * Constructor
     *
     * @param {MatDialogRef<PrivacyDialogComponent>} matDialogRef
     * @param _data
     */
    constructor(
      public matDialogRef: MatDialogRef<PrivacyDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public _data: any
  )
  {
  }

}
