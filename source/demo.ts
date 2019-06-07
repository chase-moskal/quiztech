
import "./register-all.js"
import {QuizzlyQuiz} from "./components/quizzly-quiz.js"

const coolnessQuiz: QuizzlyQuiz = document.querySelector("#coolness-quiz")

// evaluate the numerical dimensions and return the result label
coolnessQuiz.evaluator = dimensions => (
	dimensions.coolness > 0
		? "cool"
		: "uncool"
)

const quizzes: QuizzlyQuiz[] = Array.from(document.querySelectorAll("quizzly-quiz"))

for (const quiz of quizzes)
	quiz.done
		.catch(error => console.error(error))
		.then(detail => console.log("QUIZDONE", detail))
