import axios from 'axios'

const defaultApiBaseUrl = import.meta.env.PROD
  ? 'https://placement-pbl-project.onrender.com/api'
  : 'http://localhost:5000/api'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl,
  withCredentials: true,
})

http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('pmAccessToken')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default http
