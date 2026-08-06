/** Minimal typings for the Google Identity Services client we actually use. */

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleIdInitializeOptions {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  itp_support?: boolean;
  use_fedcm_for_prompt?: boolean;
}

interface GoogleIdButtonOptions {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "small" | "medium" | "large";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
}

interface GoogleAccountsId {
  initialize: (options: GoogleIdInitializeOptions) => void;
  renderButton: (parent: HTMLElement, options: GoogleIdButtonOptions) => void;
  prompt: () => void;
  disableAutoSelect: () => void;
  cancel: () => void;
}

interface Window {
  google?: {
    accounts?: {
      id?: GoogleAccountsId;
    };
  };
}
