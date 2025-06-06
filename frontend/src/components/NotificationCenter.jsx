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
  useToast
} from "@chakra-ui/react";
import { FiBell, FiMessageSquare, FiUser, FiCheck } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { getAuthHeader } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:8000/notifications', {
        headers: getAuthHeader(),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform the data to match our component structure
        const transformedNotifications = data.map(notification => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          time: formatTime(notification.created_at),
          read: notification.is_read,
          postId: notification.related_post_id,
          userId: notification.related_user,
          data: notification.data || {}
        }));
        
        setNotifications(transformedNotifications);
        setUnreadCount(transformedNotifications.filter(n => !n.read).length);
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Fallback to empty array on error
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('http://localhost:8000/notifications/unread-count', {
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
    fetchNotifications();
    fetchUnreadCount();
    // Refresh notifications and unread count every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:8000/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: getAuthHeader(),
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:8000/notifications/read-all', {
        method: 'PUT',
        headers: getAuthHeader(),
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "comment": return "💬";
      case "message": return "📩";
      case "system": return "⚙️";
      case "contact": return "🤝";
      default: return "🔔";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "comment": return "blue";
      case "message": return "green";
      case "system": return "purple";
      case "contact": return "orange";
      default: return "gray";
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffTime = now - date;
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 1) return 'Vừa xong';
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return '1 ngày trước';
      if (diffDays < 7) return `${diffDays} ngày trước`;
      
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      return timestamp;
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Handle navigation based on notification type
    switch (notification.type) {
      case "comment":
      case "system":
        if (notification.postId) {
          navigate(`/posts/${notification.postId}`);
        }
        break;
      case "message":
        if (notification.userId) {
          navigate(`/chat/${notification.userId}`);
        } else {
          navigate(`/chat`);
        }
        break;
      case "contact":
        if (notification.postId) {
          navigate(`/posts/${notification.postId}`);
        }
        break;
    }
  };

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <IconButton
          icon={
            <Box position="relative">
              <FiBell size={20} />
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
          aria-label="Notifications"
        />
      </PopoverTrigger>
      <PopoverContent w="400px" maxH="500px" overflowY="auto">
        <PopoverArrow />
        <PopoverHeader>
          <HStack justify="space-between" align="center">
            <Text fontWeight="bold" fontSize="lg">
              Thông báo
            </Text>
            {unreadCount > 0 && (
              <IconButton
                icon={<FiCheck />}
                size="sm"
                variant="ghost"
                onClick={markAllAsRead}
                aria-label="Mark all as read"
                title="Đánh dấu tất cả là đã đọc"
              />
            )}
          </HStack>
        </PopoverHeader>
        <PopoverBody p={0}>
          {notifications.length === 0 ? (
            <Center p={8}>
              <VStack spacing={2}>
                <Text fontSize="4xl">🔔</Text>
                <Text color="gray.500" textAlign="center">
                  Không có thông báo mới
                </Text>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={0} align="stretch">
              {notifications.map((notification) => (
                <Box
                  key={notification.id}
                  p={4}
                  bg={notification.read ? "transparent" : useColorModeValue("blue.50", "blue.900")}
                  borderBottom="1px"
                  borderBottomColor={borderColor}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => handleNotificationClick(notification)}
                  transition="all 0.2s"
                >
                  <HStack spacing={3} align="start">
                    <Box
                      bg={useColorModeValue(`${getNotificationColor(notification.type)}.100`, `${getNotificationColor(notification.type)}.800`)}
                      p={2}
                      borderRadius="full"
                      color={useColorModeValue(`${getNotificationColor(notification.type)}.600`, `${getNotificationColor(notification.type)}.200`)}
                    >
                      <Text fontSize="lg">
                        {getNotificationIcon(notification.type)}
                      </Text>
                    </Box>
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontSize="sm" fontWeight="semibold">
                        {notification.title}
                      </Text>
                      <Text fontSize="sm" color="gray.600" noOfLines={2}>
                        {notification.message}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {notification.time}
                      </Text>
                    </VStack>
                    {!notification.read && (
                      <Box
                        w={2}
                        h={2}
                        bg="blue.500"
                        borderRadius="full"
                        flexShrink={0}
                      />
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter; 