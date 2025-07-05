import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

// Export hook as named export
export const useSocket = () => {
  return useContext(SocketContext);
};

// SocketProvider component
const SocketProvider = ({ children }) => {
  const websocket = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map()); // username -> conversation_id
  const { token, currentUser } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = useRef(null);
  
  // Only track username, not the entire currentUser object
  const username = currentUser?.username;

  // Utility functions for real-time features
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/notification.mp3'); // Add notification sound file
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Fallback to system beep
        console.log('🔔 New notification');
      });
    } catch (e) {
      console.log('🔔 New notification');
    }
  }, []);

  const showDesktopNotification = useCallback((title, body, icon) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag: 'uit-notification',
        renotify: true
      });
    }
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // WebSocket connection function
  const connectWebSocket = useCallback(() => {
    if (!token || !username) {
      console.log('❌ Cannot connect WebSocket: missing token or username');
      return;
    }

    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return;
    }

    try {
      console.log('🔌 Connecting to WebSocket...');
      const wsUrl = `ws://localhost:8000/ws/${username}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      
      websocket.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Clear any existing reconnect interval
        if (reconnectInterval.current) {
          clearTimeout(reconnectInterval.current);
          reconnectInterval.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
          
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('❌ WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setOnlineUsers(new Set());
        setTypingUsers(new Map());
        
        // Attempt to reconnect unless manually disconnected
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          console.log(`🔄 Attempting to reconnect in ${delay}ms... (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectInterval.current = setTimeout(() => {
            reconnectAttempts.current++;
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('🔴 WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      setIsConnected(false);
    }
  }, [token, username]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    const { type } = data;
    
    switch (type) {
      case 'ping':
        // Respond to ping with pong
        sendMessage({ type: 'pong' });
        break;
        
      case 'online_users':
        console.log('👥 Online users:', data.users?.length || 0);
        setOnlineUsers(new Set(data.users || []));
        window.dispatchEvent(new CustomEvent('socket:online_users', { detail: data }));
        break;
        
      case 'user_status':
        console.log('👤 User status change:', data.username, data.status);
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (data.status === 'online') {
            newSet.add(data.username);
          } else {
            newSet.delete(data.username);
          }
          return newSet;
        });
        window.dispatchEvent(new CustomEvent('socket:user_status', { detail: data }));
        break;
        
      case 'new_message':
        console.log('🔥 SocketContext: New message received:', data);
        console.log('🔥 SocketContext: Current username:', username);
        console.log('🔥 SocketContext: Message from user:', data.message?.from_user);
        console.log('🔥 SocketContext: Message to user:', data.message?.to_user);
        
        // Play sound for new messages (except own messages)
        if (data.message?.from_user !== username) {
          console.log('🔔 SocketContext: Playing notification sound');
          playNotificationSound();
          
          // Show desktop notification
          if (data.message?.from_user_info?.full_name) {
            showDesktopNotification(
              `Tin nhắn mới từ ${data.message.from_user_info.full_name}`,
              data.message.content,
              data.message.from_user_info.avatar_url
            );
          }
        } else {
          console.log('🔇 SocketContext: Not playing sound (own message)');
        }
        
        // Emit to chat page for real-time update
        console.log('📡 SocketContext: Dispatching socket:new_message event');
        window.dispatchEvent(new CustomEvent('socket:new_message', { detail: data }));
        break;
        
      case 'message_deleted':
        console.log('🗑️ Message deleted:', data);
        window.dispatchEvent(new CustomEvent('socket:message_deleted', { detail: data }));
        break;
        
      case 'typing_start':
        console.log('⌨️ User started typing:', data);
        setTypingUsers(prev => new Map(prev.set(data.username, data.conversation_id)));
        window.dispatchEvent(new CustomEvent('socket:typing_start', { detail: data }));
        break;
        
      case 'typing_stop':
        console.log('⌨️ User stopped typing:', data);
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.username);
          return newMap;
        });
        window.dispatchEvent(new CustomEvent('socket:typing_stop', { detail: data }));
        break;
        
      case 'message_read':
        console.log('👀 Message read:', data);
        window.dispatchEvent(new CustomEvent('socket:message_read', { detail: data }));
        break;
        
      case 'notification':
        console.log('🔔 New notification:', data);
        playNotificationSound();
        
        // Show desktop notification
        showDesktopNotification(data.data?.title || data.title, data.data?.message || data.message);
        
        // Emit to notification center
        window.dispatchEvent(new CustomEvent('socket:notification', { detail: data }));
        break;
        
      case 'new_comment':
        console.log('💬 New comment:', data);
        
        // Play sound for comments on own posts
        if (data.comment?.post_author === username) {
          playNotificationSound();
          showDesktopNotification(
            'Bình luận mới',
            `${data.comment?.author_info?.full_name || data.comment?.author} đã bình luận trên bài viết của bạn`
          );
        }
        
        window.dispatchEvent(new CustomEvent('socket:new_comment', { detail: data }));
        break;
        
      case 'deleted_comment':
        console.log('🗑️ Comment deleted:', data);
        window.dispatchEvent(new CustomEvent('socket:deleted_comment', { detail: data }));
        break;
        
      case 'post_updated':
        console.log('📝 Post updated:', data);
        window.dispatchEvent(new CustomEvent('socket:post_updated', { detail: data }));
        break;
        
      case 'post_deleted':
        console.log('🗑️ Post deleted:', data);
        window.dispatchEvent(new CustomEvent('socket:post_deleted', { detail: data }));
        break;
        
      default:
        console.log('❓ Unknown message type:', type, data);
    }
  }, [username, playNotificationSound, showDesktopNotification]);

  // Send message via WebSocket
  const sendMessage = useCallback((message) => {
    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
      websocket.current.send(JSON.stringify(message));
      return true;
    } else {
      console.log('❌ Cannot send message: WebSocket not connected');
      return false;
    }
  }, []);

  // Connect WebSocket when token and username are available
  useEffect(() => {
    if (token && username) {
      connectWebSocket();
    } else {
      // Disconnect if no auth
      if (websocket.current) {
        console.log('🔌 Disconnecting WebSocket (no auth)...');
        websocket.current.close(1000, 'No authentication');
        setIsConnected(false);
        setOnlineUsers(new Set());
        setTypingUsers(new Map());
      }
    }
  }, [token, username, connectWebSocket]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (reconnectInterval.current) {
        clearTimeout(reconnectInterval.current);
      }
      if (websocket.current) {
        console.log('🧹 Cleaning up WebSocket connection...');
        websocket.current.close(1000, 'Component unmount');
        websocket.current = null;
      }
    };
  }, []);

  // WebSocket utility functions
  const socketUtils = {
    // Messaging
    emitTypingStart: useCallback((conversationId, otherUser) => {
      sendMessage({ 
        type: 'typing_start', 
        conversation_id: conversationId,
        other_user: otherUser
      });
    }, [sendMessage]),

    emitTypingStop: useCallback((conversationId, otherUser) => {
      sendMessage({ 
        type: 'typing_stop', 
        conversation_id: conversationId,
        other_user: otherUser
      });
    }, [sendMessage]),

    // Post rooms
    joinPostRoom: useCallback((postId) => {
      const success = sendMessage({ type: 'join_post_room', post_id: postId });
      if (success) {
        console.log('🏠 Joined post room:', postId);
      }
    }, [sendMessage]),

    leavePostRoom: useCallback((postId) => {
      const success = sendMessage({ type: 'leave_post_room', post_id: postId });
      if (success) {
        console.log('🚪 Left post room:', postId);
      }
    }, [sendMessage]),

    // Message status
    markMessageAsRead: useCallback((messageId) => {
      sendMessage({ type: 'mark_message_read', message_id: messageId });
    }, [sendMessage]),

    // General send
    sendMessage: sendMessage,
    
    // Connection management
    reconnect: connectWebSocket
  };

  const contextValue = {
    socket: websocket.current,
    isConnected,
    onlineUsers,
    typingUsers,
    ...socketUtils
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Export SocketProvider as default
export default SocketProvider; 
