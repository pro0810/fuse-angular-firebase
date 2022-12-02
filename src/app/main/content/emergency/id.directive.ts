import { Directive, HostListener, Input } from "@angular/core";

@Directive({
  selector: "[appResizeWindow]"
})
export class ResizeWindowDirective {
  @Input("appResizeWindow") line_ChartOptions: {};

  constructor() {}

  @HostListener("window:resize", ["$event"]) onResize(event: Event) {
    if (event.target["innerWidth"] < 420)
      this.line_ChartOptions["hAxis"]["format"] = "MMM";
    else if (event.target["innerWidth"] < 760)
      this.line_ChartOptions["hAxis"]["format"] = "MM. yy'";
    else this.line_ChartOptions["hAxis"]["format"] = "MMM d, yyyy";
  }

  @HostListener("load", ["$event"]) onPageLoad(event: Event) {
    this.onResize(event.target["innerWidth"]);
  }
}
