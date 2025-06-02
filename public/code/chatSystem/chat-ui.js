// chat-ui.js
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-auth.js';
import { startNewChatWithUser, loadUserChatList, sendMessageToChat, listenForMessages } from './astranetSDKChat.js';

const auth = getAuth();

let chatListElement;
let messageAreaElement;
let messageInputElement;
let sendMessageButtonElement;
let activeChatAreaElement;
let chatInterfacePlaceholderElement;
let activeChatNameElement;

let currentSelectedChatID = null;
let currentSelectedChatData = null;
let messageListenerUnsubscribe = null;

const DEFAULT_PARTNER_UID = 'astranet-assistant'; // <<< VERY IMPORTANT: Ensure this is a REAL Firebase UID of your assistant user

// --- UI Element Getters (called on DOMContentLoaded) ---
function initializeDOMElements() {
    console.log("chat-ui.js: Initializing DOM elements...");
    chatListElement = document.getElementById('chat-list');
    messageAreaElement = document.getElementById('message-area');
    messageInputElement = document.getElementById('message-input');
    sendMessageButtonElement = document.getElementById('send-message-button');
    activeChatAreaElement = document.getElementById('active-chat-area');
    chatInterfacePlaceholderElement = document.getElementById('chat-interface-placeholder');
    activeChatNameElement = document.getElementById('active-chat-name');

    if (!chatListElement) console.error("chat-ui.js: CRITICAL - chatListElement not found!");
    if (!messageAreaElement) console.error("chat-ui.js: CRITICAL - messageAreaElement not found!");
    // ... add checks for other critical elements if needed

    const newChatBtn = document.getElementById('new-chat-button');
    if (newChatBtn) {
        console.log("chat-ui.js: 'new-chat-button' found, attaching listener.");
        newChatBtn.addEventListener('click', handleNewChat);
    } else {
        console.error("chat-ui.js: 'new-chat-button' NOT found!");
    }

    const placeholderNewChatLink = document.getElementById('placeholder-new-chat');
    if (placeholderNewChatLink) {
        console.log("chat-ui.js: 'placeholder-new-chat' link found, attaching listener.");
        placeholderNewChatLink.addEventListener('click', handleNewChat);
    } else {
         console.warn("chat-ui.js: 'placeholder-new-chat' link NOT found (optional element).");
    }

    if (sendMessageButtonElement) {
        sendMessageButtonElement.addEventListener('click', handleSendMessage);
    } else {
        console.error("chat-ui.js: 'send-message-button' NOT found!");
    }
    if (messageInputElement) {
        messageInputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    } else {
        console.error("chat-ui.js: 'message-input' NOT found!");
    }
    console.log("chat-ui.js: DOM elements initialization complete.");
}

// --- Chat List Rendering ---
function renderChatList(chats = []) {
    console.log("chat-ui.js: renderChatList called with chats:", chats);
    if (!chatListElement) {
        console.error("chat-ui.js: chatListElement is null in renderChatList. Cannot render.");
        return;
    }
    chatListElement.innerHTML = '';
    if (chats.length === 0 && auth.currentUser) {
        chatListElement.innerHTML = `<p style="padding: 20px; text-align: center; color: var(--secondary-text);">No conversations yet. Start a new one!</p>`;
    } else if (chats.length === 0 && !auth.currentUser) {
        chatListElement.innerHTML = `<p style="padding: 20px; text-align: center; color: var(--secondary-text);">Please log in to see conversations.</p>`;
    }
    else {
        // Optional: Sort chats by last message or creation time
        // const sortedChats = [...chats].sort((a, b) => {
        //     const tsA = a.lastMessageTimestamp || a.createdAt || 0;
        //     const tsB = b.lastMessageTimestamp || b.createdAt || 0;
        //     return tsB - tsA;
        // });
        chats.forEach(chat => {
            chatListElement.appendChild(createChatListItem(chat));
        });
    }
    if (typeof feather !== 'undefined') {
        feather.replace();
    } else {
        console.warn("chat-ui.js: feather is not defined, icons may not render correctly.");
    }
}

