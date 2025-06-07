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
  Select,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
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
  Card,
  CardBody,
  Link
} from '@chakra-ui/react';
import {
  FiMoreVertical,
  FiTrash2,
  FiAlertTriangle,
  FiX
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
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
    fetchReports();
  }, [navigate, statusFilter]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        limit: '50',
        skip: '0',
        ...(statusFilter && { status_filter: statusFilter })
      });

      const response = await fetch(`http://localhost:8000/admin/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      } else if (response.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      } else {
        throw new Error('Failed to fetch reports');
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách báo cáo',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async () => {
    if (!selectedReport || !actionType) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(`http://localhost:8000/admin/reports/${selectedReport.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: actionType,
          reason: actionReason
        })
      });

      if (response.ok) {
        toast({
          title: 'Thành công',
          description: `Đã ${getActionLabel(actionType)} báo cáo`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        fetchReports();
        onClose();
        setActionReason('');
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

  const openActionModal = (report, action) => {
    setSelectedReport(report);
    setActionType(action);
    setActionReason('');
    onOpen();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { colorScheme: 'orange', label: 'Chờ xử lý' },
      reviewed: { colorScheme: 'blue', label: 'Đã xem' },
      resolved: { colorScheme: 'green', label: 'Đã xử lý' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge colorScheme={config.colorScheme} variant="solid">{config.label}</Badge>;
  };

  const getReasonLabel = (reason) => {
    const reasonMap = {
      spam: 'Spam/Quảng cáo',
      inappropriate: 'Nội dung không phù hợp',
      fake: 'Thông tin giả mạo',
      other: 'Lý do khác'
    };
    return reasonMap[reason] || reason;
  };

  const getActionLabel = (action) => {
    const actionMap = {
      delete_post: 'xóa bài viết',
      warn_user: 'cảnh báo người dùng',
      ignore: 'bỏ qua',
      resolve: 'giải quyết'
    };
    return actionMap[action] || action;
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
      <HStack spacing={0} align="stretch" minH="100vh">
        <AdminSidebar />
        
        <Box flex={1} p={8}>
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <VStack align="start" spacing={2}>
              <Heading size="lg">Quản lý báo cáo</Heading>
              <Text color="gray.600">Xem xét và xử lý các báo cáo từ người dùng</Text>
            </VStack>

            {/* Filters */}
            <Card bg={cardBg}>
              <CardBody>
                <HStack spacing={4}>
                  <Text fontWeight="medium">Lọc theo trạng thái:</Text>
                  <Select
                    w="200px"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="reviewed">Đã xem</option>
                    <option value="resolved">Đã xử lý</option>
                  </Select>
                </HStack>
              </CardBody>
            </Card>

            {/* Reports Table */}
            <Card bg={cardBg}>
              <CardBody p={0}>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Bài viết</Th>
                        <Th>Người báo cáo</Th>
                        <Th>Lý do</Th>
                        <Th>Trạng thái</Th>
                        <Th>Ngày báo cáo</Th>
                        <Th>Thao tác</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {reports.map((report) => (
                        <Tr key={report.id}>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Link
                                href={`/posts/${report.post_id}`}
                                color="blue.500"
                                fontWeight="semibold"
                                _hover={{ textDecoration: 'underline' }}
                              >
                                {report.post_title}
                              </Link>
                              <Text fontSize="sm" color="gray.500">
                                ID: {report.post_id}
                              </Text>
                            </VStack>
                          </Td>
                          
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium">
                                {report.reporter_info?.full_name || report.reporter}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                {report.reporter_info?.email || ''}
                              </Text>
                            </VStack>
                          </Td>
                          
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Badge colorScheme="red" variant="outline">
                                {getReasonLabel(report.reason)}
                              </Badge>
                              {report.description && (
                                <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                  {report.description}
                                </Text>
                              )}
                            </VStack>
                          </Td>
                          
                          <Td>
                            <VStack align="start" spacing={1}>
                              {getStatusBadge(report.status)}
                              {report.action_taken && (
                                <Text fontSize="xs" color="green.600">
                                  Đã {getActionLabel(report.action_taken)}
                                </Text>
                              )}
                            </VStack>
                          </Td>
                          
                          <Td>
                            <Text fontSize="sm">
                              {formatDate(report.created_at)}
                            </Text>
                          </Td>
                          
                          <Td>
                            {report.status === 'pending' ? (
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  icon={<FiMoreVertical />}
                                  variant="ghost"
                                  size="sm"
                                />
                                <MenuList>
                                  <MenuItem
                                    icon={<FiTrash2 />}
                                    onClick={() => openActionModal(report, 'delete_post')}
                                    color="red.500"
                                  >
                                    Xóa bài viết
                                  </MenuItem>
                                  
                                  <MenuItem
                                    icon={<FiAlertTriangle />}
                                    onClick={() => openActionModal(report, 'warn_user')}
                                    color="orange.500"
                                  >
                                    Cảnh báo người dùng
                                  </MenuItem>
                                  
                                  <MenuItem
                                    icon={<FiX />}
                                    onClick={() => openActionModal(report, 'ignore')}
                                    color="gray.500"
                                  >
                                    Bỏ qua
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            ) : (
                              <Text fontSize="sm" color="gray.500">
                                Đã xử lý
                              </Text>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>

            {reports.length === 0 && (
              <Alert status="info">
                <AlertIcon />
                Không có báo cáo nào {statusFilter && `với trạng thái "${statusFilter}"`}
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
            Xử lý báo cáo: {getActionLabel(actionType)}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {selectedReport && (
                <Box p={4} bg="gray.50" borderRadius="md">
                  <VStack spacing={2} align="start">
                    <Text fontWeight="semibold">Thông tin báo cáo:</Text>
                    <Text fontSize="sm">
                      <strong>Bài viết:</strong> {selectedReport.post_title}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Người báo cáo:</strong> {selectedReport.reporter}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Lý do:</strong> {getReasonLabel(selectedReport.reason)}
                    </Text>
                    {selectedReport.description && (
                      <Text fontSize="sm">
                        <strong>Mô tả:</strong> {selectedReport.description}
                      </Text>
                    )}
                  </VStack>
                </Box>
              )}
              
              <Text color="red.600" fontSize="sm">
                Bạn có chắc chắn muốn {getActionLabel(actionType)} cho báo cáo này?
              </Text>
              
              <FormControl>
                <FormLabel>Ghi chú (không bắt buộc)</FormLabel>
                <Textarea
                  placeholder="Nhập ghi chú về quyết định của bạn..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={3}
                />
              </FormControl>
              
              {actionType === 'delete_post' && (
                <Alert status="warning">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Hành động này sẽ xóa vĩnh viễn bài viết và không thể hoàn tác!
                  </Text>
                </Alert>
              )}
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Hủy
            </Button>
            <Button
              colorScheme={actionType === 'delete_post' ? 'red' : 'blue'}
              onClick={handleReportAction}
              isLoading={submitting}
            >
              Xác nhận {getActionLabel(actionType)}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminReports; 