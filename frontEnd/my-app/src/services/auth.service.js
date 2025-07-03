import axios from 'axios';

// IMPORTANT: Replace with your actual .NET API URL
const API_BASE_URL = 'https://localhost:7082'; 

const AuthService = {
  // Function to get the JWT token from local storage
  getToken: () => {
    return localStorage.getItem('jwtToken');
  },

  // Function to set up Axios with the authorization header
  // This function returns an Axios instance that will automatically
  // include the JWT token in the 'Authorization' header for all requests.
  getAuthAxios: () => {
    const token = AuthService.getToken();
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`; // Add the Bearer token
    }
    return axios.create({
      baseURL: API_BASE_URL,
      headers: headers,
    });
  },

  // Function to clear the token (for logout)
  logout: () => {
    localStorage.removeItem('jwtToken');
  },
};

export default AuthService;
