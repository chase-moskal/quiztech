
import {eventSettings} from "./event-settings.js"

export class QuizStartEvent extends CustomEvent<{}> {
	constructor(detail: {} = {}) {
		super("quiz-start", {...eventSettings, detail})
	}
}
