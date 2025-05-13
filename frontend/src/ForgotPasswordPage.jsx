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
  Stack,
  useToast,
  Text,
  PinInput,
  PinInputField,
  HStack,
  FormLabel
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "./assets/auth/background.png";
import logoImage from "./assets/auth/logo.png";
import mailIcon from "./assets/auth/mail.png";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: email input, 2: verification code
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("http://localhost:8000/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast({
          title: "Verification Code Sent",
          description: "Please check your email for the verification code",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setStep(2);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.detail || "Failed to send verification code",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while processing your request",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter the complete 6-digit code",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("http://localhost:8000/verify-reset-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      if (response.ok) {
        toast({
          title: "Verification Successful",
          description: "You can now reset your password",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        // Navigate to reset password page with email and verification code
        navigate(`/reset-password?email=${email}&code=${verificationCode}`);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.detail || "Invalid verification code",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while verifying the code",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinChange = (value) => {
    setVerificationCode(value);
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
              {step === 1 ? "FORGOT YOUR PASSWORD ?" : "ENTER VERIFICATION CODE"}
            </Text>
            
            <Text 
              color="white" 
              fontSize="15px" 
              textAlign="center" 
              opacity={0.55} 
              px={4}
              maxW="400px"
            >
              {step === 1 
                ? "Enter the email address you used when you joined and we'll send you a verification code."
                : "Enter the 6-digit code sent to your email address."
              }
            </Text>
          </Stack>
          
          {step === 1 ? (
            <form onSubmit={handleEmailSubmit} style={{ width: "100%", maxWidth: "400px" }}>
              <Stack spacing={6}>
                <FormControl>
                  <InputGroup size="lg">
                    <InputLeftElement h="56px" pointerEvents="none">
                      <Image src={mailIcon} alt="Email" w="25px" />
                    </InputLeftElement>
                    <Input
                      type="email"
                      placeholder="MAIL"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                  color="#0066FF"
                  transition="all 0.2s"
                  isLoading={isSubmitting}
                >
                  SEND
                </Button>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} style={{ width: "100%", maxWidth: "400px" }}>
              <Stack spacing={6}>
                <FormControl>
                  <FormLabel color="white" fontSize="md" mb={4} textAlign="center">
                    Verification code sent to {email}
                  </FormLabel>
                  <HStack justifyContent="center" spacing="4px">
                    <PinInput 
                      size="lg" 
                      value={verificationCode} 
                      onChange={handlePinChange} 
                      otp
                      colorScheme="white"
                    >
                      {[...Array(6)].map((_, i) => (
                        <PinInputField 
                          key={i}
                          borderRadius="md"
                          bg="rgba(255, 255, 255, 0.1)"
                          color="white"
                          borderColor="rgba(255, 255, 255, 0.3)"
                          _hover={{
                            bg: "rgba(255, 255, 255, 0.2)"
                          }}
                          _focus={{
                            bg: "rgba(255, 255, 255, 0.2)",
                            borderColor: "white"
                          }}
                        />
                      ))}
                    </PinInput>
                  </HStack>
                </FormControl>

                <Button
                  type="submit"
                  size="lg"
                  fontSize="xl"
                  fontWeight="bold"
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
                  color="#0066FF"
                  transition="all 0.2s"
                  isLoading={isSubmitting}
                >
                  VERIFY
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  color="white"
                  _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                >
                  Back to Email
                </Button>
              </Stack>
            </form>
          )}

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

export default ForgotPasswordPage; 