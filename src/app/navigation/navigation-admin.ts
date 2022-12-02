import { FuseNavigation } from "@fuse/types";

export const navigation_admin: FuseNavigation[] = [
  {
    id: "applications",
    title: "Main",
    type: "group",
    children: [
      {
        id: "emergencies",
        title: "Emergencies",
        type: "item",
        icon: "local_hospital",
        url: "/emergencies"
      },
      {
        id: "users",
        title: "Users",
        type: "item",
        icon: "people",
        url: "/users"
      },
      {
        id: "coordinators",
        title: "Coordinators",
        type: "item",
        icon: "business_center",
        url: "/coordinators"
      },
      {
        id: "organizations",
        title: "Organizations",
        type: "item",
        icon: "business",
        url: "/orgs"
      }
    ]
  }
];
