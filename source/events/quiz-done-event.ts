
import {Tabulation} from "../interfaces.js"
import {eventSettings} from "./event-settings.js"

export class QuizDoneEvent extends CustomEvent<Tabulation> {
	constructor(detail: Tabulation) {
		super("quiz-done", {...eventSettings, detail})
	}
}
