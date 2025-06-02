// astranetSDKChat.js
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-storage.js';
import { getDatabase, ref, set, update, push, get, onChildAdded, serverTimestamp, off, query, orderByChild, limitToLast } from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-database.js'; // Added query, orderByChild, limitToLast
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-auth.js';

const storage = getStorage(); // Ensure Firebase is initialized before this script
const db = getDatabase();
const auth = getAuth();

/**
 * Generates a lightweight, somewhat unique ID.
 * @param {number} length
 * @returns {string}
 */
function generateLightweightID(length = 16) { // Increased length slightly
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  const timestamp = Date.now().toString(36); // Add time component for better uniqueness
  id += timestamp.slice(-5); // Use last 5 chars of timestamp

  for (let i = id.length; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}


/**
 * Upload a file to Firebase Storage and return its download URL and original file name.
 * @param {File} file
 * @param {string} path - Base path in storage (e.g., 'chatFiles/')
 * @returns {Promise<{downloadURL: string, fileName: string}>}
 */
export async function uploadFileAndGetMetadata(file, path) {
  console.log("SDK: uploadFileAndGetMetadata called for path:", path, "File:", file.name);
  // Create a unique file name for storage to avoid collisions, but keep original name for display
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

  // Optional: Check if a chat already exists with this partner
  // This would require querying chatHistory for a chat with these exact two participants.
  // For simplicity, we'll allow multiple chats with the same person for now.

  const chatID = generateLightweightID();
  console.log("SDK: Generated chatID:", chatID);

  const sessionData = {
    name: chatName,
    participants: {
      [user.uid]: true,
      [partnerUid]: true
    },
    messages: {}, // Initialize as an empty object for new chats
    createdAt: serverTimestamp(), // Use server timestamp for consistency
    lastActivity: serverTimestamp(), // Track last activity
    // Store participant UIDs in an array for easier querying if needed later
    participantUIDs: [user.uid, partnerUid].sort() // Sort for consistent querying
  };
  console.log("SDK: Session data to be stored:", sessionData);

  try {
    const userChatPath = `users/${user.uid}/chatHistory/${chatID}`;
    const partnerChatPath = `users/${partnerUid}/chatHistory/${chatID}`;

    const updates = {};
    updates[userChatPath] = sessionData;
    // Only write to partner if it's a different user
    if (user.uid !== partnerUid) {
        updates[partnerChatPath] = sessionData;
    } else {
        console.log("SDK: Partner is self (solo chat), only one chat history entry will be created.");
    }

    console.log("SDK: Performing multi-path update for new chat:", updates);
    await update(ref(db), updates); // Use multi-path update for atomicity

    console.log(`SDK: Chat session ${chatID} stored successfully.`);
    return chatID;
  } catch (error) {
    console.error("SDK: Firebase error in startNewChatWithUser while setting data:", error);
    throw error;
  }
}

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
    text: text || "", // Ensure text is at least an empty string if not provided
    timestamp: serverTimestamp(),
    readBy: { [user.uid]: true } // Mark as read by sender
  };
  if (fileURL) msgData.fileURL = fileURL;
  if (fileName) msgData.fileName = fileName;

  console.log("SDK: Message data to be sent:", msgData);

  const userMessageRef = push(ref(db, `users/${user.uid}/chatHistory/${chatID}/messages`));
  const partnerMessageRef = push(ref(db, `users/${partnerUid}/chatHistory/${chatID}/messages`));

  // Create updates object for atomic operation
  const updates = {};
  updates[`users/${user.uid}/chatHistory/${chatID}/messages/${userMessageRef.key}`] = msgData;
  updates[`users/${user.uid}/chatHistory/${chatID}/lastActivity`] = serverTimestamp();
  updates[`users/${user.uid}/chatHistory/${chatID}/lastMessagePreview`] = text ? (text.length > 50 ? text.substring(0,47)+"..." : text) : (fileName || "File sent");


  // Only update partner if it's a different user
  if (user.uid !== partnerUid) {
    updates[`users/${partnerUid}/chatHistory/${chatID}/messages/${partnerMessageRef.key}`] = msgData; // Use the *same key* for message if you want perfect sync, or different if each user has own "copy" of message list. For simplicity, assuming same message data, new key on partner.
    // A better approach for shared messages is a central message store, but this duplicates as per current structure.
    // If messages are stored centrally:
    // const messageKey = push(ref(db, `chats/${chatID}/messages`)).key;
    // updates[`chats/${chatID}/messages/${messageKey}`] = msgData;
    // updates[`users/${user.uid}/chatHistory/${chatID}/lastMessageKey`] = messageKey;
    // updates[`users/${partnerUid}/chatHistory/${chatID}/lastMessageKey`] = messageKey;

    // For current duplicated structure:
    updates[`users/${partnerUid}/chatHistory/${chatID}/messages/${partnerMessageRef.key}`] = msgData; // Note: partnerMessageRef.key will be different from userMessageRef.key
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

/**
 * Loads the chat list for the current user.
 * Each chat object will include `chatID` and the rest of the chat session data.
 * @returns {Promise<Array<Object>>} Array of chat session objects, sorted by lastActivity.
 */

export async function loadUserChatList() {
  console.log("SDK: loadUserChatList called.");
  const user = auth.currentUser;
  if (!user) {
    console.log("SDK: User not logged in (loadUserChatList), returning empty list.");
    return [];
  }
  try {
    // MODIFIED: Order by 'createdAt' since 'lastActivity' might not exist on old data
    const chatHistoryQuery = query(ref(db, `users/${user.uid}/chatHistory`), orderByChild('createdAt'));
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
      // Ensure messages is at least an empty object if missing, for frontend stability
      messages: data.messages || {} 
    }));

    // Firebase returns items ordered by createdAt in ascending order. Reverse to get descending (most recent first).
    chatsArray.reverse(); 
    
    console.log("SDK: Processed and sorted chat list array:", chatsArray);
    return chatsArray;
  } catch (error) {
    console.error("SDK: Error loading user chat list:", error);
    // It's often better to throw the error so the UI layer can decide how to handle it,
    // e.g., show a specific error message rather than just an empty list.
    throw error; 
  }
}

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
  
  // Query to get messages, perhaps limit to last N initially for performance
  const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(100)); // Get last 100 messages

  const listener = onChildAdded(messagesQuery, (snapshot) => {
    // console.log("SDK: onChildAdded triggered for chatID:", chatID, "Msg key:", snapshot.key, "Data:", snapshot.val());
    if (snapshot.exists()) {
      onMessageCallback(snapshot.key, snapshot.val());
    }
  }, (error) => {
    console.error("SDK: Error in onChildAdded listener for messages:", error);
  });

  return () => {
    console.log("SDK: Unsubscribing from message listener for chatID:", chatID);
    // To turn off a listener attached with a query, you pass the query to off(), not just the ref.
    off(messagesQuery, 'child_added', listener);
  };
}

/**
 * Marks messages as read for the current user in a specific chat.
 * (This is a more advanced feature, not fully implemented in the UI yet)
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
    // If you also update the partner's copy (requires knowing partner UID):
    // const partnerUid = ... get partnerUid for this chat ...
    // if (partnerUid) updates[`users/${partnerUid}/chatHistory/${chatID}/messages/${key}/readBy/${user.uid}`] = true;
  });

  try {
    await update(ref(db), updates);
    console.log("SDK: Messages marked as read successfully.");
  } catch (error) {
    console.error("SDK: Error marking messages as read:", error);
  }
}