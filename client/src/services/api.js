import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.0.7:5001/api",
});

export default API;