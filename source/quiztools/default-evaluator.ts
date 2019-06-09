
import {Evaluator, Dimensions} from "../interfaces.js"

export const defaultEvaluator: Evaluator = (dimensions: Dimensions): string => {
	let best: string = null
	let bestValue: number = -Infinity
	for (const dimension of Object.keys(dimensions)) {
		const value = dimensions[dimension]
		if (value > bestValue) {
			best = dimension
			bestValue = value
		}
	}
	return best
}
