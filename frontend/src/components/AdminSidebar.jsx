import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  Divider,
  useColorModeValue,
  Badge,
  Image
} from '@chakra-ui/react';
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiFlag,
  FiSettings,
  FiBarChart
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImage from '../assets/auth/logo.png';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const activeColor = useColorModeValue('blue.500', 'blue.400');
  const activeBg = useColorModeValue('blue.50', 'blue.900');

  const menuItems = [
    {
      label: 'Dashboard',
      icon: FiHome,
      path: '/admin/dashboard'
    },
    {
      label: 'Báo cáo',
      icon: FiFlag,
      path: '/admin/reports',
      badge: 'Mới'
    },
    {
      label: 'Người dùng',
      icon: FiUsers,
      path: '/admin/users'
    },
    {
      label: 'Bài viết',
      icon: FiFileText,
      path: '/admin/posts'
    },
    {
      label: 'Thống kê',
      icon: FiBarChart,
      path: '/admin/analytics'
    },
    {
      label: 'Cài đặt',
      icon: FiSettings,
      path: '/admin/settings'
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <Box
      w="280px"
      h="100vh"
      bg={bg}
      borderRight="1px solid"
      borderColor={borderColor}
      p={6}
      position="sticky"
      top={0}
    >
      <VStack spacing={8} align="stretch">
        {/* Logo/Brand */}
        <VStack spacing={2}>
          <HStack spacing={3}>
            <Box
              p={2}
              borderRadius="md"
              bg="white"
              color="white"
            >
              <Image src={logoImage} w={10} h={10} alt="UIT Logo" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold" fontSize="lg" color={textColor}>
                Admin Panel
              </Text>
              <Text fontSize="sm" color="gray.500">
                UIT-W2F
              </Text>
            </VStack>
          </HStack>
        </VStack>

        <Divider />

        {/* Navigation Menu */}
        <VStack spacing={2} align="stretch">
          <Text fontSize="sm" fontWeight="semibold" color="gray.500" mb={2}>
            QUẢN LÝ
          </Text>
          
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              justifyContent="flex-start"
              h="auto"
              p={3}
              bg={isActive(item.path) ? activeBg : 'transparent'}
              color={isActive(item.path) ? activeColor : textColor}
              _hover={{
                bg: activeBg,
                color: activeColor,
                transform: 'translateX(4px)'
              }}
              transition="all 0.2s ease"
              onClick={() => navigate(item.path)}
              fontWeight={isActive(item.path) ? 'semibold' : 'normal'}
            >
              <HStack spacing={3} w="full">
                <Icon as={item.icon} w={5} h={5} />
                <Text flex={1} textAlign="left">
                  {item.label}
                </Text>
                {item.badge && (
                  <Badge
                    colorScheme="red"
                    variant="solid"
                    fontSize="xs"
                    borderRadius="full"
                  >
                    {item.badge}
                  </Badge>
                )}
              </HStack>
            </Button>
          ))}
        </VStack>

        <Divider />

        {/* Quick Stats */}
        <VStack spacing={3} align="stretch">
          <Text fontSize="sm" fontWeight="semibold" color="gray.500">
            THỐNG KÊ NHANH
          </Text>
          
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between" p={2} bg="red.50" borderRadius="md">
              <Text fontSize="sm" color="red.700">Báo cáo chờ</Text>
              <Badge colorScheme="red" fontSize="xs">5</Badge>
            </HStack>
            
            <HStack justify="space-between" p={2} bg="blue.50" borderRadius="md">
              <Text fontSize="sm" color="blue.700">User online</Text>
              <Badge colorScheme="blue" fontSize="xs">24</Badge>
            </HStack>
            
            <HStack justify="space-between" p={2} bg="green.50" borderRadius="md">
              <Text fontSize="sm" color="green.700">Posts hôm nay</Text>
              <Badge colorScheme="green" fontSize="xs">12</Badge>
            </HStack>
          </VStack>
        </VStack>
      </VStack>
    </Box>
  );
};

export default AdminSidebar; 