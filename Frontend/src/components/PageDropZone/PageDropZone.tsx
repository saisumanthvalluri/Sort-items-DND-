import { useDroppable } from "@dnd-kit/core";

interface Props {
	pageNumber: number;
}

export default function PageDropZone({ pageNumber }: Props) {
	const { setNodeRef, isOver } = useDroppable({
		id: `page-${pageNumber}`,
	});

	return (
		<div ref={setNodeRef} className="page-drop-zone">
			Page {pageNumber}
		</div>
	);
}
