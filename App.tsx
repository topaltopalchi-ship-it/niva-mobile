import React, { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  FlatList,
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
};

const INITIAL_MESSAGES: Message[] = [
  { id: "1", sender: "Maya Chen", initials: "MC", preview: "Are we still on for coffee tomorrow?", time: "9:41", category: "Personal", unread: true, important: true, blocked: false },
  { id: "2", sender: "Northstar Bank", initials: "NB", preview: "Your monthly statement is ready to view.", time: "9:18", category: "Updates", unread: true, important: false, blocked: false },
  { id: "3", sender: "Alex Rivera", initials: "AR", preview: "Sent you the photos from the weekend ✨", time: "Yesterday", category: "Personal", unread: false, important: false, blocked: false },
  { id: "4", sender: "Daily Offers", initials: "DO", preview: "Your exclusive deal expires tonight…", time: "Yesterday", category: "Promotions", unread: false, important: false, blocked: false },
  { id: "5", sender: "Studio Team", initials: "ST", preview: "The updated project files are in the folder.", time: "Mon", category: "Personal", unread: false, important: true, blocked: false },
];

type Filter = "All" | "Important" | "Blocked";

const STORAGE_KEY = "@niva/conversations/v1";

export default function App() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && active) {
          const parsed: unknown = JSON.parse(saved);
          if (Array.isArray(parsed)) setMessages(parsed as Message[]);
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
    if (!storageReady) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages)).catch(() => {
      // The app remains usable if device storage is temporarily unavailable.
    });
  }, [messages, storageReady]);

  const selectedMessage = messages.find((message) => message.id === selectedId) ?? null;

  const visibleMessages = useMemo(() => messages.filter((message) => {
    const matchesFilter =
      filter === "All" ? !message.blocked :
      filter === "Important" ? message.important && !message.blocked :
      message.blocked;
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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F4" />
      <View style={styles.container}>
        {selectedMessage ? (
          <View style={styles.detailScreen}>
            <Pressable onPress={() => setSelectedId(null)} style={styles.backButton} accessibilityRole="button">
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
            <View style={styles.detailActions}>
              <Pressable onPress={() => toggleImportant(selectedMessage.id)} style={styles.detailAction}>
                <Text style={styles.detailActionText}>{selectedMessage.important ? "★  Important" : "☆  Mark important"}</Text>
              </Pressable>
              <Pressable onPress={() => toggleBlocked(selectedMessage.id)} style={styles.detailAction}>
                <Text style={styles.detailActionText}>{selectedMessage.blocked ? "↗  Unblock sender" : "⊖  Block in Niva"}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
        <>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.wordmark}>niva<Text style={styles.wordmarkDot}>.</Text></Text>
            <Text style={styles.eyebrow}>YOUR SPACE, YOUR RULES</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>J</Text></View>
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

        <View style={styles.filters}>
          {(["All", "Important", "Blocked"] as Filter[]).map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}>
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
              {item === "Blocked" && <Text style={[styles.filterCount, filter === item && styles.filterTextActive]}>{messages.filter((m) => m.blocked).length}</Text>}
            </Pressable>
          ))}
        </View>

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
            <Pressable onPress={() => openConversation(item.id)} style={[styles.messageCard, item.unread && styles.messageUnread]}>
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
  detailScreen: { flex: 1, paddingTop: 10 },
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
  filters: { flexDirection: "row", marginTop: 22, marginBottom: 26, gap: 8 },
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
