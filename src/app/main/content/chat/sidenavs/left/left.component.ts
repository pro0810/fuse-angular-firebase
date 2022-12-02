import { Component, OnInit } from '@angular/core';

import { fuseAnimations } from '@fuse/animations';

import { ChatService } from '../../chat.service';

@Component({
    selector   : 'app-chat-left-sidenav',
    templateUrl: './left.component.html',
    styleUrls  : ['./left.component.scss'],
    animations : fuseAnimations
})
export class LeftComponent implements OnInit {

  view: string;

    constructor(private chatService: ChatService)
    {
        this.view = 'chats';
    }

    ngOnInit()
    {
        this.chatService.onLeftSidenavViewChanged.subscribe(view => {
            this.view = view;
        });
    }

}
