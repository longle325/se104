import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Grid,
  GridItem,
  Card,
  CardBody,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Alert,
  AlertIcon,
  Spinner,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Icon,
  Divider,
  SimpleGrid
} from '@chakra-ui/react';
import {
  FiUsers,
  FiFileText,
  FiMessageCircle,
  FiFlag,
  FiTrendingUp,
  FiEye,
  FiSearch,
  FiClock
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    overview: {
      totalUsers: 0,
      totalPosts: 0,
      totalComments: 0,
      totalReports: 0,
      bannedUsers: 0,
      mutedUsers: 0,
      pendingReports: 0,
      resolvedReports: 0
    },
    trends: {
      newUsersThisWeek: 0,
      newPostsThisWeek: 0,
      newReportsThisWeek: 0,
      userGrowthRate: 0,
      postGrowthRate: 0
    },
    topUsers: [],
    recentActivity: [],
    categoryDistribution: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const statCardBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchAnalytics();
  }, [navigate]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      
      // Fetch dashboard stats
      const statsResponse = await fetch('http://localhost:8000/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        
        // Fetch additional analytics data
        const [usersResponse, postsResponse, reportsResponse] = await Promise.all([
          fetch('http://localhost:8000/admin/users?limit=10', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:8000/admin/posts?limit=10', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:8000/admin/reports?limit=10', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        const [usersData, postsData, reportsData] = await Promise.all([
          usersResponse.json(),
          postsResponse.json(),
          reportsResponse.json()
        ]);
        
        // Process data for analytics
        const processedAnalytics = {
          overview: {
            totalUsers: statsData.total_users,
            totalPosts: statsData.total_posts,
            totalComments: statsData.total_comments || 0,
            totalReports: statsData.total_reports,
            bannedUsers: statsData.banned_users,
            mutedUsers: statsData.muted_users,
            pendingReports: statsData.pending_reports,
            resolvedReports: statsData.total_reports - statsData.pending_reports
          },
          trends: {
            newUsersThisWeek: statsData.new_users_week || 0,
            newPostsThisWeek: statsData.new_posts_week || 0,
            newReportsThisWeek: statsData.new_reports_week || 0,
            userGrowthRate: calculateGrowthRate(statsData.new_users_week, statsData.total_users),
            postGrowthRate: calculateGrowthRate(statsData.new_posts_week, statsData.total_posts)
          },
          topUsers: usersData.users?.slice(0, 5) || [],
          recentActivity: [...(postsData.posts?.slice(0, 3) || []), ...(reportsData.reports?.slice(0, 2) || [])],
          categoryDistribution: [
            { name: 'Tìm đồ', value: statsData.lost_posts || 0, color: 'red' },
            { name: 'Nhặt được', value: statsData.found_posts || 0, color: 'green' }
          ]
        };
        
        setAnalytics(processedAnalytics);
      } else if (statsResponse.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowthRate = (newCount, totalCount) => {
    if (totalCount === 0) return 0;
    const oldCount = totalCount - newCount;
    if (oldCount === 0) return 100;
    return ((newCount / oldCount) * 100).toFixed(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={bg} display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Đang tải dữ liệu phân tích...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg={bg} p={8}>
        <Alert status="error">
          <AlertIcon />
          <Text>Lỗi: {error}</Text>
        </Alert>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bg}>
      <HStack spacing={0} align="stretch" minH="100vh">
        <AdminSidebar />
        
        <Box flex={1} p={8}>
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <VStack align="start" spacing={2}>
              <Heading size="lg">Phân tích dữ liệu</Heading>
              <Text color="gray.600">Thống kê và xu hướng hệ thống</Text>
            </VStack>

            {/* Overview Stats */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
              <Card bg={statCardBg} shadow="sm">
                <CardBody>
                  <Stat>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <StatLabel fontSize="sm" color="gray.500">Tổng người dùng</StatLabel>
                        <StatNumber fontSize="2xl">{analytics.overview.totalUsers}</StatNumber>
                        <StatHelpText mb={0}>
                          <StatArrow type="increase" />
                          {analytics.trends.userGrowthRate}% tuần này
                        </StatHelpText>
                      </VStack>
                      <Icon as={FiUsers} fontSize="2xl" color="blue.500" />
                    </HStack>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={statCardBg} shadow="sm">
                <CardBody>
                  <Stat>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <StatLabel fontSize="sm" color="gray.500">Tổng bài viết</StatLabel>
                        <StatNumber fontSize="2xl">{analytics.overview.totalPosts}</StatNumber>
                        <StatHelpText mb={0}>
                          <StatArrow type="increase" />
                          {analytics.trends.postGrowthRate}% tuần này
                        </StatHelpText>
                      </VStack>
                      <Icon as={FiFileText} fontSize="2xl" color="green.500" />
                    </HStack>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={statCardBg} shadow="sm">
                <CardBody>
                  <Stat>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <StatLabel fontSize="sm" color="gray.500">Báo cáo chờ xử lý</StatLabel>
                        <StatNumber fontSize="2xl">{analytics.overview.pendingReports}</StatNumber>
                        <StatHelpText mb={0}>
                          <Text fontSize="xs" color="orange.500">
                            Cần xem xét
                          </Text>
                        </StatHelpText>
                      </VStack>
                      <Icon as={FiFlag} fontSize="2xl" color="orange.500" />
                    </HStack>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={statCardBg} shadow="sm">
                <CardBody>
                  <Stat>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <StatLabel fontSize="sm" color="gray.500">Người dùng bị khóa</StatLabel>
                        <StatNumber fontSize="2xl">{analytics.overview.bannedUsers}</StatNumber>
                        <StatHelpText mb={0}>
                          <Text fontSize="xs" color="gray.500">
                            {analytics.overview.mutedUsers} bị tạm khóa
                          </Text>
                        </StatHelpText>
                      </VStack>
                      <Icon as={FiUsers} fontSize="2xl" color="red.500" />
                    </HStack>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Trends and Distribution */}
            <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
              {/* Weekly Trends */}
              <Card bg={cardBg}>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <Heading size="md">Xu hướng tuần này</Heading>
                    
                    <SimpleGrid columns={3} spacing={4}>
                      <VStack spacing={2}>
                        <Icon as={FiUsers} fontSize="2xl" color="blue.500" />
                        <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                          {analytics.trends.newUsersThisWeek}
                        </Text>
                        <Text fontSize="sm" color="gray.500" textAlign="center">
                          Người dùng mới
                        </Text>
                      </VStack>
                      
                      <VStack spacing={2}>
                        <Icon as={FiFileText} fontSize="2xl" color="green.500" />
                        <Text fontSize="2xl" fontWeight="bold" color="green.500">
                          {analytics.trends.newPostsThisWeek}
                        </Text>
                        <Text fontSize="sm" color="gray.500" textAlign="center">
                          Bài viết mới
                        </Text>
                      </VStack>
                      
                      <VStack spacing={2}>
                        <Icon as={FiFlag} fontSize="2xl" color="orange.500" />
                        <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                          {analytics.trends.newReportsThisWeek}
                        </Text>
                        <Text fontSize="sm" color="gray.500" textAlign="center">
                          Báo cáo mới
                        </Text>
                      </VStack>
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>

              {/* Category Distribution */}
              <Card bg={cardBg}>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <Heading size="md">Phân bố danh mục</Heading>
                    
                    <VStack spacing={3}>
                      {analytics.categoryDistribution.map((category, index) => (
                        <HStack key={index} justify="space-between" w="full">
                          <HStack>
                            <Badge colorScheme={category.color} variant="solid">
                              {category.name}
                            </Badge>
                          </HStack>
                          <VStack spacing={0} align="end">
                            <Text fontWeight="bold">{category.value}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {((category.value / analytics.overview.totalPosts) * 100).toFixed(1)}%
                            </Text>
                          </VStack>
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            </Grid>

            {/* Recent Activity */}
            <Card bg={cardBg}>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Heading size="md">Hoạt động gần đây</Heading>
                  
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Loại</Th>
                          <Th>Tiêu đề</Th>
                          <Th>Người dùng</Th>
                          <Th>Thời gian</Th>
                          <Th>Trạng thái</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {analytics.recentActivity.slice(0, 8).map((item, index) => (
                          <Tr key={index}>
                            <Td>
                              {item.category ? (
                                <Badge 
                                  colorScheme={item.category === 'lost' ? 'red' : 'green'} 
                                  variant="solid"
                                >
                                  {item.category === 'lost' ? 'Tìm đồ' : 'Nhặt được'}
                                </Badge>
                              ) : (
                                <Badge colorScheme="orange" variant="solid">
                                  Báo cáo
                                </Badge>
                              )}
                            </Td>
                            <Td>
                              <Text noOfLines={1} maxW="200px">
                                {item.title || item.reason}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {item.author || item.reporter}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm" color="gray.500">
                                {formatDate(item.created_at)}
                              </Text>
                            </Td>
                            <Td>
                              <Badge 
                                colorScheme={
                                  item.status === 'pending' ? 'orange' :
                                  item.status === 'resolved' ? 'green' : 'blue'
                                }
                                variant="outline"
                              >
                                {item.status === 'pending' ? 'Chờ xử lý' :
                                 item.status === 'resolved' ? 'Đã xử lý' : 'Hoạt động'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </VStack>
              </CardBody>
            </Card>

            {/* Top Users */}
            <Card bg={cardBg}>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Heading size="md">Người dùng tích cực</Heading>
                  
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Người dùng</Th>
                          <Th>Email</Th>
                          <Th>Số bài viết</Th>
                          <Th>Ngày tham gia</Th>
                          <Th>Trạng thái</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {analytics.topUsers.map((user, index) => (
                          <Tr key={index}>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">
                                  {user.full_name || user.username}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  @{user.username}
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <Text fontSize="sm">{user.email}</Text>
                            </Td>
                            <Td>
                              <Text>{user.posts_count || 0}</Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm" color="gray.500">
                                {formatDate(user.created_at)}
                              </Text>
                            </Td>
                            <Td>
                              <Badge 
                                colorScheme={
                                  user.is_banned ? 'red' :
                                  user.is_muted ? 'orange' : 'green'
                                }
                                variant="outline"
                              >
                                {user.is_banned ? 'Đã khóa' :
                                 user.is_muted ? 'Bị tạm khóa' : 'Hoạt động'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Box>
      </HStack>
    </Box>
  );
};

export default AdminAnalytics; 