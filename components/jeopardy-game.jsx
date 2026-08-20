import React, { useState, useRef, useEffect } from 'react';
import { Volume2, RotateCcw, Mic, Send } from 'lucide-react';

export default function JeopardyGame() {
  const [gameState, setGameState] = useState('board');
  const [score, setScore] = useState(0);
  const [currentClue, setCurrentClue] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentAmount, setCurrentAmount] = useState(null);
  const [usedClues, setUsedClues] = useState(new Set());
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningTranscript, setListeningTranscript] = useState('');
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const usedAnswersByCategory = useRef({});

  const categories = ['Science', 'History', 'Literature', 'Pop Culture', 'Sports', 'Geography'];
  const amounts = [200, 400, 600, 800, 1000];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
        if (finalTranscript) {
          setUserAnswer(finalTranscript.trim());
        }
      };
    }
  }, []);

  const generateClue = async (category, amount) => {
    setLoading(true);
    try {
      const previousAnswers = usedAnswersByCategory.current[category] || [];
      const response = await fetch('/api/generate-clue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, amount, previousAnswers }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate clue');
      }

      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      setFeedback(`❌ ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const speakClue = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    // iOS has a bug where speak() called immediately after cancel() is
    // silently dropped. A short delay avoids it.
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      utteranceRef.current = utterance; // keep a reference so it isn't garbage collected mid-speech
      window.speechSynthesis.speak(utterance);
    }, 50);
  };

  const unlockAudio = () => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance('Voice enabled');
    utterance.volume = 1;
    utterance.onend = () => setAudioUnlocked(true);
    utterance.onerror = () => setAudioUnlocked(true);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setAudioUnlocked(true);
  };

  const handleClueSelect = async (category, amount) => {
    const clueKey = `${category}-${amount}`;
    if (usedClues.has(clueKey)) {
      setFeedback('Already answered! Pick another.');
      return;
    }

    const clueData = await generateClue(category, amount);
    if (clueData) {
      setCurrentClue(clueData);
      setCurrentCategory(category);
      setCurrentAmount(amount);
      setGameState('clue');
      setUserAnswer('');
      setFeedback('');
      const prior = usedAnswersByCategory.current[category] || [];
      usedAnswersByCategory.current[category] = [...prior, clueData.answer];
      speakClue(clueData.clue);
    }
  };

  const checkAnswer = () => {
    if (!userAnswer.trim()) {
      setFeedback('Please enter an answer!');
      return;
    }

    const normalizedAnswer = userAnswer.toLowerCase();
    const isCorrect = currentClue.acceptableAnswers.some((accepted) => {
      const normalizedAccepted = accepted.toLowerCase();
      return normalizedAnswer.includes(normalizedAccepted) || normalizedAccepted.includes(normalizedAnswer);
    });
    if (isCorrect) {
      setScore(score + currentAmount);
      setFeedback(`✓ Correct! The answer is: ${currentClue.answer}`);
    } else {
      setScore(score - currentAmount);
      setFeedback(`✗ Incorrect. The answer is: ${currentClue.answer}`);
    }

    const newUsedClues = new Set(usedClues);
    newUsedClues.add(`${currentCategory}-${currentAmount}`);
    setUsedClues(newUsedClues);

    setTimeout(() => {
      setGameState('board');
      setUserAnswer('');
    }, 3000);
  };

  const resetGame = () => {
    setScore(0);
    setUsedClues(new Set());
    setGameState('board');
    setUserAnswer('');
    setFeedback('');
    setCurrentClue(null);
    usedAnswersByCategory.current = {};
  };

  const isGameOver = usedClues.size === categories.length * amounts.length;
  const hasSTT = recognitionRef.current !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-yellow-300 mb-2">JEOPARDY!</h1>
          <p className="text-xl md:text-2xl text-white font-semibold">Score: ${score}</p>
          {hasSTT && <p className="text-sm text-green-300 mt-2">✓ Speech recognition enabled</p>}
          {!audioUnlocked && (
            <button
              onClick={unlockAudio}
              type="button"
              className="mt-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-2 rounded-full inline-flex items-center gap-2"
            >
              <Volume2 size={18} /> Tap to Enable Voice
            </button>
          )}
        </div>

        {gameState === 'board' ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
              {categories.map((category) => (
                <div key={category} className="space-y-2">
                  <div className="bg-blue-600 text-white font-bold p-2 md:p-4 rounded text-center text-xs md:text-base">
                    {category}
                  </div>
                  <div className="space-y-2">
                    {amounts.map((amount) => {
                      const isUsed = usedClues.has(`${category}-${amount}`);
                      return (
                        <button
                          key={amount}
                          onClick={() => handleClueSelect(category, amount)}
                          disabled={isUsed || loading}
                          type="button"
                          className={`w-full py-2 md:py-3 font-bold text-base md:text-lg rounded transition-all ${
                            isUsed
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-400 text-white cursor-pointer'
                          }`}
                        >
                          {isUsed ? '✓' : `$${amount}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {isGameOver && (
              <div className="bg-yellow-300 text-center p-6 md:p-8 rounded-lg mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Game Over!</h2>
                <p className="text-xl md:text-2xl font-semibold mb-6">Final Score: ${score}</p>
                <button
                  onClick={resetGame}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 md:px-8 py-2 md:py-3 rounded font-bold"
                >
                  Play Again
                </button>
              </div>
            )}

            {!isGameOver && (
              <div className="text-center">
                <button
                  onClick={resetGame}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 md:px-6 py-2 rounded font-bold"
                >
                  Reset Game
                </button>
              </div>
            )}
          </>
        ) : gameState === 'clue' ? (
          <div className="bg-blue-800 rounded-lg p-6 md:p-8 shadow-2xl max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <p className="text-yellow-300 text-lg md:text-xl font-semibold">
                {currentCategory} for ${currentAmount}
              </p>
            </div>

            <div className="bg-blue-900 rounded p-4 md:p-6 mb-8">
              <p className="text-white text-xl md:text-3xl font-bold">{currentClue?.clue}</p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => speakClue(currentClue.clue)}
                disabled={isSpeaking}
                className={`w-full ${
                  isSpeaking ? 'bg-green-600' : 'bg-yellow-400 hover:bg-yellow-300'
                } font-bold py-3 px-4 rounded flex items-center justify-center gap-2`}
              >
                <Volume2 size={20} />
                {isSpeaking ? 'Speaking...' : 'Repeat Clue'}
              </button>

              {hasSTT && (
                <button
                  onClick={() => {
                    if (isListening) {
                      recognitionRef.current?.stop();
                    } else {
                      recognitionRef.current?.start();
                    }
                  }}
                  className={`w-full font-bold py-3 px-4 rounded flex items-center justify-center gap-2 ${
                    isListening
                      ? 'bg-red-500 text-white'
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                >
                  <Mic size={20} />
                  {isListening ? '🎤 Listening...' : '🎤 Speak Answer'}
                </button>
              )}
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                placeholder="What is... / Who is... / Where is..."
                className="w-full p-3 md:p-4 rounded font-semibold text-base md:text-lg text-center bg-white text-gray-900"
                autoFocus
              />

              <button
                onClick={checkAnswer}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded flex items-center justify-center gap-2"
              >
                <Send size={20} /> Submit Answer
              </button>
            </div>

            {feedback && (
              <div className={`mt-6 p-4 rounded font-semibold text-center ${
                feedback.includes('✓') ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {feedback}
              </div>
            )}

            {loading && <div className="text-center text-yellow-300 mt-4">Generating clue...</div>}
          </div>
        ) : null}
      </div>
    </div>
  );
}
