import { NativeModules, Platform } from "react-native";
import { createSecureMessageStore } from "./secureMessageStoreCore";

const store = createSecureMessageStore(Platform.OS, NativeModules.NivaSecureMessages);

/** Native Android implementation must encrypt using an Android Keystore key. */
export const saveMessage = store.saveMessage;
export const getMessage = store.getMessage;
export const deleteMessage = store.deleteMessage;
