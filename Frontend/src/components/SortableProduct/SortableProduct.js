import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableProduct = ({ product, highlightId }) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: product._id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		padding: "10px",
		border: "1px solid #ccc",
		margin: "5px 0",
		cursor: "grab",
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`product-item ${highlightId === product._id ? "highlight" : ""}`}
			{...attributes}
			{...listeners}>
			<strong>{product.name}</strong> - price: {product.price}
		</div>
	);
};

export default SortableProduct;
