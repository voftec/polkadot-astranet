import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-storage.js';
import { getDatabase, ref, set, update, push, get, onChildAdded } from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-auth.js';

const storage = getStorage();
const db = getDatabase();
const auth = getAuth();

/**
 * Upload a file to Firebase Storage and return its download URL.
 * @param {File} file
 * @param {string} path
 * @returns {Promise<string>}
 */
export async function uploadFile(file, path) {
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

function generateLightweightID(length = 13) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export async function startNewChatWithUser(partnerUid) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  const chatID = generateLightweightID();
  const sessionData = {
    participants: { [user.uid]: true, [partnerUid]: true },
    messages: {},
    createdAt: Date.now()
  };

  // Store the session under both users
  await set(ref(db, `users/${user.uid}/chatSessions/${chatID}`), sessionData);
  await set(ref(db, `users/${partnerUid}/chatSessions/${chatID}`), sessionData);

  return chatID;
}

export async function sendMessageToChat(chatID, text, partnerUid) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  const msg = {
    sender: user.uid,
    text,
    timestamp: Date.now(),
    readBy: { [user.uid]: true }
  };

  // Add message to both users' chatSessions
  const msgRefA = push(ref(db, `users/${user.uid}/chatSessions/${chatID}/messages`));
  const msgRefB = push(ref(db, `users/${partnerUid}/chatSessions/${chatID}/messages`));
  await set(msgRefA, msg);
  await set(msgRefB, msg);
}

export async function loadUserChatList() {
  const user = auth.currentUser;
  if (!user) return [];
  const snapshot = await get(ref(db, `users/${user.uid}/chatSessions`));
  if (!snapshot.exists()) return [];
  return Object.entries(snapshot.val()).map(([chatID, data]) => ({ chatID, ...data }));
}

export function listenForMessages(chatID, onMessage) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");
  const messagesRef = ref(db, `users/${user.uid}/chatSessions/${chatID}/messages`);
  onChildAdded(messagesRef, (snapshot) => {
    onMessage(snapshot.key, snapshot.val());
  });
}
