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
  useToast
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiMapPin, FiClock, FiUser, FiMessageCircle, FiTag } from "react-icons/fi";
import { useAuth } from "../components/AuthContext";
import Navigation from "../components/Navigation";

const Homepage = () => {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const { getAuthHeader } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const bg = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");

  const categories = [
    { name: "Tất cả", value: "" },
    { name: "Tìm đồ", value: "lost" },
    { name: "Nhặt được", value: "found" }
  ];

  const fetchPosts = async () => {
    try {
      const response = await fetch(`http://localhost:8000/posts?category=${selectedCategory}&limit=20`, {
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
  }, [selectedCategory]);

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN", { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Navigation>
      <Container maxW="7xl" py={6}>
        {/* Header Section */}
        <VStack spacing={6} mb={8}>
          <Box textAlign="center">
            <Heading size="2xl" mb={4} color="blue.600">
              UIT WHERE TO FIND
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Nền tảng kết nối sinh viên UIT - Tìm kiếm, chia sẻ, kết nối
            </Text>
          </Box>

          {/* Search Bar */}
          <Box w="full" maxW="2xl">
            <InputGroup size="lg">
              <InputLeftElement>
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg={bg}
                borderRadius="xl"
              />
            </InputGroup>
          </Box>

          {/* Category Filters */}
          <HStack spacing={2} wrap="wrap" justify="center">
            {categories.map((category) => (
              <Button
                key={category.value}
                size="sm"
                variant={selectedCategory === category.value ? "solid" : "outline"}
                colorScheme="blue"
                onClick={() => setSelectedCategory(category.value)}
                borderRadius="full"
              >
                {category.name}
              </Button>
            ))}
          </HStack>
        </VStack>

        {/* Posts Grid */}
        {loading ? (
          <Flex justify="center" py={10}>
            <Text>Đang tải...</Text>
          </Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                bg={cardBg}
                shadow="md"
                borderRadius="xl"
                overflow="hidden"
                _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <CardBody>
                  <VStack align="start" spacing={3}>
                    <HStack justify="space-between" w="full">
                      <Badge
                        colorScheme={getCategoryColor(post.category)}
                        borderRadius="full"
                        px={3}
                        py={1}
                      >
                        {getCategoryName(post.category)}
                      </Badge>
                    </HStack>

                    <Heading size="md" noOfLines={2}>
                      {post.title}
                    </Heading>

                    <Text color="gray.600" noOfLines={3}>
                      {post.content}
                    </Text>

                    {post.location && (
                      <HStack>
                        <Icon as={FiMapPin} color="gray.400" />
                        <Text fontSize="sm" color="gray.500">
                          {post.location}
                        </Text>
                      </HStack>
                    )}

                    {/* Display images if available */}
                    {post.image_urls && post.image_urls.length > 0 && (
                      <SimpleGrid columns={post.image_urls.length === 1 ? 1 : 2} spacing={2}>
                        {post.image_urls.slice(0, 4).map((imageUrl, index) => (
                          <Image
                            key={index}
                            src={`http://localhost:8000${imageUrl}`}
                            alt={`${post.title} image ${index + 1}`}
                            borderRadius="md"
                            objectFit="cover"
                            maxH="120px"
                            w="full"
                          />
                        ))}
                        {post.image_urls.length > 4 && (
                          <Box
                            borderRadius="md"
                            bg="gray.100"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            minH="120px"
                          >
                            <Text fontSize="sm" color="gray.600">
                              +{post.image_urls.length - 4} ảnh khác
                            </Text>
                          </Box>
                        )}
                      </SimpleGrid>
                    )}

                    <HStack justify="space-between" w="full" pt={2}>
                      <HStack>
                        <Icon as={FiUser} color="gray.400" />
                        <Text fontSize="sm" color="gray.500">
                          {post.author}
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={FiClock} color="gray.400" />
                        <Text fontSize="sm" color="gray.500">
                          {formatDate(post.created_at)}
                        </Text>
                      </HStack>
                    </HStack>

                    <Button
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      leftIcon={<FiMessageCircle />}
                      w="full"
                      borderRadius="lg"
                      onClick={() => navigate(`/chat/${post.author}`)}
                    >
                      Liên hệ
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}

        {filteredPosts.length === 0 && !loading && (
          <Box textAlign="center" py={10}>
            <Text fontSize="lg" color="gray.500">
              Không tìm thấy bài viết nào
            </Text>
          </Box>
        )}
      </Container>
    </Navigation>
  );
};

export default Homepage; 