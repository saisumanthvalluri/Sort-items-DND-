export async function rebalanceRanksInternal(session) {
	const products = await Product.find().sort({ rank: 1 }).session(session);

	let prev = null;

	for (const product of products) {
		const newRank = generateKeyBetween(prev, null);
		product.rank = newRank;
		await product.save({ session });
		prev = newRank;
	}
}
