import {
  Box,
  Image,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  HStack,
  Text,
  Center,
  Spinner
} from "@chakra-ui/react";
import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const ImageGallery = ({ images, title = "Ảnh", height = "300px" }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState({});

  if (!images || images.length === 0) return null;

  const openModal = (index) => {
    setCurrentImageIndex(index);
    onOpen();
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleImageLoad = (index) => {
    setImageLoading(prev => ({ ...prev, [index]: false }));
  };

  const handleImageLoadStart = (index) => {
    setImageLoading(prev => ({ ...prev, [index]: true }));
  };

  const renderImageGrid = () => {
    const imageCount = images.length;

    if (imageCount === 1) {
      // Single image - full width
      return (
        <Box
          position="relative"
          overflow="hidden"
          borderRadius="md"
          cursor="pointer"
          onClick={() => openModal(0)}
          _hover={{ transform: "scale(1.02)" }}
          transition="transform 0.3s ease"
        >
          {imageLoading[0] && (
            <Center position="absolute" inset={0} bg="gray.100" zIndex={1}>
              <Spinner color="blue.500" />
            </Center>
          )}
          <Image
            src={`http://localhost:8000${images[0]}`}
            alt={`${title} 1`}
            w="full"
            h={height}
            objectFit="cover"
            borderRadius="md"
            onLoad={() => handleImageLoad(0)}
            onLoadStart={() => handleImageLoadStart(0)}
            fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjdmYWZjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPsSQYW5nIHThuqNpIGjDrG5oIGFuaDwvdGV4dD48L3N2Zz4="
          />
        </Box>
      );
    }

    if (imageCount === 2) {
      // Two images - side by side
      return (
        <SimpleGrid columns={2} spacing={2}>
          {images.slice(0, 2).map((image, index) => (
            <Box
              key={index}
              position="relative"
              overflow="hidden"
              borderRadius="md"
              cursor="pointer"
              onClick={() => openModal(index)}
              _hover={{ transform: "scale(1.02)" }}
              transition="transform 0.3s ease"
            >
              {imageLoading[index] && (
                <Center position="absolute" inset={0} bg="gray.100" zIndex={1}>
                  <Spinner color="blue.500" size="sm" />
                </Center>
              )}
              <Image
                src={`http://localhost:8000${image}`}
                alt={`${title} ${index + 1}`}
                w="full"
                h="200px"
                objectFit="cover"
                borderRadius="md"
                onLoad={() => handleImageLoad(index)}
                onLoadStart={() => handleImageLoadStart(index)}
                fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjdmYWZjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFuaDwvdGV4dD48L3N2Zz4="
              />
            </Box>
          ))}
        </SimpleGrid>
      );
    }

    if (imageCount === 3) {
      // Three images - one large, two small
      return (
        <SimpleGrid columns={2} spacing={2} h={height}>
          <Box
            position="relative"
            overflow="hidden"
            borderRadius="md"
            cursor="pointer"
            onClick={() => openModal(0)}
            _hover={{ transform: "scale(1.02)" }}
            transition="transform 0.3s ease"
          >
            {imageLoading[0] && (
              <Center position="absolute" inset={0} bg="gray.100" zIndex={1}>
                <Spinner color="blue.500" />
              </Center>
            )}
            <Image
              src={`http://localhost:8000${images[0]}`}
              alt={`${title} 1`}
              w="full"
              h="full"
              objectFit="cover"
              borderRadius="md"
              onLoad={() => handleImageLoad(0)}
              onLoadStart={() => handleImageLoadStart(0)}
              fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjdmYWZjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFuaCAxPC90ZXh0Pjwvc3ZnPg=="
            />
          </Box>
          <Box display="flex" flexDirection="column" gap={2}>
            {images.slice(1, 3).map((image, index) => (
              <Box
                key={index + 1}
                position="relative"
                overflow="hidden"
                borderRadius="md"
                cursor="pointer"
                onClick={() => openModal(index + 1)}
                _hover={{ transform: "scale(1.02)" }}
                transition="transform 0.3s ease"
                flex={1}
              >
                {imageLoading[index + 1] && (
                  <Center position="absolute" inset={0} bg="gray.100" zIndex={1}>
                    <Spinner color="blue.500" size="sm" />
                  </Center>
                )}
                <Image
                  src={`http://localhost:8000${image}`}
                  alt={`${title} ${index + 2}`}
                  w="full"
                  h="full"
                  objectFit="cover"
                  borderRadius="md"
                  onLoad={() => handleImageLoad(index + 1)}
                  onLoadStart={() => handleImageLoadStart(index + 1)}
                  fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjdmYWZjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFuaDwvdGV4dD48L3N2Zz4="
                />
              </Box>
            ))}
          </Box>
        </SimpleGrid>
      );
    }

    // Four or more images - 2x2 grid with "more" indicator
    return (
      <SimpleGrid columns={2} spacing={2} h={height}>
        {images.slice(0, 3).map((image, index) => (
          <Box
            key={index}
            position="relative"
            overflow="hidden"
            borderRadius="md"
            cursor="pointer"
            onClick={() => openModal(index)}
            _hover={{ transform: "scale(1.02)" }}
            transition="transform 0.3s ease"
          >
            {imageLoading[index] && (
              <Center position="absolute" inset={0} bg="gray.100" zIndex={1}>
                <Spinner color="blue.500" size="sm" />
              </Center>
            )}
            <Image
              src={`http://localhost:8000${image}`}
              alt={`${title} ${index + 1}`}
              w="full"
              h="full"
              objectFit="cover"
              borderRadius="md"
              onLoad={() => handleImageLoad(index)}
              onLoadStart={() => handleImageLoadStart(index)}
              fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjdmYWZjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFuaDwvdGV4dD48L3N2Zz4="
            />
          </Box>
        ))}
        <Box
          position="relative"
          overflow="hidden"
          borderRadius="md"
          cursor="pointer"
          onClick={() => openModal(3)}
          _hover={{ transform: "scale(1.02)" }}
          transition="transform 0.3s ease"
        >
          {imageLoading[3] && (
            <Center position="absolute" inset={0} bg="gray.100" zIndex={1}>
              <Spinner color="blue.500" size="sm" />
            </Center>
          )}
          <Image
            src={`http://localhost:8000${images[3]}`}
            alt={`${title} 4`}
            w="full"
            h="full"
            objectFit="cover"
            borderRadius="md"
            onLoad={() => handleImageLoad(3)}
            onLoadStart={() => handleImageLoadStart(3)}
            fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjdmYWZjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFuaDwvdGV4dD48L3N2Zz4="
          />
          {imageCount > 4 && (
            <Center
              position="absolute"
              inset={0}
              bg="blackAlpha.600"
              color="white"
              fontSize="xl"
              fontWeight="bold"
            >
              +{imageCount - 4}
            </Center>
          )}
        </Box>
      </SimpleGrid>
    );
  };

  return (
    <>
      {renderImageGrid()}
      
      {/* Modal for enlarged view */}
      <Modal isOpen={isOpen} onClose={onClose} size="full" isCentered>
        <ModalOverlay bg="blackAlpha.900" />
        <ModalContent 
          bg="transparent" 
          shadow="none" 
          maxW="100vw" 
          maxH="100vh"
          m={0}
          borderRadius={0}
        >
          <ModalCloseButton
            position="fixed"
            top={4}
            right={4}
            bg="blackAlpha.700"
            color="white"
            _hover={{ bg: "blackAlpha.900" }}
            size="lg"
            zIndex={1000}
            borderRadius="full"
          />
          
          <Box 
            position="relative" 
            w="100vw" 
            h="100vh" 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
            p={4}
          >
            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <IconButton
                  icon={<FiChevronLeft />}
                  position="fixed"
                  left={4}
                  top="50%"
                  transform="translateY(-50%)"
                  bg="blackAlpha.700"
                  color="white"
                  _hover={{ bg: "blackAlpha.900" }}
                  size="lg"
                  zIndex={1000}
                  onClick={prevImage}
                  aria-label="Previous image"
                  borderRadius="full"
                />
                <IconButton
                  icon={<FiChevronRight />}
                  position="fixed"
                  right={4}
                  top="50%"
                  transform="translateY(-50%)"
                  bg="blackAlpha.700"
                  color="white"
                  _hover={{ bg: "blackAlpha.900" }}
                  size="lg"
                  zIndex={1000}
                  onClick={nextImage}
                  aria-label="Next image"
                  borderRadius="full"
                />
              </>
            )}
            
            {/* Main image */}
            <Image
              src={`http://localhost:8000${images[currentImageIndex]}`}
              alt={`${title} ${currentImageIndex + 1}`}
              maxW="calc(100vw - 80px)"
              maxH="calc(100vh - 80px)"
              objectFit="contain"
              borderRadius="md"
              loading="eager"
            />
            
            {/* Image counter */}
            {images.length > 1 && (
              <Box
                position="fixed"
                bottom={6}
                left="50%"
                transform="translateX(-50%)"
                bg="blackAlpha.700"
                color="white"
                px={4}
                py={2}
                borderRadius="full"
                fontSize="md"
                fontWeight="medium"
                zIndex={1000}
              >
                {currentImageIndex + 1} / {images.length}
              </Box>
            )}
          </Box>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ImageGallery; 