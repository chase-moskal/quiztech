
export interface Dimensions {
	[dimension: string]: number
}

export interface Tabulation {
	resultLabel: string
	dimensions: Dimensions
}

export type Evaluator = (dimensions: Dimensions) => string
export type Submitter = (tabulation: Tabulation) => Promise<any>
