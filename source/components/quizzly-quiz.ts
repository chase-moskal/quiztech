
import {Dimensions} from "../interfaces.js"
import {QuizzlyResult} from "./quizzly-result.js"
import {QuizzlyQuestion} from "./quizzly-question.js"
import {Component, html, prop} from "../toolbox/component.js"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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

const _reset = Symbol("_reset")
const _events = Symbol("_events")
const _submit = Symbol("_submit")
const _result = Symbol("_result")
const _tabulate = Symbol("_tabulate")
const _tabulation = Symbol("_tabulation")
const _applyFrozen = Symbol("_applyFrozen")
const _applyResultLabel = Symbol("_applyResultLabel")
const _getResultElements = Symbol("_getResultElements")
const _getQuestionElements = Symbol("_getQuestionElements")
const _donePromiseInternals = Symbol("_donePromiseInternals")

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

const createCustomEvent = (eventName: string, detail: any = {}) => {
	return new CustomEvent(eventName, {
		detail,
		bubbles: true,
		composed: true
	})
}

export type Evaluator = (dimensions: Dimensions) => string
export type OnStart = (event: Event) => void
export type OnChoice = (event: Event) => void
export type OnError = (event: Event) => void
export type OnDone = (event: Event) => void

export class QuizzlyQuiz extends Component {
	@prop(String) dimensions: string = ""
	@prop(Boolean, true) frozen: boolean = false
	@prop(Boolean, true) loading: boolean = false
	@prop(Boolean, true) completed: boolean = false
	@prop(Function) evaluator: Evaluator = defaultEvaluator

	@prop(Function) onStart: OnStart = () => {}
	@prop(Function) onError: OnError = () => {}
	@prop(Function) onDone: OnDone = () => {}

	private readonly [_events] = {
		start: () => {
			this.loading = false
			const event = createCustomEvent("quiz-start")
			this.onStart(event)
			this.dispatchEvent(event)
		},
		error: (error: Error) => {
			this.loading = false
			const event = createCustomEvent("quiz-error", {error})
			this.onError(event)
			this.dispatchEvent(event)
			this[_donePromiseInternals].reject(error)
		},
		done: () => {
			this.loading = false
			const {tabulation, result} = this
			const event = createCustomEvent("quiz-done", {tabulation, result})
			this.onDone(event)
			this.dispatchEvent(event)
			this[_donePromiseInternals].resolve(event)
		}
	}

	readonly done: Promise<any> = new Promise((resolve, reject) => {
		this[_donePromiseInternals] = {resolve, reject}
	})

	private [_tabulation]: Dimensions = null
	get tabulation() { return this[_tabulation] }

	private [_result]: string
	get result() { return this[_result] }

	updated() {
		this[_tabulate]()
		this[_applyFrozen]()
	}

	firstUpdated() {
		this[_reset]()
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

	private [_applyFrozen]() {
		for (const question of this[_getQuestionElements]())
			question.disabled = this.frozen
	}

	private readonly [_submit] = async() => {
		this.frozen = true
		this[_applyResultLabel]()
		this.loading = true
		console.log("sleepyweepy")
		await sleep(2000)
		console.log("22")
		this[_events].done()
	}

	private readonly [_reset] = () => {
		this[_result] = ""
		this.frozen = false
		for (const question of this[_getQuestionElements]())
			question.reset()
		this.requestUpdate()
		this[_applyResultLabel]()
		this[_events].start()
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
		return this.loading ? html`

			<!-- LOADING STATE -->
			<div id="loading">
				loading
			</div>

		` : html`

			<!-- LOADED -->
			<slot @check=${this[_tabulate]}></slot>
			<div id="buttonbar">
				${this.frozen
					? null
					: html`
						<button
							id="submit-button"
							@click=${this[_submit]}
							?disabled=${!this.completed}
							>
								Submit Quiz for Results
						</button>
					`
				}
				<button
					id="reset-button"
					@click=${this[_reset]}
					>
						RESET
				</button>
			</div>
		`
	}
}
