
import {Component, html, css, prop} from "../toolbox/component.js"

export class QuizzlyResult extends Component {
	@prop(String, true) label: string = ""

	static get styles() {
		return css`
			:host {
				display: block;
			}
		`
	}

	render() {
		return html`<slot></slot>`
	}
}
