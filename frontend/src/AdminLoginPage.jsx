import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  useToast,
  Center,
  Text,
  Image,
  Flex,
  Stack,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import backgroundImage from './assets/auth/background.png';
import logoImage from './assets/auth/logo.png';
import usernameIcon from './assets/auth/username.png';
import passwordIcon from './assets/auth/password.png';

const AdminLoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('admin_token', data.access_token);
        
        toast({
          title: 'Đăng nhập thành công',
          description: 'Chào mừng quản trị viên!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        navigate('/admin/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Thông tin đăng nhập không chính xác');
      }
    } catch (error) {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bgImage={backgroundImage}
      bgSize="cover"
      bgPosition="center"
    >
      <Box
        p={8}
        rounded="sm"
        w={{ base: "90%", md: "450px" }}
      >
        <Stack spacing={6} align="center">
          <Image 
            src={logoImage} 
            alt="UIT Logo" 
            w="150px" 
            filter="drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.25))"
          />
          <Text color="white" fontSize="3xl" fontWeight="bold">
            UIT W2F - ADMIN
          </Text>

          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <Stack spacing={4}>
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}
              <FormControl isRequired>
                <InputGroup>
                  <InputLeftElement>
                    <Image src={usernameIcon} alt="Username" w="25px" />
                  </InputLeftElement>
                  <Input
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="USERNAME"
                    borderRadius="lg"
                    bg="rgba(255, 255, 255, 0.0)"
                    _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
                    _focus={{ bg: "rgba(255, 255, 255, 0.4)", borderColor: "blue.500" }}
                    color="white"
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <InputGroup>
                  <InputLeftElement>
                    <Image src={passwordIcon} alt="Password" w="25px" />
                  </InputLeftElement>
                  <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="PASSWORD"
                    borderRadius="lg"
                    bg="rgba(255, 255, 255, 0.0)"
                    _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
                    _focus={{ bg: "rgba(255, 255, 255, 0.4)", borderColor: "blue.500" }}
                    color="white"
                  />
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                isLoading={loading}
                loadingText="Đang đăng nhập..."
                colorScheme="blue"
                size="lg"
                w="full"
                borderRadius="full"
                bg="white"
                color="blue.500"
                fontWeight={"bold"}
                boxShadow="0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)"
                _hover={{
                  bg: "whiteAlpha.900",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 8px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)"
                }}
                _active={{
                  transform: "translateY(0)",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                }}
                transition="all 0.2s"
              >
                LOGIN
              </Button>
            </Stack>
          </form>

          <Text color="whiteAlpha.700" fontSize="sm" textAlign="center" pt={2}>
            Chỉ dành cho quản trị viên hệ thống
          </Text>
        </Stack>
      </Box>
    </Flex>
  );
};

export default AdminLoginPage; 