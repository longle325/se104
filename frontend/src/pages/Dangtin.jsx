import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Card,
  CardBody,
  useToast,
  useColorModeValue,
  Divider,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Image,
  IconButton,
  SimpleGrid,
  Alert,
  AlertIcon
} from "@chakra-ui/react";
import { useState, useRef } from "react";
import { FiPlus, FiSend, FiUpload, FiX, FiImage } from "react-icons/fi";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";

const Dangtin = () => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    location: "",
    contact_info: "",
    tags: [],
    image_urls: []
  });
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef(null);
  const { getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const bg = useColorModeValue("white", "gray.800");

  const categories = [
    { value: "lost", label: "Tìm đồ" },
    { value: "found", label: "Nhặt được" }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length + selectedFiles.length > 5) {
      toast({
        title: "Giới hạn ảnh",
        description: "Chỉ được upload tối đa 5 ảnh",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "File không hợp lệ",
          description: `${file.name} không phải là file ảnh`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File quá lớn",
          description: `${file.name} vượt quá 5MB`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      
      // Create preview URLs
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const removeImage = (index) => {
    // Revoke URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) return [];

    setUploadingImages(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch("http://localhost:8000/upload-images", {
        method: "POST",
        headers: getAuthHeader(),
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.image_urls;
      } else {
        throw new Error("Failed to upload images");
      }
    } catch (error) {
      toast({
        title: "Lỗi upload ảnh",
        description: "Không thể upload ảnh, vui lòng thử lại",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.category || !formData.contact_info) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Upload images first if any
      let imageUrls = [];
      if (selectedFiles.length > 0) {
        imageUrls = await uploadImages();
      }

      const postData = {
        ...formData,
        image_urls: imageUrls
      };

      const response = await fetch("http://localhost:8000/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Bài viết đã được đăng thành công",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        navigate("/homepage");
      } else {
        const error = await response.json();
        throw new Error(error.detail || "Đăng bài thất bại");
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi đăng bài",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Navigation>
      <Container maxW="4xl" py={6}>
        <VStack spacing={6}>
          <Box textAlign="center">
            <Heading size="xl" mb={2} color="blue.600">
              Đăng tin mới
            </Heading>
            <Text color="gray.600">
              Chia sẻ thông tin với cộng đồng sinh viên UIT
            </Text>
          </Box>

          <Card w="full" bg={bg} shadow="lg">
            <CardBody>
              <form onSubmit={handleSubmit}>
                <VStack spacing={6}>
                  {/* Title */}
                  <FormControl isRequired>
                    <FormLabel>Tiêu đề</FormLabel>
                    <Input
                      placeholder="Nhập tiêu đề bài viết..."
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      size="lg"
                    />
                  </FormControl>

                  {/* Category */}
                  <FormControl isRequired>
                    <FormLabel>Danh mục</FormLabel>
                    <Select
                      placeholder="Chọn danh mục"
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      size="lg"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Content */}
                  <FormControl isRequired>
                    <FormLabel>Nội dung</FormLabel>
                    <Textarea
                      placeholder="Mô tả chi tiết..."
                      value={formData.content}
                      onChange={(e) => handleInputChange("content", e.target.value)}
                      rows={6}
                      resize="vertical"
                    />
                  </FormControl>

                  {/* Location */}
                  <FormControl>
                    <FormLabel>Địa điểm</FormLabel>
                    <Input
                      placeholder="Ví dụ: Tòa A, UIT..."
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                    />
                  </FormControl>

                  {/* Contact Info */}
                  <FormControl isRequired>
                    <FormLabel>Thông tin liên hệ</FormLabel>
                    <Input
                      placeholder="Số điện thoại, Facebook, Email..."
                      value={formData.contact_info}
                      onChange={(e) => handleInputChange("contact_info", e.target.value)}
                    />
                  </FormControl>

                  {/* Tags */}
                  <FormControl>
                    <FormLabel>Tags</FormLabel>
                    <HStack>
                      <Input
                        placeholder="Thêm tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      />
                      <Button
                        leftIcon={<FiPlus />}
                        onClick={addTag}
                        colorScheme="blue"
                        variant="outline"
                      >
                        Thêm
                      </Button>
                    </HStack>
                    
                    {formData.tags.length > 0 && (
                      <Box mt={3}>
                        <Wrap>
                          {formData.tags.map((tag, index) => (
                            <WrapItem key={index}>
                              <Tag colorScheme="blue" variant="solid">
                                <TagLabel>{tag}</TagLabel>
                                <TagCloseButton onClick={() => removeTag(tag)} />
                              </Tag>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Box>
                    )}
                  </FormControl>

                  {/* Image Upload */}
                  <FormControl>
                    <FormLabel>Ảnh</FormLabel>
                    <VStack align="stretch" spacing={4}>
                      <HStack>
                        <Button
                          leftIcon={<FiUpload />}
                          onClick={() => fileInputRef.current?.click()}
                          colorScheme="blue"
                          variant="outline"
                          isDisabled={selectedFiles.length >= 5}
                        >
                          Chọn ảnh
                        </Button>
                        <Text fontSize="sm" color="gray.500">
                          Tối đa 5 ảnh, mỗi ảnh không quá 5MB
                        </Text>
                      </HStack>
                      
                      <Input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      
                      {previewUrls.length > 0 && (
                        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                          {previewUrls.map((url, index) => (
                            <Box key={index} position="relative">
                              <Image
                                src={url}
                                alt={`Preview ${index + 1}`}
                                borderRadius="md"
                                objectFit="cover"
                                w="full"
                                h="100px"
                              />
                              <IconButton
                                icon={<FiX />}
                                size="sm"
                                colorScheme="red"
                                position="absolute"
                                top={1}
                                right={1}
                                onClick={() => removeImage(index)}
                                aria-label="Remove image"
                              />
                            </Box>
                          ))}
                        </SimpleGrid>
                      )}
                      
                      {uploadingImages && (
                        <Alert status="info">
                          <AlertIcon />
                          Đang upload ảnh...
                        </Alert>
                      )}
                    </VStack>
                  </FormControl>

                  <Divider />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    leftIcon={<FiSend />}
                    isLoading={isLoading}
                    loadingText="Đang đăng..."
                    w="full"
                  >
                    Đăng tin
                  </Button>
                </VStack>
              </form>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Navigation>
  );
};

export default Dangtin; 