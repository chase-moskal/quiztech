
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

export interface QuizResultDetail {
	result: string
	tabulation: Dimensions
}

const eventSettings = {bubbles: true, composed: true}

export class StartEvent extends CustomEvent<{}> {
	constructor(detail: {} = {}) {
		super("quiz-start", {...eventSettings, detail})
	}
}

export class DoneEvent extends CustomEvent<QuizResultDetail> {
	constructor(detail: QuizResultDetail) {
		super("quiz-done", {...eventSettings, detail})
	}
}

export class ErrorEvent extends CustomEvent<{error: Error}> {
	constructor(error: Error) {
		super("quiz-error", {...eventSettings, detail: {error}})
	}
}

export type Evaluator = (dimensions: Dimensions) => string

export type QuizState = "interactive" | "loading" | "done" | "error"

/*

Actions

	SUBMIT
		interactive → loading → done
		interactive → loading → error

	RESET
		done → interactive
		error → interactive

*/

const _state = Symbol("_state")
const _events = Symbol("_events")
const _result = Symbol("_result")
const _complete = Symbol("_complete")
const _tabulate = Symbol("_tabulate")
const _resetAction = Symbol("_resetAction")
const _submitAction = Symbol("_submitAction")
const _renderMainSlot = Symbol("_renderMainSlot")
const _renderButtonBar = Symbol("_renderButtonBar")
const _makeDonePromise = Symbol("_makeDonePromise")
const _setSlottedStates = Symbol("_setSlottedStates")
const _handleChoiceCheck = Symbol("_handleChoiceCheck")
const _getResultElements = Symbol("_getResultElements")
const _getQuestionElements = Symbol("_getQuestionElements")
const _donePromiseInternals = Symbol("_donePromiseInternals")

export class QuizzlyQuiz extends Component {
	@prop(String) dimensions: string = ""
	@prop(Function) evaluator: Evaluator = defaultEvaluator

	@prop(Function) onStart = () => {}
	@prop(Function) onError = (error: Error) => {}
	@prop(Function) onDone = (detail: QuizResultDetail) => {}
	
	done: Promise<QuizResultDetail> = this[_makeDonePromise]()

	@prop(String) private [_result] = ""
	@prop(Boolean) private [_complete]: boolean = false
	@prop(String) private [_state]: QuizState = "interactive"

	updated() {
		this[_setSlottedStates]()

		const questions = this[_getQuestionElements]()
		const answers = questions
			.map(question => question.getCurrentChoice())
			.filter(choice => !!choice)
		this[_complete] = answers.length === questions.length
	}

	firstUpdated() {
		this[_resetAction]()
	}

	private [_makeDonePromise]() {
		return new Promise<QuizResultDetail>((resolve, reject) => {
			this[_donePromiseInternals] = {resolve, reject}
		})
	}

	private readonly [_events] = {
		start: () => {
			this[_state] = "interactive"
			const event = new StartEvent()
			this.onStart()
			this.dispatchEvent(event)
		},
		error: (error: Error) => {
			this[_state] = "error"
			const event = new ErrorEvent(error)
			this.onError(error)
			this.dispatchEvent(event)
			this[_donePromiseInternals].reject(error)
		},
		done: (detail: QuizResultDetail) => {
			this[_state] = "done"
			const event = new DoneEvent(detail)
			this.onDone(event.detail)
			this.dispatchEvent(event)
			this[_donePromiseInternals].resolve(event.detail)
		}
	}

	private readonly [_submitAction] = async() => {
		this[_state] = "loading"
		const detail = this[_tabulate]()
		await sleep(500)
		this[_events].done(detail)
	}

	private readonly [_resetAction] = () => {
		for (const questions of this[_getQuestionElements]())
			questions.reset()
		this[_events].start()
		this.requestUpdate()
	}

	private [_getQuestionElements](): QuizzlyQuestion[] {
		const slot: HTMLSlotElement = this.shadowRoot.querySelector("#main-slot")
		if (!slot) return []
		const questions = <QuizzlyQuestion[]>slot.assignedElements()
			.filter(element => element.tagName.toLowerCase().includes("question"))
		return questions
	}

	private [_getResultElements](): QuizzlyResult[] {
		const slot: HTMLSlotElement = this.shadowRoot.querySelector("#main-slot")
		if (!slot) return []
		const results = <QuizzlyResult[]>slot.assignedElements()
			.filter(element => element.tagName.toLowerCase().includes("result"))
		return results
	}

	private [_renderButtonBar]({submit, reset}: {submit: boolean; reset: boolean}) {
		return html`
			<div id="buttonbar">
				${submit
					? html`
						<button
							id="submit-button"
							@click=${this[_submitAction]}
							?disabled=${!this[_complete]}>
								Submit Quiz for Results
						</button>
					`
					: null}
				${reset
					? html`
						<button id="reset-button" @click=${this[_resetAction]}>
							RESET
						</button>
					`
					: null}
			</div>
		`
	}

	private [_tabulate](): QuizResultDetail {
		const tabulation = parseDimensions(this.dimensions)
		const questions = this[_getQuestionElements]()
		let answered = 0

		for (const question of questions) {
			const choice = question.getCurrentChoice()
			if (choice) {
				if (choice.add) {
					const additions = parseAddCommand(choice.add)
					for (const {dimension, value} of additions) {
						if (!tabulation.hasOwnProperty(dimension))
							throw new Error(`can't add to unknown dimension "${dimension}"`)
						tabulation[dimension] += value
					}
				}
				answered += 1
			}
		}

		const result = this.evaluator(tabulation)
		this[_result] = result
		Object.freeze(tabulation)

		return {tabulation, result}
	}

	private [_setSlottedStates]() {
		const questions = this[_getQuestionElements]()
		const results = this[_getResultElements]()

		switch (this[_state]) {
			case "interactive":
				for (const element of results) element.hidden = true
				for (const element of questions) element.hidden = false
				break
			case "loading":
				for (const element of results) element.hidden = true
				for (const element of questions) element.hidden = true
				break
			case "done":
				for (const element of results) {
					console.log(element.label, this[_result])
					element.hidden = element.label === this[_result]
						? false
						: true
				}
				for (const element of questions) element.hidden = true
				break
			case "error":
				for (const element of results) element.hidden = true
				for (const element of questions) element.hidden = true
				break
		}
	}

	private readonly [_handleChoiceCheck] = () => {
		this.requestUpdate()
	}

	private [_renderMainSlot]() {
		return html`<slot id="main-slot" @check=${this[_handleChoiceCheck]}></slot>`
	}

	render() {
		switch (this[_state]) {
			case "interactive": return html`
				${this[_renderMainSlot]()}
				${this[_renderButtonBar]({submit: true, reset: true})}
			`
			case "loading": return html`
				<div>loading, bruv!</div>
			`
			case "done": return html`
				${this[_renderMainSlot]()}
				${this[_renderButtonBar]({submit: false, reset: true})}
			`
			case "error": return html`
				<div>le error!!</div>
				${this[_renderButtonBar]({submit: false, reset: true})}
			`
		}
	}
}
