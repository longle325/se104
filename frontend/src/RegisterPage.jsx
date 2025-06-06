import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Stack,
  Text,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "./assets/auth/background.png";
import logoImage from "./assets/auth/logo.png";
import usernameIcon from "./assets/auth/username.png";
import passwordIcon from "./assets/auth/password.png";
import phoneIcon from "./assets/auth/phone.png";
import mailIcon from "./assets/auth/mail.png";

const RegisterPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    student_id: "",
    email: "",
    phonenumber: "",
    password: "",
    confirmPassword: ""
  });
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState("");
  const [registeredFullName, setRegisteredFullName] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
  
    const { student_id, email, phonenumber, password, confirmPassword } = formData;
  
    if (!student_id || !email || !phonenumber || !password || !confirmPassword) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all fields.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
  
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
  
    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          student_id,
          email, 
          phonenumber, 
          password
        })
      });
  
      if (response.ok) {
        const data = await response.json();
        setGeneratedUsername(data.username);
        setRegisteredFullName(data.full_name);
        setRegistrationSuccess(true);
        toast({
          title: "Account Created!",
          description: `Welcome ${data.full_name}! Your username is ${data.username}. Please check your email to verify your account.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Registration Failed",
          description: error.detail || "An error occurred during registration",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "An error occurred while registering",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (registrationSuccess) {
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
          bg="rgba(0, 0, 0, 0.7)"
          color="white"
        >
          <Stack spacing={6} align="center">
            <Text fontSize="2xl" fontWeight="bold">
              Registration Successful!
            </Text>
            <Alert
              status="success"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              height="250px"
              bg="rgba(56, 161, 105, 0.3)"
              color="white"
              borderRadius="md"
            >
              <AlertIcon boxSize="40px" mr={0} color="green.200" />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                Verification Email Sent!
              </AlertTitle>
              <AlertDescription maxWidth="sm">
                <Text>
                  We've sent a verification link to {formData.email}. 
                  Please check your email and click the link to activate your account.
                </Text>
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate("/login")}
              size="lg"
              colorScheme="blue"
              mt={4}
              w="full"
            >
              Go to Login
            </Button>
          </Stack>
        </Box>
      </Flex>
    );
  }

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
          <Text color="white" fontSize="35px" fontWeight="bold">
            SIGN UP
          </Text>
          
          <form onSubmit={handleRegister} style={{ width: "100%" }}>
            <Stack spacing={4}>
              <FormControl>
                <InputGroup>
                  <InputLeftElement>
                    <Image src={usernameIcon} alt="Full Name" w="25px" />
                  </InputLeftElement>
                  <Input
                    name="student_id"
                    type="text"
                    placeholder="STUDENT ID (MSSV)"
                    value={formData.student_id}
                    onChange={handleChange}
                    borderRadius="lg"
                    bg="rgba(255, 255, 255, 0.0)"
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.2)"
                    }}
                    _focus={{
                      bg: "rgba(255, 255, 255, 0.4)",
                      borderColor: "blue.500"
                    }}
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <InputGroup>
                  <InputLeftElement>
                    <Image src={mailIcon} alt="Email" w="25px" />
                  </InputLeftElement>
                  <Input
                    name="email"
                    type="email"
                    placeholder="EMAIL (@gm.uit.edu.vn)"
                    value={formData.email}
                    onChange={handleChange}
                    borderRadius="lg"
                    bg="rgba(255, 255, 255, 0.0)"
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.2)"
                    }}
                    _focus={{
                      bg: "rgba(255, 255, 255, 0.4)",
                      borderColor: "blue.500"
                    }}
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <InputGroup>
                  <InputLeftElement>
                    <Image src={phoneIcon} alt="phonenumber" w="25px" />
                  </InputLeftElement>
                  <Input
                    name="phonenumber"
                    type="tel"
                    placeholder="PHONE NUMBER"
                    value={formData.phonenumber}
                    onChange={handleChange}
                    borderRadius="lg"
                    bg="rgba(255, 255, 255, 0.0)"
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.2)"
                    }}
                    _focus={{
                      bg: "rgba(255, 255, 255, 0.4)",
                      borderColor: "blue.500"
                    }}
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <InputGroup>
                  <InputLeftElement>
                    <Image src={passwordIcon} alt="Password" w="25px" />
                  </InputLeftElement>
                  <Input
                    name="password"
                    type="password"
                    placeholder="PASSWORD"
                    value={formData.password}
                    onChange={handleChange}
                    borderRadius="lg"
                    bg="rgba(255, 255, 255, 0.0)"
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.2)"
                    }}
                    _focus={{
                      bg: "rgba(255, 255, 255, 0.4)",
                      borderColor: "blue.500"
                    }}
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <InputGroup>
                  <InputLeftElement>
                    <Image src={passwordIcon} alt="Confirm Password" w="25px" />
                  </InputLeftElement>
                  <Input
                    name="confirmPassword"
                    type="password"
                    placeholder="CONFIRM PASSWORD"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    borderRadius="lg"
                    bg="rgba(255, 255, 255, 0.0)"
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.2)"
                    }}
                    _focus={{
                      bg: "rgba(255, 255, 255, 0.4)",
                      borderColor: "blue.500"
                    }}
                  />
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                mt={4}
                mb={4}
                fontSize="lg"
                padding="24px"
                borderRadius="xl"
                _hover={{ transform: "translateY(-2px)", transition: "all 0.2s" }}
                bg="linear-gradient(90deg, #0066FF 0%, #6942EF 100%)"
              >
                REGISTER
              </Button>
            </Stack>
          </form>

          <Text color="white" mt={2} textAlign="center">
            Already have an account?{" "}
            <Link 
              color="blue.300" 
              onClick={() => navigate("/login")}
              cursor="pointer"
              _hover={{ color: "blue.200", textDecoration: "underline" }}
            >
              Login
            </Link>
          </Text>
        </Stack>
      </Box>
    </Flex>
  );
};

export default RegisterPage;
