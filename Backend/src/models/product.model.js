import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		price: {
			type: Number,
			required: true,
		},
		image: {
			type: String,
			required: true,
			default: "https://via.placeholder.com/150",
		},
		rank: {
			type: String,
			required: true,
			index: true,
			unique: true,
		},
	},
	{ timestamps: true },
);

const Product = mongoose.model("Product", ProductSchema);
export default Product;
