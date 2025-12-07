import axios from 'axios';

const api = axios.create({
	baseURL: import.meta.env.VITE_BACKEND_URL,
	withCredentials: true, // Crucial for sending HttpOnly cookies with requests
});

export default api;
