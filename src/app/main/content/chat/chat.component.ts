import {
  Component,
  OnInit,
  ViewEncapsulation,
  Output,
  EventEmitter
} from "@angular/core";

import { fuseAnimations } from "@fuse/animations";

import { ChatService } from "./chat.service";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.scss"],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations
})
export class ChatComponent implements OnInit {
  selectedChat: any;
  sendData: any;

  constructor(
    private chatService: ChatService,
    private route: ActivatedRoute
  ) {}
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      let userId = params["userId"];
      let name = params["name"];
      let photo = params["photo"];
      const contactData = { id: userId, name: name, photo: photo || "" };
      const from = params["from"];
      this.chatService
        .getUser()
        .take(1)
        .subscribe(user => {
          this.selectedChat = contactData;
          this.chatService.onChatSelected.next(contactData);
          this.chatService.onChatFrom.next(from);
        });
      this.sendData = params;
    });
    // this.chatService.onChatSelected
    //     .subscribe(chatData => {
    //         this.selectedChat = chatData;
    //     });
  }
}
