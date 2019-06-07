
# quizzly — quiz tech

web components and node tech for quizzes

coming soon

- **quizzly-quiz**
  - [x] provide `quizzly-question`'s
  - [x] provide `quizzly-result`'s
  - [x] provide `[dimensions]` list
  - [x] provide `.evaluator` function to determine result label
  - [ ] quiz will fire event `quiz-start` when the quiz starts or is restarted
  - [ ] quiz will fire event `question-answered` whenever a question is answered
  - [ ] quiz will fire event `quiz-error` when any error occurs
  - [ ] quiz will fire event `quiz-done` when then user hits the submit button
  - [ ] quiz has getter `.done` promise, resolves when quiz is done
  - [x] quiz has getter `.tabulation`
  - [x] quiz shows results after submit
  - [x] quiz freezes questions after submission
  - [x] quiz has working reset button
