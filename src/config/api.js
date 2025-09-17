// const API_BASE_URL = import.meta.env.PROD 
//   ? 'https://hrms-backend-xmlm.onrender.com'
//   : 'http://localhost:5000';

// export default API_BASE_URL;
// src/config/api.js - Fix for current setup
const API_BASE_URL = import.meta.env.PROD 
  ? 'http://157.180.123.32:5000'  // Direct backend access for now
  : 'http://localhost:5000';

export default API_BASE_URL;
