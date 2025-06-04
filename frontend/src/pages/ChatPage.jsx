import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Avatar,
  Divider,
  useToast,
  Spinner,
  Badge,
  IconButton,
  Flex,
  Container,
  InputGroup,
  InputRightElement,
  useColorModeValue,
  Heading
} from '@chakra-ui/react';
import { ArrowBackIcon, ChatIcon } from '@chakra-ui/icons';
import { useAuth } from '../components/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const ChatPage = () => {
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();
  const { otherUsername } = useParams();
  const toast = useToast();
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedUser, setSelectedUser] = useState(otherUsername || null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // WebSocket Connection
  useEffect(() => {
    if (!currentUser || !token) return;
    
    const connectWebSocket = () => {
      const wsUrl = `ws://localhost:8000/ws/${currentUser.username}?token=${token}`;
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        
        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
        
        // Store interval to clear it later
        ws.current.pingInterval = pingInterval;
      };
      
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'new_message') {
            const message = data.message;
            // Update messages if viewing this conversation
            if (selectedUser && 
                (message.from_user === selectedUser || message.to_user === selectedUser)) {
              setMessages(prev => [...prev, message]);
            }
            
            // Update conversations list
            fetchConversations();
            
            // Show notification if not the current conversation
            if (!selectedUser || 
                (message.from_user !== selectedUser && message.from_user !== currentUser.username)) {
              toast({
                title: `New message from ${message.from_user}`,
                description: message.content,
                status: 'info',
                duration: 3000,
                isClosable: true,
              });
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        if (ws.current.pingInterval) {
          clearInterval(ws.current.pingInterval);
        }
        
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };
    };
    
    connectWebSocket();
    
    return () => {
      if (ws.current) {
        if (ws.current.pingInterval) {
          clearInterval(ws.current.pingInterval);
        }
        ws.current.close();
      }
    };
  }, [currentUser, token, selectedUser]);
  
  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch('http://localhost:8000/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch messages for selected conversation
  const fetchMessages = async (username) => {
    try {
      const response = await fetch(`http://localhost:8000/conversations/${username}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        
        // Mark messages as read
        await markAsRead(username);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  // Mark messages as read
  const markAsRead = async (username) => {
    try {
      await fetch(`http://localhost:8000/conversations/${username}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };
  
  // Fetch online users
  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/chat/online-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setOnlineUsers(data.online_users);
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
    }
  };
  
  // Send message via WebSocket
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedUser || !wsConnected) return;
    
    setSending(true);
    
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'send_message',
        to_user: selectedUser,
        content: newMessage
      }));
      
      setNewMessage('');
    } else {
      toast({
        title: 'Connection Error',
        description: 'WebSocket not connected. Please try again.',
        status: 'error',
        duration: 3000,
      });
    }
    
    setSending(false);
  };
  
  // Select user to chat with
  const selectUser = (username) => {
    setSelectedUser(username);
    fetchMessages(username);
  };
  
  // Initial data fetch
  useEffect(() => {
    if (currentUser && token) {
      fetchConversations();
      fetchOnlineUsers();
      
      if (otherUsername) {
        selectUser(otherUsername);
      }
    }
  }, [currentUser, token, otherUsername]);
  
  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Periodically fetch online users
  useEffect(() => {
    const interval = setInterval(fetchOnlineUsers, 60000); // Every minute
    return () => clearInterval(interval);
  }, [token]);
  
  if (!currentUser) {
    navigate('/login');
    return null;
  }
  
  return (
    <Container maxW="full" p={4}>
      <HStack spacing={4} align="stretch" height="calc(100vh - 120px)">
        {/* Conversations Sidebar */}
        <Box
          w="350px"
          bg={bgColor}
          border="1px"
          borderColor={borderColor}
          borderRadius="lg"
          p={4}
        >
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between">
              <Heading size="md">Messages</Heading>
              <Badge colorScheme={wsConnected ? 'green' : 'red'}>
                {wsConnected ? 'Online' : 'Offline'}
              </Badge>
            </HStack>
            
            <Divider />
            
            {loading ? (
              <Spinner />
            ) : conversations.length === 0 ? (
              <Text color="gray.500" textAlign="center">
                No conversations yet
              </Text>
            ) : (
              conversations.map((conv) => (
                <Box
                  key={conv.id}
                  p={3}
                  cursor="pointer"
                  borderRadius="md"
                  bg={selectedUser === conv.other_user.username ? 'blue.50' : 'transparent'}
                  _hover={{ bg: 'gray.50' }}
                  onClick={() => selectUser(conv.other_user.username)}
                >
                  <HStack>
                    <Avatar 
                      size="sm" 
                      name={conv.other_user.full_name || conv.other_user.username}
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(conv.other_user.full_name || conv.other_user.username)}&background=random`}
                    />
                    <VStack align="start" spacing={0} flex={1}>
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="medium" fontSize="sm">
                          {conv.other_user.full_name || conv.other_user.username}
                        </Text>
                        {onlineUsers.includes(conv.other_user.username) && (
                          <Badge size="sm" colorScheme="green">Online</Badge>
                        )}
                      </HStack>
                      <Text fontSize="xs" color="gray.500" noOfLines={1}>
                        {conv.last_message?.content || 'No messages yet'}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
        </Box>
        
        {/* Chat Area */}
        <Box flex={1} bg={bgColor} border="1px" borderColor={borderColor} borderRadius="lg">
          {selectedUser ? (
            <VStack h="full" spacing={0}>
              {/* Chat Header */}
              <HStack w="full" p={4} borderBottom="1px" borderColor={borderColor}>
                <IconButton
                  icon={<ArrowBackIcon />}
                  variant="ghost"
                  onClick={() => setSelectedUser(null)}
                  aria-label="Back"
                />
                <Avatar 
                  size="sm" 
                  name={selectedUser}
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser)}&background=random`}
                />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="medium">{selectedUser}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {onlineUsers.includes(selectedUser) ? 'Online' : 'Offline'}
                  </Text>
                </VStack>
              </HStack>
              
              {/* Messages */}
              <Box flex={1} w="full" overflowY="auto" p={4}>
                <VStack align="stretch" spacing={3}>
                  {messages.map((message) => (
                    <Flex
                      key={message.id}
                      justify={message.from_user === currentUser.username ? 'flex-end' : 'flex-start'}
                    >
                      <Box
                        maxW="70%"
                        bg={message.from_user === currentUser.username ? 'blue.500' : 'gray.100'}
                        color={message.from_user === currentUser.username ? 'white' : 'black'}
                        p={3}
                        borderRadius="lg"
                        borderBottomRightRadius={message.from_user === currentUser.username ? 'sm' : 'lg'}
                        borderBottomLeftRadius={message.from_user === currentUser.username ? 'lg' : 'sm'}
                      >
                        <Text>{message.content}</Text>
                        <Text
                          fontSize="xs"
                          color={message.from_user === currentUser.username ? 'blue.100' : 'gray.500'}
                          mt={1}
                        >
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Text>
                      </Box>
                    </Flex>
                  ))}
                  <div ref={messagesEndRef} />
                </VStack>
              </Box>
              
              {/* Message Input */}
              <Box w="full" p={4} borderTop="1px" borderColor={borderColor}>
                <InputGroup>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={!wsConnected}
                  />
                  <InputRightElement>
                    <IconButton
                      icon={<ChatIcon />}
                      size="sm"
                      colorScheme="blue"
                      onClick={sendMessage}
                      isLoading={sending}
                      disabled={!newMessage.trim() || !wsConnected}
                      aria-label="Send message"
                    />
                  </InputRightElement>
                </InputGroup>
              </Box>
            </VStack>
          ) : (
            <Flex h="full" align="center" justify="center">
              <VStack spacing={4}>
                <ChatIcon boxSize={16} color="gray.400" />
                <Text color="gray.500" fontSize="lg">
                  Select a conversation to start chatting
                </Text>
              </VStack>
            </Flex>
          )}
        </Box>
      </HStack>
    </Container>
  );
};

export default ChatPage; 