import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Image,
  VStack,
  HStack,
  Badge,
  Button,
  InputGroup,
  Input,
  InputLeftElement,
  Flex,
  Icon,
  useColorModeValue,
  useToast,
  Center,
  Stack,
  AspectRatio,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  IconButton,
  Select,
  Collapse,
  Grid,
  GridItem,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiMapPin, FiClock, FiUser, FiMessageCircle, FiPlus, FiEye, FiShare2, FiFilter, FiX, FiChevronLeft, FiChevronRight, FiEdit, FiTrash2 } from "react-icons/fi";
import { useAuth } from "../components/AuthContext";
import Navigation from "../components/Navigation";

// Import assets
import logoUIT from "../assets/HOMEPAGE/logo UIT.png";
import findIcon from "../assets/HOMEPAGE/find@4x.png";
import userIcon from "../assets/HOMEPAGE/user@4x.png";
import calendarIcon from "../assets/HOMEPAGE/calendar_747310.png";

const Homepage = () => {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filters, setFilters] = useState({
    timeRange: "",
    location: "",
    itemType: "",
    showFilters: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const { getAuthHeader, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bg = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const postsPerPage = 24;

  const categories = [
    { name: "Tất cả", value: "", color: "gray" },
    { name: "Tìm đồ", value: "lost", color: "red" },
    { name: "Nhặt được", value: "found", color: "green" }
  ];

  const timeRanges = [
    { name: "Tất cả", value: "" },
    { name: "Hôm nay", value: "today" },
    { name: "Tuần này", value: "week" },
    { name: "Tháng này", value: "month" }
  ];

  const locations = [
    { name: "Tất cả", value: "" },
    { name: "Cổng trước", value: "Cổng trước" },
    { name: "Tòa A", value: "Tòa A" },
    { name: "Tòa B", value: "Tòa B" },
    { name: "Tòa C", value: "Tòa C" },
    { name: "Tòa D", value: "Tòa D" },
    { name: "Tòa E", value: "Tòa E" },
    { name: "Căng tin", value: "Căng tin" },
    { name: "Cafe Vối", value: "Cafe Vối" },
    { name: "Sân thể thao", value: "Sân thể thao" },
    { name: "Bãi đỗ xe", value: "Bãi đỗ xe" },
    { name: "Cổng sau", value: "Cổng sau" }
  ];

  const itemTypes = [
    { name: "Tất cả", value: "" },
    { name: "Thẻ sinh viên", value: "the_sinh_vien" },
    { name: "Ví/Giấy tờ", value: "vi_giay_to" },
    { name: "Điện thoại/Tablet/Laptop", value: "dien_tu" },
    { name: "Đồ vật khác", value: "khac" }
  ];

  const fetchPosts = async () => {
    try {
      const response = await fetch(`http://localhost:8000/posts?category=${selectedCategory}&limit=200`, {
        headers: getAuthHeader(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        throw new Error("Failed to fetch posts");
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách bài viết",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    setCurrentPage(1); // Reset to first page when category changes
  }, [selectedCategory]);

  const deletePost = async (postId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Bài viết đã được xóa",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh posts and close modal
        fetchPosts();
        onClose();
      } else {
        throw new Error('Failed to delete post');
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa bài viết",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const updatePostStatus = async (postId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:8000/posts/${postId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Trạng thái bài viết đã được cập nhật",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // Update the selected post status
        setSelectedPost(prev => ({ ...prev, status: newStatus }));
        
        // Refresh posts
        fetchPosts();
      } else {
        throw new Error('Failed to update post status');
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái bài viết",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Helper function to check if post matches time filter
  const matchesTimeFilter = (post, timeRange) => {
    if (!timeRange) return true;
    
    const postDate = new Date(post.created_at);
    const now = new Date();
    const vnOffset = 7 * 60;
    const localOffset = now.getTimezoneOffset();
    const offsetDiff = (vnOffset + localOffset) * 60 * 1000;
    
    const vnPostDate = new Date(postDate.getTime() + offsetDiff);
    const vnNow = new Date(now.getTime() + offsetDiff);
    
    switch (timeRange) {
      case "today":
        return vnPostDate.toDateString() === vnNow.toDateString();
      case "week":
        const weekAgo = new Date(vnNow.getTime() - 7 * 24 * 60 * 60 * 1000);
        return vnPostDate >= weekAgo;
      case "month":
        const monthAgo = new Date(vnNow.getTime() - 30 * 24 * 60 * 60 * 1000);
        return vnPostDate >= monthAgo;
      default:
        return true;
    }
  };

  const filteredPosts = posts.filter(post => {
    // Text search
    const matchesSearch = !searchTerm || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.location && post.location.toLowerCase().includes(searchTerm.toLowerCase()));

    // Time filter
    const matchesTime = matchesTimeFilter(post, filters.timeRange);

    // Location filter
    const matchesLocation = !filters.location || 
      (post.location && post.location.includes(filters.location));

    // Item type filter
    const matchesItemType = !filters.itemType || 
      post.item_type === filters.itemType;

    return matchesSearch && matchesTime && matchesLocation && matchesItemType;
  });

  // Pagination calculations
  const totalPosts = filteredPosts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters.timeRange, filters.location, filters.itemType]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const getCategoryColor = (category) => {
    const colors = {
      lost: "red",
      found: "green"
    };
    return colors[category] || "gray";
  };

  const getCategoryName = (category) => {
    const names = {
      lost: "Tìm đồ",
      found: "Nhặt được"
    };
    return names[category] || "Khác";
  };

  const formatDate = (dateString) => {
    // Parse the date string and treat it as GMT+7
    const date = new Date(dateString);
    const now = new Date();
    
    // Ensure we're working with GMT+7 times
    const vnOffset = 7 * 60; // GMT+7 in minutes
    const localOffset = now.getTimezoneOffset();
    const offsetDiff = (vnOffset + localOffset) * 60 * 1000; // Convert to milliseconds
    
    // Adjust the dates to GMT+7
    const vnDate = new Date(date.getTime() + offsetDiff);
    const vnNow = new Date(now.getTime() + offsetDiff);
    
    const diffTime = vnNow - vnDate;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return "Vừa đăng";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return "1 ngày trước";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return vnDate.toLocaleDateString("vi-VN");
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    onOpen();
  };

  const getStatusDisplay = (category, status) => {
    if (!status || status === 'active') return null;
    
    const statusMap = {
      lost: {
        found: { text: "Đã tìm được", color: "green" },
        not_found: { text: "Chưa tìm được", color: "orange" }
      },
      found: {
        returned: { text: "Đã hoàn trả", color: "green" },
        not_returned: { text: "Chưa hoàn trả", color: "orange" }
      }
    };
    
    return statusMap[category]?.[status] || null;
  };

  const handleContactWithPost = async (postAuthor, postId, postTitle) => {
    try {
      const message = `Chào bạn! Tôi quan tâm đến bài đăng "${postTitle}" của bạn. Có thể liên hệ để biết thêm chi tiết không?`;
      
      const response = await fetch(`http://localhost:8000/conversations/${postAuthor}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          to_user: postAuthor,
          content: message,
          post_id: postId
        }),
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Tin nhắn đã được gửi",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // Navigate to chat with the user
        navigate(`/chat/${postAuthor}`);
        onClose();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể gửi tin nhắn",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Navigation>
      <Container maxW="6xl" py={6}>
        {/* Header Section - Simple & Clean */}
        <VStack spacing={6} mb={8}>
          {/* Title */}
          <VStack spacing={2} textAlign="center">
            <Heading size="lg" color="gray.800">
              UIT - Tìm đồ thất lạc
            </Heading>
            <Text color="gray.600" fontSize="md">
              Nền tảng kết nối sinh viên UIT - Tìm kiếm đồ vật thất lạc
            </Text>
          </VStack>

          {/* Search and Actions */}
          <HStack spacing={4} w="full" maxW="4xl">
          {/* Search Bar */}
            <InputGroup flex={1}>
              <InputLeftElement>
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Tìm kiếm theo tên đồ vật, địa điểm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="white"
                border="1px solid"
                borderColor="gray.300"
                _focus={{
                  borderColor: "blue.500",
                  boxShadow: "0 0 0 1px blue.500"
                }}
              />
            </InputGroup>

            {/* Filter Toggle */}
            <Button
              leftIcon={<Icon as={FiFilter} />}
              variant="outline"
              onClick={() => setFilters(prev => ({ ...prev, showFilters: !prev.showFilters }))}
            >
              Lọc
            </Button>

            {/* Action Buttons */}
            <Button
              leftIcon={<Icon as={FiPlus} />}
              colorScheme="blue"
              onClick={() => navigate("/dangtin")}
            >
              Đăng tin
            </Button>
            <Button
              leftIcon={<Icon as={FiMessageCircle} />}
              variant="outline"
              colorScheme="blue"
              onClick={() => navigate("/chat")}
            >
              Chat
            </Button>
          </HStack>

          {/* Advanced Filters */}
          <Collapse in={filters.showFilters} animateOpacity>
            <Box 
              w="full" 
              maxW="4xl" 
              bg={cardBg} 
              p={4} 
              borderRadius="md" 
              border="1px solid" 
              borderColor={borderColor}
            >
              <VStack spacing={4}>
                <HStack justify="space-between" w="full">
                  <Text fontWeight="medium">Bộ lọc nâng cao</Text>
                  <IconButton
                    icon={<Icon as={FiX} />}
                    size="sm"
                    variant="ghost"
                    onClick={() => setFilters(prev => ({ ...prev, showFilters: false }))}
                    aria-label="Đóng bộ lọc"
                  />
                </HStack>
                
                <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4} w="full">
                  {/* Time Filter */}
                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" fontWeight="medium">Thời gian</Text>
                      <Select
                        size="sm"
                        value={filters.timeRange}
                        onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                      >
                        {timeRanges.map((range) => (
                          <option key={range.value} value={range.value}>
                            {range.name}
                          </option>
                        ))}
                      </Select>
                    </VStack>
                  </GridItem>

                  {/* Location Filter */}
                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" fontWeight="medium">Địa điểm</Text>
                      <Select
                        size="sm"
                        value={filters.location}
                        onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                      >
                        {locations.map((location) => (
                          <option key={location.value} value={location.value}>
                            {location.name}
                          </option>
                        ))}
                      </Select>
                    </VStack>
                  </GridItem>

                  {/* Item Type Filter */}
                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" fontWeight="medium">Danh mục</Text>
                      <Select
                        size="sm"
                        value={filters.itemType}
                        onChange={(e) => setFilters(prev => ({ ...prev, itemType: e.target.value }))}
                      >
                        {itemTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.name}
                          </option>
                        ))}
                      </Select>
                    </VStack>
                  </GridItem>

                  {/* Clear Filters */}
                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" fontWeight="medium" opacity={0}>Actions</Text>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        onClick={() => setFilters({
                          timeRange: "",
                          location: "",
                          itemType: "",
                          showFilters: true
                        })}
                      >
                        Xóa bộ lọc
                      </Button>
                    </VStack>
                  </GridItem>
                </Grid>
              </VStack>
            </Box>
          </Collapse>

          {/* Category Filters */}
          <VStack spacing={2}>
            <Text fontSize="sm" fontWeight="medium" color="gray.600">Loại bài đăng:</Text>
            <HStack spacing={2}>
              {categories.map((category) => (
                <Button
                  key={category.value}
                  size="sm"
                  variant={selectedCategory === category.value ? "solid" : "outline"}
                  colorScheme={category.color}
                  onClick={() => setSelectedCategory(category.value)}
                  borderRadius="full"
                >
                  {category.name}
                </Button>
              ))}
            </HStack>
          </VStack>
        </VStack>

        {/* Posts Grid - Compact Cards */}
        {loading ? (
          <Center py={10}>
            <Text>Đang tải...</Text>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 2, md: 4, lg: 5, xl: 6 }} spacing={3}>
            {currentPosts.map((post, index) => (
              <Card
                key={post.id}
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                shadow="sm"
                _hover={{ 
                  shadow: "md", 
                  borderColor: "blue.300",
                  cursor: "pointer",
                  transform: "translateY(-1px)"
                }}
                transition="all 0.2s"
                onClick={() => handlePostClick(post)}
                h="220px"
              >
                <CardBody p={3} display="flex" flexDirection="column" h="full">
                  {/* Image */}
                  <Box mb={2} flexShrink={0}>
                    {post.image_urls && post.image_urls.length > 0 ? (
                      <Image
                        src={`http://localhost:8000${post.image_urls[0]}`}
                        alt={post.title}
                        w="full"
                        h="100px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    ) : (
                      <Box
                        w="full"
                        h="100px"
                        bg="gray.100"
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={FiUser} color="gray.400" fontSize="2xl" />
                      </Box>
                    )}
                  </Box>

                  {/* Content */}
                  <VStack align="start" spacing={1} flex={1}>
                    {/* Title */}
                    <Heading size="xs" color="blue.600" noOfLines={2} lineHeight="1.2">
                      {post.title}
                    </Heading>

                    {/* Location */}
                    {post.location && (
                      <HStack spacing={1} fontSize="xs" color="gray.600">
                        <Icon as={FiMapPin} fontSize="xs" />
                        <Text noOfLines={1}>{post.location}</Text>
                      </HStack>
                    )}

                    {/* Category Badge */}
                    <Badge
                      colorScheme={getCategoryColor(post.category)}
                      variant="subtle"
                      fontSize="xs"
                      alignSelf="start"
                    >
                      {getCategoryName(post.category)}
                    </Badge>

                    {/* Bottom - Time and Share */}
                    <HStack justify="space-between" w="full" fontSize="xs" color="gray.500" mt="auto">
                      <HStack spacing={1}>
                        <Icon as={FiClock} fontSize="xs" />
                        <Text>{formatDate(post.created_at)}</Text>
                      </HStack>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="blue"
                        fontSize="xs"
                        p={1}
                        minW="auto"
                        h="auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Share functionality
                        }}
                      >
                        <Icon as={FiShare2} fontSize="xs" />
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Center mt={8}>
            <VStack spacing={4}>
              
              {/* Pagination Controls */}
              <HStack spacing={2}>
                {/* Previous Button */}
                <IconButton
                  icon={<Icon as={FiChevronLeft} />}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  isDisabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  aria-label="Trang trước"
                />

                {/* Page Numbers */}
                {(() => {
                  const pageNumbers = [];
                  const maxVisiblePages = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                  
                  // Adjust start page if we're near the end
                  if (endPage - startPage < maxVisiblePages - 1) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }

                  // First page button if not in visible range
                  if (startPage > 1) {
                    pageNumbers.push(
                      <Button
                        key={1}
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(1)}
                      >
                        1
                      </Button>
                    );
                    if (startPage > 2) {
                      pageNumbers.push(<Text key="ellipsis1">...</Text>);
                    }
                  }

                  // Visible page numbers
                  for (let i = startPage; i <= endPage; i++) {
                    pageNumbers.push(
                      <Button
                        key={i}
                        size="sm"
                        variant={currentPage === i ? "solid" : "outline"}
                        colorScheme={currentPage === i ? "blue" : "gray"}
                        onClick={() => setCurrentPage(i)}
                      >
                        {i}
                      </Button>
                    );
                  }

                  // Last page button if not in visible range
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pageNumbers.push(<Text key="ellipsis2">...</Text>);
                    }
                    pageNumbers.push(
                      <Button
                        key={totalPages}
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    );
                  }

                  return pageNumbers;
                })()}

                {/* Next Button */}
                <IconButton
                  icon={<Icon as={FiChevronRight} />}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  isDisabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  aria-label="Trang sau"
                />
              </HStack>

              {/* Quick Page Jump */}
              <HStack spacing={2} fontSize="sm">
                <Text color="gray.600">Đi đến trang:</Text>
                <NumberInput
                  size="sm"
                  maxW={16}
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(valueString, valueNumber) => {
                    if (valueNumber >= 1 && valueNumber <= totalPages) {
                      setCurrentPage(valueNumber);
                    }
                  }}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </HStack>
            </VStack>
          </Center>
        )}

        {filteredPosts.length === 0 && !loading && (
          <Center py={20}>
            <VStack spacing={4}>
              <Icon as={FiSearch} size={50} color="gray.300" />
              <Text fontSize="lg" color="gray.500">
                Không tìm thấy bài viết nào
              </Text>
              <Text color="gray.400" textAlign="center">
                Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc
              </Text>
            </VStack>
          </Center>
        )}

        {/* Post Detail Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <VStack align="start" spacing={2}>
                <HStack justify="space-between" w="full">
                  <Heading size="md">{selectedPost?.title}</Heading>
                  
                  {/* Owner Controls */}
                  {user && selectedPost?.author === user.username && (
                    <HStack spacing={2}>
                      <IconButton
                        icon={<Icon as={FiEdit} />}
                        size="sm"
                        variant="outline"
                        colorScheme="blue"
                        onClick={() => {
                          navigate(`/edit-post/${selectedPost.id}`);
                          onClose();
                        }}
                        aria-label="Chỉnh sửa bài viết"
                      />
                      <IconButton
                        icon={<Icon as={FiTrash2} />}
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        onClick={() => deletePost(selectedPost.id)}
                        aria-label="Xóa bài viết"
                      />
                    </HStack>
                  )}
                </HStack>
                
                {/* Status Display */}
                {selectedPost && getStatusDisplay(selectedPost.category, selectedPost.status) && (
                  <Badge
                    colorScheme={getStatusDisplay(selectedPost.category, selectedPost.status).color}
                    variant="solid"
                    fontSize="sm"
                  >
                    {getStatusDisplay(selectedPost.category, selectedPost.status).text}
                  </Badge>
                )}
              </VStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedPost && (
                <VStack spacing={4} align="stretch">
                  {/* Images */}
                  {selectedPost.image_urls && selectedPost.image_urls.length > 0 && (
                    <SimpleGrid columns={selectedPost.image_urls.length === 1 ? 1 : 2} spacing={2}>
                      {selectedPost.image_urls.map((imageUrl, index) => (
                          <Image
                            key={index}
                            src={`http://localhost:8000${imageUrl}`}
                          alt={`${selectedPost.title} image ${index + 1}`}
                            borderRadius="md"
                            objectFit="cover"
                          maxH="300px"
                            w="full"
                          />
                        ))}
                      </SimpleGrid>
                    )}

                  {/* Content */}
                  <Box>
                    <Text fontSize="md" lineHeight="1.6" whiteSpace="pre-wrap">
                      {selectedPost.content}
                    </Text>
                  </Box>

                  <Divider />

                  {/* Post Info */}
                  <VStack spacing={3} align="stretch">
                    {selectedPost.location && (
                      <HStack>
                        <Icon as={FiMapPin} color="gray.500" />
                        <Text><Text as="span" fontWeight="medium">Địa điểm:</Text> {selectedPost.location}</Text>
                      </HStack>
                    )}
                    
                    <HStack>
                      <Icon as={FiUser} color="gray.500" />
                      <Text>
                        <Text as="span" fontWeight="medium">Người đăng:</Text>{" "}
                        {user && selectedPost?.author !== user.username ? (
                          <Text
                            as="span"
                            color="blue.500"
                            cursor="pointer"
                            _hover={{ textDecoration: "underline" }}
                            onClick={() => {
                              navigate(`/profile/${selectedPost.author}`);
                              onClose();
                            }}
                          >
                            {selectedPost.author}
                          </Text>
                        ) : (
                          <Text as="span">{selectedPost.author}</Text>
                        )}
                      </Text>
                    </HStack>
                    
                    <HStack>
                      <Icon as={FiClock} color="gray.500" />
                      <Text><Text as="span" fontWeight="medium">Thời gian:</Text> {formatDate(selectedPost.created_at)}</Text>
                    </HStack>

                    {/* Status Update Controls for Owner */}
                    {user && selectedPost?.author === user.username && (
                      <VStack align="stretch" spacing={2} p={3} bg="gray.50" borderRadius="md">
                        <Text fontWeight="medium" fontSize="sm">Cập nhật trạng thái:</Text>
                        <HStack spacing={2}>
                          {selectedPost.category === 'lost' ? (
                            <>
                              <Button
                                size="sm"
                                colorScheme={selectedPost.status === 'not_found' ? 'orange' : 'gray'}
                                variant={selectedPost.status === 'not_found' ? 'solid' : 'outline'}
                                onClick={() => updatePostStatus(selectedPost.id, 'not_found')}
                              >
                                Chưa tìm được
                              </Button>
                              <Button
                                size="sm"
                                colorScheme={selectedPost.status === 'found' ? 'green' : 'gray'}
                                variant={selectedPost.status === 'found' ? 'solid' : 'outline'}
                                onClick={() => updatePostStatus(selectedPost.id, 'found')}
                              >
                                Đã tìm được
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                colorScheme={selectedPost.status === 'not_returned' ? 'orange' : 'gray'}
                                variant={selectedPost.status === 'not_returned' ? 'solid' : 'outline'}
                                onClick={() => updatePostStatus(selectedPost.id, 'not_returned')}
                              >
                                Chưa hoàn trả
                              </Button>
                              <Button
                                size="sm"
                                colorScheme={selectedPost.status === 'returned' ? 'green' : 'gray'}
                                variant={selectedPost.status === 'returned' ? 'solid' : 'outline'}
                                onClick={() => updatePostStatus(selectedPost.id, 'returned')}
                              >
                                Đã hoàn trả
                              </Button>
                            </>
                          )}
                        </HStack>
                      </VStack>
                    )}
                  </VStack>

                  {/* Action Buttons */}
                  <HStack spacing={3} pt={4}>
                    {user && selectedPost?.author !== user.username && (
                      <Button
                        leftIcon={<Icon as={FiMessageCircle} />}
                        colorScheme="blue"
                        flex={1}
                        onClick={() => handleContactWithPost(selectedPost.author, selectedPost.id, selectedPost.title)}
                      >
                        Liên hệ ngay
                      </Button>
                    )}
                    <IconButton
                      icon={<Icon as={FiShare2} />}
                      variant="outline"
                      aria-label="Chia sẻ"
                    />
                  </HStack>
                  </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Navigation>
  );
};

export default Homepage; 