import { Component, OnInit } from '@angular/core';

import { fuseAnimations } from '@fuse/animations';

import { ChatService } from '../../chat.service';

@Component({
    selector   : 'app-chat-right-sidenav',
    templateUrl: './right.component.html',
    styleUrls  : ['./right.component.scss'],
    animations : fuseAnimations
})
export class RightComponent implements OnInit {

  view: string;

    constructor(private chatService: ChatService)
    {
        this.view = 'contact';
    }

    ngOnInit()
    {
        this.chatService.onRightSidenavViewChanged.subscribe(view => {
            this.view = view;
        });
    }

}
