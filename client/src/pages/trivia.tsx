import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const sampleQuestions = [
  {
    question: 'Who directed the movie "Inception"?',
    options: ['Christopher Nolan', 'Steven Spielberg', 'James Cameron', 'Quentin Tarantino'],
    correct: 0,
    image: '',
    type: 'director',
  },
  {
    question: 'Which actor played Jack in "Titanic"?',
    options: ['Leonardo DiCaprio', 'Brad Pitt', 'Tom Cruise', 'Matt Damon'],
    correct: 0,
    image: '',
    type: 'actor',
  },
  {
    question: '"May the Force be with you" is a famous quote from which franchise?',
    options: ['Star Wars', 'Star Trek', 'Harry Potter', 'The Lord of the Rings'],
    correct: 0,
    image: '',
    type: 'quote',
  },
];

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function Trivia() {
  const [xp, setXp] = useState(() => Number(localStorage.getItem('trivia_xp') || 0));
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('trivia_streak') || 0));
  const [answeredToday, setAnsweredToday] = useState(() => localStorage.getItem('trivia_answered') === getTodayKey());
  const [question, setQuestion] = useState(() => sampleQuestions[new Date().getDate() % sampleQuestions.length]);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('trivia_xp', xp.toString());
    localStorage.setItem('trivia_streak', streak.toString());
  }, [xp, streak]);

  const handleAnswer = (idx: number) => {
    if (answeredToday) return;
    setSelected(idx);
    if (idx === question.correct) {
      setFeedback('Correct! +10 XP');
      setXp(xp + 10);
      setStreak(streak + 1);
    } else {
      setFeedback('Incorrect! Streak reset.');
      setStreak(0);
    }
    setAnsweredToday(true);
    localStorage.setItem('trivia_answered', getTodayKey());
  };

  return (
    <div className="min-h-screen bg-deep-black pt-20 pb-8 flex flex-col items-center">
      <div className="w-full max-w-md mx-auto">
        <motion.div className="bg-dark-char rounded-2xl p-8 mb-8 border border-gray-800 text-center" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
          <h1 className="text-3xl font-bold text-netflix mb-2">Daily Movie Trivia</h1>
          <div className="flex justify-center gap-8 mb-4">
            <div>
              <div className="text-xl font-bold text-accent-gold">{xp}</div>
              <div className="text-sm text-gray-400">XP</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-400">{streak}</div>
              <div className="text-sm text-gray-400">Streak</div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
            <div className="mb-4 text-lg text-white font-semibold">{question.question}</div>
            {question.image && <img src={question.image} alt="Trivia" className="mx-auto mb-4 rounded-lg max-h-40" />}
            <div className="grid gap-3">
              {question.options.map((opt, idx) => (
                <Button
                  key={idx}
                  className={`w-full ${selected !== null ? (idx === question.correct ? 'bg-green-600' : idx === selected ? 'bg-red-600' : 'bg-gray-800') : 'bg-gray-800'} text-white`}
                  disabled={answeredToday || selected !== null}
                  onClick={() => handleAnswer(idx)}
                >
                  {opt}
                </Button>
              ))}
            </div>
            {feedback && <div className="mt-4 text-lg font-bold text-white">{feedback}</div>}
            {answeredToday && <div className="mt-2 text-gray-400">Come back tomorrow for a new question!</div>}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 