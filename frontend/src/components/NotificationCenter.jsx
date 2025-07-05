import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverHeader,
  PopoverArrow,
  Center,
  useToast,
  ScaleFade,
  Divider
} from "@chakra-ui/react";
import { FiBell, FiCheck, FiMessageCircle, FiHeart, FiUser } from "react-icons/fi";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

const NotificationCenter = () => {
  // MINIMAL HOOKS - NEVER CHANGE THIS ORDER
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { getAuthHeader, currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Real-time notification handler
  const handleNewNotification = useCallback((event) => {
    const notification = event.detail;
    console.log('📢 New notification received:', notification);
    console.log('📢 Current user:', currentUser?.username);
    
    // Only add notification if it belongs to current user
    if (!currentUser || notification.user_id !== currentUser.username) {
      console.log('📢 Skipping notification - not for current user');
      return;
    }
    
    // Add to notifications list
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep only latest 50
    setUnreadCount(prev => prev + 1);
    
    // Show toast for important notifications
    if (notification.type === 'message' || notification.type === 'comment') {
      toast({
        title: notification.title,
        description: notification.message,
        status: 'info',
        duration: 4000,
        isClosable: true,
        position: 'top-right'
      });
    }
  }, [toast, currentUser]);

  // Load notifications and setup real-time listeners
  useEffect(() => {
    if (!currentUser) return;
    
    // Load initial notifications
    const loadNotifications = async () => {
      try {
        console.log('🔔 Loading notifications for user:', currentUser.username);
        
        const [notifResponse, countResponse] = await Promise.all([
          fetch('http://localhost:8000/notifications?limit=20', {
            headers: getAuthHeader(),
          }),
          fetch('http://localhost:8000/notifications/unread-count', {
            headers: getAuthHeader(),
          })
        ]);
        
        if (notifResponse.ok) {
          const notifData = await notifResponse.json();
          console.log('🔔 Loaded notifications:', notifData);
          console.log('🔔 Current user:', currentUser.username);
          
          // Filter notifications to ensure they belong to current user
          const filteredNotifications = notifData.filter(notif => 
            notif.user_id === currentUser.username
          );
          
          console.log('🔔 Filtered notifications:', filteredNotifications);
          setNotifications(filteredNotifications);
        } else {
          console.error('🔔 Failed to load notifications:', notifResponse.status);
        }
        
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setUnreadCount(countData.unread_count || 0);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        setUnreadCount(0);
      }
    };

    loadNotifications();

    // Add real-time notification listener
    window.addEventListener('socket:notification', handleNewNotification);
    
    return () => {
      window.removeEventListener('socket:notification', handleNewNotification);
    };
  }, [currentUser, getAuthHeader, handleNewNotification]);

  const markAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:8000/notifications/read-all', {
        method: 'PUT',
        headers: getAuthHeader(),
      });
      
      if (response.ok) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
        toast({
          title: 'Đã đánh dấu tất cả thông báo là đã đọc',
          status: 'success',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:8000/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: getAuthHeader(),
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'message' && notification.data?.conversation_id) {
      navigate(`/chat/${notification.related_user}`);
    } else if (notification.type === 'comment' && notification.related_post_id) {
      navigate(`/posts/${notification.related_post_id}`);
    } else if (notification.related_post_id) {
      navigate(`/posts/${notification.related_post_id}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message': return <FiMessageCircle size={16} color="#3182CE" />;
      case 'comment': return <FiMessageCircle size={16} color="#38A169" />;
      case 'like': return <FiHeart size={16} color="#E53E3E" />;
      case 'follow': return <FiUser size={16} color="#805AD5" />;
      default: return <FiBell size={16} color="#718096" />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <IconButton
          icon={
            <Box position="relative">
              <FiBell size={20} />
              {unreadCount > 0 && (
                <ScaleFade in={unreadCount > 0}>
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
                    animation="pulse 2s infinite"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                </ScaleFade>
              )}
            </Box>
          }
          variant="ghost"
          size="lg"
          borderRadius="xl"
          aria-label="Notifications"
          _hover={{ bg: 'gray.100' }}
        />
      </PopoverTrigger>
      <PopoverContent w="400px" maxH="600px" border="1px solid" borderColor="gray.200" shadow="xl">
        <PopoverArrow />
        <PopoverHeader bg="white" borderTopRadius="md">
          <HStack justify="space-between" align="center">
            <Text fontWeight="bold" fontSize="lg" color="gray.800">
              Thông báo {unreadCount > 0 && `(${unreadCount})`}
            </Text>
            {unreadCount > 0 && (
              <IconButton
                icon={<FiCheck />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={markAllAsRead}
                aria-label="Mark all as read"
                title="Đánh dấu tất cả là đã đọc"
                _hover={{ bg: 'blue.50' }}
              />
            )}
          </HStack>
        </PopoverHeader>
        <PopoverBody p={0} bg="gray.50">
          {notifications.length === 0 ? (
            <Center p={8}>
              <VStack spacing={3}>
                <Text fontSize="4xl">🔔</Text>
                <Text color="gray.500" textAlign="center" fontWeight="medium">
                  Chưa có thông báo nào
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Các thông báo mới sẽ hiển thị tại đây
                </Text>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={0} align="stretch" maxH="500px" overflowY="auto">
              {notifications.map((notification, index) => (
                <Box key={notification.id}>
                  <Box
                    p={4}
                    bg={notification.is_read ? 'white' : 'blue.50'}
                    cursor="pointer"
                    onClick={() => handleNotificationClick(notification)}
                    _hover={{ bg: notification.is_read ? 'gray.50' : 'blue.100' }}
                    transition="all 0.2s ease"
                    borderLeft={notification.is_read ? 'none' : '4px solid'}
                    borderLeftColor="blue.400"
                  >
                    <HStack spacing={3} align="start">
                      <Box mt={1}>
                        {getNotificationIcon(notification.type)}
                      </Box>
                      
                      <VStack align="start" spacing={1} flex={1} minW={0}>
                        <HStack justify="space-between" w="full">
                          <Text 
                            fontWeight={notification.is_read ? "normal" : "semibold"}
                            fontSize="sm"
                            color="gray.800"
                            noOfLines={1}
                          >
                            {notification.title}
                          </Text>
                          {!notification.is_read && (
                            <Box w="8px" h="8px" bg="blue.500" borderRadius="full" />
                          )}
                        </HStack>
                        
                        <Text 
                          fontSize="sm" 
                          color="gray.600" 
                          noOfLines={2}
                          lineHeight="1.3"
                        >
                          {notification.message}
                        </Text>
                        
                        <Text fontSize="xs" color="gray.500">
                          {formatTime(notification.created_at)}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                  {index < notifications.length - 1 && <Divider />}
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