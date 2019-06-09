
import {Component, html, css, prop} from "../toolbox/component.js"

export const _dispatchCheckEvent = Symbol()

export class QuizzlyChoice extends Component {
	@prop(String) add: string
	@prop(Boolean) checked: boolean = false
	@prop(Boolean, true) disabled: boolean = false

	static get styles() {
		return css`
			:host {
				display: inline-block;
			}
			button {
				display: flex;
				flex-direction: row;
				align-items: center;
			}
			button > div {
				
			}
			.icon {
				width: 1em;
				height: 1em;
				font-weight: bold;
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
					${this.checked ? "X" : "-"}
				</div>
				<div class="text">
					<slot></slot>
				</div>
			</button>
		`
	}
}
