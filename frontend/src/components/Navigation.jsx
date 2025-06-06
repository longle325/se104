import { 
  Box, 
  VStack, 
  HStack, 
  Image, 
  Text, 
  Button,
  useColorModeValue,
  Flex,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  useDisclosure
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { FiHome, FiMessageSquare, FiEdit, FiUser, FiMenu, FiLogOut } from "react-icons/fi";
import logoImage from "../assets/auth/logo.png";

const Navigation = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const menuItems = [
    { name: "Trang chủ", icon: FiHome, path: "/homepage" },
    { name: "Chat", icon: FiMessageSquare, path: "/chat" },
    { name: "Đăng tin", icon: FiEdit, path: "/dangtin" },
    { name: "Cá nhân", icon: FiUser, path: `/profile/${user?.username || 'me'}` },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = ({ onClose, ...rest }) => (
    <Box
      bg={bg}
      borderRight="1px"
      borderRightColor={borderColor}
      w={{ base: "full", md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="center" flexDirection="column">
        <Image 
          src={logoImage} 
          alt="UIT Logo" 
          w="60px" 
          h="60px"
          mb={1}
        />
        <Text fontSize="sm" fontWeight="bold" color="blue.500" textAlign="center">
          UIT-W2F
        </Text>
      </Flex>
      <VStack spacing={1} align="stretch">
        {menuItems.map((item) => (
          <Button
            key={item.name}
            variant={location.pathname === item.path ? "solid" : "ghost"}
            colorScheme={location.pathname === item.path ? "blue" : "gray"}
            justifyContent="flex-start"
            leftIcon={<item.icon />}
            mx={4}
            onClick={() => {
              navigate(item.path);
              onClose();
            }}
          >
            {item.name}
          </Button>
        ))}
        <Box mt={8}>
          <Button
            variant="ghost"
            colorScheme="red"
            justifyContent="flex-start"
            leftIcon={<FiLogOut />}
            mx={4}
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
        </Box>
      </VStack>
    </Box>
  );

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
      <SidebarContent onClose={() => onClose} display={{ base: "none", md: "block" }} />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerOverlay />
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      
      {/* Mobile nav */}
      <Flex
        ml={{ base: 0, md: 60 }}
        px={{ base: 4, md: 4 }}
        height="20"
        alignItems="center"
        bg={bg}
        borderBottomWidth="1px"
        borderBottomColor={borderColor}
        justifyContent={{ base: "space-between", md: "flex-end" }}
      >
        <IconButton
          display={{ base: "flex", md: "none" }}
          onClick={onOpen}
          variant="outline"
          aria-label="open menu"
          icon={<FiMenu />}
        />
        
        <HStack display={{ base: "flex", md: "none" }}>
          <Image 
            src={logoImage} 
            alt="UIT Logo" 
            w="40px" 
            h="40px"
          />
          <Text fontSize="lg" fontWeight="bold" color="blue.500">
            UIT-W2F
          </Text>
        </HStack>
        
        <HStack spacing={4}>
          <Text>Xin chào, {user?.username || 'User'}</Text>
        </HStack>
      </Flex>
      
      <Box ml={{ base: 0, md: 60 }} p="4">
        {children}
      </Box>
    </Box>
  );
};

export default Navigation; 