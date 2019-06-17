
import {Component, html, css, svg, prop} from "../toolbox/component.js"

export const _dispatchCheckEvent = Symbol()

export class QuizzlyChoice extends Component {
	@prop(String) add: string
	@prop(Boolean, true) checked: boolean = false
	@prop(Boolean, true) disabled: boolean = false

	static get styles() {
		return css`
			:host {
				display: inline-block;
				vertical-align: middle;
			}
			:host([hidden]) {
				display: none;
			}
			*:focus {
				outline: var(--focus-outline, 2px solid #2ef);
			}
			button {
				display: flex;
				flex-direction: row;
				align-items: center;
			}
			.icon {
				width: var(--quizzly-choice-icon-size, 1em);
				height: var(--quizzly-choice-icon-size, 1em);
				border-radius: 2em;
				margin-right: 0.5em;
				background: var(--quizzly-choice-icon-background, rgba(0,0,0, 0.05));
				box-shadow: var(--quizzly-choice-icon-box-shadow, inset 0 0 8px rgba(0,0,0, 0.2));
			}
			:host([checked]) .icon {
				background: var(--quizzly-choice-icon-background-checked, #0c0);
			}
			.icon svg {
				width: 100%;
				height: 100%;
			}
			.icon svg path {
				fill: var(--quizzly-choice-check-color, white);
			}
			.text {
			}
		`
	}

	reset() {
		this.checked = false
		this.disabled = false
	}

	private readonly [_dispatchCheckEvent] = () => {
		this.dispatchEvent(new CustomEvent("check", {
			detail: {},
			bubbles: true,
			composed: true
		}))
	}

	render() {
		return html`
			<button @click=${this[_dispatchCheckEvent]} ?disabled=${this.disabled}>
				<div class="icon">
					${this.checked
						? svg`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16"><path fill-rule="evenodd" d="M12 5l-8 8-4-4 1.5-1.5L4 10l6.5-6.5L12 5z"/></svg>`
						: null}
				</div>
				<div class="text">
					<slot></slot>
				</div>
			</button>
		`
	}
}
