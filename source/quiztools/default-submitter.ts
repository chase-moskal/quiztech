
import {sleep} from "./sleep.js"
import {Submitter} from "../interfaces.js"

export const defaultSubmitter: Submitter = async(tabulation) => {
	await sleep(0)
}
