import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const Api = axios.create({
	baseURL: API_URL,
});

export const getProducts = async (page: number) => {
	try {
		const response = await Api.get(`/products?page=${page}&limit=5`);
		return response.data;
	} catch (error) {
		console.error("Error fetching products:", error);
		throw error;
	}
};

export const updateProductRank = async (productId: string, targetPage: number, limit?: number) => {
	try {
		const response = await Api.patch(`/products/${productId}/position`, {
			targetPage,
			targetIndex: 0,
			limit: limit || 5,
		});
		return response.data;
	} catch (error) {
		console.error("Error updating product rank:", error);
		throw error;
	}
};

export const createProduct = async ({ name, price }: { name: string; price: number }) => {
	try {
		const response = await Api.post("/products", { name, price });
		return response.data;
	} catch (error) {
		console.error("Error creating product:", error);
		throw error;
	}
};
