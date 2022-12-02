import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule, MatIconModule, MatMenuModule, MatProgressBarModule, MatToolbarModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatSnackBarModule } from '@angular/material';

import { FuseSearchBarModule, FuseShortcutsModule } from '@fuse/components';
import { FuseSharedModule } from '@fuse/shared.module';

import { ToolbarComponent } from 'app/layout/components/toolbar/toolbar.component';
import { SharedModule } from '../../../shared/shared.module';
import { ProfileFormComponent } from './profile-form/profile-form.component';

@NgModule({
    declarations: [
        ToolbarComponent,
        ProfileFormComponent
    ],
    imports     : [
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatProgressBarModule,
        MatToolbarModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,

        FuseSharedModule,
        FuseSearchBarModule,
        FuseShortcutsModule,

        SharedModule
    ],
    exports     : [
        ToolbarComponent
    ],
    entryComponents:[
        ProfileFormComponent
    ]
})
export class ToolbarModule
{
}
