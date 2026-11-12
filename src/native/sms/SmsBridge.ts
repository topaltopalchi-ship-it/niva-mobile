import { NativeModules, Platform } from "react-native";
import { normalizeSmsCapability } from "./smsCapability";

/**
 * Typed boundary for the future Android default-SMS-handler module.
 * No SMS access is available until the native implementation is installed.
 */
export type SmsCapability =
  | { status: "unsupported-platform" }
  | { status: "native-module-missing" }
  | { status: "not-default-handler" }
  | { status: "default-handler"; canRead: boolean; canSend: boolean };

type NativeSmsModule = {
  getCapability(): Promise<unknown>;
  requestDefaultHandler(): Promise<boolean>;
};

const nativeSms = NativeModules.NivaSms as NativeSmsModule | undefined;

export async function getSmsCapability(): Promise<SmsCapability> {
  if (Platform.OS !== "android") return { status: "unsupported-platform" };
  if (!nativeSms) return { status: "native-module-missing" };
  try {
    // Validate native payloads at runtime; malformed responses fail closed.
    return normalizeSmsCapability(await nativeSms.getCapability()) as SmsCapability;
  } catch {
    return { status: "not-default-handler" };
  }
}

/**
 * Requests the system default-SMS role. A true result only means the native
 * request reports acceptance; callers must re-check getSmsCapability().
 */
export async function requestDefaultSmsHandler(): Promise<boolean> {
  if (Platform.OS !== "android" || !nativeSms) return false;
  try {
    return (await nativeSms.requestDefaultHandler()) === true;
  } catch {
    return false;
  }
}
