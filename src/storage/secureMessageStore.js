import { requireNativeModule } from "expo-modules-core";
import { Platform } from "react-native";
import { createSecureMessageStore } from "./secureMessageStoreCore";

let nativeStore;
if (Platform.OS === "android") {
  try {
    nativeStore = requireNativeModule("NivaSecureMessages");
  } catch {
    // The core boundary rejects all operations when the native module is absent.
    nativeStore = undefined;
  }
}

const store = createSecureMessageStore(Platform.OS, nativeStore);

/** Android-only encrypted local storage; there is deliberately no JS fallback. */
export const saveMessage = store.saveMessage;
export const getMessage = store.getMessage;
export const deleteMessage = store.deleteMessage;

export function getSecureStorageStatus() {
  if (Platform.OS !== "android") {
    return { available: false, reason: "unsupported-platform" };
  }
  if (!nativeStore || typeof nativeStore.getStorageStatus !== "function") {
    return { available: false, reason: "native-module-missing" };
  }
  return nativeStore.getStorageStatus();
}
