import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const questions = [
  {
    scenario: "小明在一家科技公司工作了2年,老闆突然通知他下個月要調到另一個城市的分公司工作。",
    question: "根據勞動基準法,老闆的做法是否合法?",
    options: [
      "完全合法,雇主有權調動員工",
      "不合法,雇主不能調動員工到其他城市",
      "需要進一步評估,要考慮是否符合法定原則",
      "只要給予加薪就是合法的"
    ],
    correctAnswer: 2,
    explanation: "根據勞動基準法第10-1條,雇主調動勞工需符合多項原則,包括考慮勞工及其家庭的生活利益。因此需要進一步評估是否符合這些原則。"
  },
  {
    scenario: "小芳在公司工作了1年3個月,因為公司營運虧損,老闆打算裁員。",
    question: "如果小芳被資遣,老闆應該提前幾天通知她?",
    options: [
      "10天",
      "20天",
      "30天",
      "不需要提前通知"
    ],
    correctAnswer: 1,
    explanation: "根據勞動基準法第16條,對於工作滿1年以上3年未滿的勞工,雇主應於20日前預告。"
  },
  {
    scenario: "大雄剛入職一家新公司,公司要求他簽署一份合約,約定他必須至少服務公司5年。",
    question: "這份合約是否合法?",
    options: [
      "完全合法,公司有權要求員工長期服務",
      "不合法,公司不能約定最低服務年限",
      "需要進一步了解公司是否提供相應的補償或培訓",
      "只要大雄同意就是合法的"
    ],
    correctAnswer: 2,
    explanation: "根據勞動基準法第15-1條,雇主必須提供專業技術培訓或合理補償才能約定最低服務年限。因此需要進一步了解公司是否符合這些條件。"
  }
];

const QuizGame = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (index) => {
    setSelectedAnswer(index);
    setShowExplanation(true);
    if (index === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentQuestion(currentQuestion + 1);
  };

  if (currentQuestion >= questions.length) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">遊戲結束!</h2>
        <p className="text-lg">你的得分是: {score} / {questions.length}</p>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-2">情境 {currentQuestion + 1}:</h2>
      <p className="mb-4">{question.scenario}</p>
      <h3 className="text-lg font-semibold mb-2">{question.question}</h3>
      <div className="space-y-2">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            className={`w-full p-2 text-left rounded ${
              selectedAnswer === index
                ? index === question.correctAnswer
                  ? 'bg-green-200'
                  : 'bg-red-200'
                : 'bg-white'
            }`}
            disabled={showExplanation}
          >
            {option}
          </button>
        ))}
      </div>
      {showExplanation && (
        <Alert className="mt-4">
          {selectedAnswer === question.correctAnswer ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {selectedAnswer === question.correctAnswer ? '答對了!' : '答錯了!'}
          </AlertTitle>
          <AlertDescription>{question.explanation}</AlertDescription>
        </Alert>
      )}
      {showExplanantion && (
        <button
          onClick={nextQuestion}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          下一題
        </button>
      )}
    </div>
  );
};

export default QuizGame;
