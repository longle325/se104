import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  useToast,
  Text
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import backgroundImage from "./assets/auth/background.png";
import passwordIcon from "./assets/auth/password.png";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Extract email and code from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const emailParam = queryParams.get("email");
    const codeParam = queryParams.get("code");
    
    if (emailParam) setEmail(emailParam);
    if (codeParam) setCode(codeParam);
    
    if (!emailParam || !codeParam) {
      toast({
        title: "Error",
        description: "Missing verification information. Please try the password reset process again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      // Redirect to forgot-password page after a short delay
      setTimeout(() => navigate("/forgot-password"), 2000);
    }
  }, [location, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("http://localhost:8000/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: email,
          code: code,
          new_password: newPassword
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password has been reset successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        // Redirect to login page after a short delay
        setTimeout(() => navigate("/login"), 2000);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.detail || "Failed to reset password",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while resetting your password",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <Stack spacing={8} align="center" maxW="450px">
          <Stack spacing={4} align="center" w="100%">
            <Text 
              color="white" 
              fontSize={{ base: "3xl", md: "5xl" }} 
              fontWeight="extrabold" 
              lineHeight="1"
              textAlign="center"
              whiteSpace="nowrap"
              letterSpacing="wide"
            >
              RESET YOUR PASSWORD
            </Text>
            
            <Text 
              color="white" 
              fontSize="15px" 
              textAlign="center" 
              opacity={0.55} 
              px={4}
              maxW="400px"
            >
              Enter your new password below and confirm it.
              Make sure it's secure and easy to remember.
            </Text>
          </Stack>
          
          <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "400px" }}>
            <Stack spacing={6}>
              <FormControl>
                <InputGroup size="lg">
                  <InputLeftElement h="56px" pointerEvents="none">
                    <Image src={passwordIcon} alt="Password" w="25px" />
                  </InputLeftElement>
                  <Input
                    type="password"
                    placeholder="NEW PASSWORD"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    borderRadius="2xl"
                    bg="rgba(255, 255, 255, 0.1)"
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.2)"
                    }}
                    _focus={{
                      bg: "rgba(255, 255, 255, 0.2)",
                      borderColor: "white"
                    }}
                    h="56px"
                    fontSize="lg"
                    color="white"
                    letterSpacing="wide"
                    border="1px solid rgba(255, 255, 255, 0.3)"
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <InputGroup size="lg">
                  <InputLeftElement h="56px" pointerEvents="none">
                    <Image src={passwordIcon} alt="Password" w="25px" />
                  </InputLeftElement>
                  <Input
                    type="password"
                    placeholder="CONFIRM PASSWORD"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    borderRadius="2xl"
                    bg="rgba(255, 255, 255, 0.1)"
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.2)"
                    }}
                    _focus={{
                      bg: "rgba(255, 255, 255, 0.2)",
                      borderColor: "white"
                    }}
                    h="56px"
                    fontSize="lg"
                    color="white"
                    letterSpacing="wide"
                    border="1px solid rgba(255, 255, 255, 0.3)"
                  />
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                size="lg"
                fontSize="xl"
                fontWeight="bold"
                colorScheme="blue"
                borderRadius="2xl"
                w="100%"
                h="56px"
                boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
                _hover={{
                  bg: "white",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 8px rgba(0, 0, 0, 0.15)"
                }}
                _active={{
                  transform: "translateY(0)",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                }}
                bg="white"
                color="blue.500"
                transition="all 0.2s"
                isLoading={isSubmitting}
                disabled={!email || !code}
              >
                UPDATE PASSWORD
              </Button>
            </Stack>
          </form>

          <Text 
            color="white" 
            fontSize="md"
            fontWeight="medium"
            cursor="pointer" 
            onClick={() => navigate("/login")}
            _hover={{
              color: "whiteAlpha.800"
            }}
            mt={2}
          >
            Back to Login
          </Text>
        </Stack>
      </Box>
    </Flex>
  );
};

export default ResetPasswordPage; 