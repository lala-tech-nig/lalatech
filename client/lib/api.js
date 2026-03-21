const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_BASE_URL.replace('/api', '');

export { API_BASE_URL, BASE_URL };
export default API_BASE_URL;
