"use client";

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const maze = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 1],
  [1, 1, 1, 0, 0, 0, 1],
  [1, 2, 0, 0, 1, 3, 1],
  [1, 1, 1, 1, 1, 1, 1],
];

const questions = [
  {
    id: 2,
    question: "根據勞動基準法，雇主調動勞工工作時必須符合哪些原則？",
    options: [
      "只要對公司有利就可以",
      "必須考慮勞工及其家庭的生活利益",
      "只要給予加薪就可以",
      "無需考慮任何原則"
    ],
    correctAnswer: 1,
    points: 10
  },
  {
    id: 3,
    question: "勞工在同一雇主工作滿一年後，每年可享有幾天特別休假？",
    options: ["3天", "7天", "10天", "14天"],
    correctAnswer: 1,
    points: 15
  }
];

const MazeQuizGame = () => {
  const [playerPosition, setPlayerPosition] = useState([1, 1]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (currentQuestion) return;
      
      const [y, x] = playerPosition;
      let newY = y, newX = x;

      switch (e.key) {
        case 'ArrowUp': newY--; break;
        case 'ArrowDown': newY++; break;
        case 'ArrowLeft': newX--; break;
        case 'ArrowRight': newX++; break;
        default: return;
      }

      if (maze[newY][newX] !== 1) {
        setPlayerPosition([newY, newX]);
        checkForQuestion(newY, newX);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [playerPosition, currentQuestion]);

  const checkForQuestion = (y, x) => {
    const cellValue = maze[y][x];
    const question = questions.find(q => q.id === cellValue);
    if (question) {
      setCurrentQuestion(question);
    }
  };

  const handleAnswer = (index) => {
    if (index === currentQuestion.correctAnswer) {
      setScore(score + currentQuestion.points);
      setMessage(`正確！獲得 ${currentQuestion.points} 分`);
    } else {
      setMessage('答錯了，再接再厲！');
    }
    setCurrentQuestion(null);

    if (playerPosition[0] === 5 && playerPosition[1] === 5) {
      setGameOver(true);
    }
  };

  const renderMaze = () => {
    return maze.map((row, y) => (
      <div key={y} style={{ display: 'flex' }}>
        {row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            style={{
              width: 30,
              height: 30,
              backgroundColor: cell === 1 ? 'black' : 'white',
              border: '1px solid gray',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {playerPosition[0] === y && playerPosition[1] === x && '🧑'}
            {cell > 1 && '❓'}
          </div>
        ))}
      </div>
    ));
  };

  if (gameOver) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">遊戲結束！</h2>
        <p className="text-lg">你的最終得分是: {score}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">勞動基準法迷宮問答遊戲</h2>
      <p className="mb-2">分數: {score}</p>
      {renderMaze()}
      {message && (
        <Alert className="mt-4">
          <AlertTitle>{message}</AlertTitle>
        </Alert>
      )}
      {currentQuestion && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">{currentQuestion.question}</h3>
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className="w-full p-2 mt-2 text-left rounded bg-white hover:bg-blue-100"
            >
              {option}
            </button>
          ))}
        </div>
      )}
      <p className="mt-4">使用方向鍵移動人物</p>
    </div>
  );
};

export default MazeQuizGame;
