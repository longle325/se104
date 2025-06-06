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
  Heading,
  Image,
  Card,
  CardBody,
  CardHeader,
  Circle,
  Stack,
  Tooltip
} from '@chakra-ui/react';
import { ArrowBackIcon, ChatIcon } from '@chakra-ui/icons';
import { useAuth } from '../components/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import Navigation from '../components/Navigation';

// Import BOX CHAT assets
import chatTrucTiepIcon from '../assets/BOX CHAT/chattructiep@4x.png';
import danhSachTinNhanIcon from '../assets/BOX CHAT/danhsachtinnhan@4x.png';
import sendIcon from '../assets/BOX CHAT/send_17524267.png';
import thanhChatIcon from '../assets/BOX CHAT/thanhchat@4x.png';
import leftArrowIcon from '../assets/BOX CHAT/left-arrow_318226.png';

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
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const messageBg = useColorModeValue('blue.500', 'blue.600');
  const receivedBg = useColorModeValue('gray.100', 'gray.700');

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
                title: `Tin nhắn mới từ ${message.from_user}`,
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

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        setOnlineUsers(data);
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    if (currentUser && token) {
      fetchConversations();
      fetchOnlineUsers();
      
      if (otherUsername) {
        setSelectedUser(otherUsername);
        fetchMessages(otherUsername);
      }
    }
  }, [currentUser, token, otherUsername]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || sending) return;
    
    setSending(true);
    try {
      const response = await fetch('http://localhost:8000/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          to_user: selectedUser,
          content: newMessage.trim(),
        }),
      });
      
      if (response.ok) {
        setNewMessage('');
        // Message will be added via WebSocket
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi tin nhắn',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectUser = (username) => {
    setSelectedUser(username);
    fetchMessages(username);
    navigate(`/chat/${username}`);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUnreadCount = (conversation) => {
    if (!conversation.last_message) return 0;
    return conversation.last_message.from_user !== currentUser.username && !conversation.last_message.is_read ? 1 : 0;
  };

  if (loading) {
    return (
      <Navigation>
        <Container maxW="7xl" h="calc(100vh - 100px)" py={6}>
          <Flex justify="center" align="center" h="full">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text color="gray.600">Đang tải...</Text>
            </VStack>
          </Flex>
        </Container>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <Container maxW="7xl" h="calc(100vh - 100px)" py={6}>
        <Card bg={cardBg} shadow="2xl" borderRadius="2xl" h="full" overflow="hidden">
          <CardHeader bg="blue.500" color="white" py={4}>
            <HStack spacing={3} align="center">
              <Image src={chatTrucTiepIcon} alt="Chat" boxSize="32px" />
              <Heading size="lg" fontWeight="bold">
                Chat trực tiếp
              </Heading>
              <Circle size="12px" bg={wsConnected ? 'green.400' : 'red.400'} />
            </HStack>
          </CardHeader>

          <CardBody p={0} h="calc(100% - 80px)">
            <Flex h="full">
              {/* Conversations Sidebar */}
              <Box
                w="350px"
                h="full"
                borderRight="1px solid"
                borderColor={borderColor}
                bg={bgColor}
              >
                <VStack spacing={0} h="full">
                  {/* Sidebar Header */}
                  <Box w="full" p={4} borderBottom="1px solid" borderColor={borderColor}>
                    <HStack spacing={3}>
                      <Image src={danhSachTinNhanIcon} alt="Messages" boxSize="24px" />
                      <Text fontWeight="bold" color="gray.700">
                        Danh sách tin nhắn
                      </Text>
                    </HStack>
                  </Box>

                  {/* Conversations List */}
                  <Box w="full" flex={1} overflowY="auto">
                    {conversations.length === 0 ? (
                      <VStack spacing={4} p={8} color="gray.500">
                        <Image src={thanhChatIcon} alt="No chat" boxSize="60px" opacity={0.5} />
                        <Text textAlign="center" fontSize="sm">
                          Chưa có cuộc trò chuyện nào
                        </Text>
                      </VStack>
                    ) : (
                      <VStack spacing={0} align="stretch">
                        {conversations.map((conversation) => {
                          const otherUser = conversation.participants.find(p => p !== currentUser.username);
                          const isSelected = selectedUser === otherUser;
                          const unreadCount = getUnreadCount(conversation);
                          
                          return (
                            <Box
                              key={conversation.id || otherUser}
                              p={4}
                              cursor="pointer"
                              bg={isSelected ? 'blue.50' : 'transparent'}
                              borderLeft={isSelected ? '4px solid' : '4px solid transparent'}
                              borderLeftColor={isSelected ? 'blue.500' : 'transparent'}
                              _hover={{ bg: 'blue.50' }}
                              transition="all 0.2s"
                              onClick={() => selectUser(otherUser)}
                            >
                              <HStack spacing={3} align="start">
                                <Box position="relative">
                                  <Avatar 
                                    size="md" 
                                    name={otherUser}
                                    bg="blue.500"
                                  />
                                  {onlineUsers.includes(otherUser) && (
                                    <Circle
                                      size="12px"
                                      bg="green.400"
                                      border="2px solid white"
                                      position="absolute"
                                      bottom="0"
                                      right="0"
                                    />
                                  )}
                                </Box>
                                
                                <VStack align="start" spacing={1} flex={1} minW={0}>
                                  <HStack justify="space-between" w="full">
                                    <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                                      {otherUser}
                                    </Text>
                                    {conversation.last_message && (
                                      <Text fontSize="xs" color="gray.500">
                                        {formatTime(conversation.last_message.timestamp)}
                                      </Text>
                                    )}
                                  </HStack>
                                  
                                  <HStack justify="space-between" w="full">
                                    <Text
                                      fontSize="xs"
                                      color="gray.600"
                                      noOfLines={1}
                                      flex={1}
                                    >
                                      {conversation.last_message?.content || 'Bắt đầu cuộc trò chuyện'}
                                    </Text>
                                    {unreadCount > 0 && (
                                      <Badge
                                        colorScheme="red"
                                        borderRadius="full"
                                        fontSize="xs"
                                      >
                                        {unreadCount}
                                      </Badge>
                                    )}
                                  </HStack>
                                </VStack>
                              </HStack>
                            </Box>
                          );
                        })}
                      </VStack>
                    )}
                  </Box>
                </VStack>
              </Box>

              {/* Chat Area */}
              <Box flex={1} h="full" bg="white">
                {selectedUser ? (
                  <VStack spacing={0} h="full">
                    {/* Chat Header */}
                    <Box
                      w="full"
                      p={4}
                      borderBottom="1px solid"
                      borderColor={borderColor}
                      bg="white"
                    >
                      <HStack spacing={3} align="center">
                        <Tooltip label="Quay lại danh sách">
                          <IconButton
                            icon={<Image src={leftArrowIcon} alt="Back" boxSize="16px" />}
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedUser(null)}
                            display={{ base: 'flex', md: 'none' }}
                          />
                        </Tooltip>
                        
                        <Avatar size="sm" name={selectedUser} bg="blue.500" />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" fontSize="md">
                            {selectedUser}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {onlineUsers.includes(selectedUser) ? 'Đang hoạt động' : 'Không hoạt động'}
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>

                    {/* Messages Area */}
                    <Box
                      flex={1}
                      w="full"
                      overflowY="auto"
                      p={4}
                      bg="gray.50"
                    >
                      <VStack spacing={3} align="stretch">
                        {messages.map((message) => {
                          const isOwn = message.from_user === currentUser.username;
                          return (
                            <Flex
                              key={message.id}
                              justify={isOwn ? 'flex-end' : 'flex-start'}
                            >
                              <Box
                                maxW="70%"
                                bg={isOwn ? messageBg : receivedBg}
                                color={isOwn ? 'white' : 'gray.800'}
                                px={4}
                                py={2}
                                borderRadius="2xl"
                                borderBottomRightRadius={isOwn ? 'md' : '2xl'}
                                borderBottomLeftRadius={isOwn ? '2xl' : 'md'}
                                shadow="sm"
                              >
                                <Text fontSize="sm" lineHeight="1.4">
                                  {message.content}
                                </Text>
                                <Text
                                  fontSize="xs"
                                  color={isOwn ? 'blue.100' : 'gray.500'}
                                  mt={1}
                                  textAlign="right"
                                >
                                  {formatTime(message.timestamp)}
                                </Text>
                              </Box>
                            </Flex>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </VStack>
                    </Box>

                    {/* Message Input */}
                    <Box
                      w="full"
                      p={4}
                      borderTop="1px solid"
                      borderColor={borderColor}
                      bg="white"
                    >
                      <HStack spacing={3}>
                        <InputGroup size="lg">
                          <Input
                            placeholder="Nhập tin nhắn..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            borderRadius="full"
                            border="2px solid"
                            borderColor="gray.200"
                            _focus={{
                              borderColor: 'blue.400',
                              boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)'
                            }}
                            disabled={sending}
                          />
                          <InputRightElement width="48px">
                            <IconButton
                              icon={<Image src={sendIcon} alt="Send" boxSize="20px" />}
                              size="sm"
                              borderRadius="full"
                              colorScheme="blue"
                              onClick={sendMessage}
                              isLoading={sending}
                              disabled={!newMessage.trim() || sending}
                            />
                          </InputRightElement>
                        </InputGroup>
                      </HStack>
                    </Box>
                  </VStack>
                ) : (
                  <Flex
                    h="full"
                    align="center"
                    justify="center"
                    direction="column"
                    color="gray.500"
                    bg="gray.50"
                  >
                    <VStack spacing={4}>
                      <Image src={thanhChatIcon} alt="Select chat" boxSize="100px" opacity={0.5} />
                      <Text fontSize="lg" fontWeight="medium">
                        Chọn một cuộc trò chuyện
                      </Text>
                      <Text fontSize="sm" textAlign="center" color="gray.400">
                        Chọn từ danh sách bên trái để bắt đầu nhắn tin
                      </Text>
                    </VStack>
                  </Flex>
                )}
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </Container>
    </Navigation>
  );
};

export default ChatPage;