import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../components/AuthContext';
import { useSocket } from '../components/SocketContext';
import { useToast } from '@chakra-ui/react';
import { API_BASE_URL, CHAT_CONFIG } from '../utils/constants';

export const useChat = (otherUsername = null) => {
  const { currentUser, token, getAuthHeader } = useAuth();
  const { sendMessage: socketSendMessage, isConnected } = useSocket();
  const toast = useToast();
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedUser, setSelectedUser] = useState(otherUsername);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [draftMessage, setDraftMessage] = useState('');
  
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!currentUser || !token) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('Fetching conversations...');
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        headers: getAuthHeader(),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Conversations fetched:', data);
        setConversations(data);
        
        // Calculate total unread count
        const totalUnread = data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
        setUnreadCount(totalUnread);
      } else {
        console.error('Failed to fetch conversations:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Show error toast
        toast({
          title: 'Lỗi tải cuộc trò chuyện',
          description: 'Không thể tải danh sách cuộc trò chuyện',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Lỗi kết nối',
        description: 'Không thể kết nối đến server',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser, token, getAuthHeader, toast]);
  
  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (username) => {
    if (!username || !currentUser || !token) return;
    
    try {
      console.log('Fetching messages for:', username);
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/conversations/${username}/messages`, {
        headers: getAuthHeader(),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Messages fetched:', data.length);
        setMessages(data);
        
        // Mark messages as read
        await markMessagesAsRead(username);
      } else {
        console.error('Failed to fetch messages:', response.status);
        toast({
          title: 'Lỗi tải tin nhắn',
          description: 'Không thể tải tin nhắn',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Lỗi kết nối',
        description: 'Không thể tải tin nhắn',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser, token, getAuthHeader, toast]);
  
  // Send message
  const sendMessage = useCallback(async (content, postId = null, postLink = null) => {
    if (!selectedUser || !content.trim() || sending) return false;
    
    try {
      setSending(true);
      
      const messageData = {
        to_user: selectedUser,
        content: content.trim(),
        post_id: postId,
        post_link: postLink
      };
      
      const response = await fetch(`${API_BASE_URL}/conversations/${selectedUser}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(messageData),
      });
      
      if (response.ok) {
        const newMessage = await response.json();
        
        // Optimistically add message to state
        setMessages(prev => [...prev, newMessage]);
        
        // Clear draft
        setDraftMessage('');
        
        // Refresh conversations
        fetchConversations();
        
        return true;
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi tin nhắn',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    } finally {
      setSending(false);
    }
  }, [selectedUser, sending, getAuthHeader, toast, fetchConversations]);
  
  // Mark messages as read
  const markMessagesAsRead = useCallback(async (username) => {
    if (!username || !currentUser || !token) return;
    
    try {
      await fetch(`${API_BASE_URL}/conversations/${username}/read`, {
        method: 'PUT',
        headers: getAuthHeader(),
      });
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.other_user === username 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [currentUser, token, getAuthHeader]);
  
  // Delete message
  const deleteMessage = useCallback(async (messageId) => {
    if (!messageId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      
      if (response.ok) {
        // Update local state
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, is_deleted: true, content: 'Tin nhắn đã được thu hồi' }
              : msg
          )
        );
        
        toast({
          title: 'Thành công',
          description: 'Tin nhắn đã được thu hồi',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể thu hồi tin nhắn',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [getAuthHeader, toast]);
  
  // Typing indicators - Updated to use WebSocket messaging
  const startTyping = useCallback(() => {
    if (!selectedUser || !socketSendMessage || isTyping) return;
    
    setIsTyping(true);
    
    // Send typing start via WebSocket
    socketSendMessage({
      type: 'typing_start',
      conversation_id: `${currentUser?.username}_${selectedUser}`,
      other_user: selectedUser
    });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, CHAT_CONFIG.TYPING_TIMEOUT || 3000);
  }, [selectedUser, socketSendMessage, isTyping, currentUser?.username]);
  
  const stopTyping = useCallback(() => {
    if (!selectedUser || !socketSendMessage || !isTyping) return;
    
    setIsTyping(false);
    
    // Send typing stop via WebSocket
    socketSendMessage({
      type: 'typing_stop',
      conversation_id: `${currentUser?.username}_${selectedUser}`,
      other_user: selectedUser
    });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [selectedUser, socketSendMessage, isTyping, currentUser?.username]);
  
  // Select user and load messages
  const selectUser = useCallback(async (username, initialMessage = '') => {
    if (selectedUser === username) return;
    
    setSelectedUser(username);
    setDraftMessage(initialMessage);
    
    if (username) {
      await fetchMessages(username);
    }
  }, [selectedUser, fetchMessages]);
  
  // WebSocket event handlers - Updated to use window events
  useEffect(() => {
    const handleNewMessage = (event) => {
      console.log('🔥 useChat: Received new message event:', event.detail);
      const data = event.detail;
      const message = data?.message;
      if (!message) return;
      
      console.log('🔥 useChat: Processing message from:', message.from_user, 'to:', message.to_user);
      console.log('🔥 useChat: Current selectedUser:', selectedUser);
      console.log('🔥 useChat: Current user:', currentUser?.username);
      
      if (selectedUser && (message.from_user === selectedUser || message.to_user === selectedUser)) {
        console.log('✅ useChat: Adding message to current conversation');
        setMessages(prev => {
          const exists = prev.some(m => m.id === message.id);
          if (!exists) {
            return [...prev, message];
          }
          return prev;
        });
      } else {
        console.log('❌ useChat: Message not for current conversation');
      }
      
      // Update conversations
      fetchConversations();
    };
    
    const handleTypingStart = (event) => {
      const { username } = event.detail;
      if (username === selectedUser) {
        setOtherUserTyping(true);
      }
    };
    
    const handleTypingStop = (event) => {
      const { username } = event.detail;
      if (username === selectedUser) {
        setOtherUserTyping(false);
      }
    };
    
    // Add window event listeners
    window.addEventListener('socket:new_message', handleNewMessage);
    window.addEventListener('socket:typing_start', handleTypingStart);
    window.addEventListener('socket:typing_stop', handleTypingStop);
    
    return () => {
      // Remove window event listeners
      window.removeEventListener('socket:new_message', handleNewMessage);
      window.removeEventListener('socket:typing_start', handleTypingStart);
      window.removeEventListener('socket:typing_stop', handleTypingStop);
    };
  }, [selectedUser, fetchConversations, currentUser?.username]);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, otherUserTyping]);
  
  // Load initial data
  useEffect(() => {
    if (currentUser && token) {
      console.log('Loading initial data...');
      fetchConversations();
      
      if (otherUsername) {
        selectUser(otherUsername);
      }
    } else {
      setLoading(false);
    }
  }, [currentUser, token, otherUsername, fetchConversations, selectUser]);
  
  return {
    conversations,
    messages,
    loading,
    sending,
    selectedUser,
    isTyping,
    otherUserTyping,
    unreadCount,
    draftMessage,
    setDraftMessage,
    sendMessage,
    deleteMessage,
    selectUser,
    startTyping,
    stopTyping,
    messagesEndRef
  };
}; 