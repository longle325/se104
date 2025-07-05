import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  Avatar,
  IconButton,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Textarea,
  Select
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiCamera, FiSave, FiArrowLeft } from "react-icons/fi";
import { useAuth } from "../components/AuthContext";
import Navigation from "../components/Navigation";
import { safeAvatarName } from "../utils/avatarUtils";

const EditProfile = () => {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    full_name: "",
    phone: "",
    student_id: "",
    bio: "",
    facebook: "",
    instagram: "",
    avatar: null
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const { user, getAuthHeader, loadUserProfile, token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  // Cleanup preview URL to prevent memory leak
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/profile/${user?.username}`, {
        headers: getAuthHeader(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile({
          username: data.username || "",
          email: data.email || "",
          full_name: data.full_name || "",
          phone: data.phonenumber || "",
          student_id: data.student_id || "",
          bio: data.bio || "",
          facebook: data.facebook || "",
          instagram: data.instagram || "",
          avatar: data.avatar_url ? `http://localhost:8000${data.avatar_url}` : null
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin cá nhân",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      
      // Upload avatar first if there's a new file
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);

        const avatarResponse = await fetch('http://localhost:8000/upload-avatar', {
          method: 'POST',
          headers: getAuthHeader(),
          body: formData,
        });

        if (!avatarResponse.ok) {
          throw new Error('Failed to upload avatar');
        }
      }
      
      // Prepare profile data for API - only send editable fields
      const profileData = {
        username: profile.username,
        bio: profile.bio,
        facebook: profile.facebook,
        instagram: profile.instagram,
        major: null,
        year: null
      };
      
      const response = await fetch(`http://localhost:8000/profile/${user?.username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Thông tin cá nhân đã được cập nhật",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        // Đồng bộ lại user context để avatar mới cập nhật ở mọi nơi
        if (user && token) {
          await loadUserProfile(user.username, token);
        }
        // Clear avatar file and preview after successful save
        setAvatarFile(null);
        setAvatarPreview(null);
        navigate(`/profile/${user?.username}`);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin cá nhân",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn file ảnh",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Lỗi",
          description: "Kích thước file quá lớn. Vui lòng chọn file dưới 5MB",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Create preview URL and store file for later upload
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      
      toast({
        title: "Ảnh đã được chọn",
        description: "Nhấn 'Lưu thay đổi' để cập nhật ảnh đại diện",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Navigation>
        <Container maxW="4xl" py={8}>
          <Text>Đang tải...</Text>
        </Container>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <Container maxW="4xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack spacing={4}>
            <IconButton
              icon={<FiArrowLeft />}
              variant="outline"
              onClick={() => navigate(-1)}
              aria-label="Quay lại"
            />
            <Heading size="lg" color="gray.800">
              Sửa hồ sơ cá nhân
            </Heading>
          </HStack>

          <Card>
            <CardHeader>
              <Heading size="md">Thông tin cá nhân</Heading>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit}>
                <VStack spacing={6} align="stretch">
                  {/* Avatar Section */}
                  <VStack spacing={4}>
                    <Box position="relative">
                      <Avatar
                        size="xl"
                        name={safeAvatarName(profile.full_name || profile.username)}
                        src={avatarPreview || profile.avatar}
                      />
                      <IconButton
                        icon={<FiCamera />}
                        size="sm"
                        borderRadius="full"
                        position="absolute"
                        bottom={0}
                        right={0}
                        colorScheme="blue"
                        as="label"
                        htmlFor="avatar-upload"
                        cursor="pointer"
                      />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleAvatarChange}
                      />
                    </Box>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Nhấp vào icon camera để thay đổi ảnh đại diện
                    </Text>
                    {avatarFile && (
                      <HStack spacing={2} fontSize="sm">
                        <Text color="blue.600">Ảnh mới đã được chọn</Text>
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => {
                            setAvatarFile(null);
                            setAvatarPreview(null);
                            // Reset file input
                            const fileInput = document.getElementById('avatar-upload');
                            if (fileInput) fileInput.value = '';
                          }}
                        >
                          Hủy
                        </Button>
                      </HStack>
                    )}
                  </VStack>

                  <Divider />

                  {/* Form Fields */}
                  <VStack spacing={4} align="stretch">
                    <HStack spacing={4}>
                      <FormControl isReadOnly>
                        <FormLabel>Họ và tên </FormLabel>
                        <Input
                          value={profile.full_name}
                          isReadOnly
                          bg="gray.100"
                          color="gray.600"
                          placeholder="Họ và tên từ hệ thống"
                        />
                      </FormControl>
                      
                      <FormControl isReadOnly>
                        <FormLabel>Tên đăng nhập</FormLabel>
                        <Input
                          value={profile.username}
                          isReadOnly
                          bg="gray.100"
                          color="gray.600"
                        />
                      </FormControl>
                    </HStack>

                    <HStack spacing={4}>
                      <FormControl isReadOnly>
                        <FormLabel>Email </FormLabel>
                        <Input
                          type="email"
                          value={profile.email}
                          isReadOnly
                          bg="gray.100"
                          color="gray.600"
                          placeholder="Email đăng ký"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Số điện thoại</FormLabel>
                        <Input
                          value={profile.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="Nhập số điện thoại"
                        />
                      </FormControl>
                    </HStack>
                    <FormControl>
                      <FormLabel>Giới thiệu bản thân</FormLabel>
                      <Textarea
                        value={profile.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Viết một vài dòng giới thiệu về bản thân..."
                        rows={4}
                      />
                    </FormControl>
                  </VStack>

                  <Divider />

                  {/* Submit Button */}
                  <HStack spacing={4} justify="flex-end">
                    <Button
                      variant="outline"
                      onClick={() => navigate(-1)}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      colorScheme="blue"
                      leftIcon={<FiSave />}
                      isLoading={saving}
                      loadingText="Đang lưu..."
                    >
                      Lưu thay đổi
                    </Button>
                  </HStack>
                </VStack>
              </form>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Navigation>
  );
};

export default EditProfile; 