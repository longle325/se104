import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Button,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  SimpleGrid,
  Badge,
  useToast
} from '@chakra-ui/react';
import {
  FiUsers,
  FiFile,
  FiFlag,
  FiTrendingUp,
  FiUserPlus,
  FiFileText,
  FiAlertTriangle,
  FiLogOut,
  FiUserCheck,
  FiUserX
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8000/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      } else {
        setError('Không thể tải thống kê');
      }
    } catch (error) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    toast({
      title: 'Đăng xuất thành công',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={bg} display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Đang tải...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg={bg} p={8}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  const statCards = [
    {
      label: 'Tổng người dùng',
      value: stats?.total_users || 0,
      icon: FiUsers,
      color: 'blue',
      helpText: `${stats?.users_today || 0} người dùng mới hôm nay`
    },
    {
      label: 'Người dùng hoạt động',
      value: stats?.active_users || 0,
      icon: FiUserCheck,
      color: 'green',
      helpText: `${Math.round((stats?.active_users / stats?.total_users) * 100) || 0}% tổng số người dùng`
    },
    {
      label: 'Người dùng bị khóa',
      value: stats?.banned_users || 0,
      icon: FiUserX,
      color: 'red',
      helpText: `${Math.round((stats?.banned_users / stats?.total_users) * 100) || 0}% tổng số người dùng`
    },
    {
      label: 'Tổng bài viết',
      value: stats?.total_posts || 0,
      icon: FiFileText,
      color: 'purple',
      helpText: `${stats?.posts_today || 0} bài viết mới hôm nay`
    },
    {
      label: 'Báo cáo chờ xử lý',
      value: stats?.pending_reports || 0,
      icon: FiFlag,
      color: 'orange',
      helpText: `${stats?.total_reports || 0} tổng báo cáo`
    },
    {
      label: 'Hoạt động hôm nay',
      value: `${stats?.posts_today || 0} bài / ${stats?.users_today || 0} user`,
      icon: FiTrendingUp,
      color: 'teal',
      helpText: 'Bài viết / Người dùng mới'
    }
  ];

  const quickActions = [
    {
      title: 'Xem báo cáo',
      description: 'Xử lý các báo cáo bài viết',
      action: () => navigate('/admin/reports'),
      color: 'red',
      icon: FiFlag,
      count: stats?.pending_reports || 0
    },
    {
      title: 'Quản lý người dùng',
      description: 'Xem và quản lý tài khoản',
      action: () => navigate('/admin/users'),
      color: 'blue',
      icon: FiUsers,
      count: stats?.total_users || 0
    },
    {
      title: 'Quản lý bài viết',
      description: 'Xem và kiểm duyệt bài viết',
      action: () => navigate('/admin/posts'),
      color: 'purple',
      icon: FiFileText,
      count: stats?.total_posts || 0
    }
  ];

  return (
    <Box minH="100vh" bg={bg}>
      <HStack spacing={0} align="stretch" minH="100vh">
        <AdminSidebar />
        
        <Box flex={1} p={8}>
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Heading size="lg">Dashboard Quản trị</Heading>
                <Text color="gray.600">Tổng quan hệ thống UIT-W2F</Text>
              </VStack>
              
              <Button
                leftIcon={<Icon as={FiLogOut} />}
                colorScheme="red"
                variant="outline"
                onClick={handleLogout}
              >
                Đăng xuất
              </Button>
            </HStack>

            {/* Stats Grid */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {statCards.map((stat, index) => (
                <Card key={index} bg={cardBg}>
                  <CardBody>
                    <Stat>
                      <HStack justify="space-between" mb={2}>
                        <StatLabel fontSize="sm" fontWeight="medium">
                          {stat.label}
                        </StatLabel>
                        <Icon
                          as={stat.icon}
                          w={6}
                          h={6}
                          color={`${stat.color}.500`}
                        />
                      </HStack>
                      <StatNumber fontSize="2xl" fontWeight="bold">
                        {stat.value}
                      </StatNumber>
                      <StatHelpText fontSize="xs" color="gray.500">
                        {stat.helpText}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>

            {/* Quick Actions */}
            <Card bg={cardBg}>
              <CardHeader>
                <Heading size="md">Thao tác nhanh</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  {quickActions.map((action, index) => (
                    <Card
                      key={index}
                      variant="outline"
                      cursor="pointer"
                      _hover={{
                        shadow: 'md',
                        borderColor: `${action.color}.300`,
                        transform: 'translateY(-2px)'
                      }}
                      transition="all 0.2s"
                      onClick={action.action}
                    >
                      <CardBody>
                        <VStack spacing={3} align="start">
                          <HStack justify="space-between" w="full">
                            <Icon
                              as={action.icon}
                              w={8}
                              h={8}
                              color={`${action.color}.500`}
                            />
                            {action.count > 0 && (
                              <Badge
                                colorScheme={action.color}
                                variant="solid"
                                borderRadius="full"
                              >
                                {action.count}
                              </Badge>
                            )}
                          </HStack>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold">{action.title}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {action.description}
                            </Text>
                          </VStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Recent Activity Summary */}
            <Card bg={cardBg}>
              <CardHeader>
                <Heading size="md">Tóm tắt hoạt động</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" p={4} bg="blue.50" borderRadius="md">
                    <HStack>
                      <Icon as={FiUserPlus} color="blue.500" />
                      <Text fontWeight="medium">Người dùng mới hôm nay</Text>
                    </HStack>
                    <Badge colorScheme="blue" fontSize="sm">
                      {stats?.users_today || 0}
                    </Badge>
                  </HStack>
                  
                  <HStack justify="space-between" p={4} bg="purple.50" borderRadius="md">
                    <HStack>
                      <Icon as={FiFile} color="purple.500" />
                      <Text fontWeight="medium">Bài viết mới hôm nay</Text>
                    </HStack>
                    <Badge colorScheme="purple" fontSize="sm">
                      {stats?.posts_today || 0}
                    </Badge>
                  </HStack>
                  
                  <HStack justify="space-between" p={4} bg="orange.50" borderRadius="md">
                    <HStack>
                      <Icon as={FiAlertTriangle} color="orange.500" />
                      <Text fontWeight="medium">Báo cáo cần xử lý</Text>
                    </HStack>
                    <Badge 
                      colorScheme={stats?.pending_reports > 0 ? "orange" : "green"} 
                      fontSize="sm"
                    >
                      {stats?.pending_reports || 0}
                    </Badge>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Box>
      </HStack>
    </Box>
  );
};

export default AdminDashboard; 