import { NativeModules, Platform } from "react-native";

/**
 * Typed boundary for the future Android default-SMS-handler module.
 *
 * The native implementation is intentionally not bundled yet. Until the
 * Android RoleManager flow, SMS intents, provider access, and Play policy
 * requirements are implemented and tested, this bridge reports unavailable.
 */
export type SmsCapability =
  | { status: "unsupported-platform" }
  | { status: "native-module-missing" }
  | { status: "not-default-handler" }
  | { status: "default-handler"; canRead: boolean; canSend: boolean };

type NativeSmsModule = {
  getCapability(): Promise<Exclude<SmsCapability, { status: "unsupported-platform" | "native-module-missing" }>>;
  requestDefaultHandler(): Promise<boolean>;
};

const nativeSms = NativeModules.NivaSms as NativeSmsModule | undefined;

export async function getSmsCapability(): Promise<SmsCapability> {
  if (Platform.OS !== "android") return { status: "unsupported-platform" };
  if (!nativeSms) return { status: "native-module-missing" };
  try {
    return await nativeSms.getCapability();
  } catch {
    // Fail closed: a bridge error must never be interpreted as permission.
    return { status: "not-default-handler" };
  }
}

/**
 * Opens the Android system role request through the native module.
 * Returns false when the module is unavailable or the platform is unsupported.
 */
export async function requestDefaultSmsHandler(): Promise<boolean> {
  if (Platform.OS !== "android" || !nativeSms) return false;
  try {
    return await nativeSms.requestDefaultHandler();
  } catch {
    return false;
  }
}
