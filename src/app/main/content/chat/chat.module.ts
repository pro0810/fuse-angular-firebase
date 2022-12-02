import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FuseSharedModule } from "@fuse/shared.module";
import { CdkTableModule } from "@angular/cdk/table";

import {
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatRadioModule,
  MatSidenavModule,
  MatToolbarModule,
  MatProgressSpinnerModule
} from "@angular/material";
import { ChatComponent } from "./chat.component";
import { RightComponent } from "./sidenavs/right/right.component";
import { ContactComponent } from "./sidenavs/right/contact/contact.component";
import { LeftComponent } from "./sidenavs/left/left.component";
import { ChatsComponent } from "./sidenavs/left/chats/chats.component";
import { UserComponent } from "./sidenavs/left/user/user.component";
import { ChatService } from "./chat.service";
import { ChatStartComponent } from "./chat-start/chat-start.component";
import { ChatViewComponent } from "./chat-view/chat-view.component";
import { SharedModule } from "../../../shared/shared.module";
import { AgmCoreModule } from "@agm/core";
import { UserListService } from "../users/user-list.service";

const routes = [
  {
    path: "",
    component: ChatComponent,
    resolve: {}
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    FuseSharedModule,

    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatRadioModule,
    MatSidenavModule,
    MatToolbarModule,
    MatProgressSpinnerModule,

    AgmCoreModule.forRoot({
      apiKey: "AIzaSyCUkQGJqSh-AOPsw2mEG4xW2NBXM4yvrKs"
    }),
    SharedModule
  ],
  declarations: [
    ChatComponent,
    RightComponent,
    ContactComponent,
    LeftComponent,
    ChatsComponent,
    UserComponent,
    ChatStartComponent,
    ChatViewComponent
  ],
  providers: [ChatService],
  exports: [ChatComponent]
})
export class ChatModule {}
