import { startNewChatWithUser } from './astranetSDKChat.js';

// TODO: replace with actual UID of the assistant or conversation partner
const DEFAULT_PARTNER_UID = 'REPLACE_WITH_PARTNER_UID';

document.addEventListener('DOMContentLoaded', () => {
  const newChatBtn = document.getElementById('newChatButton');
  if (!newChatBtn) return;

  newChatBtn.addEventListener('click', async () => {
    try {
      const chatID = await startNewChatWithUser(DEFAULT_PARTNER_UID);
      console.log('New chat started with ID:', chatID);
      // Here you could update the UI or redirect to the chat session
    } catch (err) {
      console.error('Failed to start chat:', err);
      if (window.popupNotifier) {
        popupNotifier.error('No se pudo iniciar el chat.', 'Error');
      }
    }
  });
});
