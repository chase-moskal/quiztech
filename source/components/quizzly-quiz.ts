
import {TemplateResult} from "lit-element"

import {Tabulation, Evaluator, Submitter} from "../interfaces.js"

import {parseDimensions} from "../quiztools/parse-dimensions.js"
import {parseAddCommand} from "../quiztools/parse-add-command.js"
import {defaultEvaluator} from "../quiztools/default-evaluator.js"
import {defaultSubmitter} from "../quiztools/default-submitter.js"

import {QuizDoneEvent} from "../events/quiz-done-event.js"
import {QuizStartEvent} from "../events/quiz-start-event.js"
import {QuizErrorEvent} from "../events/quiz-error-event.js"

import {QuizzlyResult} from "./quizzly-result.js"
import {QuizzlyQuestion} from "./quizzly-question.js"
import {Component, html, prop} from "../toolbox/component.js"

export const _state = Symbol()
export const _actions = Symbol()
export const _tabulate = Symbol()
export const _resultLabel = Symbol()
export const _questionIndex = Symbol()
export const _renderActionBar = Symbol()
export const _handleChoiceCheck = Symbol()
export const _getSlottedElements = Symbol()
export const _donePromiseInternals = Symbol()

export class QuizzlyQuiz extends Component {
	@prop(String) dimensions: string = ""
	@prop(Boolean, true) once: boolean = false
	@prop(Function) evaluator: Evaluator = defaultEvaluator
	@prop(Function) submitter: Submitter = defaultSubmitter

	@prop(Function) onQuizStart = () => {}
	@prop(Function) onQuizDone = (tabulation: Tabulation) => {}
	@prop(Function) onQuizError = (error: Error) => {}

	@prop(String) private [_state]: string = "question"
	@prop(Number) private [_questionIndex]: number = 0
	@prop(String) private [_resultLabel]: string = ""

	private [_donePromiseInternals]: {resolve: any; reject: any}
	done = new Promise((resolve, reject) => {
		this[_donePromiseInternals] = {resolve, reject}
	})

	updated() {
		const {questions, results} = this[_getSlottedElements]()

		// start by hiding all of the questions and results
		for (const element of [...questions, ...results]) element.hidden = true

		// display the correct question
		questions.forEach((question, questionIndex) => {
			if (this[_state] === "question" && questionIndex === this[_questionIndex])
				question.hidden = false
		})

		// display the correct result
		for (const result of results) {
			if (this[_state] === "result" && result.label === this[_resultLabel])
				result.hidden = false
		}
	}

	firstUpdated() {
		this[_actions].reset()
		this.removeAttribute("initially-hidden")
	}

	render() {
		return html`
			<slot id="main-slot" @check=${this[_handleChoiceCheck]}></slot>
			${this[_state] === "loading"
				? html`<div class="loading">...loading...</div>`
				: null}
			${this[_state] === "error"
				? html`<div class="error">ERROR</div>`
				: null}
			${this[_renderActionBar]()}
		`
	}

	private [_getSlottedElements]() {
		const slot: HTMLSlotElement = this.shadowRoot.querySelector("slot")
		if (!slot) return {elements: [], questions: [], results: []}
		const elements = slot.assignedElements()

		const questions = <QuizzlyQuestion[]>elements
			.filter(element => element.tagName.toLowerCase().includes("question"))

		const results = <QuizzlyResult[]>elements
			.filter(element => element.tagName.toLowerCase().includes("result"))

		return {elements, questions, results}
	}

	private [_actions] = {
		next: () => {
			this[_questionIndex] += 1
			this.requestUpdate()
		},
		back: () => {
			this[_questionIndex] -= 1
			this.requestUpdate()
		},
		submit: async() => {
			this[_state] = "loading"
			try {
				const tabulation = this[_tabulate]()
				const response = await this.submitter(tabulation)
				this[_resultLabel] = tabulation.resultLabel
				this[_state] = "result"

				this.dispatchEvent(new QuizDoneEvent(tabulation))
				this.onQuizDone(tabulation)
				this[_donePromiseInternals].resolve(tabulation)
			}
			catch (error) {
				this[_state] = "error"

				this.dispatchEvent(new QuizErrorEvent(error))
				this.onQuizError(error)
				this[_donePromiseInternals].reject(error)
			}
			this.requestUpdate()
		},
		reset: () => {
			const {questions} = this[_getSlottedElements]()
			for (const question of questions) question.reset()
			this[_state] = "question"
			this[_questionIndex] = 0
			this[_resultLabel] = ""
			this.requestUpdate()

			this.dispatchEvent(new QuizStartEvent())
			this.onQuizStart()
		}
	}

	private [_tabulate](): Tabulation {
		const dimensions = parseDimensions(this.dimensions)
		const {questions} = this[_getSlottedElements]()
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
		this[_resultLabel] = resultLabel
		Object.freeze(dimensions)

		return {dimensions, resultLabel}
	}

	private [_renderActionBar]() {
		const wrap = (inner: TemplateResult) => html`<div class="actionbar">${inner}</div>`
		const {questions} = this[_getSlottedElements]()

		if (this[_state] === "question") {
			const getQuestion = (index: number) => {
				return (index >= 0 && index < questions.length)
					? questions[index]
					: null
			}
			const question = getQuestion(this[_questionIndex])
			if (!question) return null
			const choice = question.getCurrentChoice()
			const lastQuestion = getQuestion(this[_questionIndex] - 1)
			const nextQuestion = getQuestion(this[_questionIndex] + 1)
			return wrap(html`
				${lastQuestion
					? html`<button @click=${this[_actions].back}>back</button>`
					: null}
				${nextQuestion
					? html`<button ?disabled=${!choice} @click=${this[_actions].next}>next</button>`
					: html`<button ?disabled=${!choice} @click=${this[_actions].submit}>submit</button>`}
			`)
		}
		else if (this[_state] === "loading") {
			return null
		}
		else if (this[_state] === "error" || this[_state] === "result") {
			return wrap(html`
				${this.once ? null : html`<button @click=${this[_actions].reset}>reset</button>`}
			`)
		}
		else throw new Error(`unknown state "${this[_state]}"`)
	}

	private [_handleChoiceCheck] = () => {
		this.requestUpdate()
	}
}

