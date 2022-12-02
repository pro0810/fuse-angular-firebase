import { MatChipInputEvent } from '@angular/material';

import { FuseUtils } from '@fuse/utils';

export class Coordinator
{
    id: string;
    name: string;
    email: string;
    photo: string;
    phone: string;
    belongsTo: string;
    description: string;
    type: number; // 0: owner, 1:admin
    active: boolean;

    constructor(coordinator?)
    {
        coordinator = coordinator || {};
        this.id = coordinator.id || '?';
        this.name = coordinator.name || '';
        this.email = coordinator.email || '';
        this.photo = coordinator.photo || '';
        this.phone = coordinator.phone || '';
        this.belongsTo = coordinator.belongsTo || ''
        this.description = coordinator.description || '';
        this.type  = coordinator.type  || 1;
        this.active = coordinator.active || false;
    }

    updateData(data) 
    {
        this.name = data.name || '';
        this.email = data.email || '';
        this.description = data.description || '';
        this.active = data.active || false;
    }
}
