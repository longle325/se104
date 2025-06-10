import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  useColorModeValue,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverHeader,
  PopoverArrow,
  Center,
  Avatar,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  Flex
} from "@chakra-ui/react";
import { FiMessageCircle, FiSearch, FiMoreHorizontal } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

const MessageCenter = () => {
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const { getAuthHeader, user } = useAuth();
  const navigate = useNavigate();
  
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  // Fetch conversations from API
  const fetchConversations = async () => {
    try {
      const response = await fetch('http://localhost:8000/conversations', {
        headers: getAuthHeader(),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform the data to match our component structure
        const transformedConversations = data.map(conv => ({
          id: conv.id,
          otherUser: conv.other_user?.full_name || conv.other_user?.username || 'Unknown User',
          otherUsername: conv.other_user?.username,
          lastMessage: conv.last_message?.content || 'Không có tin nhắn',
          timestamp: conv.last_message ? formatTime(conv.last_message.timestamp) : '',
          unread: conv.unread_count > 0,
          online: false, // This would need to be implemented separately
          avatar: conv.other_user?.avatar_url
        }));
        
        setConversations(transformedConversations);
        setUnreadCount(transformedConversations.filter(c => c.unread).length);
      } else {
        throw new Error('Failed to fetch conversations');
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      // Fallback to empty array on error
      setConversations([]);
      setUnreadCount(0);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('http://localhost:8000/messages/unread-count', {
        headers: getAuthHeader(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
    // Refresh conversations and unread count every 30 seconds
    const interval = setInterval(() => {
      fetchConversations();
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleConversationClick = async (conversation) => {
    // Mark messages as read in backend
    try {
      const username = conversation.otherUsername || conversation.otherUser;
      await fetch(`http://localhost:8000/conversations/${username}/read`, {
        method: 'PUT',
        headers: getAuthHeader(),
      });
      
      // Update local state
      setConversations(prev => 
        prev.map(c => 
          c.id === conversation.id ? { ...c, unread: false, unread_count: 0 } : c
        )
      );
      
      // Update unread count
      fetchUnreadCount();
      
      // Navigate to chat with that user using their username
      navigate(`/chat/${username}`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      // Still navigate even if marking as read fails
      navigate(`/chat/${conversation.otherUsername || conversation.otherUser}`);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      
      // Kiểm tra nếu date không hợp lệ
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const now = new Date();
      const diffTime = now - date;
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 1) return 'Vừa xong';
      if (diffMinutes < 60) return `${diffMinutes}ph`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays === 1) return '1 ngày';
      if (diffDays < 7) return `${diffDays} ngày`;
      
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      console.error('Error formatting timestamp:', timestamp, error);
      return '';
    }
  };

  const filteredConversations = (conversations || []).filter(conv => {
    if (!conv) return false;
    
    const otherUserMatch = conv.otherUser && typeof conv.otherUser === 'string' && 
      conv.otherUser.toLowerCase().includes(searchTerm.toLowerCase());
    
    const lastMessageMatch = conv.lastMessage && typeof conv.lastMessage === 'string' && 
      conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    
    return otherUserMatch || lastMessageMatch;
  });

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <IconButton
          icon={
            <Box position="relative">
              <FiMessageCircle size={20} />
              {unreadCount > 0 && (
                <Badge
                  position="absolute"
                  top="-8px"
                  right="-8px"
                  borderRadius="full"
                  bg="red.500"
                  color="white"
                  fontSize="xs"
                  minW="18px"
                  h="18px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Box>
          }
          variant="ghost"
          size="lg"
          borderRadius="xl"
          _hover={{ bg: hoverBg }}
          aria-label="Messages"
        />
      </PopoverTrigger>
      <PopoverContent w="400px" maxH="500px">
        <PopoverArrow />
        <PopoverHeader>
          <HStack justify="space-between" align="center">
            <Text fontWeight="bold" fontSize="lg">
              Tin nhắn
            </Text>
            <HStack spacing={2}>
              <IconButton
                icon={<FiMoreHorizontal />}
                size="sm"
                variant="ghost"
                aria-label="More options"
              />
            </HStack>
          </HStack>
          
          {/* Search */}
          <Box mt={3}>
            <InputGroup size="sm">
              <InputLeftElement>
                <FiSearch color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Tìm kiếm tin nhắn..."
                borderRadius="full"
                bg={useColorModeValue("gray.100", "gray.700")}
                border="none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Box>
        </PopoverHeader>
        
        <PopoverBody p={0}>
          {filteredConversations.length === 0 ? (
            <Center p={8}>
              <VStack spacing={2}>
                <Text fontSize="4xl">💬</Text>
                <Text color="gray.500" textAlign="center">
                  {searchTerm ? "Không tìm thấy cuộc trò chuyện" : "Chưa có tin nhắn"}
                </Text>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={0} align="stretch">
              {filteredConversations.map((conversation) => (
                <Box
                  key={conversation.id}
                  p={3}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => handleConversationClick(conversation)}
                  transition="all 0.2s"
                  borderBottom="1px"
                  borderBottomColor={borderColor}
                  bg={conversation.unread ? useColorModeValue("blue.50", "blue.900") : "transparent"}
                >
                  <HStack spacing={3} align="start">
                    <Box position="relative">
                      <Avatar 
                        size="md" 
                        name={conversation.otherUser}
                        src={conversation.avatar ? `http://localhost:8000${conversation.avatar}` : undefined}
                        bg="blue.500"
                      />
                      {conversation.online && (
                        <Box
                          position="absolute"
                          bottom="0"
                          right="0"
                          w="12px"
                          h="12px"
                          bg="green.400"
                          borderRadius="full"
                          border="2px solid white"
                        />
                      )}
                    </Box>
                    
                    <VStack align="start" spacing={1} flex={1} minW={0}>
                      <HStack justify="space-between" w="full">
                        <Text 
                          fontWeight={conversation.unread ? "bold" : "medium"} 
                          fontSize="sm" 
                          noOfLines={1}
                          flex={1}
                        >
                          {conversation.otherUser}
                        </Text>
                        <Text fontSize="xs" color="gray.500" flexShrink={0}>
                          {formatTime(conversation.timestamp)}
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between" w="full">
                        <Text
                          fontSize="sm"
                          color={conversation.unread ? "gray.700" : "gray.500"}
                          fontWeight={conversation.unread ? "medium" : "normal"}
                          noOfLines={1}
                          flex={1}
                        >
                          {conversation.lastMessage}
                        </Text>
                        {conversation.unread && (
                          <Box
                            w={2}
                            h={2}
                            bg="blue.500"
                            borderRadius="full"
                            flexShrink={0}
                          />
                        )}
                      </HStack>
                    </VStack>
                  </HStack>
                </Box>
              ))}
              
              {/* See All Button */}
              <Box p={3} textAlign="center">
                <Text
                  color="blue.500"
                  fontWeight="medium"
                  cursor="pointer"
                  _hover={{ textDecoration: "underline" }}
                  onClick={() => navigate("/chat")}
                >
                  Xem tất cả tin nhắn
                </Text>
              </Box>
            </VStack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default MessageCenter; 