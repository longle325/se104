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
  NumberInput,
  NumberInputField,
  InputGroup,
  InputLeftElement,
  Icon,
  Card,
  CardBody
} from '@chakra-ui/react';
import {
  FiMoreVertical,
  FiUserX,
  FiUserCheck,
  FiMic,
  FiMicOff,
  FiSearch
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState('');
  const [actionData, setActionData] = useState({ reason: '', duration_days: 7 });
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
    fetchUsers();
  }, [navigate, searchTerm, filterType]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        limit: '50',
        skip: '0',
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== 'all' && { filter_type: filterType })
      });

      const response = await fetch(`http://localhost:8000/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else if (response.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách người dùng',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async () => {
    if (!selectedUser || !actionType) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('admin_token');
      let endpoint = '';
      let method = 'POST';
      let body = null;

      switch (actionType) {
        case 'ban':
          endpoint = `/admin/users/${selectedUser.username}/ban`;
          body = JSON.stringify({
            reason: actionData.reason,
            duration_days: actionData.duration_days === -1 ? null : actionData.duration_days
          });
          break;
        case 'unban':
          endpoint = `/admin/users/${selectedUser.username}/unban`;
          break;
        case 'mute':
          endpoint = `/admin/users/${selectedUser.username}/mute`;
          body = JSON.stringify({
            reason: actionData.reason,
            duration_days: actionData.duration_days
          });
          break;
        default:
          return;
      }

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        ...(body && { body })
      });

      if (response.ok) {
        toast({
          title: 'Thành công',
          description: `Đã ${actionType === 'ban' ? 'khóa' : actionType === 'unban' ? 'mở khóa' : 'hạn chế'} người dùng`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        fetchUsers();
        onClose();
        setActionData({ reason: '', duration_days: 7 });
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể thực hiện thao tác',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openActionModal = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setActionData({ reason: '', duration_days: 7 });
    onOpen();
  };

  const getStatusBadge = (user) => {
    if (user.is_banned) {
      return <Badge colorScheme="red" variant="solid">Bị khóa</Badge>;
    }
    if (user.is_muted) {
      return <Badge colorScheme="orange" variant="solid">Bị hạn chế</Badge>;
    }
    if (user.is_active) {
      return <Badge colorScheme="green" variant="solid">Hoạt động</Badge>;
    }
    return <Badge colorScheme="gray" variant="solid">Không hoạt động</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN');
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
      <HStack spacing={0} align="stretch" minH="100vh">
        <AdminSidebar />
        
        <Box flex={1} p={8}>
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <VStack align="start" spacing={2}>
              <Heading size="lg">Quản lý người dùng</Heading>
              <Text color="gray.600">Xem và quản lý tài khoản người dùng</Text>
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
                        placeholder="Tìm kiếm theo tên, email, MSSV..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                    
                    <Select
                      w="200px"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">Tất cả</option>
                      <option value="active">Hoạt động</option>
                      <option value="banned">Bị khóa</option>
                      <option value="muted">Bị hạn chế</option>
                    </Select>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Users Table */}
            <Card bg={cardBg}>
              <CardBody p={0}>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Người dùng</Th>
                        <Th>Trạng thái</Th>
                        <Th>Bài viết</Th>
                        <Th>Báo cáo</Th>
                        <Th>Ngày tham gia</Th>
                        <Th>Thao tác</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {users.map((user) => (
                        <Tr key={user.username}>
                          <Td>
                            <HStack spacing={3}>
                              <Avatar
                                size="md"
                                name={user.full_name || user.username || 'User'}
                                src={user.avatar_url}
                              />
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="semibold">
                                  {user.full_name || user.username}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  {user.email}
                                </Text>
                                {user.student_id && (
                                  <Text fontSize="xs" color="blue.500">
                                    MSSV: {user.student_id}
                                  </Text>
                                )}
                              </VStack>
                            </HStack>
                          </Td>
                          
                          <Td>
                            <VStack align="start" spacing={1}>
                              {getStatusBadge(user)}
                              {user.ban_until && (
                                <Text fontSize="xs" color="red.500">
                                  Khóa đến: {formatDate(user.ban_until)}
                                </Text>
                              )}
                              {user.mute_until && (
                                <Text fontSize="xs" color="orange.500">
                                  Hạn chế đến: {formatDate(user.mute_until)}
                                </Text>
                              )}
                            </VStack>
                          </Td>
                          
                          <Td>
                            <Badge colorScheme="purple" variant="outline">
                              {user.posts_count}
                            </Badge>
                          </Td>
                          
                          <Td>
                            <Badge 
                              colorScheme={user.reports_count > 0 ? "red" : "green"} 
                              variant="outline"
                            >
                              {user.reports_count}
                            </Badge>
                          </Td>
                          
                          <Td>
                            <Text fontSize="sm">
                              {formatDate(user.created_at)}
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
                                {user.is_banned ? (
                                  <MenuItem
                                    icon={<FiUserCheck />}
                                    onClick={() => openActionModal(user, 'unban')}
                                  >
                                    Mở khóa
                                  </MenuItem>
                                ) : (
                                  <MenuItem
                                    icon={<FiUserX />}
                                    onClick={() => openActionModal(user, 'ban')}
                                    color="red.500"
                                  >
                                    Khóa tài khoản
                                  </MenuItem>
                                )}
                                
                                <MenuItem
                                  icon={user.is_muted ? <FiMic /> : <FiMicOff />}
                                  onClick={() => openActionModal(user, 'mute')}
                                  color="orange.500"
                                >
                                  Hạn chế bình luận
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

            {users.length === 0 && (
              <Alert status="info">
                <AlertIcon />
                Không tìm thấy người dùng nào
              </Alert>
            )}
          </VStack>
        </Box>
      </HStack>

      {/* Action Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {actionType === 'ban' ? 'Khóa tài khoản' : 
             actionType === 'unban' ? 'Mở khóa tài khoản' : 
             'Hạn chế bình luận'}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4}>
              <Text>
                Bạn có chắc chắn muốn {actionType === 'ban' ? 'khóa' : actionType === 'unban' ? 'mở khóa' : 'hạn chế'} 
                {' '}tài khoản <strong>{selectedUser?.username}</strong>?
              </Text>
              
              {actionType !== 'unban' && (
                <>
                  <FormControl isRequired>
                    <FormLabel>Lý do</FormLabel>
                    <Textarea
                      placeholder="Nhập lý do..."
                      value={actionData.reason}
                      onChange={(e) => setActionData(prev => ({ ...prev, reason: e.target.value }))}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>
                      Thời hạn {actionType === 'ban' ? 'khóa' : 'hạn chế'} (ngày)
                    </FormLabel>
                    <NumberInput
                      min={1}
                      max={365}
                      value={actionData.duration_days}
                      onChange={(value) => setActionData(prev => ({ ...prev, duration_days: parseInt(value) || 7 }))}
                    >
                      <NumberInputField />
                    </NumberInput>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      {actionType === 'ban' && 'Để trống = khóa vĩnh viễn'}
                    </Text>
                  </FormControl>
                </>
              )}
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Hủy
            </Button>
            <Button
              colorScheme={actionType === 'unban' ? 'green' : 'red'}
              onClick={handleUserAction}
              isLoading={submitting}
            >
              Xác nhận
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminUsers; 