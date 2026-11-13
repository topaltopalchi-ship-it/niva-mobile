import React, { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCategorySuggestion, getRiskHint, isStoredMessages } from "./messageRules";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  FlatList,
  ScrollView,
  Alert,
  Share,
} from "react-native";

type Message = {
  id: string;
  sender: string;
  initials: string;
  preview: string;
  time: string;
  category: "Personal" | "Updates" | "Promotions";
  unread: boolean;
  important: boolean;
  blocked: boolean;
  riskFeedback?: "suspicious" | "false-positive";
};

const INITIAL_MESSAGES: Message[] = [
  { id: "1", sender: "Maya Chen", initials: "MC", preview: "Are we still on for coffee tomorrow?", time: "9:41", category: "Personal", unread: true, important: true, blocked: false },
  { id: "2", sender: "Northstar Bank", initials: "NB", preview: "Your monthly statement is ready to view.", time: "9:18", category: "Updates", unread: true, important: false, blocked: false },
  { id: "3", sender: "Alex Rivera", initials: "AR", preview: "Sent you the photos from the weekend ✨", time: "Yesterday", category: "Personal", unread: false, important: false, blocked: false },
  { id: "4", sender: "Daily Offers", initials: "DO", preview: "Your exclusive deal expires tonight…", time: "Yesterday", category: "Promotions", unread: false, important: false, blocked: false },
  { id: "5", sender: "Studio Team", initials: "ST", preview: "The updated project files are in the folder.", time: "Mon", category: "Personal", unread: false, important: true, blocked: false },
  { id: "6", sender: "Parcel Desk", initials: "PD", preview: "Your package is out for delivery today.", time: "Mon", category: "Personal", unread: true, important: false, blocked: false },
  { id: "7", sender: "Unknown Sender", initials: "US", preview: "FINAL WARNING: Your account is suspended. Verify your password immediately at http://example.invalid", time: "Today", category: "Updates", unread: true, important: false, blocked: false },
];

type Filter = "All" | "Important" | "Blocked" | "Personal" | "Updates" | "Promotions";

const STORAGE_KEY = "@niva/conversations/v1";
const DELETED_KEY = "@niva/data-deleted/v1";



