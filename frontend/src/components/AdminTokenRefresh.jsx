import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';

const AdminTokenRefresh = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const refreshAdminToken = async () => {
    try {
      const response = await fetch('http://localhost:8000/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin12',
          password: '123456'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('admin_token', data.access_token);
        console.log('Admin token refreshed successfully');
        return true;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('admin_token');
      toast({
        title: 'Lỗi xác thực',
        description: 'Không thể làm mới token. Vui lòng đăng nhập lại.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/admin/login');
      return false;
    }
  };

  const checkTokenValidity = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      // Test token với API simple
      const response = await fetch('http://localhost:8000/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
        await refreshAdminToken();
      }
    } catch (error) {
      console.error('Token check failed:', error);
    }
  };

  useEffect(() => {
    // Check token on mount
    checkTokenValidity();

    // Set up periodic token check (every 5 minutes)
    const interval = setInterval(checkTokenValidity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null; // This is a utility component, no UI
};

export default AdminTokenRefresh; 