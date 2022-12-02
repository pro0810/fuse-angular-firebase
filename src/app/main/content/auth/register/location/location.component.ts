import { Component, OnInit, ViewEncapsulation, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LocationDialogComponent implements OnInit {

  location = {lat: -27.470125, lng: 153.021072};
  tempLocation = {lat: -27.470125, lng: 153.021072};
  mapZoom = 15;
  /**
     * Constructor
     *
     * @param {MatDialogRef<LocationDialogComponent>} matDialogRef
     * @param _data
     */
    constructor(
      public matDialogRef: MatDialogRef<LocationDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public _data: any
    )
  {
      if (_data.location) {
        this.location = _data.location;
        this.tempLocation = _data.location;
      }

      if (_data.mapZoom) {
        this.mapZoom = _data.mapZoom;
      }
  }

  ngOnInit()
  {
    
  }

  centerChange(event)
  {
    this.tempLocation = {lat: event.lat, lng: event.lng}
  }

  zoomChange(event)
  {
    this.mapZoom = event
  }

  onOkay()
  {
    this.location = this.tempLocation;
    this.matDialogRef.close([this.location, this.mapZoom]);
  }
}
