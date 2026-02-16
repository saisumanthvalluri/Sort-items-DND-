import express from "express";
import { createProduct, getProducts, updatePosition } from "../controllers/product.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/products:
 * get:
 * summary: Get all products with pagination
 * responses:
 * 200:
 * description: Success
 */
router.get("/", getProducts);
router.post("/", createProduct);
router.patch("/:id/position", updatePosition);

/**
 * @openapi
 * /api/products/seed:
 * post:
 * summary: Seed initial product data
 * responses:
 * 200:
 * description: Database Seeded
 */
// router.post("/seed", seedProducts);

export default router;
