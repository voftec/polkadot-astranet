// astranetSDKChat.js
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-storage.js';
import { getDatabase, ref, set, update, push, get, onChildAdded, serverTimestamp, off, query, orderByChild, limitToLast } from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-auth.js';

const storage = getStorage();
const db = getDatabase();
const auth = getAuth();

// THIS FUNCTION MUST BE IN THE GLOBAL SCOPE OF THE MODULE
/**
 * Generates a lightweight, somewhat unique ID.
 * @param {number} length
 * @returns {string}
 */
function generateLightweightID(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  const timestamp = Date.now().toString(36);
  id += timestamp.slice(-5);
  for (let i = id.length; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// THIS FUNCTION MUST BE IN THE GLOBAL SCOPE OF THE MODULE
/**
 * Upload a file to Firebase Storage and return its download URL and original file name.
 * @param {File} file
 * @param {string} path - Base path in storage (e.g., 'chatFiles/')
 * @returns {Promise<{downloadURL: string, fileName: string}>}
 */
export async function uploadFileAndGetMetadata(file, path) {
  console.log("SDK: uploadFileAndGetMetadata called for path:", path, "File:", file.name);
  const uniqueFileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const fileRef = storageRef(storage, `${path.endsWith('/') ? path : path + '/'}${uniqueFileName}`);
  try {
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    console.log("SDK: File uploaded successfully. URL:", downloadURL, "Original Name:", file.name);
    return { downloadURL, fileName: file.name };
  } catch (error) {
    console.error("SDK: Error uploading file:", error);
    throw error;
  }
}

// THIS FUNCTION MUST BE IN THE GLOBAL SCOPE OF THE MODULE
/**
 * Starts a new chat session with a partner.
 * @param {string} partnerUid UID of the chat partner.
 * @param {string} chatName Optional name for the chat.
 * @returns {Promise<string>} The ID of the newly created chat.
 */
export async function startNewChatWithUser(partnerUid, chatName = 'New Conversation') {
  console.log("SDK: startNewChatWithUser called. Partner:", partnerUid, "Chat Name:", chatName);
  const user = auth.currentUser;
  if (!user) {
    console.error("SDK: User not logged in (startNewChatWithUser).");
    throw new Error("Not logged in");
  }
  if (!partnerUid) {
    console.error("SDK: partnerUid is required for startNewChatWithUser.");
    throw new Error("Partner UID is required.");
  }
  console.log("SDK: Current user UID:", user.uid);

  const chatID = generateLightweightID();
  console.log("SDK: Generated chatID:", chatID);

  const sessionData = {
    name: chatName,
    participants: {
      [user.uid]: true,
      [partnerUid]: true
    },
    messages: {},
    createdAt: serverTimestamp(),
    lastActivity: serverTimestamp(),
    participantUIDs: [user.uid, partnerUid].sort()
  };
  console.log("SDK: Session data to be stored:", sessionData);

  try {
    const updates = {};
    updates[`users/${user.uid}/chatHistory/${chatID}`] = sessionData;
    if (user.uid !== partnerUid) {
        updates[`users/${partnerUid}/chatHistory/${chatID}`] = sessionData;
    } else {
        console.log("SDK: Partner is self (solo chat), only one chat history entry will be created.");
    }
    console.log("SDK: Performing multi-path update for new chat:", updates);
    await update(ref(db), updates);
    console.log(`SDK: Chat session ${chatID} stored successfully.`);
    return chatID;
  } catch (error) {
    console.error("SDK: Firebase error in startNewChatWithUser while setting data:", error);
    throw error;
  }
}

// THIS FUNCTION MUST BE IN THE GLOBAL SCOPE OF THE MODULE
/**
 * Sends a message to a specific chat.
 * Updates lastActivity for the chat session on both users' sides.
 * @param {string} chatID
 * @param {string} text Message content.
 * @param {string} partnerUid UID of the other participant (for updating their copy).
 * @param {string} [fileURL] Optional URL of an uploaded file.
 * @param {string} [fileName] Optional name of the uploaded file.
 */
export async function sendMessageToChat(chatID, text, partnerUid, fileURL = null, fileName = null) {
  console.log("SDK: sendMessageToChat called. ChatID:", chatID, "Partner:", partnerUid, "Text:", text ? text.substring(0,20)+"..." : "(No text, likely file)");
  const user = auth.currentUser;
  if (!user) {
    console.error("SDK: User not logged in (sendMessageToChat).");
    throw new Error("Not logged in");
  }
  if (!partnerUid) {
    console.error("SDK: partnerUid is required for sendMessageToChat to update both copies.");
    throw new Error("Partner UID is required to send message correctly.");
  }
   if (!text && !fileURL) {
    console.error("SDK: Cannot send an empty message (no text and no file).");
    throw new Error("Message content (text or file) is required.");
  }

  const msgData = {
    sender: user.uid,
    text: text || "",
    timestamp: serverTimestamp(),
    readBy: { [user.uid]: true }
  };
  if (fileURL) msgData.fileURL = fileURL;
  if (fileName) msgData.fileName = fileName;
  console.log("SDK: Message data to be sent:", msgData);

  const userMessageKey = push(ref(db, `users/${user.uid}/chatHistory/${chatID}/messages`)).key;
  let partnerMessageKey = null;
  if (user.uid !== partnerUid) {
    partnerMessageKey = push(ref(db, `users/${partnerUid}/chatHistory/${chatID}/messages`)).key;
  }

  const updates = {};
  updates[`users/${user.uid}/chatHistory/${chatID}/messages/${userMessageKey}`] = msgData;
  updates[`users/${user.uid}/chatHistory/${chatID}/lastActivity`] = serverTimestamp();
  updates[`users/${user.uid}/chatHistory/${chatID}/lastMessagePreview`] = text ? (text.length > 50 ? text.substring(0,47)+"..." : text) : (fileName || "File sent");

  if (user.uid !== partnerUid && partnerMessageKey) {
    updates[`users/${partnerUid}/chatHistory/${chatID}/messages/${partnerMessageKey}`] = msgData;
    updates[`users/${partnerUid}/chatHistory/${chatID}/lastActivity`] = serverTimestamp();
    updates[`users/${partnerUid}/chatHistory/${chatID}/lastMessagePreview`] = text ? (text.length > 50 ? text.substring(0,47)+"..." : text) : (fileName || "File sent");
  }

  try {
    console.log("SDK: Performing multi-path update for sending message:", updates);
    await update(ref(db), updates);
    console.log("SDK: Message sent and activity/preview updated successfully.");
  } catch (error) {
    console.error("SDK: Firebase error in sendMessageToChat:", error);
    throw error;
  }
}

// THIS FUNCTION MUST BE IN THE GLOBAL SCOPE OF THE MODULE
/**
 * Loads the chat list for the current user.
 * Each chat object will include `chatID` and the rest of the chat session data.
 * @returns {Promise<Array<Object>>} Array of chat session objects, sorted by lastActivity or createdAt.
 */
export async function loadUserChatList() {
  console.log("SDK: loadUserChatList called.");
  const user = auth.currentUser;
  if (!user) {
    console.log("SDK: User not logged in (loadUserChatList), returning empty list.");
    return [];
  }
  try {
    // Prioritize lastActivity for sorting if index is available and data is populated.
    // Fallback to createdAt if lastActivity indexing causes issues or data is old.
    // Ensure ".indexOn": ["createdAt", "lastActivity"] is in your Firebase rules.
    const chatHistoryQuery = query(ref(db, `users/${user.uid}/chatHistory`), orderByChild('lastActivity'));
    // const chatHistoryQuery = query(ref(db, `users/${user.uid}/chatHistory`), orderByChild('createdAt')); // Fallback

    const snapshot = await get(chatHistoryQuery);

    if (!snapshot.exists()) {
      console.log("SDK: No chat history found for user.");
      return [];
    }
    const chatHistory = snapshot.val();
    console.log("SDK: Raw chat history from Firebase:", chatHistory);
    
    const chatsArray = Object.entries(chatHistory).map(([chatID, data]) => ({
      chatID,
      ...data,
      messages: data.messages || {},
      createdAt: data.createdAt || 0,
      lastActivity: data.lastActivity || data.createdAt || 0 // Fallback for sorting
    }));
    
    // Sort client-side to ensure consistent descending order by lastActivity, then createdAt
    chatsArray.sort((a,b) => (b.lastActivity || 0) - (a.lastActivity || 0) || (b.createdAt || 0) - (a.createdAt || 0));

    console.log("SDK: Processed and sorted chat list array:", chatsArray);
    return chatsArray;
  } catch (error) {
    console.error("SDK: Error loading user chat list:", error);
    // If the error is "Index not defined for lastActivity", switch to 'createdAt' query above and ensure 'createdAt' is indexed.
    throw error; 
  }
}

// THIS FUNCTION MUST BE IN THE GLOBAL SCOPE OF THE MODULE
/**
 * Listens for new messages in a specific chat for the current user.
 * @param {string} chatID
 * @param {function} onMessageCallback Function to call with (messageKey, messageData)
 * @returns {function} An unsubscribe function to stop listening.
 */
export function listenForMessages(chatID, onMessageCallback) {
  console.log("SDK: listenForMessages called for chatID:", chatID);
  const user = auth.currentUser;
  if (!user) {
    console.error("SDK: User not logged in (listenForMessages).");
    throw new Error("Not logged in");
  }
  const messagesRef = ref(db, `users/${user.uid}/chatHistory/${chatID}/messages`);
  const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(100));

  const listener = onChildAdded(messagesQuery, (snapshot) => {
    if (snapshot.exists()) {
      onMessageCallback(snapshot.key, snapshot.val());
    }
  }, (error) => {
    console.error("SDK: Error in onChildAdded listener for messages:", error);
  });

  return () => {
    console.log("SDK: Unsubscribing from message listener for chatID:", chatID);
    off(messagesQuery, 'child_added', listener);
  };
}

// THIS FUNCTION MUST BE IN THE GLOBAL SCOPE OF THE MODULE
/**
 * Deletes a chat session from the history of all specified participants.
 * @param {string} chatID The ID of the chat to delete.
 * @param {Array<string>} participantUIDs An array of UIDs of all participants in the chat.
 * @returns {Promise<void>}
 */
export async function deleteChatFromHistory(chatID, participantUIDs) {
  console.log("SDK: deleteChatFromHistory called. ChatID:", chatID, "Participants:", participantUIDs);
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error("SDK: User not logged in (deleteChatFromHistory).");
    throw new Error("User not authenticated to perform this action.");
  }
  if (!chatID) {
    console.error("SDK: chatID is required for deleteChatFromHistory.");
    throw new Error("Chat ID is required.");
  }
  if (!participantUIDs || participantUIDs.length === 0) {
    console.error("SDK: participantUIDs array is required and cannot be empty for deleteChatFromHistory.");
    throw new Error("Participant UIDs are required.");
  }

  const updates = {};
  participantUIDs.forEach(uid => {
    updates[`users/${uid}/chatHistory/${chatID}`] = null; // Setting to null deletes the data
  });

  // Optional: If you have a central chat object store (e.g., /chats/{chatID}) for messages, delete it too.
  // updates[`chats/${chatID}`] = null;

  console.log("SDK: Prepared updates for chat deletion:", updates);

  try {
    await update(ref(db), updates);
    console.log("SDK: Chat", chatID, "successfully deleted (or attempted deletion) from history for all specified participants.");
  } catch (error) {
    console.error("SDK: Firebase error in deleteChatFromHistory:", error);
    throw error;
  }
}

// THIS FUNCTION MUST BE IN THE GLOBAL SCOPE OF THE MODULE
/**
 * Marks messages as read for the current user in a specific chat.
 * @param {string} chatID
 * @param {Array<string>} messageKeys Array of message keys to mark as read.
 */
export async function markMessagesAsRead(chatID, messageKeys) {
  const user = auth.currentUser;
  if (!user || !chatID || !messageKeys || messageKeys.length === 0) return;

  console.log(`SDK: Marking ${messageKeys.length} messages as read in chat ${chatID} for user ${user.uid}`);
  const updates = {};
  messageKeys.forEach(key => {
    updates[`users/${user.uid}/chatHistory/${chatID}/messages/${key}/readBy/${user.uid}`] = true;
  });

  try {
    await update(ref(db), updates);
    console.log("SDK: Messages marked as read successfully.");
  } catch (error) {
    console.error("SDK: Error marking messages as read:", error);
  }
}