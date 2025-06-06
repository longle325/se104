import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Grid,
  GridItem,
  Badge,
  Divider,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  IconButton,
  Image,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiEdit, FiCalendar, FiExternalLink, FiTrash2, FiEye, FiMapPin, FiClock, FiMessageCircle } from "react-icons/fi";
import { useAuth } from "../components/AuthContext";
import Navigation from "../components/Navigation";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const { username } = useParams();
  const { getAuthHeader, user } = useAuth();

  const { 
    isOpen: isPostModalOpen, 
    onOpen: onPostModalOpen, 
    onClose: onPostModalClose 
  } = useDisclosure();
  const { 
    isOpen: isDeleteAlertOpen, 
    onOpen: onDeleteAlertOpen, 
    onClose: onDeleteAlertClose 
  } = useDisclosure();
  const cancelRef = useRef();
  const navigate = useNavigate();
  const toast = useToast();

  const bg = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  const isOwnProfile = user?.username === username;

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8000/profile/${username}`, {
        headers: getAuthHeader(),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        throw new Error("Failed to fetch profile");
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin profile",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`http://localhost:8000/posts?limit=20`, {
        headers: getAuthHeader(),
      });

      if (response.ok) {
        const data = await response.json();
        // Filter posts by the profile user
        const filteredPosts = data.filter(post => post.author === username);
        setUserPosts(filteredPosts);
      }
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
    }
  };



  const viewPostDetails = (post) => {
    setSelectedPost(post);
    onPostModalOpen();
  };

  const deletePost = async (postId) => {
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
        
        // Refresh posts and close dialog
        fetchUserPosts();
        onDeleteAlertClose();
        onPostModalClose();
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
        
        // Update the selected post and refresh posts
        setSelectedPost(prev => ({ ...prev, status: newStatus }));
        fetchUserPosts();
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

  const confirmDeletePost = (post) => {
    setPostToDelete(post);
    onDeleteAlertOpen();
  };

  useEffect(() => {
    if (username) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [username]);

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    
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

  if (loading) {
    return (
      <Navigation>
        <Container maxW="6xl" py={6}>
          <Text textAlign="center">Đang tải...</Text>
        </Container>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <Container maxW="6xl" py={6}>
        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={6}>
          {/* Profile Info */}
          <GridItem>
            <Card bg={cardBg} shadow="lg">
              <CardHeader textAlign="center" pb={2}>
                <VStack spacing={4}>
                  <Avatar 
                    size="2xl" 
                    name={profile?.full_name || profile?.username || "User"}
                    src={profile?.avatar_url}
                  />
                  <VStack spacing={1}>
                    <Heading size="lg">
                      {profile?.full_name || profile?.username}
                    </Heading>
                    <Text color="gray.500">@{profile?.username}</Text>
                    {isOwnProfile ? (
                      <Button
                        size="sm"
                        leftIcon={<FiEdit />}
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => navigate('/edit-profile')}
                      >
                        Chỉnh sửa
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        leftIcon={<FiMessageCircle />}
                        colorScheme="blue"
                        onClick={() => navigate(`/chat/${profile?.username}`)}
                      >
                        Nhắn tin
                      </Button>
                    )}
                  </VStack>
                </VStack>
              </CardHeader>

              <CardBody pt={2}>
                <VStack spacing={4} align="stretch">
                  {profile?.bio && (
                    <Box>
                      <Text fontWeight="medium" mb={2}>Giới thiệu</Text>
                      <Text color="gray.600" fontSize="sm">
                        {profile.bio}
                      </Text>
                    </Box>
                  )}

                  <Divider />

                  <VStack spacing={3} align="stretch">
                    {profile?.created_at && (
                      <HStack>
                        <FiCalendar />
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">Tham gia:</Text> {formatDate(profile.created_at)}
                        </Text>
                      </HStack>
                    )}
                  </VStack>

                  {(profile?.facebook || profile?.instagram) && (
                    <>
                      <Divider />
                      <VStack spacing={2} align="stretch">
                        <Text fontWeight="medium">Liên kết</Text>
                        {profile?.facebook && (
                          <HStack>
                            <Text fontSize="sm" color="blue.500">Facebook</Text>
                            <IconButton
                              icon={<FiExternalLink />}
                              size="xs"
                              variant="ghost"
                              onClick={() => window.open(profile.facebook, '_blank')}
                            />
                          </HStack>
                        )}
                        {profile?.instagram && (
                          <HStack>
                            <Text fontSize="sm" color="pink.500">Instagram</Text>
                            <IconButton
                              icon={<FiExternalLink />}
                              size="xs"
                              variant="ghost"
                              onClick={() => window.open(profile.instagram, '_blank')}
                            />
                          </HStack>
                        )}
                      </VStack>
                    </>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Posts and Stats */}
          <GridItem>
            <VStack spacing={6} align="stretch">
              {/* Stats */}
              <SimpleGrid columns={3} spacing={4}>
                <Stat bg={cardBg} p={4} borderRadius="lg" textAlign="center">
                  <StatLabel>Tổng bài viết</StatLabel>
                  <StatNumber>{userPosts.length}</StatNumber>
                </Stat>
                <Stat bg={cardBg} p={4} borderRadius="lg" textAlign="center">
                  <StatLabel>Đang tìm</StatLabel>
                  <StatNumber>
                    {userPosts.filter(post => post.category === "lost").length}
                  </StatNumber>
                </Stat>
                <Stat bg={cardBg} p={4} borderRadius="lg" textAlign="center">
                  <StatLabel>Đã nhặt được</StatLabel>
                  <StatNumber>
                    {userPosts.filter(post => post.category === "found").length}
                  </StatNumber>
                </Stat>
              </SimpleGrid>

              {/* Recent Posts */}
              <Card bg={cardBg}>
                <CardHeader>
                  <Heading size="md">Bài viết gần đây</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  {userPosts.length === 0 ? (
                    <Text color="gray.500" textAlign="center">
                      Chưa có bài viết nào
                    </Text>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {userPosts.slice(0, 5).map((post) => (
                        <Box
                          key={post.id}
                          p={4}
                          border="1px"
                          borderColor="gray.200"
                          borderRadius="md"
                          _hover={{ borderColor: "blue.300" }}
                          transition="all 0.2s"
                        >
                          <HStack justify="space-between" mb={2}>
                            <HStack spacing={2}>
                              <Badge
                                colorScheme={getCategoryColor(post.category)}
                                variant="subtle"
                              >
                                {getCategoryName(post.category)}
                              </Badge>
                              
                              {/* Status Badge */}
                              {getStatusDisplay(post.category, post.status) && (
                                <Badge
                                  colorScheme={getStatusDisplay(post.category, post.status).color}
                                  variant="solid"
                                  fontSize="xs"
                                >
                                  {getStatusDisplay(post.category, post.status).text}
                                </Badge>
                              )}
                            </HStack>
                            
                            <HStack spacing={1}>
                              <Text fontSize="xs" color="gray.500">
                                {formatDate(post.created_at)}
                              </Text>
                              
                              {/* Action buttons for own profile */}
                              {isOwnProfile && (
                                <HStack spacing={1} ml={2}>
                                  <IconButton
                                    icon={<FiEye />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="blue"
                                    onClick={() => viewPostDetails(post)}
                                    aria-label="Xem chi tiết"
                                  />
                                  <IconButton
                                    icon={<FiEdit />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="green"
                                    onClick={() => navigate(`/edit-post/${post.id}`)}
                                    aria-label="Chỉnh sửa"
                                  />
                                  <IconButton
                                    icon={<FiTrash2 />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => confirmDeletePost(post)}
                                    aria-label="Xóa"
                                  />
                                </HStack>
                              )}
                            </HStack>
                          </HStack>
                          
                          <Text fontWeight="medium" mb={2} noOfLines={1}>
                            {post.title}
                          </Text>
                          
                          <Text fontSize="sm" color="gray.600" noOfLines={2}>
                            {post.content}
                          </Text>
                          
                          {/* Location info */}
                          {post.location && (
                            <HStack spacing={1} mt={2} fontSize="xs" color="gray.500">
                              <FiMapPin />
                              <Text>{post.location}</Text>
                            </HStack>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  )}
                </CardBody>
              </Card>
            </VStack>
          </GridItem>
        </Grid>
      </Container>



      {/* Post Detail Modal */}
      <Modal isOpen={isPostModalOpen} onClose={onPostModalClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack align="start" spacing={2}>
              <HStack justify="space-between" w="full">
                <Heading size="md">{selectedPost?.title}</Heading>
                
                {/* Owner Controls */}
                {isOwnProfile && selectedPost && (
                  <HStack spacing={2}>
                    <IconButton
                      icon={<FiEdit />}
                      size="sm"
                      variant="outline"
                      colorScheme="blue"
                      onClick={() => {
                        navigate(`/edit-post/${selectedPost.id}`);
                        onPostModalClose();
                      }}
                      aria-label="Chỉnh sửa bài viết"
                    />
                    <IconButton
                      icon={<FiTrash2 />}
                      size="sm"
                      variant="outline"
                      colorScheme="red"
                      onClick={() => {
                        confirmDeletePost(selectedPost);
                        onPostModalClose();
                      }}
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
                      <FiMapPin color="gray.500" />
                      <Text><Text as="span" fontWeight="medium">Địa điểm:</Text> {selectedPost.location}</Text>
                    </HStack>
                  )}
                  
                  <HStack>
                    <FiClock color="gray.500" />
                    <Text><Text as="span" fontWeight="medium">Thời gian:</Text> {formatDate(selectedPost.created_at)}</Text>
                  </HStack>

                  {/* Status Update Controls for Owner */}
                  {isOwnProfile && (
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
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Xóa bài viết
            </AlertDialogHeader>

            <AlertDialogBody>
              Bạn có chắc chắn muốn xóa bài viết "{postToDelete?.title}"? 
              Hành động này không thể hoàn tác.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                Hủy
              </Button>
              <Button 
                colorScheme="red" 
                onClick={() => deletePost(postToDelete?.id)} 
                ml={3}
              >
                Xóa
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Navigation>
  );
};

export default ProfilePage; 