import { requireNativeModule } from "expo-modules-core";
import { createSecureMessageStore } from "./secureMessageStoreCore";

let nativeStore;
try {
  nativeStore = requireNativeModule("NivaSecureMessages");
} catch {
  // The core boundary rejects all operations when the native module is absent.
  nativeStore = undefined;
}

const store = createSecureMessageStore("android", nativeStore);

/** Android-only encrypted local storage; there is deliberately no JS fallback. */
export const saveMessage = store.saveMessage;
export const getMessage = store.getMessage;
export const deleteMessage = store.deleteMessage;

export function getSecureStorageStatus() {
  if (!nativeStore || typeof nativeStore.getStorageStatus !== "function") {
    return { available: false, reason: "native-module-missing" };
  }
  return nativeStore.getStorageStatus();
}
