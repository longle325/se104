import { 
  Box, 
  HStack, 
  Image, 
  Text, 
  Button,
  useColorModeValue,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Container
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { FiHome, FiMessageSquare, FiEdit, FiUser, FiLogOut, FiSettings, FiLock } from "react-icons/fi";
import { useState, useEffect } from "react";
import logoImage from "../assets/auth/logo.png";
import NotificationCenter from "./NotificationCenter";
import MessageCenter from "./MessageCenter";
import { safeAvatarName } from "../utils/avatarUtils";

const Navigation = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  const menuItems = [
    { name: "Trang chủ", icon: FiHome, path: "/homepage" },
    { name: "Đăng tin", icon: FiEdit, path: "/dangtin" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
      {/* Top Navigation Bar */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={1000}
        bg={bg}
        borderBottom="1px"
        borderBottomColor={borderColor}
        shadow="sm"
      >
        <Container maxW="container.xl">
          <Flex h="16" alignItems="center" justifyContent="space-between">
            {/* Logo and Brand */}
            <HStack
              spacing={2}
              cursor="pointer"
              onClick={() => navigate("/homepage")}
            >
              <Image 
                src={logoImage} 
                alt="UIT Logo" 
                w="40px" 
                h="40px"
              />
              <Text fontSize="xl" fontWeight="bold" color="blue.500">
                UIT-W2F
              </Text>
            </HStack>

            {/* Navigation Menu - Desktop */}
            <HStack spacing={1} display={{ base: "none", md: "flex" }}>
              {menuItems.map((item) => (
                <IconButton
                  key={item.name}
                  icon={<item.icon size={20} />}
                  variant="ghost"
                  size="lg"
                  borderRadius="xl"
                  bg={location.pathname === item.path ? hoverBg : "transparent"}
                  color={location.pathname === item.path ? "blue.500" : "gray.600"}
                  _hover={{ bg: hoverBg }}
                  onClick={() => navigate(item.path)}
                  aria-label={item.name}
                  title={item.name}
                />
              ))}
            </HStack>

            {/* Right Side - Messages, Notifications, Profile */}
            <HStack spacing={2}>
              {/* Messages */}
              <MessageCenter />
              
              {/* Notifications */}
              <NotificationCenter />

              {/* Profile Menu */}
              <Menu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  size="lg"
                  borderRadius="xl"
                  _hover={{ bg: hoverBg }}
                  px={3}
                  h="40px"
                  leftIcon={
                    <Avatar 
                      size="sm" 
                                              name={safeAvatarName(user?.full_name || user?.username)} 
                      src={user?.avatar_url ? `http://localhost:8000${user.avatar_url}` : undefined}
                      w="32px"
                      h="32px"
                    />
                  }
                >
                  <Text 
                    display={{ base: "none", md: "block" }}
                    fontSize="md"
                    fontWeight="medium"
                    color="gray.700"
                    _dark={{ color: "gray.200" }}
                  >
                    {user?.full_name || user?.username || 'User'}
                  </Text>
                </MenuButton>
                <MenuList>
                  <MenuItem
                    icon={<FiUser />}
                    onClick={() => navigate(`/profile/${user?.username || 'me'}`)}
                  >
                    Trang cá nhân
                  </MenuItem>
                  <MenuItem 
                    icon={<FiSettings />}
                    onClick={() => navigate('/edit-profile')}
                  >
                    Sửa hồ sơ cá nhân
                  </MenuItem>
                  <MenuItem 
                    icon={<FiLock />}
                    onClick={() => navigate('/change-password')}
                  >
                    Đổi mật khẩu
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    icon={<FiLogOut />}
                    onClick={handleLogout}
                    color="red.500"
                  >
                    Đăng xuất
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </Container>
      </Box>
      
      {/* Main Content */}
      <Box pt="16" pb={{ base: "20", md: "0" }} minH="100vh">
        {children}
      </Box>

      {/* Mobile Bottom Navigation */}
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={1000}
        bg={bg}
        borderTop="1px"
        borderTopColor={borderColor}
        display={{ base: "block", md: "none" }}
        shadow="lg"
      >
        <HStack spacing={0} justify="space-around" py={2}>
          {menuItems.map((item) => (
            <IconButton
              key={item.name}
              icon={<item.icon size={24} />}
              variant="ghost"
              size="lg"
              color={location.pathname === item.path ? "blue.500" : "gray.600"}
              _hover={{ bg: hoverBg }}
              onClick={() => navigate(item.path)}
              aria-label={item.name}
              borderRadius="xl"
              flex={1}
            />
          ))}
          <IconButton
            icon={<FiMessageSquare size={24} />}
            variant="ghost"
            size="lg"
            color={location.pathname === "/chat" ? "blue.500" : "gray.600"}
            _hover={{ bg: hoverBg }}
            onClick={() => navigate("/chat")}
            aria-label="Chat"
            borderRadius="xl"
            flex={1}
          />
        </HStack>
      </Box>
    </Box>
  );
};

export default Navigation; 