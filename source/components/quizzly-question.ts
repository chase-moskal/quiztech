
import {QuizzlyChoice} from "./quizzly-choice.js"
import {Component, html, css, prop} from "../toolbox/component.js"

export const _getChoices = Symbol()
export const _handleCheckEvent = Symbol()

export class QuizzlyQuestion extends Component {
	@prop(Boolean, true) disabled: boolean = false

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

	static get styles() {
		return css`
			:host {
				display: block;
			}
		`
	}

	updated() {
		for (const choice of this[_getChoices]())
			choice.disabled = this.disabled
	}

	check(choice: HTMLElement) {
		for (const node of this[_getChoices]())
			node.checked = node === choice
	}

	getCurrentChoice() {
		return this[_getChoices]().find(choice => choice.checked)
	}

	reset() {
		for (const choice of this[_getChoices]())
			choice.reset()
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
