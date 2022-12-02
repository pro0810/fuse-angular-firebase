import { MatChipInputEvent } from '@angular/material';

import { FuseUtils } from '@fuse/utils';

export class Organization
{
    id: string;
    name: string;
    ownerId: string;
    description: string;
    coordinators: any[];
    users: any[];
    mem_size: number;
    max_size: number;
    location: {
        name: string,
        addr: string,
        lat: number,
        lng: number
    };
    active: boolean;
    localService: string;
    coordPhone: string;
    configOrgMin: number;

    constructor(org?)
    {
        org = org || {};
        this.id = org.id || FuseUtils.generateGUID();
        this.name = org.name || '';
        this.ownerId = org.ownerId || '?';
        this.description = org.description || '';
        this.coordinators = org.coordinators || [];
        this.users = org.users || [];
        this.mem_size = org.mem_size || 0;
        this.max_size = org.max_size || 5;
        this.location = org.location || {name: '', addr: '', lat: 0.0, lng: 0.0};
        this.active = org.active || false;
        this.localService = org.localService || '919';
        this.coordPhone = org.coordPhone || '18002345670';
        this.configOrgMin = org.configOrgMin || 0;
    }

    // tslint:disable-next-line:typedef
    updateData(data) 
    {
        this.name = data.name || '';
        this.ownerId = data.ownerId || '?';
        this.description = data.description || '';
        this.coordinators = data.coordinators || [];
        this.users = data.users || [];
        this.mem_size = parseFloat(data.mem_size) || 0;
        this.max_size = parseFloat(data.max_size) || 5;
        this.location = {name: data.location_name,
                        addr: data.location_addr,
                        lat: parseFloat(data.location_lat),
                        lng: parseFloat(data.location_lng)} || {name: '', addr: '', lat: 0.0, lng: 0.0};
        this.active = data.active || false;
        this.localService = data.localService || '919';
        this.coordPhone = data.coordPhone || '18002345670';
        this.configOrgMin = data.configOrgMin || 0;
    }
}
