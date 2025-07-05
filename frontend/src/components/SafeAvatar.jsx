import React from 'react';
import { Avatar } from '@chakra-ui/react';

const SafeAvatar = ({ name, ...props }) => {
  // Ensure name is always a string to prevent .trim() errors
  const safeName = name && typeof name === 'string' && name.trim() 
    ? name.trim() 
    : 'User';

  return <Avatar name={safeName} {...props} />;
};

export default SafeAvatar; 