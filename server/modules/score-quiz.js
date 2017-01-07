var _ = require('lodash')
exports = module.exports = function (mapQuestions, answers, quizInfo, callback) {
  if (_.isObject(mapQuestions) && _.isArray(answers)) {
    var report = []
    var studentAnswers = answers
    var questionIdsArray = Object.keys(mapQuestions)
    let totalQuestionCount = questionIdsArray.length
    var studentAnsweredQuestionArray = []
    var mapStudentAnswers = {}
    var totalRightCount = 0
    var totalUnstartCount = 0
    var totalBlank = []
    var checkAnswersReports = []

    var wrongQuestionTagsCountDic = {}

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
                  currentQuestion.tags.forEach((tag) => {
                    if (wrongQuestionTagsCountDic[tag]) {
                      wrongQuestionTagsCountDic[tag]++
                    } else {
                      wrongQuestionTagsCountDic[tag] = 1
                    }
                  })
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
                currentQuestion.tags.forEach((tag) => {
                  if (wrongQuestionTagsCountDic[tag]) {
                    wrongQuestionTagsCountDic[tag]++
                  } else {
                    wrongQuestionTagsCountDic[tag] = 1
                  }
                })
                answer['correct'] = false
              }
            } else {
              answer['exception'] = true
            }
          }
          checkAnswersReports.push({
            key: key,
            data: answer.data,
            correct: answer['correct'] || false,
            blank: answer['blank'] || false,
            exception: answer['exception'] || false
          })
        }
      }
    })

    // calculate most wrong tags start
    var mostWrongTagCount = 0
    var mostWrongTags = []
    _.forEach(wrongQuestionTagsCountDic, function (value, key) {
      if (value === mostWrongTagCount) {
        mostWrongTags.push(key)
      } else if (value > mostWrongTagCount) {
        mostWrongTagCount = value
        mostWrongTags = []
        mostWrongTags.push(key)
      }
    })
    if (mostWrongTags.length > 0) {
      report.push({
        key: 'mostWrongTags',
        data: JSON.stringify(mostWrongTags)
      })
    }
    // calculate most wrong tags end

    // check if hand in on time
    if (quizInfo) {
      if (quizInfo.endAt) {
        if (new Date() > new Date(quizInfo.endAt)) {
          report.push({
            key: 'onTime',
            data: 'false'
          })
        } else {
          report.push({
            key: 'onTime',
            data: 'true'
          })
        }
      } else {
        report.push({
          key: 'onTime',
          data: 'true'
        })
      }
    }
    // end check

    let incorrect = (totalQuestionCount - totalUnstartCount - totalRightCount)

    report.push({
      key: 'unstartCount',
      data: totalUnstartCount.toString()
    })
    report.push({
      key: 'incorrectCount',
      data: incorrect.toString()
    })
    report.push({
      key: 'correctCount',
      data: totalRightCount.toString()
    })

    let score = _.round(_.multiply(_.divide(totalRightCount, totalQuestionCount), 100), 2);
    var results = {
      checkAnswersReports: checkAnswersReports,
      score: score,
      report: report
    }
    callback(null, results)
  } else {
    if (!_.isObject(mapQuestions)) {
      callback({message: 'mapQuestions is not a object'})
    } else if (!_.isArray(answers)) {
      callback({message: 'answers is not an array'})
    }
  }
}
