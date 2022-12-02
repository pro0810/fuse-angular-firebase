export interface FuseConfig {
  layout: {
    style: string;
    width: "fullwidth" | "boxed";
    navbar: {
      hidden: boolean;
      folded: boolean;
      position: "left" | "right" | "top";
      background: string;
    };
    toolbar: {
      hidden: boolean;
      position:
        | "above"
        | "above-static"
        | "above-fixed"
        | "below"
        | "below-static"
        | "below-fixed";
      background: string;
    };
    footer: {
      hidden: boolean;
      position:
        | "above"
        | "above-static"
        | "above-fixed"
        | "below"
        | "below-static"
        | "below-fixed";
      background: string;
    };
  };
  customScrollbars: boolean;
}
