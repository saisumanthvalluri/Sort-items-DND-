import Product from "../models/product.model.js";
import { generateKeyBetween } from "fractional-indexing";
import { rebalanceRanksInternal } from "../utils/methods.js";
import mongoose from "mongoose";

export const getProducts = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const [products, totalItems] = await Promise.all([
			Product.find().sort({ rank: 1 }).skip(skip).limit(limit),
			Product.countDocuments(),
		]);

		const totalPages = Math.ceil(totalItems / limit);

		res.status(200).json({
			success: true,
			data: products,
			pagination: {
				totalItems,
				totalPages,
				currentPage: page,
				limit,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1,
			},
		});
	} catch (error) {
		console.error("Fetch Error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching products",
		});
	}
};

// export const createProduct = async (req, res) => {
// 	const { name, price } = req.body;
// 	if (!name || !price) {
// 		return res.status(400).json({ message: "Name, price are required" });
// 	}

// 	try {
// 		const lastProduct = await Product.findOne().sort({ rank: -1 });
// 		const newRank = generateKeyBetween(lastProduct ? lastProduct.rank : null, null);
// 		console.log(newRank, "uiuo");
// 		const newProduct = new Product({
// 			name,
// 			price,
// 			rank: newRank,
// 		});
// 		const product = await newProduct.save();
// 		res.status(201).json({ message: "Product created successfully", product });
// 	} catch (error) {
// 		return res.status(500).json({ message: "Internal server error", error: error.message });
// 	}
// };

export const createProduct = async (req, res) => {
	const session = await mongoose.startSession();

	try {
		const { name, price } = req.body;

		if (!name || price == null) {
			return res.status(400).json({
				message: "Name and price are required",
			});
		}

		session.startTransaction();

		const products = await Product.find().sort({ rank: 1 }).session(session);

		const lastProduct = products.length ? products[products.length - 1] : null;

		let newRank = generateKeyBetween(lastProduct ? lastProduct.rank : null, null);

		// Safety: prevent rank collision
		if (!newRank || newRank === lastProduct?.rank) {
			await rebalanceRanksInternal(session);

			const refreshed = await Product.find().sort({ rank: 1 }).session(session);

			const newLast = refreshed.length ? refreshed[refreshed.length - 1] : null;

			newRank = generateKeyBetween(newLast ? newLast.rank : null, null);
		}

		const newProduct = new Product({
			name,
			price,
			rank: newRank,
		});

		const product = await newProduct.save({ session });

		await session.commitTransaction();
		session.endSession();

		res.status(201).json({
			message: "Product created successfully",
			product,
		});
	} catch (error) {
		await session.abortTransaction();
		session.endSession();

		// duplicate rank edge case
		if (error.code === 11000) {
			return res.status(409).json({
				message: "Rank conflict detected. Please retry.",
			});
		}

		res.status(500).json({
			message: "Internal server error",
			error: error.message,
		});
	}
};

// export const updatePosition = async (req, res) => {
// 	try {
// 		const { id } = req.params;
// 		const { prevRank, nextRank } = req.body;
// 		const pRank = prevRank === "" ? null : prevRank;
// 		const nRank = nextRank === "" ? null : nextRank;

// 		const newRank = generateKeyBetween(pRank, nRank);

// 		const updatedProduct = await Product.findByIdAndUpdate(id, { rank: newRank }, { new: true });

// 		if (!updatedProduct) {
// 			return res.status(404).json({ message: "Product not found" });
// 		}

// 		res.json({
// 			message: "Position updated successfully",
// 			data: updatedProduct,
// 		});
// 	} catch (error) {
// 		console.error("DND Error:", error);
// 		res.status(500).json({ message: "Error updating position" });
// 	}
// };

// export const updatePosition = async (req, res) => {
// 	try {
// 		const { id } = req.params;
// 		const { targetPage, targetIndex, limit } = req.body;

// 		const skip = (targetPage - 1) * limit;

// 		const pageItems = await Product.find().sort({ rank: 1 }).skip(skip).limit(limit);

// 		const prevItem = pageItems[targetIndex - 1] || null;
// 		const nextItem = pageItems[targetIndex] || null;

// 		const newRank = generateKeyBetween(prevItem?.rank ?? null, nextItem?.rank ?? null);

// 		const updatedProduct = await Product.findByIdAndUpdate(id, { rank: newRank }, { new: true });

// 		res.json({
// 			message: "Position updated successfully",
// 			data: updatedProduct,
// 		});
// 	} catch (error) {
// 		console.error("DND Error:", error);
// 		res.status(500).json({ message: "Error updating position" });
// 	}
// };

export const updatePosition = async (req, res) => {
	const session = await mongoose.startSession();

	try {
		const { id } = req.params;
		const { targetPage, targetIndex, limit } = req.body;

		if (!targetPage || targetIndex == null || !limit) {
			return res.status(400).json({
				message: "targetPage, targetIndex and limit are required",
			});
		}

		session.startTransaction();

		const skip = (targetPage - 1) * limit;

		// Fetch full sorted list inside transaction
		const sortedProducts = await Product.find().sort({ rank: 1 }).session(session);

		// Remove the item being moved from calculation
		const filtered = sortedProducts.filter((item) => item._id.toString() !== id);

		// Calculate actual insertion position globally
		const globalIndex = skip + targetIndex;

		const prevItem = filtered[globalIndex - 1] || null;
		const nextItem = filtered[globalIndex] || null;

		if (prevItem && nextItem && prevItem.rank >= nextItem.rank) {
			throw new Error("Invalid rank boundaries detected");
		}

		let newRank = generateKeyBetween(prevItem?.rank ?? null, nextItem?.rank ?? null);

		// 🚨 Space exhaustion detection
		if (!newRank || newRank === prevItem?.rank || newRank === nextItem?.rank) {
			await rebalanceRanksInternal(session);

			// refetch after rebalance
			const refreshed = await Product.find().sort({ rank: 1 }).session(session);

			const refreshedFiltered = refreshed.filter((item) => item._id.toString() !== id);

			const refreshedPrev = refreshedFiltered[globalIndex - 1] || null;
			const refreshedNext = refreshedFiltered[globalIndex] || null;

			newRank = generateKeyBetween(refreshedPrev?.rank ?? null, refreshedNext?.rank ?? null);
		}

		const updatedProduct = await Product.findByIdAndUpdate(id, { rank: newRank }, { new: true, session });

		await session.commitTransaction();
		session.endSession();

		res.json({
			message: "Position updated safely",
			data: updatedProduct,
		});
	} catch (error) {
		await session.abortTransaction();
		session.endSession();

		console.error("DND Error:", error);

		if (error.code === 11000) {
			return res.status(409).json({
				message: "Rank conflict detected. Please retry.",
			});
		}

		res.status(500).json({
			message: "Error updating position",
		});
	}
};
