import { startNewChatWithUser, loadUserChatList } from './astranetSDKChat.js';

let chatListElement;

/**
 * Render provided chats in the chat list container.
 * Clears existing items before rendering.
 * @param {Array<{chatID: string, name: string}>} chats
 */
function renderChatList(chats = []) {
  if (!chatListElement) return;
  chatListElement.innerHTML = '';
  chats.forEach(({ chatID, name }) => {
    chatListElement.appendChild(
      createChatListItem(chatID, name || chatID)
    );
  });
}

async function loadAndRenderChatList() {
  const chats = await loadUserChatList();
  renderChatList(chats);
}

// UID of the default assistant account used for new conversations
const DEFAULT_PARTNER_UID = 'astranet-assistant';

function createChatListItem(chatID, chatName) {
  const item = document.createElement('div');
  item.className = 'flex items-center gap-4 bg-white px-4 min-h-14';
  item.innerHTML = `
    <div class="text-[#111418] flex items-center justify-center rounded-lg bg-[#f0f2f5] shrink-0 size-10" data-icon="ChatCircleDots" data-size="24px" data-weight="regular">
      <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
        <path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM84,116a12,12,0,1,0,12,12A12,12,0,0,0,84,116Zm88,0a12,12,0,1,0,12,12A12,12,0,0,0,172,116Zm60,12A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z"></path>
      </svg>
    </div>
    <p class="text-[#111418] text-base font-normal leading-normal flex-1 truncate">${chatName}</p>
  `;
  return item;
}

document.addEventListener('DOMContentLoaded', () => {
  const newChatBtn = document.getElementById('newChatButton');
  chatListElement = document.getElementById('chatList');
  if (!newChatBtn) return;

  // Load existing chats on startup
  loadAndRenderChatList();

  newChatBtn.addEventListener('click', async () => {
    try {
      const chatID = await startNewChatWithUser(DEFAULT_PARTNER_UID);
      console.log('New chat started with ID:', chatID);
      if (chatListElement) {
        chatListElement.appendChild(createChatListItem(chatID, 'Nuevo chat'));
      }
      if (window.popupNotifier) {
        popupNotifier.success('Conversación iniciada', 'Chat');
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
      if (window.popupNotifier) {
        popupNotifier.error('No se pudo iniciar el chat.', 'Error');
      }
    }
  });
});

// Reload chats when the auth state changes
document.addEventListener('app:userLoggedIn', loadAndRenderChatList);
document.addEventListener('app:userLoggedOut', () => {
  if (chatListElement) chatListElement.innerHTML = '';
});
