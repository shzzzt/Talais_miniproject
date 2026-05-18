const MAX_CHAT_MESSAGES = 60;
const MAX_ARCHIVED_SESSIONS = 30;

export function chatHistoryKey(userId, scope) {
  return `talais.parent-chat.${userId || 'guest'}.${scope}`;
}

export function chatArchiveKey(userId, scope) {
  return `talais.parent-chat-archive.${userId || 'guest'}.${scope}`;
}

export function loadChatHistory(key, fallback = []) {
  if (!key || typeof window === 'undefined') return fallback;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    const messages = Array.isArray(parsed)
      ? parsed
          .filter((msg) => ['user', 'assistant'].includes(msg?.role) && typeof msg?.text === 'string')
          .map((msg) => ({ role: msg.role, text: msg.text }))
      : [];

    return messages.length ? messages.slice(-MAX_CHAT_MESSAGES) : fallback;
  } catch (_) {
    return fallback;
  }
}

export function saveChatHistory(key, messages) {
  if (!key || typeof window === 'undefined') return;

  const cleanMessages = (messages || [])
    .filter((msg) => ['user', 'assistant'].includes(msg?.role) && typeof msg?.text === 'string')
    .slice(-MAX_CHAT_MESSAGES);

  window.localStorage.setItem(key, JSON.stringify(cleanMessages));
}

export function loadArchivedChatSessions(userId, scope = 'home') {
  if (typeof window === 'undefined') return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(chatArchiveKey(userId, scope)) || '[]');

    return Array.isArray(parsed)
      ? parsed
          .filter((session) => Array.isArray(session?.messages) && session.messages.length > 0)
          .map((session) => ({
            id: session.id || `${Date.now()}`,
            title: session.title || 'Conversation',
            createdAt: session.createdAt || new Date().toISOString(),
            messages: session.messages
              .filter((msg) => ['user', 'assistant'].includes(msg?.role) && typeof msg?.text === 'string')
              .map((msg) => ({ role: msg.role, text: msg.text }))
              .slice(-MAX_CHAT_MESSAGES),
          }))
      : [];
  } catch (_) {
    return [];
  }
}

export function archiveActiveChatSession(userId, scope = 'home') {
  if (typeof window === 'undefined') return null;

  const activeKey = chatHistoryKey(userId, scope);
  const messages = loadChatHistory(activeKey, []);
  const userMessages = messages.filter((msg) => msg.role === 'user');

  window.localStorage.removeItem(activeKey);

  if (userMessages.length === 0) {
    return null;
  }

  const archived = loadArchivedChatSessions(userId, scope);
  const firstUserMessage = userMessages[0]?.text || 'Conversation';
  const session = {
    id: `${Date.now()}`,
    title: firstUserMessage.length > 64 ? `${firstUserMessage.slice(0, 61)}...` : firstUserMessage,
    createdAt: new Date().toISOString(),
    messages,
  };

  window.localStorage.setItem(
    chatArchiveKey(userId, scope),
    JSON.stringify([session, ...archived].slice(0, MAX_ARCHIVED_SESSIONS)),
  );

  return session;
}
