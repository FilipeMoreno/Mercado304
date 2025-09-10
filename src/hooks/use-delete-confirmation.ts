import { useState } from "react";

interface DeleteState<T> {
	show: boolean;
	item: T | null;
}

export function useDeleteConfirmation<T>() {
	const [deleteState, setDeleteState] = useState<DeleteState<T>>({
		show: false,
		item: null,
	});

	const openDeleteConfirm = (item: T) => {
		setDeleteState({ show: true, item });
	};

	const closeDeleteConfirm = () => {
		setDeleteState({ show: false, item: null });
	};

	const resetDeleteConfirm = () => {
		setDeleteState({ show: false, item: null });
	};

	return {
		deleteState,
		openDeleteConfirm,
		closeDeleteConfirm,
		resetDeleteConfirm,
	};
}
