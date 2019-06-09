
import "./register-all.js"
import {QuizzlyQuiz} from "./components/quizzly-quiz.js"

const coolQuiz: QuizzlyQuiz = document.querySelector("#coolness-quiz")

// evaluate the numerical dimensions and return the result label
coolQuiz.evaluator = dimensions => (
	dimensions.coolness > 0
		? "cool"
		: "uncool"
)

const quizzes: QuizzlyQuiz[] = Array.from(document.querySelectorAll("quizzly-quiz"))

for (const quiz of quizzes)
	quiz.done
		.catch(error => console.error(error))
		.then(detail => console.log("QUIZDONE", detail))

window["quizzes"] = quizzes
window["coolQuiz"] = coolQuiz

window.addEventListener("quiz-start", () => console.log("= quiz-start"))
window.addEventListener("quiz-done", () => console.log("= quiz-done"))
window.addEventListener("quiz-error", () => console.log("= quiz-error"))
