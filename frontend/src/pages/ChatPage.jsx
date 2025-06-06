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
import { ArrowBackIcon, ChatIcon, CloseIcon, DeleteIcon, RepeatIcon, ArrowForwardIcon } from '@chakra-ui/icons';
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
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const messageBg = useColorModeValue('blue.500', 'blue.600');
  const receivedBg = useColorModeValue('gray.100', 'gray.700');

  // WebSocket Connection with improved realtime handling
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
            
            // Update messages if viewing this conversation - REALTIME UPDATE
            if (selectedUser && 
                (message.from_user === selectedUser || message.to_user === selectedUser)) {
              setMessages(prev => {
                // Check if message already exists to prevent duplicates
                const messageExists = prev.some(m => m.id === message.id);
                if (!messageExists) {
                  return [...prev, message];
                }
                return prev;
              });
            }
            
            // Update conversations list immediately
            fetchConversations();
            
            // Show notification if not the current conversation
            if (!selectedUser || 
                (message.from_user !== selectedUser && message.from_user !== currentUser.username)) {
              toast({
                title: `Tin nhắn mới từ ${message.from_user}`,
                description: message.content,
                status: 'info',
                duration: 5000,
                isClosable: true,
                position: 'top-right'
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
        if (ws.current?.pingInterval) {
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
  }, [currentUser, token]);

  // Enhanced auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      const scrollContainer = messagesEndRef.current.parentElement?.parentElement;
      if (scrollContainer) {
        // Check if user is near bottom before auto-scrolling
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        if (isNearBottom || messages.length === 1) {
          // Smooth scroll to bottom
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'end',
              inline: 'nearest'
            });
          }, 100);
        }
      }
    }
  }, [messages]);

  // Auto-select user from URL parameter
  useEffect(() => {
    if (otherUsername && !selectedUser) {
      setSelectedUser(otherUsername);
    }
  }, [otherUsername, selectedUser]);

  // Set selectedUserInfo when selectedUser changes and conversations are loaded
  useEffect(() => {
    if (selectedUser && conversations.length > 0) {
      const conversation = conversations.find(conv => 
        conv.other_user?.username === selectedUser || 
        conv.participants?.includes(selectedUser)
      );
      
      if (conversation?.other_user) {
        setSelectedUserInfo(conversation.other_user);
      } else {
        setSelectedUserInfo({ username: selectedUser, full_name: selectedUser, avatar_url: null });
      }
    }
  }, [selectedUser, conversations]);

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser);
    }
  }, [selectedUser]);

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
    fetchConversations();
    fetchOnlineUsers();
    
    // Refresh online users every 30 seconds
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Enhanced send message with immediate UI update
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately
    setSending(true);

    // Create temporary message for immediate UI update
    const tempMessage = {
      id: `temp-${Date.now()}`,
      from_user: currentUser.username,
      to_user: selectedUser,
      content: messageContent,
      timestamp: new Date().toISOString(),
      is_temp: true,
      reply_to: replyingTo?.id || null,
      reply_content: replyingTo?.content || null,
      reply_author: replyingTo?.from_user || null
    };

    // Add temporary message to UI immediately
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch(`http://localhost:8000/conversations/${selectedUser}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          to_user: selectedUser,
          content: messageContent,
          reply_to: replyingTo?.id || null,
        }),
      });

      if (response.ok) {
        const sentMessage = await response.json();
        
        // Replace temporary message with real message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? sentMessage : msg
          )
        );
        
        // Clear reply state
        setReplyingTo(null);
        
        // Update conversations list
        fetchConversations();
      } else {
        // Remove temporary message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        throw new Error('Failed to send message');
      }
    } catch (error) {
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      
      toast({
        title: "Lỗi",
        description: "Không thể gửi tin nhắn",
        status: "error",
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
    } else if (e.key === 'Escape') {
      // Cancel reply or edit
      setReplyingTo(null);
      setEditingMessage(null);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi tin nhắn này?')) return;

    try {
      const response = await fetch(`http://localhost:8000/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove message from UI immediately
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        toast({
          title: "Thành công",
          description: "Tin nhắn đã được thu hồi",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to delete message');
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thu hồi tin nhắn",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    setEditingMessage(null);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const selectUser = (username) => {
    setSelectedUser(username);
    setReplyingTo(null);
    
    // Find user info from conversations
    const conversation = conversations.find(conv => 
      conv.other_user?.username === username || 
      conv.participants?.includes(username)
    );
    
    if (conversation?.other_user) {
      setSelectedUserInfo(conversation.other_user);
    } else {
      // Fallback to username only
      setSelectedUserInfo({ username, full_name: username, avatar_url: null });
    }
    
    navigate(`/chat/${username}`);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const getUnreadCount = (conversation) => {
    if (!conversation.last_message) return 0;
    
    const otherUser = conversation.participants.find(p => p !== currentUser.username);
    if (conversation.last_message.from_user === currentUser.username) return 0;
    
    return conversation.last_message.is_read ? 0 : 1;
  };

  if (loading) {
    return (
      <Navigation>
        <Box h="100vh" bg={bgColor}>
          <Flex justify="center" align="center" h="full">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text color="gray.600">Đang tải...</Text>
            </VStack>
          </Flex>
        </Box>
      </Navigation>
    );
  }

  return (
    <Navigation>
      {/* Chat Interface - Adjusted height for new navbar */}
      <Box h="calc(100vh - 64px)" bg={bgColor} overflow="hidden">
        <Card bg={cardBg} shadow="none" borderRadius="0" h="full" overflow="hidden">
          <CardHeader bg="blue.500" color="white" py={4} px={6}>
            <HStack spacing={3} align="center">
              <Image src={chatTrucTiepIcon} alt="Chat" boxSize="32px" />
              <Heading size="lg" fontWeight="bold">
                Chat
              </Heading>
              <Circle size="12px" bg={wsConnected ? 'green.400' : 'red.400'} />
            </HStack>
          </CardHeader>

          <CardBody p={0} h="calc(100vh - 144px)">
            <Flex h="full">
              {/* Conversations Sidebar - Wider for better UX */}
              <Box
                w={{ base: "100%", md: "400px" }}
                h="full"
                borderRight="1px solid"
                borderColor={borderColor}
                bg={bgColor}
                display={{ base: selectedUser ? "none" : "block", md: "block" }}
              >
                <VStack spacing={0} h="full">
                  {/* Sidebar Header */}
                  <Box w="full" p={4} borderBottom="1px solid" borderColor={borderColor}>
                    <HStack spacing={3}>
                      <Image src={danhSachTinNhanIcon} alt="Messages" boxSize="24px" />
                      <Text fontWeight="bold" color="gray.700" fontSize="lg">
                        Tin nhắn ({conversations.length})
                      </Text>
                    </HStack>
                  </Box>

                  {/* Conversations List with Enhanced Scrollbar */}
                  <Box 
                    w="full" 
                    flex={1} 
                    overflowY="auto"
                    css={{
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#f7fafc',
                        borderRadius: '8px',
                        margin: '2px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'linear-gradient(180deg, #E2E8F0 0%, #CBD5E0 100%)',
                        borderRadius: '8px',
                        border: '1px solid #f7fafc',
                        backgroundClip: 'padding-box',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'linear-gradient(180deg, #CBD5E0 0%, #A0AEC0 100%)',
                          cursor: 'pointer',
                        },
                        '&:active': {
                          background: 'linear-gradient(180deg, #A0AEC0 0%, #718096 100%)',
                        },
                      },
                      '&::-webkit-scrollbar-corner': {
                        background: '#f7fafc',
                      },
                      // Firefox scrollbar styling
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#E2E8F0 #f7fafc',
                      // Smooth scrolling
                      scrollBehavior: 'smooth',
                    }}
                  >
                    {conversations.length === 0 ? (
                      <VStack spacing={4} p={8} color="gray.500">
                        <Image src={thanhChatIcon} alt="No chat" boxSize="80px" opacity={0.5} />
                        <Text textAlign="center" fontSize="md">
                          Chưa có cuộc trò chuyện nào
                        </Text>
                        <Text textAlign="center" fontSize="sm" color="gray.400">
                          Bắt đầu trò chuyện từ các bài đăng
                        </Text>
                      </VStack>
                    ) : (
                      <VStack spacing={0} align="stretch">
                        {conversations.map((conversation) => {
                          // Support both old and new conversation structure
                          const otherUser = conversation.other_user?.username || conversation.participants?.find(p => p !== currentUser.username);
                          const otherUserFullName = conversation.other_user?.full_name || otherUser;
                          const otherUserAvatar = conversation.other_user?.avatar_url;
                          const isSelected = selectedUser === otherUser;
                          const unreadCount = getUnreadCount(conversation);
                          const isOnline = onlineUsers.includes(otherUser);
                          
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
                                    name={otherUserFullName}
                                    src={otherUserAvatar ? `http://localhost:8000${otherUserAvatar}` : undefined}
                                    bg="blue.500"
                                  />
                                  {isOnline && (
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
                                    <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                                      {otherUserFullName}
                                    </Text>
                                    {conversation.last_message && (
                                      <Text fontSize="xs" color="gray.500">
                                        {formatTime(conversation.last_message.timestamp)}
                                      </Text>
                                    )}
                                  </HStack>
                                  
                                  <HStack justify="space-between" w="full">
                                    <Text
                                      fontSize="sm"
                                      color="gray.600"
                                      noOfLines={2}
                                      flex={1}
                                    >
                                      {conversation.last_message?.content || 'Bắt đầu cuộc trò chuyện'}
                                    </Text>
                                    {unreadCount > 0 && (
                                      <Badge
                                        colorScheme="red"
                                        borderRadius="full"
                                        fontSize="xs"
                                        minW="20px"
                                        h="20px"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                      >
                                        {unreadCount}
                                      </Badge>
                                    )}
                                  </HStack>
                                  
                                  <Text fontSize="xs" color={isOnline ? "green.500" : "gray.400"}>
                                    {isOnline ? "Đang hoạt động" : "Offline"}
                                  </Text>
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

              {/* Chat Area - Full width when sidebar is hidden on mobile */}
              <Box 
                flex={1} 
                h="full" 
                bg="white"
                display={{ base: selectedUser ? "block" : "none", md: "block" }}
              >
                {selectedUser ? (
                  <VStack spacing={0} h="full">
                    {/* Chat Header - Enhanced */}
                    <Box
                      w="full"
                      p={4}
                      borderBottom="1px solid"
                      borderColor={borderColor}
                      bg="white"
                      boxShadow="sm"
                    >
                      <HStack spacing={3} align="center">
                        <Tooltip label="Quay lại danh sách">
                          <IconButton
                            icon={<Image src={leftArrowIcon} alt="Back" boxSize="16px" />}
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(null);
                              navigate('/chat');
                            }}
                            display={{ base: 'flex', md: 'none' }}
                          />
                        </Tooltip>
                        
                        <Avatar 
                          size="md" 
                          name={selectedUserInfo?.full_name || selectedUser} 
                          src={selectedUserInfo?.avatar_url ? `http://localhost:8000${selectedUserInfo.avatar_url}` : undefined}
                          bg="blue.500"
                        />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="bold" fontSize="lg">
                            {selectedUserInfo?.full_name || selectedUser}
                          </Text>
                          <Text fontSize="sm" color={onlineUsers.includes(selectedUser) ? "green.500" : "gray.500"}>
                            {onlineUsers.includes(selectedUser) ? 
                              '🟢 Online' : 
                              '⚫ Offline'
                            }
                          </Text>
                        </VStack>
                        
                        {/* Connection Status */}
                        {/* <VStack align="end" spacing={0}>
                          <Circle size="8px" bg={wsConnected ? 'green.400' : 'red.400'} />
                        </VStack> */}
                      </HStack>
                    </Box>

                    {/* Messages Area - Enhanced scrolling with better scrollbar */}
                    <Box
                      flex={1}
                      w="full"
                      overflowY="auto"
                      p={4}
                      bg="gray.50"
                      css={{
                        '&::-webkit-scrollbar': {
                          width: '12px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: '#f1f1f1',
                          borderRadius: '10px',
                          margin: '5px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: 'linear-gradient(180deg, #CBD5E0 0%, #A0AEC0 100%)',
                          borderRadius: '10px',
                          border: '2px solid #f1f1f1',
                          backgroundClip: 'padding-box',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'linear-gradient(180deg, #A0AEC0 0%, #718096 100%)',
                            cursor: 'pointer',
                          },
                          '&:active': {
                            background: 'linear-gradient(180deg, #718096 0%, #4A5568 100%)',
                          },
                        },
                        '&::-webkit-scrollbar-corner': {
                          background: '#f1f1f1',
                        },
                        // Firefox scrollbar styling
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#CBD5E0 #f1f1f1',
                        // Smooth scrolling
                        scrollBehavior: 'smooth',
                      }}
                    >
                      <VStack spacing={3} align="stretch">
                        {messages.map((message) => {
                          const isOwn = message.from_user === currentUser.username;
                          const isTemp = message.is_temp;
                          const isDeleted = message.is_deleted;
                          
                          return (
                            <Flex
                              key={message.id}
                              justify={isOwn ? 'flex-end' : 'flex-start'}
                              direction="column"
                              align={isOwn ? 'flex-end' : 'flex-start'}
                            >
                              <Box
                                maxW="75%"
                                bg={isDeleted ? 'gray.200' : (isOwn ? (isTemp ? 'blue.300' : messageBg) : receivedBg)}
                                color={isDeleted ? 'gray.500' : (isOwn ? 'white' : 'gray.800')}
                                px={4}
                                py={3}
                                borderRadius="2xl"
                                borderBottomRightRadius={isOwn ? 'md' : '2xl'}
                                borderBottomLeftRadius={isOwn ? '2xl' : 'md'}
                                shadow="sm"
                                opacity={isTemp ? 0.7 : (isDeleted ? 0.6 : 1)}
                                position="relative"
                                transition="all 0.2s ease"
                                _hover={!isDeleted && !isTemp ? { 
                                  '& .message-actions': { opacity: 1 },
                                  transform: 'scale(1.01)',
                                  shadow: 'md'
                                } : {}}
                              >
                                {/* Reply reference */}
                                {message.reply_to && message.reply_content && (
                                  <Box
                                    bg={isOwn ? 'blue.600' : 'gray.300'}
                                    color={isOwn ? 'blue.100' : 'gray.600'}
                                    px={3}
                                    py={2}
                                    borderRadius="md"
                                    mb={2}
                                    fontSize="xs"
                                    borderLeft="3px solid"
                                    borderLeftColor={isOwn ? 'blue.200' : 'gray.500'}
                                  >
                                    <Text fontWeight="semibold" mb={1}>
                                      {message.reply_author === currentUser.username ? 'Bạn' : (message.reply_author_display || message.reply_author)}
                                    </Text>
                                    <Text noOfLines={2}>
                                      {message.reply_content}
                                    </Text>
                                  </Box>
                                )}

                                {/* Message content */}
                                <Text 
                                  fontSize="sm" 
                                  lineHeight="1.4" 
                                  whiteSpace="pre-wrap"
                                  fontStyle={isDeleted ? 'italic' : 'normal'}
                                >
                                  {isDeleted ? (
                                    <HStack spacing={2}>
                                      <DeleteIcon boxSize={3} />
                                      <Text>Tin nhắn đã được thu hồi</Text>
                                    </HStack>
                                  ) : message.content}
                                </Text>
                                
                                {/* Message timestamp */}
                                <Flex justify="space-between" align="center" mt={1}>
                                  <Text
                                    fontSize="xs"
                                    color={isDeleted ? 'gray.400' : (isOwn ? 'blue.100' : 'gray.500')}
                                  >
                                    {formatTime(message.timestamp)}
                                    {isTemp && (
                                      <Text as="span" ml={1} opacity={0.7}>
                                        Đang gửi...
                                      </Text>
                                    )}
                                  </Text>

                                  {/* Message actions */}
                                  {!isDeleted && !isTemp && (
                                    <HStack 
                                      className="message-actions"
                                      spacing={1}
                                      opacity={0}
                                      transition="all 0.2s ease"
                                      bg="rgba(255, 255, 255, 0.9)"
                                      borderRadius="md"
                                      px={1}
                                      py={1}
                                      backdropFilter="blur(4px)"
                                      border="1px solid"
                                      borderColor="gray.200"
                                    >
                                      <IconButton
                                        icon={<ArrowForwardIcon />}
                                        size="xs"
                                        variant="ghost"
                                        colorScheme={isOwn ? 'blue' : 'gray'}
                                        onClick={() => handleReply(message)}
                                        aria-label="Trả lời"
                                        _hover={{ 
                                          bg: isOwn ? 'blue.100' : 'gray.200',
                                          color: isOwn ? 'blue.600' : 'gray.600',
                                          transform: 'scale(1.1)'
                                        }}
                                        transition="all 0.2s ease"
                                      />
                                      {isOwn && (
                                        <IconButton
                                          icon={<DeleteIcon />}
                                          size="xs"
                                          variant="ghost"
                                          colorScheme="red"
                                          onClick={() => deleteMessage(message.id)}
                                          aria-label="Thu hồi"
                                          _hover={{ 
                                            bg: 'red.100', 
                                            color: 'red.600',
                                            transform: 'scale(1.1)'
                                          }}
                                          transition="all 0.2s ease"
                                        />
                                      )}
                                    </HStack>
                                  )}
                                </Flex>
                              </Box>
                            </Flex>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </VStack>
                    </Box>

                    {/* Message Input - Enhanced with Reply */}
                    <Box
                      w="full"
                      borderTop="1px solid"
                      borderColor={borderColor}
                      bg="white"
                      boxShadow="sm"
                    >
                      {/* Reply Preview */}
                      {replyingTo && (
                        <Box
                          px={4}
                          py={3}
                          bg="blue.50"
                          borderBottom="1px solid"
                          borderBottomColor="blue.200"
                        >
                          <HStack justify="space-between" align="start">
                            <VStack align="start" spacing={1} flex={1}>
                              <HStack spacing={2}>
                                <ArrowForwardIcon color="blue.600" boxSize={3} />
                                <Text fontSize="sm" fontWeight="semibold" color="blue.600">
                                  Đang trả lời
                                </Text>
                                <Text fontSize="sm" color="blue.500">
                                  {replyingTo.from_user === currentUser.username ? 'chính mình' : (replyingTo.from_user_info?.full_name || replyingTo.from_user)}
                                </Text>
                              </HStack>
                              <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                {replyingTo.content}
                              </Text>
                            </VStack>
                            <IconButton
                              icon={<CloseIcon />}
                              size="xs"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={handleCancelReply}
                              aria-label="Hủy trả lời"
                            />
                          </HStack>
                        </Box>
                      )}

                      {/* Input Area */}
                      <Box p={4}>
                        <HStack spacing={3}>
                          <InputGroup size="lg">
                            <Input
                              placeholder={replyingTo ? "Nhập phản hồi... (ESC để hủy)" : "Nhập tin nhắn..."}
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={handleKeyPress}
                              borderRadius="full"
                              border="2px solid"
                              borderColor={replyingTo ? "blue.300" : "gray.200"}
                              _focus={{
                                borderColor: 'blue.400',
                                boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)'
                              }}
                              disabled={sending}
                              resize="none"
                              minH="50px"
                            />
                            <InputRightElement width="60px" h="full">
                              <IconButton
                                icon={<Image src={sendIcon} alt="Send" boxSize="20px" />}
                                size="md"
                                borderRadius="full"
                                colorScheme="blue"
                                onClick={sendMessage}
                                isLoading={sending}
                                disabled={!newMessage.trim() || sending}
                                aria-label="Gửi tin nhắn"
                              />
                            </InputRightElement>
                          </InputGroup>
                        </HStack>
                      </Box>
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
                    <VStack spacing={6}>
                      <Image src={thanhChatIcon} alt="Select chat" boxSize="120px" opacity={0.5} />
                      <Text fontSize="xl" fontWeight="medium">
                        Chọn một cuộc trò chuyện
                      </Text>
                      <Text fontSize="md" textAlign="center" color="gray.400" maxW="300px">
                        Chọn từ danh sách bên trái để bắt đầu nhắn tin hoặc tìm người dùng từ các bài đăng
                      </Text>
                    </VStack>
                  </Flex>
                )}
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </Box>
    </Navigation>
  );
};

export default ChatPage;