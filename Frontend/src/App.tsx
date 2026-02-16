import React, { useEffect, useState } from "react";
import axios from "axios";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableProduct from "./components/SortableProduct/SortableProduct";
import PageDropZone from "./components/PageDropZone/PageDropZone";
import "./App.css";

interface Product {
	_id: string;
	name: string;
	rank: number;
}

function App() {
	const [products, setProducts] = useState<Product[]>([]);
	const [page, setPage] = useState(1);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [highlightId, setHighlightId] = useState<string | null>(null);

	const [pagination, setPagination] = useState({
		totalItems: 0,
		totalPages: 0,
		currentPage: 0,
		limit: 0,
		hasNextPage: false,
		hasPrevPage: false,
	});

	const fetchProducts = async () => {
		const { data } = await axios.get(`http://localhost:5050/api/products?page=${page}&limit=5`);
		console.log(data);
		setPagination(data?.pagination || {});
		setProducts(
			data?.data?.toSorted((a: Product, b: Product) => (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0)) || [],
		);
	};

	useEffect(() => {
		fetchProducts();
	}, [page]);

	// const handleDragEnd = async (event: DragEndEvent) => {
	// 	const { active, over } = event;
	// 	if (!over || active.id === over.id) return;

	// 	const oldIndex = products?.findIndex((p) => p._id === active.id);
	// 	const newIndex = products?.findIndex((p) => p._id === over.id);

	// 	// Get the neighbors at the destination
	// 	const prevRank = products[newIndex - 1]?.rank || null;
	// 	const nextRank = products[newIndex]?.rank || null;

	// 	// 1. Optimistic Update (UI updates immediately)
	// 	const movedItem = products[oldIndex];
	// 	const remainingItems = products?.filter((p) => p._id !== active.id);
	// 	const updatedList = [...remainingItems.slice(0, newIndex), movedItem, ...remainingItems.slice(newIndex)];
	// 	setProducts(updatedList);

	// 	// 2. Persist to Backend
	// 	try {
	// 		await axios.patch(`http://localhost:5050/api/products/${active.id}/position`, {
	// 			prevRank,
	// 			nextRank,
	// 		});
	// 		// fetchProducts(); // Refresh to get precise server-side ranks
	// 	} catch (err) {
	// 		console.error("Failed to update position", err);
	// 		// fetchProducts(); // Revert on error
	// 	}
	// };

	// const handleDragEnd = async (event: DragEndEvent) => {
	// 	const { active, over } = event;
	// 	setActiveId(null);
	// 	if (!over) return;

	// 	const activeId = String(active.id);
	// 	const overId = String(over.id);

	// 	// CASE 1: Dropped on a PAGE DROP ZONE (Cross-page move)
	// 	if (overId.startsWith("page-")) {
	// 		const targetPage = Number(overId.split("-")[1]);

	// 		try {
	// 			await axios.patch(`http://localhost:5050/api/products/${activeId}/position`, {
	// 				targetPage,
	// 				targetIndex: 0,
	// 				limit: pagination.limit || 5,
	// 			});

	// 			setPage(targetPage);
	// 			setHighlightId(activeId);
	// 			setTimeout(() => setHighlightId(null), 1000);
	// 			await fetchProducts();
	// 		} catch (error) {
	// 			console.error("Cross-page move failed:", error);
	// 		}

	// 		return;
	// 	}

	// 	// CASE 2: Same-page reordering
	// 	if (activeId !== overId) {
	// 		const oldIndex = products.findIndex((p) => p._id === activeId);
	// 		const newIndex = products.findIndex((p) => p._id === overId);

	// 		if (oldIndex === -1 || newIndex === -1) return;

	// 		const movedItem = products[oldIndex];

	// 		// Create new array without moved item
	// 		const remainingItems = products.filter((p) => p._id !== activeId);

	// 		// Insert into new position
	// 		const updatedList = [...remainingItems.slice(0, newIndex), movedItem, ...remainingItems.slice(newIndex)];

	// 		setProducts(updatedList);

	// 		try {
	// 			// Determine neighbors for fractional ranking
	// 			const prevItem = updatedList[newIndex - 1] || null;
	// 			const nextItem = updatedList[newIndex + 1] || null;

	// 			await axios.patch(`http://localhost:5050/api/products/${activeId}/position`, {
	// 				prevRank: prevItem?.rank ?? null,
	// 				nextRank: nextItem?.rank ?? null,
	// 			});
	// 		} catch (error) {
	// 			console.error("Same-page reorder failed:", error);
	// 			await fetchProducts();
	// 		}
	// 	}
	// };

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveId(null);
		if (!over) return;

		const activeId = String(active.id);
		const overId = String(over.id);

		// 🔹 CASE 1: Cross-page move
		if (overId.startsWith("page-")) {
			const targetPage = Number(overId.split("-")[1]);

			try {
				await axios.patch(`http://localhost:5050/api/products/${activeId}/position`, {
					targetPage,
					targetIndex: 0,
					limit: pagination.limit || 5,
				});

				setPage(targetPage);
				setHighlightId(activeId);
				setTimeout(() => setHighlightId(null), 1000);
				await fetchProducts();
			} catch (error) {
				console.error("Cross-page move failed:", error);
			}

			return;
		}

		// 🔹 CASE 2: Same-page reorder
		if (activeId !== overId) {
			const oldIndex = products.findIndex((p) => p._id === activeId);
			const newIndex = products.findIndex((p) => p._id === overId);

			if (oldIndex === -1 || newIndex === -1) return;

			// Optimistic UI
			const movedItem = products[oldIndex];
			const remainingItems = products.filter((p) => p._id !== activeId);
			const updatedList = [...remainingItems.slice(0, newIndex), movedItem, ...remainingItems.slice(newIndex)];

			setProducts(updatedList);

			try {
				await axios.patch(`http://localhost:5050/api/products/${activeId}/position`, {
					targetPage: pagination.currentPage,
					targetIndex: newIndex,
					limit: pagination.limit || 5,
				});
			} catch (error) {
				console.error("Same-page reorder failed:", error);
				await fetchProducts();
			}
		}
	};

	const createProduct = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);
		const name = formData.get("name") as string;
		const price = Number(formData.get("price"));

		try {
			const { data } = await axios.post("http://localhost:5050/api/products", {
				name,
				price,
			});
			fetchProducts();
			alert("Product created successfully!");
		} catch (err) {
			console.error("Failed to create product", err);
		}
	};

	return (
		<div className="app-container">
			<div className="card">
				<h1 className="title">📦 Product Manager</h1>

				<DndContext
					collisionDetection={closestCenter}
					onDragStart={(event) => setActiveId(String(event.active.id))}
					onDragEnd={handleDragEnd}
					onDragCancel={() => setActiveId(null)}>
					<div className="product-list">
						<SortableContext items={products?.map((p) => p._id)} strategy={verticalListSortingStrategy}>
							{products?.map((product) => (
								<SortableProduct key={product._id} product={product} highlightId={highlightId} />
							))}
						</SortableContext>
					</div>

					{activeId && (
						<div className="move-container">
							<h4>Move To Page</h4>
							<div className="page-zones">
								{Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
									.filter((pageNumber) => pageNumber !== pagination.currentPage)
									.map((pageNumber) => (
										<PageDropZone key={pageNumber} pageNumber={pageNumber} />
									))}
							</div>
						</div>
					)}
				</DndContext>

				<div className="pagination">
					{pagination?.hasPrevPage && (
						<button onClick={() => setPage((p) => Math.max(1, p - 1))}>← Prev</button>
					)}

					<span className="page-info">
						Page {page} of {pagination.totalPages}
					</span>

					{pagination?.hasNextPage && <button onClick={() => setPage((p) => p + 1)}>Next →</button>}
				</div>

				<form onSubmit={createProduct} className="form">
					<input type="text" name="name" placeholder="Product Name" required />
					<input type="number" name="price" placeholder="Product Price" required />
					<button type="submit">Create Product</button>
				</form>
			</div>
		</div>
	);
}

export default App;
