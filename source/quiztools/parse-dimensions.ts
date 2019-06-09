
import {Dimensions} from "../interfaces.js"

export const parseDimensions = (raw: string): Dimensions => {
	let obj = {}
	const names = raw.split(",").map(part => part.trim())
	for (const name of names) obj[name] = 0
	return obj
}
