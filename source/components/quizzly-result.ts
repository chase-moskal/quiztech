
import {Component, html, prop} from "../toolbox/component.js"

export class QuizzlyResult extends Component {
	@prop(String, true) label: string = ""

	render() {
		return html`<slot></slot>`
	}
}
