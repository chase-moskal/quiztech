
export const parseAddCommand = (raw: string): {dimension: string; value: number}[] => {
	const additions = raw.split(",").map(a => a.trim())
	return additions.map(addition => {
		const [dimension, rawValue] = addition.split(":")
		const value = parseFloat(rawValue)
		return {dimension, value}
	})
}
