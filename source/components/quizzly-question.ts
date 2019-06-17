
import {QuizzlyChoice} from "./quizzly-choice.js"
import {Component, html, css, prop} from "../toolbox/component.js"

export const _getChoices = Symbol()
export const _handleCheckEvent = Symbol()

export class QuizzlyQuestion extends Component {
	@prop(String, true) numeral: string = ""
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
			:host([hidden]) {
				display: none;
			}
			.textblock {
				display: flex;
			}
			.textblock > .numeral {
				margin-right: 0.2em;
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
				<div class="textblock">
					${this.numeral
						? html`<div class="numeral">${this.numeral}</div>`
						: null}
					<slot id="textslot" name="text"></slot>
				</div>
				<slot id="mainslot"></slot>
			</div>
		`
	}
}
