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

const LoginPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    // Create form data for FastAPI OAuth2PasswordRequestForm
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      // Send login request to backend
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData.toString()
      });

      if (response.ok) {
        // Display success message and navigate to background page
        toast({
          title: "Login successful",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        navigate("/background");
      } else {
        // Handle login failure
        const error = await response.json();
        toast({
          title: "Login failed",
          description: error.detail || "Invalid credentials",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      // Handle network or other errors
      toast({
        title: "Error",
        description: "An error occurred while logging in",
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
          <Image 
            src={logoImage} 
            alt="UIT Logo" 
            w="150px" 
            filter="drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.25))"
          />
          <Text color="white" fontSize="3xl" fontWeight="bold">
            UIT W2F - WHERE TO FIND
          </Text>
          
          <form onSubmit={handleLogin} style={{ width: "100%" }}>
            <Stack spacing={4}>
              <FormControl>
                <InputGroup>
                  <InputLeftElement>
                    <Image src={usernameIcon} alt="Username" w="25px" />
                  </InputLeftElement>
                  <Input
                    type="text"
                    placeholder="USERNAME"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                    type="password"
                    placeholder="PASSWORD"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                mt={4}
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
                bg="white"
                color="blue.500"
                fontWeight={"bold"}
                transition="all 0.2s"
              >
                LOGIN
              </Button>
            </Stack>
          </form>

          <Stack direction="row" justify="space-between" w="100%" pt={2}>
            <Link
              color="white"
              onClick={() => navigate("/register")}
              fontSize="sm"
              _hover={{
                textDecoration: "none",
                color: "whiteAlpha.800"
              }}
            >
              Sign up
            </Link>
            <Link
              color="white"
              onClick={() => navigate("/forgot-password")}
              fontSize="sm"
              _hover={{
                textDecoration: "none",
                color: "whiteAlpha.800"
              }}
            >
              Forgot password?
            </Link>
          </Stack>
        </Stack>
      </Box>
    </Flex>
  );  
};

export default LoginPage;
