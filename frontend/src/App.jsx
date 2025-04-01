// import { useState } from "react";
// import {
//   Flex,
//   Heading,
//   Input,
//   Button,
//   InputGroup,
//   Stack,
//   InputLeftElement,
//   chakra,
//   Box,
//   Link,
//   Avatar,
//   FormControl,
//   FormLabel,
//   FormErrorMessage,
//   FormHelperText,
//   InputRightElement
// } from "@chakra-ui/react";
// import { FaUserAlt, FaLock } from "react-icons/fa";

// const CFaUserAlt = chakra(FaUserAlt);
// const CFaLock = chakra(FaLock);

// const App = () => {
//   const [showPassword, setShowPassword] = useState(false);

//   const handleShowClick = () => setShowPassword(!showPassword);

//   return (
//     <Flex
//       flexDirection="column"
//       width="100wh"
//       height="100vh"
//       backgroundColor="gray.200"
//       justifyContent="center"
//       alignItems="center"
//     >
//       <Stack
//         flexDir="column"
//         mb="2"
//         justifyContent="center"
//         alignItems="center"
//       >
//         <Avatar bg="teal.500" />
//         <Heading color="teal.400">Welcome</Heading>
//         <Box minW={{ base: "90%", md: "468px" }}>
//           <form>
//             <Stack
//               spacing={4}
//               p="1rem"
//               backgroundColor="whiteAlpha.900"
//               boxShadow="md"
//             >
//               <FormControl>
//                 <InputGroup>
//                   <InputLeftElement pointerEvents="none">
//                     <CFaUserAlt color="gray.300" />
//                   </InputLeftElement>
//                   <Input type="email" placeholder="Username" />
//                 </InputGroup>
//               </FormControl>
//               <FormControl>
//                 <InputGroup>
//                   <InputLeftElement pointerEvents="none" color="gray.300">
//                     <CFaLock color="gray.300" />
//                   </InputLeftElement>
//                   <Input
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Password"
//                   />
//                   <InputRightElement width="4.5rem">
//                     <Button h="1.75rem" size="sm" onClick={handleShowClick}>
//                       {showPassword ? "Hide" : "Show"}
//                     </Button>
//                   </InputRightElement>
//                 </InputGroup>
//                 <FormHelperText textAlign="right">
//                   <Link>forgot password?</Link>
//                 </FormHelperText>
//               </FormControl>
//               <Button
//                 borderRadius={0}
//                 type="submit"
//                 variant="solid"
//                 colorScheme="teal"
//                 width="full"
//               >
//                 Login
//               </Button>
//             </Stack>
//           </form>
//         </Box>
//       </Stack>
//       <Box>
//         New to us?{" "}
//         <Link color="teal.500" href="#">
//           Sign Up
//         </Link>
//       </Box>
//     </Flex>
//   );
// };

// export default App;
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import HomePage from './HomePage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </Router>
  );
};

export default App;