async function loadAndRenderChatList() {
    console.log("chat-ui.js: loadAndRenderChatList called.");
    if (!auth.currentUser) {
        console.log("chat-ui.js: User not logged in, clearing chat list and showing placeholder.");
        renderChatList([]);
        showPlaceholderScreen();
        return;
    }
    console.log("chat-ui.js: User logged in, attempting to load chats.");
    try {
        const chats = await loadUserChatList();
        console.log("chat-ui.js: Chats loaded from SDK:", chats);
        renderChatList(chats);
    } catch (error) {
        console.error("chat-ui.js: Error loading chat list:", error);
        if (window.popupNotifier) popupNotifier.error('Could not load chats.', 'Error');
    }
}

function createChatListItem(chat) {
    const { chatID, name, participants, messages, createdAt } = chat; // Ensure chat objects have these
    // console.log("chat-ui.js: createChatListItem for chatID:", chatID, "Data:", chat);
    const item = document.createElement('div');
    item.className = 'chat-list-item';
    item.dataset.chatId = chatID;

    let lastMessageText = "No messages yet...";
    // let lastMessageTimestamp = createdAt || 0; // Fallback to createdAt
    if (messages && Object.keys(messages).length > 0) {
        const sortedMessages = Object.values(messages).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (sortedMessages.length > 0 && sortedMessages[0]) {
            lastMessageText = sortedMessages[0].text || "Media content";
            if (lastMessageText.length > 35) lastMessageText = lastMessageText.substring(0, 32) + "...";
            // lastMessageTimestamp = sortedMessages[0].timestamp || lastMessageTimestamp;
        }
    }

    let displayName = name || `Chat (${chatID.substring(0, 6)}...)`;
    if (participants && Object.keys(participants).length === 2 && auth.currentUser) {
        const partnerId = Object.keys(participants).find(uid => uid !== auth.currentUser.uid);
        if (partnerId === DEFAULT_PARTNER_UID) {
            displayName = "Astranet Assistant";
        } else if (partnerId) {
             // In a real app, you'd fetch profile to get partner's name
            // displayName = `User (${partnerId.substring(0,4)})`;
        }
    }

    item.innerHTML = `
        <div class="chat-item-icon-container">
          <i data-feather="message-square"></i>
        </div>
        <div class="chat-item-details">
          <p class="chat-item-name">${displayName}</p>
          <p class="chat-item-last-message">${lastMessageText}</p>
        </div>
    `;
    item.addEventListener('click', () => selectChat(chat));
    return item;
}

