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
  useToast
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
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
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
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Account created successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        navigate("/login");
      } else {
        const error = await response.json();
        toast({
          title: "Registration failed",
          description: error.detail || "An error occurred during registration",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while registering",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
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
        <Stack spacing={6} align="center">
          <Text color="white" fontSize="35px" fontWeight="bold">
            SIGN UP
          </Text>
          
          <form onSubmit={handleRegister} style={{ width: "100%" }}>
            <Stack spacing={4}>
              <FormControl>
                <InputGroup>
                  <InputLeftElement>
                    <Image src={usernameIcon} alt="Username" w="25px" />
                  </InputLeftElement>
                  <Input
                    name="username"
                    type="text"
                    placeholder="USERNAME"
                    value={formData.username}
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
                    placeholder="EMAIL"
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
                    <Image src={phoneIcon} alt="Phone" w="25px" />
                  </InputLeftElement>
                  <Input
                    name="phone"
                    type="tel"
                    placeholder="PHONE NUMBER"
                    value={formData.phone}
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
                size="lg"
                fontSize="md"
                borderRadius="full"
                rounded="xl"
                w="100%"
                boxShadow="0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)"
                _hover={{
                  bg: "whiteAlpha.900",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 8px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)"
                }}
                _active={{
                  transform: "translateY(0)",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)"
                }}
                bg="white"
                color="blue.500"
                fontWeight="bold"
                transition="all 0.2s"
              >
                SIGN UP
              </Button>
            </Stack>
          </form>

          <Stack direction="row" justify="center" w="100%" pt={2}>
            <Text fontSize="sm" color="white">Already have an account?</Text>
            <Link
              color="white"
              onClick={() => navigate("/login")}
              fontSize="sm"
              _hover={{
                textDecoration: "none",
                color: "whiteAlpha.800"
              }}
            >
              Login
            </Link>
          </Stack>
        </Stack>
      </Box>
    </Flex>
  );
};

export default RegisterPage;
