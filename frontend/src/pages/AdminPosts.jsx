import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  Input,
  Select,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Avatar,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Textarea,
  InputGroup,
  InputLeftElement,
  Icon,
  Card,
  CardBody,
  Image,
  Link
} from '@chakra-ui/react';
import {
  FiMoreVertical,
  FiTrash2,
  FiEye,
  FiSearch,
  FiFlag
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminTokenRefresh from '../components/AdminTokenRefresh';

const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();
  
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchPosts();
  }, [navigate, searchTerm, categoryFilter]);

  const adminFetch = async (url, options = {}) => {
    let token = localStorage.getItem('admin_token');
    
    if (!token) {
      // Try to get new token
      try {
        const loginResponse = await fetch('http://localhost:8000/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin12', password: '123456' }),
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          token = loginData.access_token;
          localStorage.setItem('admin_token', token);
          console.log('Auto-logged in with new token');
        } else {
          throw new Error('Auto-login failed');
        }
      } catch (error) {
        console.error('Auto-login error:', error);
        navigate('/admin/login');
        throw error;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    // If 401, try to refresh token once
    if (response.status === 401) {
      try {
        const loginResponse = await fetch('http://localhost:8000/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin12', password: '123456' }),
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          const newToken = loginData.access_token;
          localStorage.setItem('admin_token', newToken);
          console.log('Token refreshed, retrying request');
          
          // Retry with new token
          return await fetch(url, {
            ...options,
            headers: {
              'Authorization': `Bearer ${newToken}`,
              ...options.headers,
            },
          });
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      // If refresh failed, redirect to login
      localStorage.removeItem('admin_token');
      navigate('/admin/login');
      throw new Error('Authentication failed');
    }

    return response;
  };

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts...');
      
      const params = new URLSearchParams({
        limit: '50',
        skip: '0',
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter })
      });

      const url = `http://localhost:8000/admin/posts?${params}`;
      console.log('Fetching URL:', url);

      const response = await adminFetch(url);
      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Posts data:', data);
        setPosts(data.posts || []);
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: 'Lỗi',
        description: `Không thể tải danh sách bài viết: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      if (deleteReason) {
        params.append('reason', deleteReason);
      }
      
      const response = await fetch(`http://localhost:8000/admin/posts/${selectedPost.id}?${params}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        toast({
          title: 'Thành công',
          description: 'Đã xóa bài viết',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        fetchPosts();
        onClose();
        setDeleteReason('');
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa bài viết',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (post) => {
    setSelectedPost(post);
    setDeleteReason('');
    onOpen();
  };

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      lost: { colorScheme: 'red', label: 'Tìm đồ' },
      found: { colorScheme: 'green', label: 'Nhặt được' }
    };
    
    const config = categoryConfig[category] || { colorScheme: 'gray', label: 'Khác' };
    return <Badge colorScheme={config.colorScheme} variant="solid">{config.label}</Badge>;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { colorScheme: 'green', label: 'Hoạt động' },
      found: { colorScheme: 'blue', label: 'Đã tìm được' },
      returned: { colorScheme: 'purple', label: 'Đã hoàn trả' },
      not_found: { colorScheme: 'orange', label: 'Chưa tìm được' },
      not_returned: { colorScheme: 'orange', label: 'Chưa hoàn trả' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return <Badge colorScheme={config.colorScheme} variant="outline">{config.label}</Badge>;
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
          <Text>Đang tải...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bg}>
      <AdminTokenRefresh />
      <HStack spacing={0} align="stretch" minH="100vh">
        <AdminSidebar />
        
        <Box flex={1} p={8}>
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <VStack align="start" spacing={2}>
              <HStack justify="space-between" w="full">
                <VStack align="start" spacing={1}>
                  <Heading size="lg">Quản lý bài viết</Heading>
                  <Text color="gray.600">Xem và kiểm duyệt các bài viết</Text>
                </VStack>
                <Button onClick={fetchPosts} colorScheme="blue" size="sm">
                  Reload
                </Button>
              </HStack>
            </VStack>

            {/* Filters */}
            <Card bg={cardBg}>
              <CardBody>
                <VStack spacing={4}>
                  <HStack spacing={4} w="full">
                    <InputGroup flex={1}>
                      <InputLeftElement>
                        <Icon as={FiSearch} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Tìm kiếm theo tiêu đề, nội dung..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                    
                    <Select
                      w="200px"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="">Tất cả danh mục</option>
                      <option value="lost">Tìm đồ</option>
                      <option value="found">Nhặt được</option>
                    </Select>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Posts Table */}
            <Card bg={cardBg}>
              <CardBody p={0}>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Bài viết</Th>
                        <Th>Tác giả</Th>
                        <Th>Danh mục</Th>
                        <Th>Trạng thái</Th>
                        <Th>Báo cáo</Th>
                        <Th>Lượt xem</Th>
                        <Th>Ngày đăng</Th>
                        <Th>Thao tác</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {posts.map((post) => (
                        <Tr key={post.id}>
                          <Td>
                            <HStack spacing={3}>
                              {post.image_urls && post.image_urls.length > 0 ? (
                                <Image
                                  src={`http://localhost:8000${post.image_urls[0]}`}
                                  alt={post.title}
                                  boxSize="60px"
                                  objectFit="cover"
                                  borderRadius="md"
                                  fallbackSrc="https://via.placeholder.com/60"
                                />
                              ) : (
                                <Box
                                  w="60px"
                                  h="60px"
                                  bg="gray.100"
                                  borderRadius="md"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                >
                                  <Icon as={FiEye} color="gray.400" />
                                </Box>
                              )}
                              <VStack align="start" spacing={1}>
                                <Link
                                  href={`/posts/${post.id}`}
                                  color="blue.500"
                                  fontWeight="semibold"
                                  _hover={{ textDecoration: 'underline' }}
                                  noOfLines={2}
                                >
                                  {post.title}
                                </Link>
                                <Text fontSize="sm" color="gray.500" noOfLines={2}>
                                  {post.content}
                                </Text>
                                {post.location && (
                                  <Text fontSize="xs" color="gray.400">
                                    📍 {post.location}
                                  </Text>
                                )}
                              </VStack>
                            </HStack>
                          </Td>
                          
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium">
                                {post.author_info?.full_name || post.author}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                {post.author_info?.email || ''}
                              </Text>
                            </VStack>
                          </Td>
                          
                          <Td>
                            {getCategoryBadge(post.category)}
                          </Td>
                          
                          <Td>
                            {getStatusBadge(post.status)}
                          </Td>
                          
                          <Td>
                            {post.reports_count > 0 ? (
                              <Badge colorScheme="red" variant="solid">
                                {post.reports_count}
                              </Badge>
                            ) : (
                              <Badge colorScheme="green" variant="outline">
                                0
                              </Badge>
                            )}
                          </Td>
                          
                          <Td>
                            <Text fontSize="sm">
                              {post.view_count || 0}
                            </Text>
                          </Td>
                          
                          <Td>
                            <Text fontSize="sm">
                              {formatDate(post.created_at)}
                            </Text>
                          </Td>
                          
                          <Td>
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<FiMoreVertical />}
                                variant="ghost"
                                size="sm"
                              />
                              <MenuList>
                                <MenuItem
                                  icon={<FiEye />}
                                  onClick={() => window.open(`/posts/${post.id}`, '_blank')}
                                >
                                  Xem chi tiết
                                </MenuItem>
                                
                                {post.reports_count > 0 && (
                                  <MenuItem
                                    icon={<FiFlag />}
                                    onClick={() => navigate('/admin/reports')}
                                    color="orange.500"
                                  >
                                    Xem báo cáo
                                  </MenuItem>
                                )}
                                
                                <MenuItem
                                  icon={<FiTrash2 />}
                                  onClick={() => openDeleteModal(post)}
                                  color="red.500"
                                >
                                  Xóa bài viết
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>

            {posts.length === 0 && (
              <Alert status="info">
                <AlertIcon />
                Không tìm thấy bài viết nào
              </Alert>
            )}
          </VStack>
        </Box>
      </HStack>

      {/* Delete Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Xóa bài viết</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {selectedPost && (
                <Box p={4} bg="gray.50" borderRadius="md">
                  <VStack spacing={2} align="start">
                    <Text fontWeight="semibold">Thông tin bài viết:</Text>
                    <Text fontSize="sm">
                      <strong>Tiêu đề:</strong> {selectedPost.title}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Tác giả:</strong> {selectedPost.author}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Danh mục:</strong> {selectedPost.category === 'lost' ? 'Tìm đồ' : 'Nhặt được'}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Số báo cáo:</strong> {selectedPost.reports_count}
                    </Text>
                  </VStack>
                </Box>
              )}
              
              <Alert status="warning">
                <AlertIcon />
                <Text fontSize="sm">
                  Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác!
                </Text>
              </Alert>
              
              <FormControl>
                <FormLabel>Lý do xóa (không bắt buộc)</FormLabel>
                <Textarea
                  placeholder="Nhập lý do xóa bài viết..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Hủy
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeletePost}
              isLoading={submitting}
            >
              Xóa bài viết
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminPosts; 