// --- Active Chat Selection & Message Display ---
function selectChat(chatData) {
    console.log("chat-ui.js: selectChat called for chatID:", chatData.chatID, "Data:", chatData);
    if (!chatData || !chatData.chatID) {
        console.error("chat-ui.js: selectChat called with invalid chatData:", chatData);
        return;
    }
    if (currentSelectedChatID === chatData.chatID && activeChatAreaElement && !activeChatAreaElement.classList.contains('hidden')) {
        console.log("chat-ui.js: Chat already selected and visible.");
        return; 
    }

    currentSelectedChatID = chatData.chatID;
    currentSelectedChatData = chatData;

    document.querySelectorAll('.chat-list-item.selected').forEach(el => el.classList.remove('selected'));
    const currentItemInList = chatListElement.querySelector(`.chat-list-item[data-chat-id="${chatData.chatID}"]`);
    if (currentItemInList) {
        currentItemInList.classList.add('selected');
    } else {
        console.warn("chat-ui.js: Could not find chat item in list to mark as selected for chatID:", chatData.chatID);
    }

    let displayName = chatData.name || `Chat (${chatData.chatID.substring(0,6)}...)`;
     if (chatData.participants && Object.keys(chatData.participants).length === 2 && auth.currentUser) {
        const partnerId = Object.keys(chatData.participants).find(uid => uid !== auth.currentUser.uid);
        if (partnerId === DEFAULT_PARTNER_UID) displayName = "Astranet Assistant";
    }
    if (activeChatNameElement) activeChatNameElement.textContent = displayName;


    showActiveChatScreen();
    if(messageAreaElement) messageAreaElement.innerHTML = '<p style="text-align:center; color:var(--secondary-text); margin-top:20px;">Loading messages...</p>';

    if (messageListenerUnsubscribe) {
        console.log("chat-ui.js: Unsubscribing from previous message listener for chat:", currentSelectedChatID);
        messageListenerUnsubscribe();
        messageListenerUnsubscribe = null;
    }

    console.log("chat-ui.js: Setting up new message listener for chat:", currentSelectedChatID);
    let initialMessagesLoaded = false;
    const messagesArray = [];

    messageListenerUnsubscribe = listenForMessages(currentSelectedChatID, (messageKey, messageData) => {
        // console.log("chat-ui.js: Message received/loaded - Key:", messageKey, "Data:", messageData);
        if (!initialMessagesLoaded) {
            messagesArray.push({ ...messageData, id: messageKey });
            return;
        }
        appendMessage(messageData);
    });

    setTimeout(() => {
        console.log("chat-ui.js: Processing initial batch of messages for chat:", currentSelectedChatID, "Batch size:", messagesArray.length);
        initialMessagesLoaded = true;
        if(messageAreaElement) messageAreaElement.innerHTML = '';
        messagesArray.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        messagesArray.forEach(msg => appendMessage(msg));
        if (messagesArray.length === 0 && messageAreaElement) {
            messageAreaElement.innerHTML = '<p style="text-align:center; color:var(--secondary-text); margin-top:20px;">No messages in this conversation yet.</p>';
        }
        console.log("chat-ui.js: Initial messages processed and rendered.");
    }, 700); // Increased delay slightly for Firebase listener to gather initial children

    if(messageInputElement) messageInputElement.focus();
}

