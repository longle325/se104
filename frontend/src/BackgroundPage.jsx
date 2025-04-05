import { Box } from "@chakra-ui/react";
import backgroundImage from "./assets/auth/background.png";

const BackgroundPage = () => {
  return (
    <Box
      w="100vw"
      h="100vh"
      bgImage={backgroundImage}
      bgSize="cover"
      bgPosition="center"
    />
  );
};

export default BackgroundPage; 