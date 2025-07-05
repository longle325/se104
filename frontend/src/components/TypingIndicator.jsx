import React from 'react';
import { Box, HStack, Text, Circle } from '@chakra-ui/react';

const TypingIndicator = ({ username, isVisible }) => {
  if (!isVisible) return null;

  return (
    <Box
      p={2}
      bg="gray.100"
      borderRadius="md"
      maxW="200px"
      opacity={0.8}
      transition="all 0.3s ease"
    >
      <HStack spacing={2} align="center">
        <HStack spacing={1}>
          <Circle size="6px" bg="blue.400" className="animate-pulse" />
          <Circle size="6px" bg="blue.400" className="animate-pulse" style={{ animationDelay: '0.1s' }} />
          <Circle size="6px" bg="blue.400" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
        </HStack>
        <Text fontSize="sm" color="gray.600">
          {username} đang nhập...
        </Text>
      </HStack>
    </Box>
  );
};

export default TypingIndicator; 