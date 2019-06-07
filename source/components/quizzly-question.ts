
import {QuizzlyChoice} from "./quizzly-choice.js"
import {Component, html, css, prop} from "../toolbox/component.js"

const _getChoices = Symbol("_getChoices")
const _handleCheckEvent = Symbol("_handleCheckEvent")

export class QuizzlyQuestion extends Component {

	static get styles() {
		return css``
	}

	private readonly [_handleCheckEvent] = event => {
		const {target, detail} = event
		this.check(target)
	}

	private [_getChoices]() {
		const mainSlot: HTMLSlotElement = this.shadowRoot.querySelector("#mainslot")
		if (!mainSlot) return []
		const choices = <QuizzlyChoice[]>mainSlot.assignedElements()
		return choices
	}

	check(choice: HTMLElement) {
		const choices = this[_getChoices]()
		for (const node of choices) node.checked = node === choice
	}

	getCurrentChoice() {
		const choices = this[_getChoices]()
		return choices.find(choice => choice.checked)
	}

	render() {
		return html`
			<div @check=${this[_handleCheckEvent]}>
				<slot id="textslot" name="text"></slot>
				<slot id="mainslot"></slot>
			</div>
		`
	}
}
