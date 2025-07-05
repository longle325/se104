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
import { useState, useRef, useEffect } from "react";
import { FiPlus, FiSend, FiUpload, FiX, FiImage } from "react-icons/fi";
import { useAuth } from "../components/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "../components/Navigation";
import ImageGallery from "../components/ImageGallery";

const EditPost = () => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    item_type: "",
    location: "",
    location_code: "",
    custom_location: "",
    tags: [],
    image_urls: []
  });
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const { getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const { postId } = useParams();
  const toast = useToast();

  const bg = useColorModeValue("white", "gray.800");

  const categories = [
    { value: "lost", label: "Tìm đồ" },
    { value: "found", label: "Nhặt được" }
  ];

  const locations = [
    { value: "cong_truoc", label: "Cổng trước" },
    { value: "toa_a", label: "Tòa A" },
    { value: "toa_b", label: "Tòa B" },
    { value: "toa_c", label: "Tòa C" },
    { value: "toa_d", label: "Tòa D" },
    { value: "toa_e", label: "Tòa E" },
    { value: "canteen", label: "Căng tin" },
    { value: "cafe_voi", label: "Cafe Vối" },
    { value: "san_the_thao", label: "Sân thể thao" },
    { value: "bai_do_xe", label: "Bãi đỗ xe" },
    { value: "cong_sau", label: "Cổng sau" },
    { value: "khac", label: "Khác" }
  ];

  const itemTypes = [
    { value: "the_sinh_vien", label: "Thẻ sinh viên" },
    { value: "vi_giay_to", label: "Ví/Giấy tờ" },
    { value: "dien_tu", label: "Điện thoại/Tablet/Laptop" },
    { value: "khac", label: "Đồ vật khác" }
  ];

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`http://localhost:8000/posts/${postId}`, {
          headers: getAuthHeader(),
        });

        if (response.ok) {
          const post = await response.json();
          
          // Find location code based on location name
          const locationItem = locations.find(loc => loc.label === post.location);
          const locationCode = locationItem ? locationItem.value : "khac";
          
          setFormData({
            title: post.title || "",
            content: post.content || "",
            category: post.category || "",
            item_type: post.item_type || "",
            location: post.location || "",
            location_code: locationCode,
            custom_location: locationCode === "khac" ? post.location : "",
            tags: post.tags || [],
            image_urls: post.image_urls || []
          });
          
          // Set preview URLs for existing images
          if (post.image_urls && post.image_urls.length > 0) {
            setPreviewUrls(post.image_urls.map(url => `http://localhost:8000${url}`));
          }
        } else {
          throw new Error("Failed to fetch post");
        }
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin bài viết",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        navigate("/homepage");
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const handleInputChange = (field, value) => {
    if (field === "location") {
      // Find the location label based on value
      const selectedLocation = locations.find(loc => loc.value === value);
      setFormData(prev => ({
        ...prev,
        location: selectedLocation ? selectedLocation.label : value,
        location_code: value, // Keep the code for conditional logic
        // Clear custom location when predefined location is selected
        custom_location: value === "khac" ? prev.custom_location : ""
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && Array.isArray(formData.tags) && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: Array.isArray(prev.tags) ? prev.tags.filter(tag => tag !== tagToRemove) : []
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
    if (index < formData.image_urls.length) {
      // Removing existing image
      setFormData(prev => ({
        ...prev,
        image_urls: prev.image_urls.filter((_, i) => i !== index)
      }));
    } else {
      // Removing new selected file
      const newFileIndex = index - formData.image_urls.length;
      URL.revokeObjectURL(previewUrls[index]);
      setSelectedFiles(prev => prev.filter((_, i) => i !== newFileIndex));
    }
    
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) return [];

    setUploadingImages(true);
    try {
      const formDataUpload = new FormData();
      selectedFiles.forEach(file => {
        formDataUpload.append('files', file);
      });

      const response = await fetch("http://localhost:8000/upload-images", {
        method: "POST",
        headers: getAuthHeader(),
        body: formDataUpload,
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
    
    if (!formData.title || !formData.content || !formData.category || !formData.item_type) {
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
      // Upload new images if any
      let newImageUrls = [];
      if (selectedFiles.length > 0) {
        newImageUrls = await uploadImages();
      }

      // Combine existing and new image URLs
      const allImageUrls = [...formData.image_urls, ...newImageUrls];

      // Prepare post data with proper location handling
      const finalLocation = formData.location_code === "khac" && formData.custom_location 
        ? formData.custom_location 
        : formData.location;

      const postData = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        item_type: formData.item_type,
        location: finalLocation,
        tags: formData.tags,
        image_urls: allImageUrls
      };

      const response = await fetch(`http://localhost:8000/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Bài viết đã được cập nhật thành công",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        navigate("/homepage");
      } else {
        const error = await response.json();
        throw new Error(error.detail || "Cập nhật bài thất bại");
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật bài",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <Navigation>
        <Container maxW="4xl" py={6}>
          <Text textAlign="center">Đang tải...</Text>
        </Container>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <Container maxW="4xl" py={6}>
        <VStack spacing={6}>
          <Box textAlign="center">
            <Heading size="xl" mb={2} color="blue.600">
              Chỉnh sửa bài viết
            </Heading>
            <Text color="gray.600">
              Cập nhật thông tin bài viết của bạn
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
                    <FormLabel>Loại bài đăng</FormLabel>
                    <Select
                      placeholder="Chọn loại bài đăng"
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

                  {/* Item Type */}
                  <FormControl isRequired>
                    <FormLabel>Danh mục</FormLabel>
                    <Select
                      placeholder="Chọn danh mục"
                      value={formData.item_type}
                      onChange={(e) => handleInputChange("item_type", e.target.value)}
                      size="lg"
                    >
                      {itemTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
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
                    <Select
                      placeholder="Chọn địa điểm"
                      value={formData.location_code}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      size="lg"
                    >
                      {locations.map((loc) => (
                        <option key={loc.value} value={loc.value}>
                          {loc.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Custom Location - Only show when "Khác" is selected */}
                  {formData.location_code === "khac" && (
                    <FormControl>
                      <FormLabel>Địa điểm khác</FormLabel>
                      <Input
                        placeholder="Nhập địa điểm cụ thể..."
                        value={formData.custom_location}
                        onChange={(e) => handleInputChange("custom_location", e.target.value)}
                      />
                    </FormControl>
                  )}

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
                          isDisabled={previewUrls.length >= 5}
                        >
                          Thêm ảnh
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
                                h="120px"
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
                              <Text fontSize="xs" textAlign="center" mt={1} fontWeight="medium">
                                Ảnh {index + 1}
                              </Text>
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

                  {/* Action Buttons */}
                  <HStack spacing={4} w="full">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => navigate(-1)}
                      flex={1}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      colorScheme="blue"
                      size="lg"
                      leftIcon={<FiSend />}
                      isLoading={isLoading}
                      loadingText="Đang cập nhật..."
                      flex={1}
                    >
                      Cập nhật bài viết
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

export default EditPost; 