import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { AppModule } from "app/app.module";
import { environment } from "environments/environment";
import { hmrBootstrap } from "hmr";

if (environment.production) {
  enableProdMode();
}

const bootstrap = () => platformBrowserDynamic().bootstrapModule(AppModule);

if (environment.hmr) {
  if (module["hot"]) {
    hmrBootstrap(module, bootstrap);
  } else {
  }
} else {
  bootstrap();
}
