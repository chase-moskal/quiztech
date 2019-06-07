
import {Component, html, css, prop} from "../toolbox/component.js"

const _dispatchCheckEvent = Symbol("_dispatchCheckEvent")

export class QuizzlyChoice extends Component {
	@prop(String) add: string
	@prop(Boolean) checked: boolean = false

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

	private readonly [_dispatchCheckEvent] = () => {
		this.dispatchEvent(new CustomEvent("check", {
			detail: {},
			bubbles: true,
			composed: true
		}))
	}

	render() {
		return html`
			<button @click=${this[_dispatchCheckEvent]}>
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
