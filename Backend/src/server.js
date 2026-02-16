import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productRouter from "./routes/product.route.js";
import ConnectDB from "./lib/MongoDBConfig.js";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Swagger Definition
const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "MERN Drag & Drop API",
			version: "1.0.0",
			description: "API for paginated product drag-and-drop using Fractional Indexing",
		},
		servers: [
			{
				url: "http://localhost:5050",
			},
		],
	},
	apis: ["./server.js", "./routes/*.js"], // Path to the API docs (we'll put them in this file for now)
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @openapi
 * /health-check:
 * get:
 * description: Check if server is running
 * responses:
 * 200:
 * description: Returns a success message.
 */
app.get("/health-check", (req, res) => {
	res.json({ message: "health check, server is running!" });
});

/**
 * @openapi
 * /api/products/{id}/position:
 * patch:
 * summary: Update product rank for drag and drop
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * prevRank:
 * type: string
 * nullable: true
 * nextRank:
 * type: string
 * nullable: true
 * responses:
 * 200:
 * description: Product position updated successfully.
 */
// ... (rest of your app logic)

// Health Check
app.get("/health-check", (req, res) => {
	console.log("Health check hit!");
	return res.json({ message: "health check, server is running!" });
});

app.use("/api/products", productRouter);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
	ConnectDB();
});
