import { Flex, Heading, Box } from "@chakra-ui/react";

const HomePage = () => {
  return (
    <Flex
      flexDirection="column"
      width="100wh"
      height="100vh"
      backgroundColor="gray.100"
      justifyContent="center"
      alignItems="center"
    >
      <Heading>Fake Homepage</Heading>
      <Box mt={4}>Welcome! You have logged in successfully.</Box>
    </Flex>
  );
};

export default HomePage;
