
import {TemplateResult} from "lit-element"

import {Dimensions} from "../interfaces.js"
import {QuizzlyResult} from "./quizzly-result.js"
import {QuizzlyQuestion} from "./quizzly-question.js"
import {Component, html, prop} from "../toolbox/component.js"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface Tabulation {
	resultLabel: string
	dimensions: Dimensions
}

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

export type Evaluator = (dimensions: Dimensions) => string
export type Submitter = (tabulation: Tabulation) => Promise<any>

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

export const defaultSubmitter: Submitter = async(tabulation) => {
	await sleep(500)
}

const eventSettings = {bubbles: true, composed: true}

export class StartEvent extends CustomEvent<{}> {
	constructor(detail: {} = {}) {
		super("quiz-start", {...eventSettings, detail})
	}
}

export class DoneEvent extends CustomEvent<Tabulation> {
	constructor(detail: Tabulation) {
		super("quiz-done", {...eventSettings, detail})
	}
}

export class ErrorEvent extends CustomEvent<{error: Error}> {
	constructor(error: Error) {
		super("quiz-error", {...eventSettings, detail: {error}})
	}
}

/*

QUIZZLY-QUIZ
- slots the intro, questions, and results
- can be in "question", "loading", "result", or "error" state
	- in question mode, display the next unanswered question
	- in loading mode, show loading spinner
	- in result mode, show the relevant result
	- in error mode, say there's an error
- renders an action bar, based on the current state
- provides quiz-start quiz-done and quiz-error events
- accepts an evaluator function
- accepts a submitter function
- updates whenever choice is checked

*/

export class QuizzlyQuiz extends Component {
	@prop(String) dimensions: string = ""
	@prop(Function) evaluator: Evaluator = defaultEvaluator
	@prop(Function) submitter: Submitter = defaultSubmitter

	private state: string = "question"
	private questionIndex: number = 0
	private resultLabel: string = ""

	updated() {
		const {questions, results} = this.getSlottedElements()

		// start by hiding all of the questions and results
		for (const element of [...questions, ...results]) element.hidden = true

		// display the correct question
		questions.forEach((question, questionIndex) => {
			if (this.state === "question" && questionIndex === this.questionIndex)
				question.hidden = false
		})

		// display the correct result
		for (const result of results) {
			if (this.state === "result" && result.label === this.resultLabel)
				result.hidden = false
		}
	}

	firstUpdated() {
		this.actions.reset()
	}

	private getSlottedElements() {
		const slot: HTMLSlotElement = this.shadowRoot.querySelector("slot")
		if (!slot) return {elements: [], questions: [], results: []}
		const elements = slot.assignedElements()

		const questions = <QuizzlyQuestion[]>elements
			.filter(element => element.tagName.toLowerCase().includes("question"))

		const results = <QuizzlyResult[]>elements
			.filter(element => element.tagName.toLowerCase().includes("result"))

		return {elements, questions, results}
	}

	private actions = {
		next: () => {
			this.questionIndex += 1
			this.requestUpdate()
		},
		back: () => {
			this.questionIndex -= 1
			this.requestUpdate()
		},
		submit: async() => {
			this.state = "loading"
			try {
				const tabulation = this.tabulate()
				const response = await this.submitter(tabulation)
				this.resultLabel = tabulation.resultLabel
				this.state = "result"
				console.log("quiz submitted!", response)
			}
			catch (error) {
				this.state = "error"
				console.error("ERROR!", error)
			}
			this.requestUpdate()
		},
		reset: () => {
			const {questions} = this.getSlottedElements()
			for (const question of questions) question.reset()
			this.state = "question"
			this.questionIndex = 0
			this.resultLabel = ""
			this.requestUpdate()
		}
	}

	private tabulate(): Tabulation {
		const dimensions = parseDimensions(this.dimensions)
		const {questions} = this.getSlottedElements()
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

		if (answered !== questions.length) throw new Error("cannot tabulate incomplete quiz")

		const resultLabel = this.evaluator(dimensions)
		this.resultLabel = resultLabel
		Object.freeze(dimensions)

		return {dimensions, resultLabel}
	}

	private renderActionBar() {
		const wrap = (inner: TemplateResult) => html`<div class="actionbar">${inner}</div>`
		const {questions} = this.getSlottedElements()

		if (this.state === "question") {
			const getQuestion = (index: number) => {
				return (index >= 0 && index < questions.length)
					? questions[index]
					: null
			}
			const question = getQuestion(this.questionIndex)
			if (!question) return null
			const choice = question.getCurrentChoice()
			const lastQuestion = getQuestion(this.questionIndex - 1)
			const nextQuestion = getQuestion(this.questionIndex + 1)
			return wrap(html`
				${lastQuestion
					? html`<button @click=${this.actions.back}>back</button>`
					: null}
				${nextQuestion
					? html`<button ?disabled=${!choice} @click=${this.actions.next}>next</button>`
					: html`<button ?disabled=${!choice} @click=${this.actions.submit}>submit</button>`}
			`)
		}
		else if (this.state === "loading") {
			return null
		}
		else if (this.state === "error" || this.state === "result") {
			return wrap(html`
				<button @click=${this.actions.reset}>reset</button>
			`)
		}
		else throw new Error(`unknown state "${this.state}"`)
	}

	private handleChoiceCheck = () => {
		this.requestUpdate()
	}

	render() {
		return html`
			<slot id="main-slot" @check=${this.handleChoiceCheck}></slot>
			${this.renderActionBar()}
		`
	}
}

