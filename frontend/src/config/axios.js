import axios from 'axios'
const REACT_APP_BASE_URL="http://localhost:8000" ;

export const axiosi=axios.create({withCredentials:true,baseURL:REACT_APP_BASE_URL})