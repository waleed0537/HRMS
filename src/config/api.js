const API_BASE_URL = import.meta.env.PROD 
  ? 'https://hrms-backend-xmlm.onrender.com'
  : 'http://localhost:5000';

export default API_BASE_URL;