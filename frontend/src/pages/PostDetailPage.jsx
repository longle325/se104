import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Image,
  Card,
  CardBody,
  Avatar,
  Divider,
  SimpleGrid,
  useToast,
  Spinner,
  Center,
  Flex,
  IconButton,
  Textarea,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
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
  Select,
  Stack,
  Tag,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { 
  FiArrowLeft, 
  FiMapPin, 
  FiClock, 
  FiUser, 
  FiMessageCircle, 
  FiShare2, 
  FiFlag,
  FiMoreVertical,
  FiSend,
  FiTrash2,
  FiThumbsUp,
  FiEye
} from 'react-icons/fi';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import Navigation from '../components/Navigation';

const PostDetailPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, getAuthHeader } = useAuth();
  const toast = useToast();
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reportData, setReportData] = useState({ reason: '', description: '' });
  const [submittingReport, setSubmittingReport] = useState(false);

  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const reportReasons = [
    { value: 'spam', label: 'Spam hoặc quảng cáo' },
    { value: 'inappropriate', label: 'Nội dung không phù hợp' },
    { value: 'fake', label: 'Thông tin giả mạo' },
    { value: 'other', label: 'Lý do khác' }
  ];

  useEffect(() => {
    fetchPostDetails();
    fetchComments();
  }, [postId]);

  const fetchPostDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8000/posts/${postId}`, {
        headers: getAuthHeader(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setPost(data);
      } else if (response.status === 404) {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy bài viết",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải bài viết",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await fetch(`http://localhost:8000/posts/${postId}/comments`, {
        headers: getAuthHeader(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };



  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      setSubmittingComment(true);
      const response = await fetch(`http://localhost:8000/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          post_id: postId,
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
        toast({
          title: "Thành công",
          description: "Bình luận đã được thêm",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm bình luận",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

    try {
      const response = await fetch(`http://localhost:8000/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        toast({
          title: "Thành công",
          description: "Bình luận đã được xóa",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa bình luận",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmitReport = async () => {
    if (!reportData.reason) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn lý do báo cáo",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSubmittingReport(true);
      const response = await fetch(`http://localhost:8000/posts/${postId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Báo cáo đã được gửi. Chúng tôi sẽ xem xét và xử lý sớm nhất có thể.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        onReportClose();
        setReportData({ reason: '', description: '' });
      } else if (response.status === 400) {
        const errorData = await response.json();
        toast({
          title: "Lỗi",
          description: errorData.detail || "Không thể gửi báo cáo",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể gửi báo cáo",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleContactUser = async () => {
    if (!user) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để liên hệ",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const postLink = window.location.href;
      const message = `Chào bạn! Tôi quan tâm đến bài đăng "${post.title}" của bạn.\n\n📝 Bài đăng: ${postLink}\n\nCó thể liên hệ để biết thêm chi tiết không?`;
      
      const response = await fetch(`http://localhost:8000/conversations/${post.author}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          to_user: post.author,
          content: message,
          post_id: postId,
          post_link: postLink
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
        navigate(`/chat/${post.author}`);
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

  const getCategoryColor = (category) => {
    switch (category) {
      case 'lost': return 'red';
      case 'found': return 'green';
      default: return 'gray';
    }
  };

  const getCategoryName = (category) => {
    switch (category) {
      case 'lost': return 'Tìm đồ';
      case 'found': return 'Nhặt được';
      default: return category;
    }
  };

  const getItemTypeName = (itemType) => {
    switch (itemType) {
      case 'the_sinh_vien': return 'Thẻ sinh viên';
      case 'vi_giay_to': return 'Ví/Giấy tờ';
      case 'dien_tu': return 'Điện thoại/Tablet/Laptop';
      case 'khac': return 'Đồ vật khác';
      default: return itemType;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Hôm nay lúc ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Hôm qua lúc ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const sharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Đã sao chép",
        description: "Liên kết bài viết đã được sao chép vào clipboard",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Navigation>
        <Container maxW="6xl" py={6}>
          <Center h="50vh">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text color="gray.600">Đang tải bài viết...</Text>
            </VStack>
          </Center>
        </Container>
      </Navigation>
    );
  }

  if (!post) {
    return (
      <Navigation>
        <Container maxW="6xl" py={6}>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Không tìm thấy bài viết!</AlertTitle>
            <AlertDescription>
              Bài viết có thể đã bị xóa hoặc không tồn tại.
            </AlertDescription>
          </Alert>
        </Container>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <Box bg={bg} minH="100vh">
        {loading ? (
          <Center h="50vh">
            <Spinner size="xl" color="blue.500" />
          </Center>
        ) : post ? (
          <Container maxW="900px" py={6}>
            {/* Back Button */}
            <Button
              leftIcon={<FiArrowLeft />}
              variant="ghost"
              mb={6}
              onClick={() => navigate(-1)}
              _hover={{ bg: 'gray.100' }}
            >
              Quay lại
            </Button>

            {/* Main Content */}
            <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
              {/* Post Header */}
              <Box px={6} py={4} borderBottom="1px solid" borderColor={borderColor}>
                <VStack align="stretch" spacing={3}>
                  <Heading size="lg" lineHeight="1.3">
                    {post.title}
                  </Heading>

                  {/* Post Meta */}
                  <HStack spacing={6} fontSize="sm" color="gray.600" flexWrap="wrap">
                    <HStack>
                      <Avatar 
                        size="sm" 
                        name={post.author_info?.full_name || post.author}
                        src={post.author_info?.avatar_url ? `http://localhost:8000${post.author_info.avatar_url}` : undefined}
                      />
                      <Text>
                        Người đăng: 
                        <Text as="span" fontWeight="semibold" color="blue.600" ml={1} cursor="pointer" 
                              onClick={() => navigate(`/profile/${post.author}`)}
                              _hover={{ textDecoration: 'underline' }}>
                          {post.author_info?.full_name || post.author}
                        </Text>
                      </Text>
                    </HStack>
                    <HStack>
                      <FiClock />
                      <Text>{formatDate(post.created_at)}</Text>
                    </HStack>
                    <HStack>
                      <FiMapPin />
                      <Text>{post.location || 'Chưa rõ'}</Text>
                    </HStack>
                    <HStack>
                      <FiEye />
                      <Text>{post.view_count || 0} lượt xem</Text>
                    </HStack>
                  </HStack>

                  {/* Tags */}
                  <HStack spacing={3}>
                    <Tag
                      size="md"
                      colorScheme={getCategoryColor(post.category)}
                      borderRadius="full"
                    >
                      {getCategoryName(post.category)}
                    </Tag>
                    <Tag
                      size="md"
                      colorScheme="gray"
                      variant="outline"
                      borderRadius="full"
                    >
                      {getItemTypeName(post.item_type)}
                    </Tag>
                    {post.status && (
                      <Tag
                        size="md"
                        colorScheme={post.status === 'resolved' ? 'green' : 'orange'}
                        borderRadius="full"
                      >
                        {post.status === 'resolved' ? 'Đã giải quyết' : 'Chưa giải quyết'}
                      </Tag>
                    )}
                  </HStack>
                </VStack>
              </Box>

              <CardBody p={0}>
                {/* Main Image */}
                {(post.image_urls || post.images) && (post.image_urls || post.images).length > 0 && (
                  <Box position="relative" bg="gray.100">
                    <Image
                      src={`http://localhost:8000${(post.image_urls || post.images)[0]}`}
                      alt={post.title}
                      w="full"
                      h={{ base: "300px", md: "400px" }}
                      objectFit="contain"
                      bg="white"
                    />
                    
                    {/* Image Count Badge */}
                    {(post.image_urls || post.images).length > 1 && (
                      <Badge
                        position="absolute"
                        top={4}
                        right={4}
                        bg="blackAlpha.600"
                        color="white"
                        px={3}
                        py={1}
                        borderRadius="md"
                      >
                        {(post.image_urls || post.images).length} ảnh
                      </Badge>
                    )}
                  </Box>
                )}

                {/* Content */}
                <Box p={6}>
                  {/* Description */}
                  <Text fontSize="md" lineHeight="1.7" mb={6} color="gray.700">
                    {post.description || post.content}
                  </Text>

                  {/* Additional Images */}
                  {(post.image_urls || post.images) && (post.image_urls || post.images).length > 1 && (
                    <Box mb={6}>
                      <Text fontWeight="semibold" mb={3} color="gray.700">
                        Hình ảnh khác:
                      </Text>
                      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                        {(post.image_urls || post.images).slice(1).map((image, index) => (
                          <Image
                            key={index + 1}
                            src={`http://localhost:8000${image}`}
                            alt={`${post.title} - Ảnh ${index + 2}`}
                            borderRadius="md"
                            h="120px"
                            w="full"
                            objectFit="cover"
                            cursor="pointer"
                            _hover={{ transform: 'scale(1.02)', shadow: 'md' }}
                            transition="all 0.2s"
                          />
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <HStack spacing={3} pt={4} borderTop="1px solid" borderColor={borderColor}>
                    <Button
                      leftIcon={<FiMessageCircle />}
                      colorScheme="blue"
                      size="md"
                      onClick={handleContactUser}
                      disabled={!user || post.author === user?.username}
                    >
                      Liên hệ ngay
                    </Button>
                    <Button
                      leftIcon={<FiShare2 />}
                      variant="outline"
                      size="md"
                      onClick={sharePost}
                    >
                      Chia sẻ
                    </Button>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        variant="outline"
                        size="md"
                      />
                      <MenuList>
                        <MenuItem
                          icon={<FiFlag />}
                          onClick={onReportOpen}
                        >
                          Báo cáo bài viết
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                </Box>
              </CardBody>
            </Card>



            {/* Comments Section */}
            <Card bg={cardBg} shadow="md" borderRadius="lg" mt={6}>
              <CardBody p={6}>
                <Heading size="md" mb={4} color="gray.700">
                  Bình luận ({comments.length})
                </Heading>

                {/* Add Comment */}
                {user ? (
                  <Box mb={6} p={4} bg="gray.50" borderRadius="md">
                    <VStack spacing={3}>
                      <Textarea
                        placeholder="Viết bình luận của bạn..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        resize="vertical"
                        minH="80px"
                      />
                      <HStack w="full" justify="flex-end">
                        <Button
                          leftIcon={<FiSend />}
                          colorScheme="blue"
                          size="sm"
                          onClick={handleSubmitComment}
                          isLoading={submittingComment}
                          disabled={!newComment.trim()}
                        >
                          Gửi bình luận
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                ) : (
                  <Alert status="info" mb={6}>
                    <AlertIcon />
                    <AlertDescription>
                      <Link to="/login" style={{ color: 'blue', textDecoration: 'underline' }}>
                        Đăng nhập
                      </Link> để bình luận
                    </AlertDescription>
                  </Alert>
                )}

                {/* Comments List */}
                {commentsLoading ? (
                  <Center py={8}>
                    <Spinner />
                  </Center>
                ) : comments.length > 0 ? (
                  <VStack spacing={4} align="stretch">
                    {comments.map((comment) => (
                      <Box key={comment.id} p={4} bg="gray.50" borderRadius="md">
                        <HStack justify="space-between" align="start" mb={2}>
                          <HStack>
                            <Avatar 
                              size="sm" 
                              name={comment.author_info?.full_name || comment.author}
                              src={comment.author_info?.avatar_url ? `http://localhost:8000${comment.author_info.avatar_url}` : undefined}
                            />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="semibold" fontSize="sm">
                                {comment.author_info?.full_name || comment.author}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {formatDate(comment.created_at)}
                              </Text>
                            </VStack>
                          </HStack>
                          
                          {(user?.username === comment.author || user?.username === 'admin') && (
                            <IconButton
                              icon={<FiTrash2 />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeleteComment(comment.id)}
                            />
                          )}
                        </HStack>
                        <Text ml={10} color="gray.700" fontSize="sm">
                          {comment.content}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                ) : (
                  <Center py={8}>
                    <Text color="gray.500">Chưa có bình luận nào</Text>
                  </Center>
                )}
              </CardBody>
            </Card>
          </Container>
        ) : (
          <Center h="50vh">
            <Alert status="error" w="fit-content">
              <AlertIcon />
              <AlertTitle>Không tìm thấy bài viết!</AlertTitle>
            </Alert>
          </Center>
        )}

        {/* Report Modal */}
        <Modal isOpen={isReportOpen} onClose={onReportClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Báo cáo bài viết</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Lý do báo cáo</FormLabel>
                  <Select
                    value={reportData.reason}
                    onChange={(e) => setReportData({...reportData, reason: e.target.value})}
                  >
                    <option value="">Chọn lý do</option>
                    {reportReasons.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Mô tả chi tiết</FormLabel>
                  <Textarea
                    placeholder="Mô tả chi tiết về vấn đề..."
                    value={reportData.description}
                    onChange={(e) => setReportData({...reportData, description: e.target.value})}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onReportClose}>
                Hủy
              </Button>
              <Button
                colorScheme="red"
                onClick={handleSubmitReport}
                isLoading={submittingReport}
                disabled={!reportData.reason}
              >
                Gửi báo cáo
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Navigation>
  );
};

export default PostDetailPage; 