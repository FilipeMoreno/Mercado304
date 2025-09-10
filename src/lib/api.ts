// src/lib/api.ts
const API_BASE_URL =
	process.env.NODE_ENV === "development"
		? "http://localhost:3000/api"
		: process.env.NEXT_PUBLIC_API_URL;

console.log("API: ", process.env.NODE_ENV);

export default API_BASE_URL;
