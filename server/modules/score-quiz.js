var _ = require('lodash')
exports = module.exports = function (mapQuestions, answers, callback) {
  if (_.isObject(mapQuestions) && _.isArray(answers)) {
    var studentAnswers = answers
    var questionIdsArray = Object.keys(mapQuestions)
    let totalQuestionCount = questionIdsArray.length
    var studentAnsweredQuestionArray = []
    var mapStudentAnswers = {}
    var totalRightCount = 0
    var totalUnstartCount = 0
    var totalBlank = []

    studentAnswers.forEach((studentAnswer) => {
      if (studentAnswer && studentAnswer.key && studentAnswer.data) {
        mapStudentAnswers[studentAnswer.key] = {
          key: studentAnswer.key,
          data: studentAnswer.data
        }
        studentAnsweredQuestionArray.push(studentAnswer.key)
      }
    })

    totalBlank = _.difference(questionIdsArray, studentAnsweredQuestionArray)

    if (totalBlank.length > 0) {
      totalBlank.forEach((question_id) => {
        mapStudentAnswers[question_id] = {
          key: question_id,
          correct: false,
          blank: true
        }
      })
    }

    Object.keys(mapStudentAnswers).map(function (key, index) {
      var answer = mapStudentAnswers[key]
      let currentQuestion = mapQuestions[key]
      if (currentQuestion) {
        let questionType = currentQuestion.type
        if (questionType === 'mc') {
          var correctAnswer = null
          var hasMultpleAnswerMetaKey = false
          currentQuestion.meta.forEach((metaData) => {
            if (metaData.key === 'multiple_answer' && metaData.data === 'true') {
              hasMultpleAnswerMetaKey = true
            }
          })
          if (hasMultpleAnswerMetaKey) {
            if (answer.data) {
              correctAnswer = []
              currentQuestion.choices.forEach((choice) => {
                if (choice.correct) {
                  correctAnswer.push(choice._id.toString())
                }
              })
              let answerMissing = _.difference(correctAnswer, answer.data)
              let wrongChoices = _.difference(answer.data, correctAnswer)
              if (answer.data.length === 0) {
                answer['blank'] = true
                totalUnstartCount++
              } else {
                if (answerMissing.length === 0 && wrongChoices.length === 0) {
                  answer['correct'] = true
                  totalRightCount++
                } else {
                  answer['correct'] = false
                }
              }
            } else {
              answer['blank'] = true
              totalUnstartCount++
            }
          } else {
            if (answer.blank) {
              totalUnstartCount++
              answer['correct'] = false
            } else if (answer.data) {
              correctAnswer = ''
              currentQuestion.choices.forEach((choice) => {
                if (choice.correct) {
                  correctAnswer = choice._id
                }
              })
              if (answer.data.toString() === correctAnswer.toString()) {
                answer['correct'] = true
                totalRightCount++
              } else {
                answer['correct'] = false
              }
            } else {
              answer['exception'] = true
            }
          }
        }
      }
    })
    let score = _.round(_.multiply(_.divide(totalRightCount, totalQuestionCount), 100), 2);
    callback(null, { correct: totalRightCount, incorrect: (totalQuestionCount - totalUnstartCount - totalRightCount), unstarted: totalUnstartCount, score: score })
  } else {
    callback('_.isObject(mapQuestions) && _.isArray(answers)')
  }
}
