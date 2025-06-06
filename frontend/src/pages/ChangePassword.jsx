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
  IconButton,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Divider,
  InputGroup,
  InputRightElement,
  Alert,
  AlertIcon,
  AlertDescription
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import { useAuth } from "../components/AuthContext";
import Navigation from "../components/Navigation";

const ChangePassword = () => {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  
  const { getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwords.currentPassword) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mật khẩu hiện tại",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!passwords.newPassword) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mật khẩu mới",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới phải có ít nhất 6 ký tự",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          current_password: passwords.currentPassword,
          new_password: passwords.newPassword
        }),
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Mật khẩu đã được thay đổi thành công",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        navigate(-1);
      } else {
        throw new Error('Failed to change password');
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi mật khẩu",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPasswords(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleShowPassword = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "gray" };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: "Yếu", color: "red" };
    if (strength <= 4) return { strength, label: "Trung bình", color: "yellow" };
    return { strength, label: "Mạnh", color: "green" };
  };

  const passwordStrength = getPasswordStrength(passwords.newPassword);

  return (
    <Navigation>
      <Container maxW="2xl" py={8}>
        <VStack spacing={6} align="stretch">
          <HStack spacing={4}>
            <IconButton
              icon={<FiArrowLeft />}
              variant="outline"
              onClick={() => navigate(-1)}
              aria-label="Quay lại"
            />
            <Heading size="lg" color="gray.800">
              Đổi mật khẩu
            </Heading>
          </HStack>

          <Card>
            <CardHeader>
              <VStack spacing={2} align="start">
                <Heading size="md">Thay đổi mật khẩu</Heading>
                <Text fontSize="sm" color="gray.600">
                  Để bảo mật tài khoản, vui lòng chọn mật khẩu mạnh
                </Text>
              </VStack>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit}>
                <VStack spacing={6} align="stretch">
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">
                      Sau khi đổi mật khẩu, bạn sẽ cần đăng nhập lại
                    </AlertDescription>
                  </Alert>

                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Mật khẩu hiện tại</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwords.currentPassword}
                          onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                          placeholder="Nhập mật khẩu hiện tại"
                        />
                        <InputRightElement>
                          <IconButton
                            size="sm"
                            variant="ghost"
                            icon={showPasswords.current ? <FiEyeOff /> : <FiEye />}
                            onClick={() => toggleShowPassword('current')}
                            aria-label="Toggle password visibility"
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>

                    <Divider />

                    <FormControl isRequired>
                      <FormLabel>Mật khẩu mới</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwords.newPassword}
                          onChange={(e) => handleInputChange('newPassword', e.target.value)}
                          placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                        />
                        <InputRightElement>
                          <IconButton
                            size="sm"
                            variant="ghost"
                            icon={showPasswords.new ? <FiEyeOff /> : <FiEye />}
                            onClick={() => toggleShowPassword('new')}
                            aria-label="Toggle password visibility"
                          />
                        </InputRightElement>
                      </InputGroup>
                      
                      {/* Password Strength Indicator */}
                      {passwords.newPassword && (
                        <Box mt={2}>
                          <HStack spacing={2}>
                            <Text fontSize="xs" color="gray.600">Độ mạnh:</Text>
                            <Text fontSize="xs" color={`${passwordStrength.color}.500`} fontWeight="medium">
                              {passwordStrength.label}
                            </Text>
                          </HStack>
                          <Box w="full" h="2" bg="gray.200" borderRadius="full" mt={1}>
                            <Box
                              h="full"
                              bg={`${passwordStrength.color}.500`}
                              borderRadius="full"
                              w={`${(passwordStrength.strength / 6) * 100}%`}
                              transition="all 0.3s"
                            />
                          </Box>
                        </Box>
                      )}
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwords.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                        />
                        <InputRightElement>
                          <IconButton
                            size="sm"
                            variant="ghost"
                            icon={showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                            onClick={() => toggleShowPassword('confirm')}
                            aria-label="Toggle password visibility"
                          />
                        </InputRightElement>
                      </InputGroup>
                      
                      {/* Password Match Indicator */}
                      {passwords.confirmPassword && (
                        <Text 
                          fontSize="xs" 
                          color={passwords.newPassword === passwords.confirmPassword ? "green.500" : "red.500"}
                          mt={1}
                        >
                          {passwords.newPassword === passwords.confirmPassword 
                            ? "✓ Mật khẩu khớp" 
                            : "✗ Mật khẩu không khớp"}
                        </Text>
                      )}
                    </FormControl>
                  </VStack>

                  <Divider />

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
                      leftIcon={<FiLock />}
                      isLoading={loading}
                      loadingText="Đang thay đổi..."
                    >
                      Đổi mật khẩu
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

export default ChangePassword; 