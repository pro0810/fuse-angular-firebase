export class DB_NAME {
  public static readonly ADMIN = "Admin";
  public static readonly ROLES = "Roles";
  public static readonly USERS = "UserList";
  public static readonly COORS = "Coordinators";
  public static readonly ORGAS = "Organizations";
  public static readonly EMERG = "Emergencies";
  public static readonly USER = "users";
  // public static readonly LOCATION = "Locations";
  //add by adi
  public static readonly ZONES = "Zones";

  public static readonly CHAT_ROOMS = "ChatRooms";
  public static readonly CHAT_MSGES = "ChatMsges";

  public static readonly FCM_TOKENS = "fcmTokens";
  public static readonly EMERG_MSGES = "EmergMsges";

  public static readonly LOCS = "locations";
}

export class TW {
  public static readonly ACCID = "AC53bd04fe02997cf8a9364d8d34066ffb";
  public static readonly TOKEN = "4cf57408b891c8d5809a4728cdb4f069";
  public static readonly PHONE = "+61417597025";
}
export class ENDPOINT {
  public static readonly NOTIFICATION =
    "https://ruok-node.herokuapp.com/notification/send";
  //public static readonly SMS = "https://ruok-node.herokuapp.com/notification/sms";

  public static readonly SMS = `https://api.twilio.com/2010-04-01/Accounts/${TW.ACCID}/Messages`;
  public static readonly SMS1 = `https://${TW.ACCID}:${TW.TOKEN}@api.twilio.com/2010-04-01/Accounts/${TW.ACCID}/Messages`;
}