export default function App() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [resetNotice, setResetNotice] = useState("");
  const [dataDeleted, setDataDeleted] = useState(false);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const deleted = await AsyncStorage.getItem(DELETED_KEY);
        if (deleted === "true" && active) {
          setMessages([]);
          setDataDeleted(true);
        }
        const saved = deleted === "true" ? null : await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && active) {
          const parsed: unknown = JSON.parse(saved);
          if (isStoredMessages(parsed)) setMessages(parsed);
        }
      } catch {
        // Keep the sample inbox available if saved data is unavailable or invalid.
      } finally {
        if (active) setStorageReady(true);
      }
    };
    void restore();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!storageReady || dataDeleted) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages)).catch(() => {
      // The app remains usable if device storage is temporarily unavailable.
    });
  }, [messages, storageReady, dataDeleted]);

  const selectedMessage = messages.find((message) => message.id === selectedId) ?? null;

  const visibleMessages = useMemo(() => messages.filter((message) => {
    const matchesFilter =
      filter === "All" ? !message.blocked :
      filter === "Important" ? message.important && !message.blocked :
      filter === "Blocked" ? message.blocked :
      message.category === filter && !message.blocked;
    const matchesQuery = (message.sender + " " + message.preview).toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  }), [messages, filter, query]);

  const unreadCount = messages.filter((message) => message.unread && !message.blocked).length;

  const toggleImportant = (id: string) => setMessages((current) =>
    current.map((message) => message.id === id ? { ...message, important: !message.important } : message)
  );

  const toggleBlocked = (id: string) => setMessages((current) =>
    current.map((message) => message.id === id ? { ...message, blocked: !message.blocked } : message)
  );

  const markRead = (id: string) => setMessages((current) =>
    current.map((message) => message.id === id ? { ...message, unread: false } : message)
  );

  const openConversation = (id: string) => {
    markRead(id);
    setSelectedId(id);
  };

  const setRiskFeedback = (id: string, riskFeedback: Message["riskFeedback"]) => {
    setMessages((current) => current.map((message) =>
      message.id === id ? { ...message, riskFeedback } : message
    ));
  };

  const applyCategorySuggestion = (id: string, category: Message["category"]) => {
    setMessages((current) => current.map((message) =>
      message.id === id ? { ...message, category } : message
    ));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {selectedMessage ? (
          <ScrollView style={styles.detailScreen} contentContainerStyle={styles.detailContent} keyboardShouldPersistTaps="handled">
            <Pressable onPress={() => setSelectedId(null)} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back to inbox">
              <Text style={styles.backText}>‹  Back to inbox</Text>
            </Pressable>
            <View style={styles.detailHeader}>
              <View style={styles.detailAvatar}><Text style={styles.detailInitials}>{selectedMessage.initials}</Text></View>
              <Text style={styles.detailSender}>{selectedMessage.sender}</Text>
              <Text style={styles.detailMeta}>{selectedMessage.category} · {selectedMessage.time}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>MESSAGE PREVIEW</Text>
              <Text style={styles.detailBody}>{selectedMessage.preview}</Text>
              <Text style={styles.detailDisclaimer}>This is sample conversation content. Niva is not connected to your device messages yet.</Text>
            </View>
            {(() => {
              const riskReasons = getRiskHint(selectedMessage);
              if (selectedMessage.riskFeedback === "false-positive") {
                return (
                  <View style={styles.feedbackCard}>
                    <Text style={styles.feedbackTitle}>MARKED AS A POSSIBLE FALSE ALARM</Text>
                    <Text style={styles.feedbackText}>Niva will keep this feedback on this device. The original warning rules are unchanged.</Text>
                    <Pressable onPress={() => setRiskFeedback(selectedMessage.id, undefined)} style={styles.feedbackLink} accessibilityRole="button">
                      <Text style={styles.feedbackLinkText}>Undo feedback</Text>
                    </Pressable>
                  </View>
                );
              }
              return riskReasons.length > 0 ? (
                <View style={styles.riskCard}>
                  <Text style={styles.riskTitle}>REVIEW CAREFULLY · POTENTIAL WARNING SIGNS</Text>
                  {riskReasons.map((reason) => (
                    <Text key={reason} style={styles.riskReason}>• {reason}</Text>
                  ))}
                  <Text style={styles.riskDisclaimer}>This is a local keyword check, not a fraud verdict. Don’t share passwords or codes, and verify through an official channel you find yourself.</Text>
                  {selectedMessage.riskFeedback === "suspicious" ? (
                    <Text style={styles.feedbackText}>Marked by you as suspicious on this device.</Text>
                  ) : (
                    <View style={styles.feedbackActions}>
                      <Pressable onPress={() => setRiskFeedback(selectedMessage.id, "suspicious")} style={styles.feedbackButton} accessibilityRole="button">
                        <Text style={styles.feedbackButtonText}>Report suspicious</Text>
                      </Pressable>
                      <Pressable onPress={() => setRiskFeedback(selectedMessage.id, "false-positive")} style={styles.feedbackButtonSecondary} accessibilityRole="button">
                        <Text style={styles.feedbackButtonSecondaryText}>False alarm</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ) : null;
            })()}
            {(() => {
              const suggestion = getCategorySuggestion(selectedMessage);
              return suggestion ? (
                <View style={styles.suggestionCard}>
                  <Text style={styles.suggestionTitle}>NIVA SUGGESTS · {suggestion.category.toUpperCase()}</Text>
                  <Text style={styles.suggestionReason}>{suggestion.reason}</Text>
                  <Pressable
                    onPress={() => applyCategorySuggestion(selectedMessage.id, suggestion.category)}
                    style={styles.suggestionButton}
                    accessibilityRole="button"
                  >
                    <Text style={styles.suggestionButtonText}>Apply category</Text>
                  </Pressable>
                </View>
              ) : null;
            })()}
            <View style={styles.detailActions}>
              <Pressable onPress={() => toggleImportant(selectedMessage.id)} style={styles.detailAction} accessibilityRole="button">
                <Text style={styles.detailActionText}>{selectedMessage.important ? "★  Important" : "☆  Mark important"}</Text>
              </Pressable>
              <Pressable onPress={() => toggleBlocked(selectedMessage.id)} style={styles.detailAction}>
                <Text style={styles.detailActionText}>{selectedMessage.blocked ? "↗  Unblock sender" : "⊖  Block in Niva"}</Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : privacyOpen ? (
          <ScrollView style={styles.privacyScreen} contentContainerStyle={styles.privacyContent}>
            <Pressable onPress={() => { setPrivacyOpen(false); setResetNotice(""); }} style={styles.backButton} accessibilityRole="button">
              <Text style={styles.backText}>‹  Back to inbox</Text>
            </Pressable>
            <Text style={styles.heading}>Privacy & data</Text>
            <Text style={styles.subheading}>Understand what stays on this device.</Text>

            <View style={styles.privacyCard}>
              <Text style={styles.privacyCardTitle}>LOCAL DATA</Text>
              <View style={styles.privacyStatRow}>
                <Text style={styles.privacyStatLabel}>Conversations on this device</Text>
                <Text style={styles.privacyStatValue}>{messages.length}</Text>
              </View>
              <View style={styles.privacyStatRow}>
                <Text style={styles.privacyStatLabel}>Storage</Text>
                <Text style={styles.privacyStatValue}>{storageReady ? "Available" : "Loading"}</Text>
              </View>
              <Text style={styles.privacyBody}>Niva stores conversation previews and your read, category, important, blocked-in-Niva, and warning-feedback choices in this app’s local storage.</Text>
            </View>

            <View style={styles.privacyCard}>
              <Text style={styles.privacyCardTitle}>WHAT NIVA DOES NOT DO</Text>
              <Text style={styles.privacyBullet}>• This prototype does not connect to SMS, email, contacts, or notifications.</Text>
              <Text style={styles.privacyBullet}>• Message content and feedback are not sent to a Niva server.</Text>
              <Text style={styles.privacyBullet}>• “Block in Niva” does not block at the device or carrier level.</Text>
              <Text style={styles.privacyBullet}>• Local keyword hints are not a definitive fraud or spam check.</Text>
            </View>

            <View style={styles.privacyCard}>
              <Text style={styles.privacyCardTitle}>STORAGE LIMITATION</Text>
              <Text style={styles.privacyBody}>AsyncStorage is persistent but not encrypted by this app. Do not use this prototype for sensitive or confidential message content.</Text>
            </View>

            <View style={styles.privacyCard}>
              <Text style={styles.privacyCardTitle}>EXPORT YOUR DATA</Text>
              <Text style={styles.privacyBody}>Create a JSON export of the conversations and Niva preferences currently stored in this app. The native share sheet lets you choose where to send or save it.</Text>
              <Pressable
                onPress={() => {
                  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), app: "Niva", conversations: messages }, null, 2);
                  Share.share({ title: "Niva data export", message: payload }).catch(() => setResetNotice("Could not open the share sheet. Please try again."));
                }}
                style={styles.exportButton}
                accessibilityRole="button"
              >
                <Text style={styles.exportButtonText}>Export conversations (JSON)</Text>
              </Pressable>
            </View>

            <View style={styles.privacyDangerCard}>
              <Text style={styles.privacyDangerTitle}>RESET LOCAL INBOX</Text>
              <Text style={styles.privacyBody}>Remove saved inbox changes and restore the original sample conversations. This does not affect messages on your phone or any external account.</Text>
              <Pressable
                onPress={() => {
                  AsyncStorage.multiRemove([STORAGE_KEY, DELETED_KEY]).then(() => {
                    setDataDeleted(false);
                    setMessages(INITIAL_MESSAGES);
                    setSelectedId(null);
                    setFilter("All");
                    setQuery("");
                    setResetNotice("Local inbox reset. Sample conversations are restored.");
                  }).catch(() => setResetNotice("Could not clear local storage. Please try again."));
                }}
                style={styles.resetButton}
                accessibilityRole="button"
              >
                <Text style={styles.resetButtonText}>Reset to sample inbox</Text>
              </Pressable>
              {resetNotice ? <Text style={styles.resetNotice}>{resetNotice}</Text> : null}
            </View>

            <View style={styles.privacyDangerCard}>
              <Text style={styles.privacyDangerTitle}>DELETE ALL LOCAL DATA</Text>
              <Text style={styles.privacyBody}>Permanently clear Niva conversations and preferences saved by this prototype. The app will remain empty after reopening. This cannot delete SMS, email, or data in other apps.</Text>
              <Pressable
                onPress={() => Alert.alert(
                  "Delete all local Niva data?",
                  "This permanently removes the conversations and preferences stored by Niva on this device. This action cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete data", style: "destructive", onPress: () => {
                      setDataDeleted(true);
                      AsyncStorage.setItem(DELETED_KEY, "true")
                        .then(() => AsyncStorage.removeItem(STORAGE_KEY))
                        .then(() => {
                          setMessages([]);
                          setSelectedId(null);
                          setFilter("All");
                          setQuery("");
                          setResetNotice("All Niva data stored by this prototype has been deleted from local storage.");
                        })
                        .catch(async () => {
                          const deletionMarker = await AsyncStorage.getItem(DELETED_KEY).catch(() => null);
                          if (deletionMarker === "true") {
                            // Keep the inbox empty after restart, but do not claim stored bytes were removed.
                            setMessages([]);
                            setSelectedId(null);
                            setFilter("All");
                            setQuery("");
                            setResetNotice("Niva is hiding the old inbox, but storage could not confirm full deletion. Please retry deletion.");
                          } else {
                            setDataDeleted(false);
                            setResetNotice("Could not start deletion because the deletion marker could not be saved. Your local inbox was not cleared.");
                          }
                        });
                    } },
                  ]
                )}
                style={styles.deleteButton}
                accessibilityRole="button"
              >
                <Text style={styles.deleteButtonText}>Delete all local data</Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
        <>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.wordmark}>niva<Text style={styles.wordmarkDot}>.</Text></Text>
            <Text style={styles.eyebrow}>YOUR SPACE, YOUR RULES</Text>
          </View>
          <View style={styles.topBarActions}>
            <Pressable onPress={() => setPrivacyOpen(true)} style={styles.settingsButton} accessibilityRole="button" accessibilityLabel="Open privacy and data settings">
              <Text style={styles.settingsIcon}>⚙</Text>
            </Pressable>
            <View style={styles.avatar}><Text style={styles.avatarText}>J</Text></View>
          </View>
        </View>

        <View style={styles.headingRow}>
          <View>
            <Text style={styles.heading}>Your inbox</Text>
            <Text style={styles.subheading}>{unreadCount} unread conversations</Text>
          </View>
          <View style={styles.securePill}><View style={styles.secureDot} /><Text style={styles.secureText}>Private by design</Text></View>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search messages"
            placeholderTextColor="#929A93"
            style={styles.searchInput}
            accessibilityLabel="Search messages"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filters}>
          {(["All", "Important", "Blocked", "Personal", "Updates", "Promotions"] as Filter[]).map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]} accessibilityRole="button" accessibilityState={{ selected: filter === item }} accessibilityLabel={`${item} filter`}>
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
              {item === "Blocked" && <Text style={[styles.filterCount, filter === item && styles.filterTextActive]}>{messages.filter((m) => m.blocked).length}</Text>}
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{filter === "All" ? "RECENT" : filter.toUpperCase()}</Text>
          <Text style={styles.sampleLabel}>SAMPLE INBOX</Text>
        </View>

        <FlatList
          data={visibleMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>Nothing here yet</Text><Text style={styles.emptyText}>Messages matching this view will appear here.</Text></View>}
          renderItem={({ item }) => (
            <Pressable onPress={() => openConversation(item.id)} style={[styles.messageCard, item.unread && styles.messageUnread]} accessibilityRole="button" accessibilityLabel={`${item.sender}. ${item.preview}. ${item.category}. ${item.unread ? "Unread" : "Read"}`} accessibilityHint="Opens conversation details">
              <View style={[styles.contactAvatar, item.category === "Promotions" && styles.promoAvatar, item.category === "Updates" && styles.updateAvatar]}>
                <Text style={styles.contactInitials}>{item.initials}</Text>
              </View>
              <View style={styles.messageBody}>
                <View style={styles.messageTop}>
                  <Text style={[styles.sender, item.unread && styles.senderUnread]} numberOfLines={1}>{item.sender}</Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
                <Text style={styles.preview} numberOfLines={2}>{item.preview}</Text>
                <View style={styles.messageActions}>
                  <Text style={styles.category}>{item.category}</Text>
                  <View style={styles.actionRow}>
                    <Pressable onPress={() => toggleImportant(item.id)} hitSlop={8} accessibilityLabel={item.important ? "Remove important" : "Mark important"}>
                      <Text style={[styles.actionIcon, item.important && styles.actionSelected]}>{item.important ? "★" : "☆"}</Text>
                    </Pressable>
                    <Pressable onPress={() => toggleBlocked(item.id)} hitSlop={8} accessibilityLabel={item.blocked ? "Unblock sender" : "Block sender"}>
                      <Text style={[styles.actionIcon, item.blocked && styles.blockSelected]}>{item.blocked ? "⊘" : "⊖"}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
              {item.unread && <View style={styles.unreadDot} />}
            </Pressable>
          )}
        />

        <View style={styles.bottomNote}>
          <Text style={styles.bottomIcon}>✳</Text>
          <Text style={styles.bottomText}>A calmer inbox starts with what matters.</Text>
        </View>
        </>)}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7F4" },
  privacyScreen: { flex: 1 },
  privacyContent: { paddingTop: 10, paddingBottom: 28, gap: 13 },
  topBarActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingsButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#EAEFE8", alignItems: "center", justifyContent: "center" },
  settingsIcon: { color: "#526B50", fontSize: 18 },
  privacyCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E9EDE8", padding: 16, gap: 9 },
  privacyCardTitle: { color: "#879188", fontSize: 9, fontWeight: "800", letterSpacing: 1.3, marginBottom: 2 },
  privacyStatRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  privacyStatLabel: { color: "#59645B", fontSize: 11 },
  privacyStatValue: { color: "#344337", fontSize: 11, fontWeight: "800" },
  privacyBody: { color: "#778278", fontSize: 10, lineHeight: 16 },
  privacyBullet: { color: "#59675C", fontSize: 10, lineHeight: 16 },
  privacyDangerCard: { backgroundColor: "#FFF7F1", borderRadius: 16, borderWidth: 1, borderColor: "#F0DFD2", padding: 16, gap: 9 },
  privacyDangerTitle: { color: "#9B6449", fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  exportButton: { alignSelf: "flex-start", backgroundColor: "#E8EFE5", borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, marginTop: 3 },
  exportButtonText: { color: "#526B50", fontSize: 10, fontWeight: "800" },
  deleteButton: { alignSelf: "flex-start", backgroundColor: "#F0DFD2", borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, marginTop: 3 },
  deleteButtonText: { color: "#88563D", fontSize: 10, fontWeight: "800" },
  resetButton: { alignSelf: "flex-start", backgroundColor: "#F0DFD2", borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, marginTop: 3 },
  resetButtonText: { color: "#88563D", fontSize: 10, fontWeight: "800" },
  resetNotice: { color: "#587452", fontSize: 10, lineHeight: 15 },
  detailScreen: { flex: 1 },
  detailContent: { paddingTop: 10, paddingBottom: 28 },
  backButton: { alignSelf: "flex-start", paddingVertical: 10, paddingRight: 16 },
  backText: { color: "#587452", fontSize: 13, fontWeight: "700" },
  detailHeader: { alignItems: "center", paddingVertical: 38 },
  detailAvatar: { width: 64, height: 64, borderRadius: 22, backgroundColor: "#E3EADF", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  detailInitials: { color: "#526B50", fontSize: 17, fontWeight: "800" },
  detailSender: { color: "#1C2A21", fontSize: 23, fontWeight: "700" },
  detailMeta: { color: "#89928B", fontSize: 11, marginTop: 7 },
  detailCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E9EDE8", padding: 20 },
  detailLabel: { color: "#879188", fontSize: 9, fontWeight: "800", letterSpacing: 1.4, marginBottom: 14 },
  detailBody: { color: "#344337", fontSize: 16, lineHeight: 25 },
  detailDisclaimer: { color: "#9AA49A", fontSize: 10, lineHeight: 15, marginTop: 22 },
  feedbackCard: { marginTop: 14, padding: 15, borderRadius: 15, backgroundColor: "#EEF2EB", borderWidth: 1, borderColor: "#DDE7D8" },
  feedbackTitle: { color: "#587452", fontSize: 9, fontWeight: "800", letterSpacing: 0.7 },
  feedbackText: { color: "#6D786E", fontSize: 10, lineHeight: 15, marginTop: 8 },
  feedbackLink: { alignSelf: "flex-start", marginTop: 8, paddingVertical: 4 },
  feedbackLinkText: { color: "#587452", fontSize: 10, fontWeight: "800" },
  feedbackActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 13 },
  feedbackButton: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: "#EBD9C1" },
  feedbackButtonText: { color: "#79562F", fontSize: 10, fontWeight: "800" },
  feedbackButtonSecondary: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: "#E6EDE3" },
  feedbackButtonSecondaryText: { color: "#587452", fontSize: 10, fontWeight: "800" },
  riskCard: { marginTop: 14, padding: 16, borderRadius: 15, backgroundColor: "#FFF6E9", borderWidth: 1, borderColor: "#EED9B8" },
  riskTitle: { color: "#94652B", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  riskReason: { color: "#765B3A", fontSize: 11, lineHeight: 17, marginTop: 8 },
  riskDisclaimer: { color: "#967F63", fontSize: 10, lineHeight: 15, marginTop: 10 },
  suggestionCard: { marginTop: 14, padding: 16, borderRadius: 15, backgroundColor: "#EEF2EB", borderWidth: 1, borderColor: "#DDE7D8" },
  suggestionTitle: { color: "#587452", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  suggestionReason: { color: "#6D786E", fontSize: 11, lineHeight: 16, marginTop: 7 },
  suggestionButton: { alignSelf: "flex-start", marginTop: 12, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 10, backgroundColor: "#DCE8D8" },
  suggestionButtonText: { color: "#496544", fontSize: 11, fontWeight: "800" },
  detailActions: { marginTop: 16, gap: 10 },
  detailAction: { backgroundColor: "#EAEFE8", borderRadius: 13, padding: 15 },
  detailActionText: { color: "#526B50", fontSize: 12, fontWeight: "700" },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 12 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 34 },
  wordmark: { color: "#17251D", fontSize: 31, fontWeight: "800", letterSpacing: -1.8 },
  wordmarkDot: { color: "#7D9B78" },
  eyebrow: { color: "#8B958D", fontSize: 9, fontWeight: "700", letterSpacing: 1.6, marginTop: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E3EADF", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#526B50", fontSize: 15, fontWeight: "700" },
  headingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 },
  heading: { color: "#1C2A21", fontSize: 29, fontWeight: "700", letterSpacing: -0.9 },
  subheading: { color: "#89928B", fontSize: 12, marginTop: 5 },
  securePill: { flexDirection: "row", alignItems: "center", backgroundColor: "#E8EFE5", paddingHorizontal: 9, paddingVertical: 7, borderRadius: 20, marginBottom: 3 },
  secureDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#6E9568", marginRight: 6 },
  secureText: { color: "#587452", fontSize: 9, fontWeight: "700" },
  searchBox: { height: 48, backgroundColor: "#FFFFFF", borderRadius: 14, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, borderWidth: 1, borderColor: "#E9EDE8" },
  searchIcon: { fontSize: 24, color: "#829087", marginRight: 9, marginTop: -3 },
  searchInput: { flex: 1, color: "#26352A", fontSize: 13, paddingVertical: 0 },
  filterScroll: { flexGrow: 0, marginTop: 22, marginBottom: 26 },
  filters: { flexDirection: "row", gap: 8, paddingRight: 4 },
  filter: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: "#EAEFE8" },
  filterActive: { backgroundColor: "#24382A" },
  filterText: { color: "#748075", fontSize: 11, fontWeight: "700" },
  filterTextActive: { color: "#FFFFFF" },
  filterCount: { color: "#748075", fontSize: 10, marginLeft: 6 },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 11 },
  listTitle: { color: "#879188", fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  sampleLabel: { color: "#A0AAA1", fontSize: 8, fontWeight: "700", letterSpacing: 1 },
  listContent: { paddingBottom: 14, flexGrow: 1 },
  messageCard: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 9, borderWidth: 1, borderColor: "#EDF0EC" },
  messageUnread: { backgroundColor: "#FCFDFC", borderColor: "#DCE7D9" },
  contactAvatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#E9EDE7", alignItems: "center", justifyContent: "center", marginRight: 12 },
  promoAvatar: { backgroundColor: "#F5EDE3" },
  updateAvatar: { backgroundColor: "#E7EDF2" },
  contactInitials: { color: "#526451", fontSize: 11, fontWeight: "800" },
  messageBody: { flex: 1 },
  messageTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sender: { color: "#59645B", fontSize: 12, fontWeight: "600", flex: 1, marginRight: 8 },
  senderUnread: { color: "#1D2C21", fontWeight: "800" },
  time: { color: "#9AA39B", fontSize: 9 },
  preview: { color: "#818B82", fontSize: 11, lineHeight: 16, marginTop: 5 },
  messageActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  category: { color: "#9AA49A", fontSize: 9 },
  actionRow: { flexDirection: "row", gap: 13, alignItems: "center" },
  actionIcon: { color: "#A3ADA3", fontSize: 17 },
  actionSelected: { color: "#B48B42" },
  blockSelected: { color: "#C56C5D" },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#789A70", alignSelf: "center", marginLeft: 8 },
  empty: { alignItems: "center", paddingTop: 50 },
  emptyTitle: { color: "#344337", fontSize: 16, fontWeight: "700" },
  emptyText: { color: "#89948B", fontSize: 11, marginTop: 7, textAlign: "center" },
  bottomNote: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#E8ECE6" },
  bottomIcon: { color: "#83A17B", fontSize: 13, marginRight: 7 },
  bottomText: { color: "#929B93", fontSize: 10 },
});
