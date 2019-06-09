
import {eventSettings} from "./event-settings.js"

export class QuizErrorEvent extends CustomEvent<{error: Error}> {
	constructor(error: Error) {
		super("quiz-error", {...eventSettings, detail: {error}})
	}
}
