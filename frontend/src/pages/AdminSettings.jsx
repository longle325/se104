import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  Divider,
  Badge,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  SimpleGrid,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import {
  FiSettings,
  FiSave,
  FiRefreshCw,
  FiPlus,
  FiTrash2,
  FiEdit,
  FiCheck
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    general: {
      siteName: 'UIT Lost & Found',
      siteDescription: 'Nền tảng kết nối tìm kiếm đồ vật thất lạc cho sinh viên trường ĐH CNTT',
      maxPostsPerUser: 50,
      maxImagesPerPost: 5,
      autoDeletePosts: false,
      autoDeleteDays: 30
    },
    moderation: {
      requirePostApproval: false,
      autoFlagSpam: true,
      maxReportsBeforeHide: 5,
      banDuration: 7,
      muteDuration: 3
    },
    categories: [
      { id: 1, name: 'Thẻ sinh viên', value: 'the_sinh_vien', active: true },
      { id: 2, name: 'Ví/Giấy tờ', value: 'vi_giay_to', active: true },
      { id: 3, name: 'Điện thoại/Tablet/Laptop', value: 'dien_tu', active: true },
      { id: 4, name: 'Đồ vật khác', value: 'khac', active: true }
    ],
    locations: [
      { id: 1, name: 'Cổng trước', active: true },
      { id: 2, name: 'Tòa A', active: true },
      { id: 3, name: 'Tòa B', active: true },
      { id: 4, name: 'Tòa C', active: true },
      { id: 5, name: 'Tòa D', active: true },
      { id: 6, name: 'Tòa E', active: true },
      { id: 7, name: 'Căng tin', active: true },
      { id: 8, name: 'Cafe Vối', active: true },
      { id: 9, name: 'Sân thể thao', active: true },
      { id: 10, name: 'Bãi đỗ xe', active: true },
      { id: 11, name: 'Cổng sau', active: true }
    ]
  });
  
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', value: '' });
  const [newLocation, setNewLocation] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  
  const { isOpen: isCategoryOpen, onOpen: onCategoryOpen, onClose: onCategoryClose } = useDisclosure();
  const { isOpen: isLocationOpen, onOpen: onLocationOpen, onClose: onLocationClose } = useDisclosure();
  
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
    loadSettings();
  }, [navigate]);

  const loadSettings = async () => {
    // In a real app, this would fetch from the backend
    // For now, we use the default settings
    setLoading(false);
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // In a real app, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: 'Thành công',
        description: 'Cài đặt đã được lưu',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu cài đặt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      general: {
        ...prev.general,
        [field]: value
      }
    }));
  };

  const handleModerationChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      moderation: {
        ...prev.moderation,
        [field]: value
      }
    }));
  };

  const addCategory = () => {
    if (!newCategory.name || !newCategory.value) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập đầy đủ thông tin',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newId = Math.max(...settings.categories.map(c => c.id)) + 1;
    setSettings(prev => ({
      ...prev,
      categories: [...prev.categories, {
        id: newId,
        name: newCategory.name,
        value: newCategory.value,
        active: true
      }]
    }));
    
    setNewCategory({ name: '', value: '' });
    onCategoryClose();
    
    toast({
      title: 'Thành công',
      description: 'Đã thêm danh mục mới',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const addLocation = () => {
    if (!newLocation) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên địa điểm',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newId = Math.max(...settings.locations.map(l => l.id)) + 1;
    setSettings(prev => ({
      ...prev,
      locations: [...prev.locations, {
        id: newId,
        name: newLocation,
        active: true
      }]
    }));
    
    setNewLocation('');
    onLocationClose();
    
    toast({
      title: 'Thành công',
      description: 'Đã thêm địa điểm mới',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const toggleCategoryStatus = (id) => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === id ? { ...cat, active: !cat.active } : cat
      )
    }));
  };

  const toggleLocationStatus = (id) => {
    setSettings(prev => ({
      ...prev,
      locations: prev.locations.map(loc =>
        loc.id === id ? { ...loc, active: !loc.active } : loc
      )
    }));
  };

  const deleteCategory = (id) => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== id)
    }));
    
    toast({
      title: 'Thành công',
      description: 'Đã xóa danh mục',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const deleteLocation = (id) => {
    setSettings(prev => ({
      ...prev,
      locations: prev.locations.filter(loc => loc.id !== id)
    }));
    
    toast({
      title: 'Thành công',
      description: 'Đã xóa địa điểm',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box minH="100vh" bg={bg}>
      <HStack spacing={0} align="stretch" minH="100vh">
        <AdminSidebar />
        
        <Box flex={1} p={8}>
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <VStack align="start" spacing={2}>
              <Heading size="lg">Cài đặt hệ thống</Heading>
              <Text color="gray.600">Quản lý cấu hình và tùy chọn hệ thống</Text>
            </VStack>

            {/* General Settings */}
            <Card bg={cardBg}>
              <CardHeader>
                <Heading size="md">Cài đặt chung</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Tên trang web</FormLabel>
                      <Input
                        value={settings.general.siteName}
                        onChange={(e) => handleGeneralChange('siteName', e.target.value)}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Số bài viết tối đa/người dùng</FormLabel>
                      <NumberInput
                        value={settings.general.maxPostsPerUser}
                        onChange={(value) => handleGeneralChange('maxPostsPerUser', parseInt(value))}
                        min={1}
                        max={1000}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </SimpleGrid>
                  
                  <FormControl>
                    <FormLabel>Mô tả trang web</FormLabel>
                    <Textarea
                      value={settings.general.siteDescription}
                      onChange={(e) => handleGeneralChange('siteDescription', e.target.value)}
                      rows={3}
                    />
                  </FormControl>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Số ảnh tối đa/bài viết</FormLabel>
                      <NumberInput
                        value={settings.general.maxImagesPerPost}
                        onChange={(value) => handleGeneralChange('maxImagesPerPost', parseInt(value))}
                        min={1}
                        max={10}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Tự động xóa bài cũ (ngày)</FormLabel>
                      <NumberInput
                        value={settings.general.autoDeleteDays}
                        onChange={(value) => handleGeneralChange('autoDeleteDays', parseInt(value))}
                        min={7}
                        max={365}
                        isDisabled={!settings.general.autoDeletePosts}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </SimpleGrid>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="auto-delete" mb="0">
                      Tự động xóa bài viết cũ
                    </FormLabel>
                    <Switch
                      id="auto-delete"
                      isChecked={settings.general.autoDeletePosts}
                      onChange={(e) => handleGeneralChange('autoDeletePosts', e.target.checked)}
                    />
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Moderation Settings */}
            <Card bg={cardBg}>
              <CardHeader>
                <Heading size="md">Cài đặt kiểm duyệt</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Thời gian khóa tài khoản (ngày)</FormLabel>
                      <NumberInput
                        value={settings.moderation.banDuration}
                        onChange={(value) => handleModerationChange('banDuration', parseInt(value))}
                        min={1}
                        max={365}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Thời gian tạm khóa bình luận (ngày)</FormLabel>
                      <NumberInput
                        value={settings.moderation.muteDuration}
                        onChange={(value) => handleModerationChange('muteDuration', parseInt(value))}
                        min={1}
                        max={30}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </SimpleGrid>
                  
                  <FormControl>
                    <FormLabel>Số báo cáo tối đa trước khi ẩn bài</FormLabel>
                    <NumberInput
                      value={settings.moderation.maxReportsBeforeHide}
                      onChange={(value) => handleModerationChange('maxReportsBeforeHide', parseInt(value))}
                      min={1}
                      max={50}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  
                  <VStack spacing={3} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="require-approval" mb="0">
                        Yêu cầu duyệt bài trước khi đăng
                      </FormLabel>
                      <Switch
                        id="require-approval"
                        isChecked={settings.moderation.requirePostApproval}
                        onChange={(e) => handleModerationChange('requirePostApproval', e.target.checked)}
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="auto-flag" mb="0">
                        Tự động đánh dấu spam
                      </FormLabel>
                      <Switch
                        id="auto-flag"
                        isChecked={settings.moderation.autoFlagSpam}
                        onChange={(e) => handleModerationChange('autoFlagSpam', e.target.checked)}
                      />
                    </FormControl>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Categories Management */}
            <Card bg={cardBg}>
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="md">Quản lý danh mục</Heading>
                  <Button leftIcon={<FiPlus />} colorScheme="blue" size="sm" onClick={onCategoryOpen}>
                    Thêm danh mục
                  </Button>
                </HStack>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  {settings.categories.map((category) => (
                    <HStack key={category.id} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">{category.name}</Text>
                        <Text fontSize="sm" color="gray.500">{category.value}</Text>
                      </VStack>
                      <HStack spacing={2}>
                        <Badge colorScheme={category.active ? 'green' : 'red'} variant="solid">
                          {category.active ? 'Hoạt động' : 'Tắt'}
                        </Badge>
                        <Switch
                          size="sm"
                          isChecked={category.active}
                          onChange={() => toggleCategoryStatus(category.id)}
                        />
                        <IconButton
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => deleteCategory(category.id)}
                          aria-label="Xóa danh mục"
                        />
                      </HStack>
                    </HStack>
                  ))}
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Locations Management */}
            <Card bg={cardBg}>
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="md">Quản lý địa điểm</Heading>
                  <Button leftIcon={<FiPlus />} colorScheme="green" size="sm" onClick={onLocationOpen}>
                    Thêm địa điểm
                  </Button>
                </HStack>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
                  {settings.locations.map((location) => (
                    <HStack key={location.id} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                      <Text fontWeight="medium">{location.name}</Text>
                      <HStack spacing={2}>
                        <Badge colorScheme={location.active ? 'green' : 'red'} variant="solid" size="sm">
                          {location.active ? 'ON' : 'OFF'}
                        </Badge>
                        <Switch
                          size="sm"
                          isChecked={location.active}
                          onChange={() => toggleLocationStatus(location.id)}
                        />
                        <IconButton
                          icon={<FiTrash2 />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => deleteLocation(location.id)}
                          aria-label="Xóa địa điểm"
                        />
                      </HStack>
                    </HStack>
                  ))}
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Save Button */}
            <Card bg={cardBg}>
              <CardBody>
                <HStack justify="space-between">
                  <Alert status="info" variant="left-accent">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Nhớ lưu thay đổi trước khi thoát khỏi trang
                    </Text>
                  </Alert>
                  
                  <HStack spacing={3}>
                    <Button
                      leftIcon={<FiRefreshCw />}
                      variant="outline"
                      onClick={loadSettings}
                      isLoading={loading}
                    >
                      Khôi phục
                    </Button>
                    <Button
                      leftIcon={<FiSave />}
                      colorScheme="blue"
                      onClick={saveSettings}
                      isLoading={loading}
                    >
                      Lưu thay đổi
                    </Button>
                  </HStack>
                </HStack>
              </CardBody>
            </Card>
          </VStack>
        </Box>
      </HStack>

      {/* Add Category Modal */}
      <Modal isOpen={isCategoryOpen} onClose={onCategoryClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Thêm danh mục mới</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Tên danh mục</FormLabel>
                <Input
                  placeholder="VD: Sách vở"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Giá trị (không dấu, viết thường)</FormLabel>
                <Input
                  placeholder="VD: sach_vo"
                  value={newCategory.value}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, value: e.target.value }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCategoryClose}>
              Hủy
            </Button>
            <Button colorScheme="blue" onClick={addCategory}>
              Thêm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Location Modal */}
      <Modal isOpen={isLocationOpen} onClose={onLocationClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Thêm địa điểm mới</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Tên địa điểm</FormLabel>
              <Input
                placeholder="VD: Tòa F"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onLocationClose}>
              Hủy
            </Button>
            <Button colorScheme="green" onClick={addLocation}>
              Thêm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminSettings; 