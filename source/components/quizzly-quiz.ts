
import {QuizzlyResult} from "./quizzly-result.js"
import {QuizzlyQuestion} from "./quizzly-question.js"
import {Dimensions} from "../interfaces.js"
import {Component, html, css, prop} from "../toolbox/component.js"

const parseDimensions = (raw: string): Dimensions => {
	let obj = {}
	const names = raw.split(",").map(part => part.trim())
	for (const name of names) obj[name] = 0
	return obj
}

const parseAddCommand = (raw: string) => {
	const additions = raw.split(",").map(a => a.trim())
	return additions.map(addition => {
		const [dimension, rawValue] = addition.split(":")
		const value = parseFloat(rawValue)
		return {dimension, value}
	})
}

const _submit = Symbol("_submit")
const _result = Symbol("_result")
const _tabulate = Symbol("_tabulate")
const _tabulation = Symbol("_tabulation")
const _applyResultLabel = Symbol("_applyResultLabel")
const _getResultElements = Symbol("_getResultElements")
const _getQuestionElements = Symbol("_getQuestionElements")

export const defaultEvaluator = (dimensions: Dimensions): string => {
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

export type Evaluator = (dimensions: Dimensions) => string

/**
 * Quiz
 * - a quiz that users can fill out
 * - it evaluates the result of the quiz clientside
 * - it asks you to submit your result before revealing it
 * - it displays statistics of other people's results
 * - every time a question is checked, it updates results and fires an event
 * - submit button freezes all answers, displays finalized result
 * - restart/unlock button exists
 */
export class QuizzlyQuiz extends Component {
	@prop(String) dimensions: string = ""
	@prop(Boolean, true) completed: boolean = false
	@prop(Function) evaluator: Evaluator = defaultEvaluator

	static get styles() {
		return css``
	}

	private [_tabulation]: Dimensions = null
	get tabulation() { return this[_tabulation] }

	private [_result]: string
	get result() { return this[_result] }

	updated() {
		this[_tabulate]()
	}

	firstUpdated() {
		this[_applyResultLabel]()
	}

	private readonly [_tabulate] = () => {
		const dimensions = parseDimensions(this.dimensions)
		const questions = this[_getQuestionElements]()
		let answered = 0

		for (const question of questions) {
			const choice = question.getCurrentChoice()
			if (choice) {
				if (choice.add) {
					const additions = parseAddCommand(choice.add)
					for (const {dimension, value} of additions) {
						if (!dimensions.hasOwnProperty(dimension))
							throw new Error(`can't add to unknown dimension "${dimension}"`)
						dimensions[dimension] += value
					}
				}
				answered += 1
			}
		}

		Object.freeze(dimensions)
		this[_tabulation] = dimensions
		this.completed = answered === questions.length
		this[_result] = this.evaluator(dimensions)
	}

	private readonly [_submit] = () => {
		this[_applyResultLabel]()
		console.log("submit")
	}

	private [_getQuestionElements](): QuizzlyQuestion[] {
		const slot: HTMLSlotElement = this.shadowRoot.querySelector("slot")
		if (!slot) return []
		const questions = <QuizzlyQuestion[]>slot.assignedElements()
			.filter(element => element.tagName.toLowerCase().includes("question"))
		return questions
	}

	private [_getResultElements](): QuizzlyResult[] {
		const slot: HTMLSlotElement = this.shadowRoot.querySelector("slot")
		if (!slot) return []
		const results = <QuizzlyResult[]>slot.assignedElements()
			.filter(element => element.tagName.toLowerCase().includes("result"))
		return results
	}

	private [_applyResultLabel]() {
		const label = this[_result]
		const resultElements = this[_getResultElements]()
		for (const result of resultElements) {
			if (this.completed) {
				result.hidden = result.label.toLowerCase() !== label.toLowerCase()
				if (!result.label && !label) result.hidden = false
			}
			else {
				result.hidden = true
				if (!result.label) result.hidden = false
			}
		}
	}

	render() {
		return html`
			<slot @check=${this[_tabulate]}></slot>
			<div id="buttonbar">
				<button
				 @click=${this[_submit]}
				 ?disabled=${!this.completed}
				 >
					Submit Quiz for Results
				</button>
			</div>
		`
	}
}
