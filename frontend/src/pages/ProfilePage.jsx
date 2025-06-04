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
  IconButton
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FiEdit, FiMail, FiPhone, FiMapPin, FiCalendar, FiBook, FiUser, FiExternalLink } from "react-icons/fi";
import { useAuth } from "../components/AuthContext";
import Navigation from "../components/Navigation";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [editData, setEditData] = useState({
    major: "",
    year: "",
    bio: "",
    facebook: "",
    instagram: ""
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { username } = useParams();
  const { getAuthHeader, user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bg = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  const isOwnProfile = user?.username === username;

  const majors = [
    "Khoa học máy tính",
    "Kỹ thuật phần mềm",
    "Hệ thống thông tin",
    "Kỹ thuật máy tính",
    "An toàn thông tin",
    "Trí tuệ nhân tạo",
    "Công nghệ thông tin",
    "Mạng máy tính và truyền thông dữ liệu",
    "Khác"
  ];

  const years = ["Năm 1", "Năm 2", "Năm 3", "Năm 4", "Đã tốt nghiệp"];

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8000/profile/${username}`, {
        headers: getAuthHeader(),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditData({
          major: data.major || "",
          year: data.year || "",
          bio: data.bio || "",
          facebook: data.facebook || "",
          instagram: data.instagram || ""
        });
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

  const updateProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8000/profile/${username}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Cập nhật profile thành công",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        fetchProfile();
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.detail || "Cập nhật profile thất bại");
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật profile",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    if (username) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [username]);

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
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
                    {isOwnProfile && (
                      <Button
                        size="sm"
                        leftIcon={<FiEdit />}
                        colorScheme="blue"
                        variant="outline"
                        onClick={onOpen}
                      >
                        Chỉnh sửa
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
                    {profile?.student_id && (
                      <HStack>
                        <FiUser />
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">MSSV:</Text> {profile.student_id}
                        </Text>
                      </HStack>
                    )}

                    {profile?.major && (
                      <HStack>
                        <FiBook />
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">Ngành:</Text> {profile.major}
                        </Text>
                      </HStack>
                    )}

                    {profile?.year && (
                      <HStack>
                        <FiCalendar />
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">Khóa:</Text> {profile.year}
                        </Text>
                      </HStack>
                    )}

                    {profile?.email && (
                      <HStack>
                        <FiMail />
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">Email:</Text> {profile.email}
                        </Text>
                      </HStack>
                    )}

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
                            <Badge
                              colorScheme={getCategoryColor(post.category)}
                              variant="subtle"
                            >
                              {getCategoryName(post.category)}
                            </Badge>
                            <Text fontSize="xs" color="gray.500">
                              {formatDate(post.created_at)}
                            </Text>
                          </HStack>
                          
                          <Text fontWeight="medium" mb={2} noOfLines={1}>
                            {post.title}
                          </Text>
                          
                          <Text fontSize="sm" color="gray.600" noOfLines={2}>
                            {post.content}
                          </Text>
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

      {/* Edit Profile Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Chỉnh sửa thông tin cá nhân</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Họ và tên</FormLabel>
                <Input
                  value={profile?.full_name || "Chưa cập nhật"}
                  placeholder="Tự động lấy từ thông tin đăng ký"
                  isReadOnly
                  bg="gray.50"
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Thông tin này được lấy từ tài khoản email của bạn
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Mã số sinh viên</FormLabel>
                <Input
                  value={profile?.username || "Chưa cập nhật"}
                  placeholder="Tự động lấy từ email"
                  isReadOnly
                  bg="gray.50"
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  MSSV được tự động lấy từ email (@gm.uit.edu.vn)
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Ngành học</FormLabel>
                <Select
                  value={editData.major}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    major: e.target.value
                  }))}
                  placeholder="Chọn ngành học"
                >
                  {majors.map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Năm học</FormLabel>
                <Select
                  value={editData.year}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    year: e.target.value
                  }))}
                  placeholder="Chọn năm học"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Giới thiệu</FormLabel>
                <Textarea
                  value={editData.bio}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    bio: e.target.value
                  }))}
                  placeholder="Viết gì đó về bản thân..."
                  rows={4}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Facebook URL</FormLabel>
                <Input
                  value={editData.facebook}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    facebook: e.target.value
                  }))}
                  placeholder="https://facebook.com/username"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Instagram URL</FormLabel>
                <Input
                  value={editData.instagram}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    instagram: e.target.value
                  }))}
                  placeholder="https://instagram.com/username"
                />
              </FormControl>

              <Button colorScheme="blue" w="full" onClick={updateProfile}>
                Lưu thay đổi
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Navigation>
  );
};

export default ProfilePage; 