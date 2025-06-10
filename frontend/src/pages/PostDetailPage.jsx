import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  FiEye,
  FiCornerDownRight
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
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reportData, setReportData] = useState({ reason: '', description: '' });
  const [submittingReport, setSubmittingReport] = useState(false);

  const [replyTo, setReplyTo] = useState(null);
  const [isReportCommentOpen, setIsReportCommentOpen] = useState(false);
  const [reportingComment, setReportingComment] = useState(null);
  const [reportCommentData, setReportCommentData] = useState({ reason: '', description: '' });
  const [submittingCommentReport, setSubmittingCommentReport] = useState(false);

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

  // Function to organize comments into a tree structure
  const organizeComments = (comments) => {
    const commentMap = new Map();
    const rootComments = [];

    // First pass: create a map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into parent-child relationships
    comments.forEach(comment => {
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        // This is a reply, add it to parent's replies
        commentMap.get(comment.parent_id).replies.push(commentMap.get(comment.id));
      } else {
        // This is a root comment
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return rootComments;
  };

  // Memoized reply input component
  const ReplyInput = React.memo(({ commentId, onCancel, onSubmit, isSubmitting }) => {
    const [localReplyContent, setLocalReplyContent] = useState('');

    const handleKeyDown = useCallback((e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (localReplyContent.trim() && !isSubmitting) {
          onSubmit(commentId, localReplyContent);
          setLocalReplyContent('');
        }
      }
    }, [localReplyContent, isSubmitting, commentId, onSubmit]);

    const handleSubmit = useCallback(() => {
      if (localReplyContent.trim() && !isSubmitting) {
        onSubmit(commentId, localReplyContent);
        setLocalReplyContent('');
      }
    }, [localReplyContent, isSubmitting, commentId, onSubmit]);

    const handleCancel = useCallback(() => {
      setLocalReplyContent('');
      onCancel();
    }, [onCancel]);

    return (
      <Box mt={2} ml={10}>
        <Textarea
          placeholder="Nhập phản hồi..."
          value={localReplyContent}
          onChange={(e) => setLocalReplyContent(e.target.value)}
          onKeyDown={handleKeyDown}
          minH="60px"
          autoFocus
        />
        <Text fontSize="xs" color="gray.500" mt={1}>
          Nhấn Enter để gửi, Shift + Enter để xuống dòng
        </Text>
        <HStack mt={2} justify="flex-end">
          <Button size="sm" onClick={handleCancel} variant="ghost">Hủy</Button>
          <Button 
            size="sm" 
            colorScheme="blue" 
            isLoading={isSubmitting} 
            onClick={handleSubmit} 
            disabled={!localReplyContent.trim()}
          >
            Gửi phản hồi
          </Button>
        </HStack>
      </Box>
    );
  });
  ReplyInput.displayName = 'ReplyInput';

  // Memoized comment item component
  const CommentItem = React.memo(({ comment, depth = 0, onReply, onReport, onDelete, isReplyingTo }) => {
    const handleReplyClick = useCallback(() => {
      onReply(comment);
    }, [comment, onReply]);

    const handleReportClick = useCallback(() => {
      onReport(comment);
    }, [comment, onReport]);

    const handleDeleteClick = useCallback(() => {
      onDelete(comment.id);
    }, [comment.id, onDelete]);

    const handleProfileClick = useCallback(() => {
      navigate(`/profile/${comment.author}`);
    }, [comment.author]);

    return (
      <Box ml={depth * 6}>
        <Box p={4} bg={depth === 0 ? "gray.50" : "gray.100"} borderRadius="md" borderLeft={depth > 0 ? "3px solid" : "none"} borderColor={depth > 0 ? "blue.200" : "transparent"}>
          <HStack justify="space-between" align="start" mb={2}>
            <HStack>
              <Avatar 
                size="sm" 
                name={comment.author_info?.full_name || comment.author}
                src={comment.author_info?.avatar_url ? `http://localhost:8000${comment.author_info.avatar_url}` : undefined}
                cursor="pointer"
                _hover={{ transform: 'scale(1.05)', shadow: 'md' }}
                transition="all 0.2s"
                onClick={handleProfileClick}
              />
              <VStack align="start" spacing={0}>
                <Text 
                  fontWeight="semibold" 
                  fontSize="sm"
                  cursor="pointer"
                  color="blue.600"
                  _hover={{ textDecoration: 'underline' }}
                  onClick={handleProfileClick}
                >
                  {comment.author_info?.full_name || comment.author}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {formatDate(comment.created_at)}
                </Text>
              </VStack>
            </HStack>
            <HStack>
              <Button size="xs" leftIcon={<FiCornerDownRight />} variant="ghost" colorScheme="blue" onClick={handleReplyClick}>Trả lời</Button>
              <Button size="xs" leftIcon={<FiFlag />} variant="ghost" colorScheme="red" onClick={handleReportClick}>Báo cáo</Button>
              {(user?.username === comment.author || user?.username === 'admin') && (
                <IconButton
                  icon={<FiTrash2 />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={handleDeleteClick}
                />
              )}
            </HStack>
          </HStack>
          <Text ml={10} color="gray.700" fontSize="sm">
            {comment.content}
          </Text>
          
          {/* Show reply input if this comment is being replied to */}
          {isReplyingTo && (
            <ReplyInput
              commentId={comment.id}
              onCancel={() => setReplyTo(null)}
              onSubmit={handleReplySubmit}
              isSubmitting={submittingComment}
            />
          )}
        </Box>
        
        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <VStack spacing={2} align="stretch" mt={2}>
            {comment.replies.map(reply => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                depth={depth + 1}
                onReply={onReply}
                onReport={onReport}
                onDelete={onDelete}
                isReplyingTo={replyTo?.id === reply.id}
              />
            ))}
          </VStack>
        )}
      </Box>
    );
  });
  CommentItem.displayName = 'CommentItem';

  // Memoized organized comments
  const organizedComments = useMemo(() => organizeComments(comments), [comments]);

  // Optimized delete comment handler (moved up to fix dependency issue)
  const handleDeleteComment = useCallback(async (commentId) => {
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
      } else {
        const errorData = await response.json();
        toast({
          title: "Lỗi",
          description: errorData.detail || "Không thể xóa bình luận",
          status: "error",
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
  }, [postId, getAuthHeader, toast]);

  // Memoized event handlers
  const handleReplyClick = useCallback((comment) => {
    setReplyTo(comment);
  }, []);

  const handleReportClick = useCallback((comment) => {
    setReportingComment(comment);
    setIsReportCommentOpen(true);
  }, []);

  const handleDeleteClick = useCallback((commentId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;
    handleDeleteComment(commentId);
  }, [handleDeleteComment]);

  const handleReplySubmit = useCallback(async (parentId, content) => {
    if (!content.trim() || !user) return;

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
          content: content.trim(),
          parent_id: parentId
        }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [newCommentData, ...prev]);
        setReplyTo(null);
        toast({
          title: "Thành công",
          description: "Phản hồi đã được thêm",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Lỗi",
          description: errorData.detail || "Không thể thêm phản hồi",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm phản hồi",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmittingComment(false);
    }
  }, [postId, user, getAuthHeader, toast]);

  // Memoized main comment input with local state for better performance
  const MainCommentInput = React.memo(({ 
    user, 
    postId, 
    getAuthHeader, 
    toast, 
    setComments, 
    submittingComment, 
    setSubmittingComment 
  }) => {
    const [localComment, setLocalComment] = useState('');
    
    const handleLocalSubmit = useCallback(async () => {
      if (!localComment.trim() || !user) return;

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
            content: localComment.trim(),
          }),
        });

        if (response.ok) {
          const newCommentData = await response.json();
          setComments(prev => [newCommentData, ...prev]);
          setLocalComment(''); // Clear local state
          toast({
            title: "Thành công",
            description: "Bình luận đã được thêm",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } else {
          const errorData = await response.json();
          toast({
            title: "Lỗi",
            description: errorData.detail || "Không thể thêm bình luận",
            status: "error",
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
    }, [localComment, user, postId, getAuthHeader, toast, setComments, setSubmittingComment]);

    const handleKeyDown = useCallback((e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (localComment.trim() && !submittingComment) {
          handleLocalSubmit();
        }
      }
    }, [localComment, submittingComment, handleLocalSubmit]);

    return (
      <Box mb={6} p={4} bg="gray.50" borderRadius="md">
        <VStack spacing={3}>
          <Textarea
            placeholder="Viết bình luận của bạn..."
            value={localComment}
            onChange={(e) => setLocalComment(e.target.value)}
            onKeyDown={handleKeyDown}
            resize="vertical"
            minH="80px"
            autoFocus
          />
          <Text fontSize="xs" color="gray.500" alignSelf="flex-start">
            Nhấn Enter để gửi, Shift + Enter để xuống dòng
          </Text>
          <HStack w="full" justify="flex-end">
            <Button
              leftIcon={<FiSend />}
              colorScheme="blue"
              size="sm"
              onClick={handleLocalSubmit}
              isLoading={submittingComment}
              disabled={!localComment.trim()}
            >
              Gửi bình luận
            </Button>
          </HStack>
        </VStack>
      </Box>
    );
  });
  MainCommentInput.displayName = 'MainCommentInput';

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

  const handleSubmitReportComment = async () => {
    if (!reportCommentData.reason || !reportingComment) return;
    try {
      setSubmittingCommentReport(true);
      const response = await fetch(`http://localhost:8000/comments/${reportingComment.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(reportCommentData),
      });
      
      if (response.ok) {
        toast({ 
          title: 'Thành công', 
          description: 'Báo cáo bình luận đã được gửi',
          status: 'success', 
          duration: 3000, 
          isClosable: true 
        });
        setIsReportCommentOpen(false);
        setReportCommentData({ reason: '', description: '' });
        setReportingComment(null);
      } else {
        const errorData = await response.json();
        toast({ 
          title: 'Lỗi', 
          description: errorData.detail || 'Không thể gửi báo cáo',
          status: 'error', 
          duration: 3000, 
          isClosable: true 
        });
      }
    } catch (error) {
      console.error('Report comment error:', error);
      toast({ 
        title: 'Lỗi', 
        description: 'Không thể gửi báo cáo bình luận',
        status: 'error', 
        duration: 3000, 
        isClosable: true 
      });
    } finally {
      setSubmittingCommentReport(false);
    }
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
                    {post.status && post.status !== 'active' && (
                      <Tag
                        size="md"
                        colorScheme={getStatusDisplay(post.category, post.status)?.color || 'gray'}
                        borderRadius="full"
                      >
                        {getStatusDisplay(post.category, post.status)?.text || 'Chưa cập nhật'}
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
                  <MainCommentInput 
                    user={user} 
                    postId={postId} 
                    getAuthHeader={getAuthHeader} 
                    toast={toast} 
                    setComments={setComments} 
                    submittingComment={submittingComment} 
                    setSubmittingComment={setSubmittingComment} 
                  />
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
                    {organizedComments.map((comment) => (
                      <CommentItem 
                        key={comment.id} 
                        comment={comment} 
                        depth={0}
                        onReply={handleReplyClick}
                        onReport={handleReportClick}
                        onDelete={handleDeleteClick}
                        isReplyingTo={replyTo?.id === comment.id}
                      />
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

        {/* Report Comment Modal */}
        <Modal isOpen={isReportCommentOpen} onClose={() => setIsReportCommentOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Báo cáo bình luận</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Lý do báo cáo</FormLabel>
                  <Select
                    value={reportCommentData.reason}
                    onChange={e => setReportCommentData(prev => ({ ...prev, reason: e.target.value }))}
                  >
                    <option value="">Chọn lý do</option>
                    {reportReasons.map((reason) => (
                      <option key={reason.value} value={reason.value}>{reason.label}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Mô tả chi tiết</FormLabel>
                  <Textarea
                    placeholder="Mô tả chi tiết về vấn đề..."
                    value={reportCommentData.description}
                    onChange={e => setReportCommentData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setIsReportCommentOpen(false)}>Hủy</Button>
              <Button colorScheme="red" onClick={handleSubmitReportComment} isLoading={submittingCommentReport} disabled={!reportCommentData.reason}>Gửi báo cáo</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Navigation>
  );
};

export default PostDetailPage; 