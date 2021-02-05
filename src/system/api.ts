import axios from "axios";

const BASE_URL = window.APIURL || "http://localhost:9997"

const instance = axios.create({
    baseURL: BASE_URL
});

export default instance;