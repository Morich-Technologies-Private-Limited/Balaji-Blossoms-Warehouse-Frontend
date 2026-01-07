import { LOGIN_URL } from "../constants/apiConstants";
import axios from 'axios';


const getNavLinkByRole = (userRole) => {
  const navLinks = {
    'ADMIN': '/admin-dashboard',
    'MANAGER': '/manager-dashboard', 
    'USER': '/user-dashboard'
  };
  return navLinks[userRole] || '/dashboard';
};

export const loginApi = async (userId, password) => {
  try {
    const response = await axios.post(LOGIN_URL, {
      userId,
      password
    });

    const data = response.data;
    
    if (data.status === 'SUCCESS' && data.data) {
      const user = data.payload;
      return {
        success: true,
        navLink: getNavLinkByRole(user.userRole)
      };
    } else {
      return {
        success: false,
        message: data.message || 'Login failed'
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Network error occurred'
    };
  }
};
