
import {Component, html, svg, prop} from "../toolbox/component"

const _state = Symbol("_state")
const _renderStage = Symbol("_renderStage")
const _questionIndex = Symbol("_questionIndex")
const _renderIntroStage = Symbol("_renderIntroStage")
const _renderResultStage = Symbol("_renderResultStage")
const _renderQuestionStage = Symbol("_renderQuestionStage")

type QuizState = "intro" | "question" | "result"

export class QztQuiz extends Component {
	@prop(String) title: string = "Quiz"

	@prop(String) private [_state]: string = "intro"
	@prop(Number) private [_questionIndex]: number = 0

	private [_renderStage]() {
		switch (this[_state]) {
			case "intro": return this[_renderIntroStage]()
			case "question": return this[_renderQuestionStage]()
			case "result": return this[_renderResultStage]()
		}
	}

	private [_renderIntroStage]() {
		return html`
			<div class="stage intro">
				<section>
	
				</section>
				<footer>
					<button>Back</button>
					<button>Next</button>
				</footer>
			</div>
		`
	}

	private [_renderQuestionStage]() {
		return html`
			<div class="stage question">
				<section>
					
				</section>
				<footer>
					<button>Back</button>
					<button>Next</button>
				</footer>
			</div>
		`
	}

	private [_renderResultStage]() {
		return html`
			<div class="stage result">
				<section>
					
				</section>
				<footer>
					<button>Back</button>
					<button>Next</button>
				</footer>
			</div>
		`
	}

	render() {
		return html`
			<style>
				* {
					margin: 0;
					padding: 0;
					box-sizing: border-box;
				}
			</style>

			<header>
				<h1>${this.title}</h1>
			</header>

			${this[_renderStage]()}
		`
	}
}