function appendMessage(messageData) {
    // console.log("chat-ui.js: appendMessage called with data:", messageData);
    if (!messageAreaElement || !auth.currentUser) {
        console.warn("chat-ui.js: Cannot append message - messageAreaElement or auth.currentUser is null.");
        return;
    }

    const placeholder = messageAreaElement.querySelector('p');
    if (placeholder && (placeholder.textContent.includes("No messages") || placeholder.textContent.includes("Loading messages"))) {
        messageAreaElement.innerHTML = '';
    }

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message-bubble');
    const isSent = messageData.sender === auth.currentUser.uid;
    messageDiv.classList.add(isSent ? 'sent' : 'received');

    let messageText = messageData.text || ""; // Ensure text is not undefined
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    messageText = messageText.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    
    if (messageData.fileURL && messageData.fileName) {
        messageText += `<br/><i data-feather="file-text" style="width:1em; height:1em; vertical-align:middle;"></i> <a href="${messageData.fileURL}" target="_blank" rel="noopener noreferrer">${messageData.fileName}</a>`;
    } else if (messageData.fileURL) {
         messageText += `<br/><i data-feather="link" style="width:1em; height:1em; vertical-align:middle;"></i> <a href="${messageData.fileURL}" target="_blank" rel="noopener noreferrer">View File</a>`;
    }

    // Sender display name logic can be improved (fetch from profiles)
    let senderDisplayName = 'User'; // Default
    if (!isSent && messageData.sender === DEFAULT_PARTNER_UID) {
        senderDisplayName = "Astranet Assistant";
    } else if (!isSent) {
        // senderDisplayName = `User (${messageData.sender.substring(0,4)})`; // Basic fallback
    }


    messageDiv.innerHTML = `
        ${!isSent ? `<div class="message-sender-name">${senderDisplayName}</div>` : ''}
        <div class="message-text">${messageText}</div>
        <div class="message-timestamp">${new Date(messageData.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    messageAreaElement.appendChild(messageDiv);
    messageAreaElement.scrollTop = messageAreaElement.scrollHeight;
    if (typeof feather !== 'undefined') feather.replace();
}

// --- UI State Management ---
function showActiveChatScreen() {
    console.log("chat-ui.js: showActiveChatScreen called.");
    if (chatInterfacePlaceholderElement) chatInterfacePlaceholderElement.classList.add('hidden');
    if (activeChatAreaElement) activeChatAreaElement.classList.remove('hidden');
}

function showPlaceholderScreen() {
    console.log("chat-ui.js: showPlaceholderScreen called.");
    if (chatInterfacePlaceholderElement) chatInterfacePlaceholderElement.classList.remove('hidden');
    if (activeChatAreaElement) activeChatAreaElement.classList.add('hidden');
    
    // Clear selected state visually and programmatically
    document.querySelectorAll('.chat-list-item.selected').forEach(el => el.classList.remove('selected'));
    currentSelectedChatID = null;
    currentSelectedChatData = null;
    
    if (messageListenerUnsubscribe) {
        console.log("chat-ui.js: Unsubscribing from message listener due to placeholder screen.");
        messageListenerUnsubscribe();
        messageListenerUnsubscribe = null;
    }
}

// --- Actions ---
async function handleNewChat() {
    console.log("chat-ui.js: handleNewChat triggered.");

    if (!auth.currentUser) {
        console.log("chat-ui.js: User not logged in, cannot start new chat.");
        if (window.popupNotifier) popupNotifier.info('Please log in to start a new chat.', 'Authentication');
        return;
    }
    console.log("chat-ui.js: User is logged in:", auth.currentUser.uid);
    console.log("chat-ui.js: Attempting to chat with DEFAULT_PARTNER_UID:", DEFAULT_PARTNER_UID);

    try {
        const chatID = await startNewChatWithUser(DEFAULT_PARTNER_UID); // SDK function will use default name if not provided
        console.log('chat-ui.js: New chat started successfully with ID from SDK:', chatID);

        await loadAndRenderChatList(); // This will re-fetch and re-render the list
        console.log("chat-ui.js: Chat list reloaded and rendered after new chat.");

        // Find the newly created chat data from the reloaded list to pass to selectChat
        // This is more robust than mocking, assuming loadUserChatList returns full chat objects
        let newChatFullData = null;
        if (chatListElement && chatListElement.firstChild) { // A bit of a heuristic
            const chats = await loadUserChatList(); // Re-fetch to be sure
            newChatFullData = chats.find(c => c.chatID === chatID);
        }

        if (newChatFullData) {
            console.log("chat-ui.js: Found new chat data from list for selection:", newChatFullData);
            selectChat(newChatFullData);
        } else {
            // Fallback if not found (e.g., if loadUserChatList is slow or doesn't return immediately)
            console.warn("chat-ui.js: Could not immediately find new chat in list, attempting to select with minimal data.");
            const mockNewChatData = { 
                chatID, 
                name: "Astranet Assistant", // Or what startNewChatWithUser sets as default
                participants: {[auth.currentUser.uid]:true, [DEFAULT_PARTNER_UID]:true}, 
                messages: {},
                createdAt: Date.now()
            };
            selectChat(mockNewChatData);
        }
        
        if (window.popupNotifier) popupNotifier.success('Conversation with Astranet Assistant started!', 'Chat');

    } catch (err) {
        console.error('chat-ui.js: Failed to start new chat in handleNewChat:', err);
        if (window.popupNotifier) popupNotifier.error('Could not start new chat. Check console for details.', 'Error');
    }
}


async function handleSendMessage() {
    console.log("chat-ui.js: handleSendMessage called.");
    if (!auth.currentUser || !currentSelectedChatID || !currentSelectedChatData) {
        console.warn("chat-ui.js: Cannot send message - No user, selected chat, or chat data.", {
            user: !!auth.currentUser,
            chatId: currentSelectedChatID,
            chatData: !!currentSelectedChatData
        });
        return;
    }

    const text = messageInputElement.value.trim();
    if (!text) {
        console.log("chat-ui.js: Message text is empty, not sending.");
        return;
    }

    const participants = currentSelectedChatData.participants;
    if (!participants || Object.keys(participants).length < 1) { // Should be at least 1 (self) if creating, ideally 2
        console.error("chat-ui.js: Cannot determine partner UID - participants data is invalid:", currentSelectedChatData);
        if(window.popupNotifier) popupNotifier.error('Error sending message: Invalid chat participant data.', 'Error');
        return;
    }
    const partnerUid = Object.keys(participants).find(uid => uid !== auth.currentUser.uid);
    if (!partnerUid && Object.keys(participants).length > 1) { // Only error if more than 1 participant and still no partner
         console.error("chat-ui.js: Could not find partner UID in participants list:", participants);
         if(window.popupNotifier) popupNotifier.error('Error sending message: Chat partner not found.', 'Error');
        return;
    }
    // If it's a chat with only self (e.g. notes), partnerUid might be undefined. The SDK should handle this.
    // For now, we assume a 2-party chat for this sendMessage.
    if (!partnerUid) {
        console.warn("chat-ui.js: Sending message without a clear partnerUid. This might be a solo chat or an issue.");
        // If your SDK's sendMessageToChat *requires* a partnerUid for a 2-party structure, this will fail.
        // If it can handle a solo chat (e.g. writing to current user's own message list only), it's fine.
        // For this example, we'll assume it's for a 2-party chat for now.
        if (window.popupNotifier) popupNotifier.error('Cannot send message: Partner UID is missing.', 'Error');
        return;
    }


    console.log("chat-ui.js: Attempting to send message to chatID:", currentSelectedChatID, "Partner UID:", partnerUid);
    try {
        if(sendMessageButtonElement) sendMessageButtonElement.disabled = true;
        await sendMessageToChat(currentSelectedChatID, text, partnerUid); // Ensure SDK uses partnerUid
        console.log("chat-ui.js: Message sent successfully via SDK.");
        messageInputElement.value = '';
        messageInputElement.focus();
    } catch (err) {
        console.error('chat-ui.js: Failed to send message:', err);
        if (window.popupNotifier) popupNotifier.error('Could not send message.', 'Error');
    } finally {
        if (sendMessageButtonElement) sendMessageButtonElement.disabled = false;
    }
}

// --- Initialization and Auth State Changes ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("chat-ui.js: DOMContentLoaded event.");
    initializeDOMElements();
    if (typeof feather !== 'undefined') {
        feather.replace();
    } else {
         console.warn("chat-ui.js: feather is not defined on DOMContentLoaded.");
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('chat-ui.js: Auth state changed - User is logged in:', user.uid);
            // Dispatch custom event for other modules if needed, or handle directly
            document.dispatchEvent(new CustomEvent('app:userLoggedIn', { detail: { user } }));
        } else {
            console.log('chat-ui.js: Auth state changed - User is logged out.');
            document.dispatchEvent(new CustomEvent('app:userLoggedOut'));
        }
    });
});

document.addEventListener('app:userLoggedIn', (event) => {
    console.log('chat-ui.js: app:userLoggedIn event caught.');
    loadAndRenderChatList();
    if (!currentSelectedChatID) { // Only show placeholder if no chat was previously selected
        showPlaceholderScreen();
    }
});

document.addEventListener('app:userLoggedOut', () => {
    console.log('chat-ui.js: app:userLoggedOut event caught.');
    renderChatList([]);
    showPlaceholderScreen();
    if (chatListElement) { // Ensure element exists
         chatListElement.innerHTML = `<p style="padding: 20px; text-align: center; color: var(--secondary-text);">Please log in to see your conversations.</p>`;
    }
});