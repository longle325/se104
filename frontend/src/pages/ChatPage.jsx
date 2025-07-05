import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Tooltip,
  Fade,
  ScaleFade,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { ArrowBackIcon, ChatIcon, CloseIcon, DeleteIcon, RepeatIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { FiSend, FiMoreVertical, FiSmile, FiPaperclip, FiMic, FiImage, FiVideo, FiCheck, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../components/AuthContext';
import { useSocket } from '../components/SocketContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useChat } from '../hooks/useChat';
import { safeAvatarName } from '../utils/avatarUtils';
import { safeText, safeUserName } from '../utils/textUtils';

// Import BOX CHAT assets
import chatTrucTiepIcon from '../assets/BOX CHAT/chattructiep@4x.png';
import danhSachTinNhanIcon from '../assets/BOX CHAT/danhsachtinnhan@4x.png';
import sendIcon from '../assets/BOX CHAT/send_17524267.png';
import thanhChatIcon from '../assets/BOX CHAT/thanhchat@4x.png';
import leftArrowIcon from '../assets/BOX CHAT/left-arrow_318226.png';

const ChatPage = () => {
  const { currentUser, token } = useAuth();
  const { socket, isConnected, onlineUsers } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const { otherUsername } = useParams();
  const toast = useToast();
  
  // Draft message states
  const [showDraftAlert, setShowDraftAlert] = useState(false);
  const [draftPostInfo, setDraftPostInfo] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    currentUser: null,
    token: null,
    isConnected: false,
    conversationsLength: 0,
    messagesLength: 0,
    selectedUser: null,
    loading: true,
    error: null
  });
  
  const {
    conversations,
    messages,
    loading,
    sending,
    selectedUser,
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
  } = useChat(otherUsername);
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const messageBg = useColorModeValue('blue.500', 'blue.600');
  const receivedBg = useColorModeValue('gray.100', 'gray.700');

  // Debug effect
  useEffect(() => {
    setDebugInfo({
      currentUser: currentUser?.username || 'Not logged in',
      token: token ? 'Available' : 'Missing',
      isConnected: isConnected,
      conversationsLength: conversations.length,
      messagesLength: messages.length,
      selectedUser: selectedUser,
      loading: loading,
      error: !currentUser ? 'No current user' : !token ? 'No token' : null
    });
  }, [currentUser, token, isConnected, conversations, messages, selectedUser, loading]);

  // Handle draft message from sessionStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isDraft = urlParams.get('draft') === 'true';
    
    if (isDraft && otherUsername) {
      const storedDraftMessage = sessionStorage.getItem('chatDraftMessage');
      const storedPostId = sessionStorage.getItem('chatDraftPostId');
      const storedPostLink = sessionStorage.getItem('chatDraftPostLink');
      
      if (storedDraftMessage) {
        setDraftMessage(storedDraftMessage);
        setShowDraftAlert(true);
        
        if (storedPostId || storedPostLink) {
          setDraftPostInfo({
            postId: storedPostId,
            postLink: storedPostLink
          });
        }
        
        // Clear from sessionStorage
        sessionStorage.removeItem('chatDraftMessage');
        sessionStorage.removeItem('chatDraftPostId');
        sessionStorage.removeItem('chatDraftPostLink');
        
        // Clear URL parameters
        navigate(`/chat/${otherUsername}`, { replace: true });
      }
    }
  }, [location, otherUsername, setDraftMessage, navigate]);

  // Early return with debug info if no user or token
  if (!currentUser || !token) {
    return (
      <Navigation>
        <Container maxW="8xl" h="calc(100vh - 80px)" py={4}>
          <Flex h="full" justify="center" align="center">
            <VStack spacing={4}>
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Lỗi xác thực!</AlertTitle>
                <AlertDescription>
                  Vui lòng đăng nhập lại để sử dụng tính năng chat.
                </AlertDescription>
              </Alert>
              <Button colorScheme="blue" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
            </VStack>
          </Flex>
        </Container>
      </Navigation>
    );
  }

  const handleSendMessage = async () => {
    if (!draftMessage.trim() || sending) return;
    
    const postId = draftPostInfo?.postId || null;
    const postLink = draftPostInfo?.postLink || null;
    
    const success = await sendMessage(draftMessage, postId, postLink);
    
    if (success) {
      setShowDraftAlert(false);
      setDraftPostInfo(null);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setDraftMessage(value);
    
    if (value.trim()) {
      startTyping();
      } else {
      stopTyping();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hôm qua ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getUnreadCount = (conversation) => {
    return conversation.unread_count || 0;
  };

  if (loading && !conversations.length) {
    return (
      <Navigation>
        <Container maxW="8xl" h="calc(100vh - 80px)" py={4}>
          <Flex h="full" justify="center" align="center">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text color="gray.600">Đang tải cuộc trò chuyện...</Text>
              
              {/* Debug info
              <Box bg="gray.100" p={4} borderRadius="md" fontSize="sm" maxW="500px">
                <Text fontWeight="bold" mb={2}>Debug Info:</Text>
                <Text>User: {debugInfo.currentUser}</Text>
                <Text>Token: {debugInfo.token}</Text>
                <Text>Socket Connected: {debugInfo.isConnected ? 'Yes' : 'No'}</Text>
                <Text>Conversations: {debugInfo.conversationsLength}</Text>
                <Text>Messages: {debugInfo.messagesLength}</Text>
                <Text>Selected User: {debugInfo.selectedUser || 'None'}</Text>
                <Text>Loading: {debugInfo.loading ? 'Yes' : 'No'}</Text>
                {debugInfo.error && <Text color="red.500">Error: {debugInfo.error}</Text>}
              </Box> */}
              
              <Button onClick={() => window.location.reload()}>
                Tải lại trang
              </Button>
            </VStack>
          </Flex>
        </Container>
      </Navigation>
    );
  }

    return (
    <Navigation>
      <Container maxW="8xl" h="calc(100vh - 80px)" py={0} px={0}>
        <Flex h="full" bg={bgColor}>
          {/* Conversations List */}
          <Box w="30%" bg={cardBg} borderRight="1px" borderColor={borderColor}>
            <VStack spacing={0} h="full">
              {/* Header */}
              <Box w="full" p={4} borderBottom="1px" borderColor={borderColor}>
                <HStack justify="space-between">
                  <Heading size="md" color="blue.600">
                    💬 Tin nhắn
                  </Heading>
                  {unreadCount > 0 && (
                    <Badge colorScheme="red" variant="solid" borderRadius="full">
                      {unreadCount}
                    </Badge>
                  )}
          </HStack>
        </Box>

              {/* Conversations */}
              <Box flex="1" w="full" overflowY="auto">
                {conversations.length === 0 ? (
                  <Flex h="full" align="center" justify="center" p={4}>
                    <VStack spacing={2}>
                      <Text color="gray.500" textAlign="center">
                        Chưa có cuộc trò chuyện nào
                      </Text>
                      <Text fontSize="sm" color="gray.400" textAlign="center">
                        Bắt đầu trò chuyện bằng cách nhấn "Liên hệ ngay" từ bài viết
                </Text>
              </VStack>
                  </Flex>
                ) : (
                  conversations.map((conversation) => {
                    const isSelected = selectedUser === conversation.other_user;
                    const unreadCount = getUnreadCount(conversation);

    return (
      <Box
                        key={conversation.id}
                        p={3}
        cursor="pointer"
        bg={isSelected ? 'blue.50' : 'transparent'}
                        borderLeft={isSelected ? "4px solid" : "4px solid transparent"}
                        borderColor={isSelected ? 'blue.500' : 'transparent'}
                        _hover={{ bg: 'gray.50' }}
                        onClick={() => selectUser(conversation.other_user)}
                        transition="all 0.2s"
      >
        <HStack spacing={3} align="start">
          <Box position="relative">
            <Avatar
              size="md"
                              name={safeAvatarName(conversation.other_user_info?.full_name || conversation.other_user)}
                              src={conversation.other_user_info?.avatar_url}
            />
                            {onlineUsers && onlineUsers.has && onlineUsers.has(conversation.other_user) && (
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

                          <VStack flex="1" align="start" spacing={1}>
            <HStack justify="space-between" w="full">
              <Text
                                fontWeight={unreadCount > 0 ? "bold" : "medium"}
                fontSize="sm"
                noOfLines={1}
              >
                                {safeUserName(conversation.other_user_info?.full_name || conversation.other_user)}
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
                                fontWeight={unreadCount > 0 ? "medium" : "normal"}
                              >
                                {conversation.last_message ? (
                                  conversation.last_message.from_user === currentUser.username 
                                    ? `Bạn: ${conversation.last_message.content}`
                                    : conversation.last_message.content
                                ) : (
                                  "Chưa có tin nhắn"
                                )}
              </Text>
                              {unreadCount > 0 && (
                                <Badge colorScheme="red" variant="solid" borderRadius="full" fontSize="xs">
                                  {unreadCount}
                </Badge>
              )}
            </HStack>
          </VStack>
        </HStack>
      </Box>
    );
                  })
                    )}
                  </Box>
                </VStack>
              </Box>

          {/* Chat Area */}
          <Box flex="1" bg={cardBg}>
                {selectedUser ? (
              <VStack h="full" spacing={0}>
                {/* Chat Header */}
                <Box w="full" p={4} borderBottom="1px" borderColor={borderColor}>
                  <HStack justify="space-between">
                    <HStack spacing={3}>
                          <IconButton
                        icon={<ArrowBackIcon />}
                            size="sm"
                            variant="ghost"
                        onClick={() => selectUser(null)}
                            display={{ base: 'flex', md: 'none' }}
                          />
                          <Avatar 
                        size="sm"
                        name={safeAvatarName(selectedUser)}
                        src={conversations.find(c => c.other_user === selectedUser)?.other_user_info?.avatar_url}
                      />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="sm">
                          {conversations.find(c => c.other_user === selectedUser)?.other_user_info?.full_name || selectedUser}
                          </Text>
                        <Text fontSize="xs" color="gray.500">
                          {onlineUsers && onlineUsers.has && onlineUsers.has(selectedUser) ? '🟢 Đang online' : '⚫ Offline'}
                            </Text>
                        </VStack>
                    </HStack>
                      </HStack>
                    </Box>

                {/* Draft Alert */}
                {showDraftAlert && (
                  <Alert status="info" borderRadius={0}>
                    <AlertIcon />
                    <VStack align="start" spacing={1} flex="1">
                      <AlertTitle fontSize="sm">Tin nhắn đã soạn sẵn từ bài viết!</AlertTitle>
                      <AlertDescription fontSize="xs">
                        Bạn có thể chỉnh sửa tin nhắn bên dưới trước khi gửi.
                      </AlertDescription>
                    </VStack>
                          <IconButton
                      icon={<CloseIcon />}
                      size="xs"
                            variant="ghost"
                            onClick={() => {
                        setShowDraftAlert(false);
                        setDraftPostInfo(null);
                      }}
                    />
                  </Alert>
                )}

                {/* Messages */}
                <Box flex="1" w="full" overflowY="auto" p={4}>
                  <VStack spacing={3} align="stretch" h="full">
                    {loading ? (
                      <Flex justify="center" align="center" h="full">
                        <Spinner color="blue.500" />
                      </Flex>
                    ) : messages.length === 0 ? (
                      <Flex justify="center" align="center" h="full">
                        <VStack spacing={2}>
                          <Text color="gray.500" textAlign="center">
                            Chưa có tin nhắn nào
                                    </Text>
                          <Text fontSize="sm" color="gray.400" textAlign="center">
                            Hãy bắt đầu cuộc trò chuyện!
                                    </Text>
                        </VStack>
                      </Flex>
                    ) : (
                      messages.map((message, index) => {
                          const isOwn = message.from_user === currentUser.username;
                        const showTime = index === 0 || 
                          (new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime()) > 300000; // 5 minutes
                          
                          return (
                          <Box key={message.id}>
                            {showTime && (
                              <Text fontSize="xs" color="gray.500" textAlign="center" mb={2}>
                                      {formatTime(message.timestamp)}
                                        </Text>
                                      )}
                            
                            <Flex justify={isOwn ? 'flex-end' : 'flex-start'} mb={1}>
                              <Box maxW="70%">
                                {!isOwn && (
                                  <Text fontSize="xs" color="gray.500" mb={1}>
                                    {message.from_user_info?.full_name || message.from_user}
                                    </Text>
                                )}
                                
                                <Box
                                  bg={isOwn ? messageBg : receivedBg}
                                  color={isOwn ? 'white' : 'gray.800'}
                                  px={3}
                                  py={2}
                                  borderRadius="lg"
                                  borderTopLeftRadius={!isOwn ? 'sm' : 'lg'}
                                  borderTopRightRadius={isOwn ? 'sm' : 'lg'}
                                  position="relative"
                                  _hover={{
                                    '& .message-actions': { opacity: 1 }
                                  }}
                                >
                                  {message.is_deleted ? (
                                    <Text fontStyle="italic" opacity={0.7}>
                                      {message.content}
                                      </Text>
                                  ) : (
                                    <Text whiteSpace="pre-wrap">{message.content}</Text>
                                    )}

                                  {/* Message Actions */}
                                  {isOwn && !message.is_deleted && (
                                    <HStack 
                                      className="message-actions"
                                      position="absolute"
                                      top="-8px"
                                      right="0"
                                      opacity={0}
                                      transition="opacity 0.2s"
                                      bg="white"
                                      borderRadius="md"
                                      shadow="sm"
                                      p={1}
                                    >
                                        <IconButton
                                          icon={<DeleteIcon />}
                                          size="xs"
                                          variant="ghost"
                                          colorScheme="red"
                                        onClick={() => deleteMessage(message.id)}
                                      />
                                    </HStack>
                                  )}
                                </Box>
                                
                                <Text fontSize="xs" color="gray.400" mt={1} textAlign={isOwn ? 'right' : 'left'}>
                                  {formatTime(message.timestamp)}
                                  {isOwn && message.is_read && ' ✓✓'}
                                </Text>
                              </Box>
                            </Flex>
                          </Box>
                          );
                      })
                    )}
                        
                    {/* Typing Indicator */}
                    {otherUserTyping && (
                          <Flex justify="flex-start">
                        <Box bg={receivedBg} px={3} py={2} borderRadius="lg" borderTopLeftRadius="sm">
                                  <HStack spacing={1}>
                            <Box w="2" h="2" bg="gray.400" borderRadius="full" animation="pulse 1.5s ease-in-out infinite" />
                            <Box w="2" h="2" bg="gray.400" borderRadius="full" animation="pulse 1.5s ease-in-out 0.1s infinite" />
                            <Box w="2" h="2" bg="gray.400" borderRadius="full" animation="pulse 1.5s ease-in-out 0.2s infinite" />
                              </HStack>
                            </Box>
                          </Flex>
                    )}
                        
                        <div ref={messagesEndRef} />
                      </VStack>
                    </Box>

                {/* Message Input */}
                <Box w="full" p={4} borderTop="1px" borderColor={borderColor}>
                  <HStack spacing={2}>
                    <Textarea
                      value={draftMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập tin nhắn..."
                      resize="none"
                      minH="40px"
                      maxH="120px"
                      bg="gray.50"
                      border="1px"
                      borderColor="gray.200"
                      _focus={{
                        borderColor: "blue.500",
                        bg: "white"
                      }}
                    />
                    <Button
                      colorScheme="blue"
                      size="md"
                      onClick={handleSendMessage}
                      isLoading={sending}
                      loadingText="Gửi"
                      disabled={!draftMessage.trim() || sending}
                      leftIcon={<ArrowForwardIcon />}
                    >
                      Gửi
                    </Button>
                  </HStack>
                </Box>
                  </VStack>
                ) : (
              <Flex h="full" align="center" justify="center">
                <VStack spacing={4}>
                  <Image src={chatTrucTiepIcon} alt="Chat" w="100px" opacity={0.5} />
                  <Text color="gray.500" textAlign="center">
                    Chọn một cuộc trò chuyện để bắt đầu
                      </Text>
                    </VStack>
                  </Flex>
                )}
              </Box>
            </Flex>
      </Container>
    </Navigation>
  );
};
export default ChatPage;
