import React, { useState, useRef, useEffect } from 'react';
import { Volume2, RotateCcw, Mic, Send } from 'lucide-react';

export default function JeopardyGame() {
  const [gameState, setGameState] = useState('board'); // 'board', 'clue', 'answer'
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
  const recognitionRef = useRef(null);
  const answerInputRef = useRef(null);

  const categories = [
    'Science',
    'History',
    'Literature',
    'Pop Culture',
    'Sports',
    'Geography'
  ];

  const amounts = [200, 400, 600, 800, 1000];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setListeningTranscript('');
      };

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setUserAnswer(finalTranscript.trim());
          setListeningTranscript('');
        } else {
          setListeningTranscript(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setListeningTranscript('');
      };
    }
  }, []);

  const generateClue = async (category, amount) => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-clue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate clue');
      }

      const clueData = await response.json();
      return clueData;
    } catch (error) {
      console.error('Error generating clue:', error);
      setFeedback(`Error: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const speakClue = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
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

      // Speak the clue after a short delay
      setTimeout(() => speakClue(clueData.clue), 500);
    }
  };

  const checkAnswer = () => {
    if (!userAnswer.trim()) {
      setFeedback('Please enter an answer!');
      return;
    }

    const userText = userAnswer.toLowerCase();
    const correctKeyword = currentClue.correctAnswerKeyword.toLowerCase();
    const isCorrect = userText.includes(correctKeyword);

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
  };

  const isGameOver = usedClues.size === categories.length * amounts.length;

  const hasSTT = recognitionRef.current !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-yellow-300 mb-2 drop-shadow-lg">
            JEOPARDY!
          </h1>
          <p className="text-xl md:text-2xl text-white font-semibold">Score: ${score}</p>
          {hasSTT && (
            <p className="text-sm text-green-300 mt-2">✓ Speech recognition enabled</p>
          )}
        </div>

        {gameState === 'board' ? (
          <>
            {/* Categories Board */}
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
                          className={`w-full py-2 md:py-3 font-bold text-base md:text-lg rounded transition-all ${
                            isUsed
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-400 text-white cursor-pointer hover:scale-105'
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

            {/* Game Over Screen */}
            {isGameOver && (
              <div className="bg-yellow-300 text-center p-6 md:p-8 rounded-lg mb-8 shadow-2xl">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Game Over!</h2>
                <p className="text-xl md:text-2xl font-semibold mb-6">Final Score: ${score}</p>
                <button
                  onClick={resetGame}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 md:px-8 py-2 md:py-3 rounded font-bold text-base md:text-lg flex items-center gap-2 mx-auto"
                >
                  <RotateCcw size={20} /> Play Again
                </button>
              </div>
            )}

            {/* Reset Button */}
            {!isGameOver && (
              <div className="text-center">
                <button
                  onClick={resetGame}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 md:px-6 py-2 rounded font-bold flex items-center gap-2 mx-auto text-sm md:text-base"
                >
                  <RotateCcw size={18} /> Reset Game
                </button>
              </div>
            )}
          </>
        ) : gameState === 'clue' ? (
          <div className="bg-blue-800 rounded-lg p-6 md:p-8 shadow-2xl max-w-2xl mx-auto">
            {/* Category & Amount */}
            <div className="text-center mb-6">
              <p className="text-yellow-300 text-lg md:text-xl font-semibold">
                {currentCategory} for ${currentAmount}
              </p>
            </div>

            {/* Clue Display */}
            <div className="bg-blue-900 rounded p-4 md:p-6 mb-8">
              <p className="text-white text-xl md:text-3xl font-bold leading-relaxed">
                {currentClue?.clue}
              </p>
            </div>

            {/* Button Group */}
            <div className="space-y-3 mb-6">
              {/* Speak Button */}
              <button
                onClick={() => speakClue(currentClue.clue)}
                disabled={isSpeaking}
                className={`w-full ${
                  isSpeaking
                    ? 'bg-green-600 text-white'
                    : 'bg-yellow-400 hover:bg-yellow-300 text-gray-900'
                } font-bold py-3 px-4 rounded flex items-center justify-center gap-2 transition-all`}
              >
                <Volume2 size={20} />
                {isSpeaking ? 'Speaking...' : 'Repeat Clue'}
              </button>

              {/* STT Button */}
              {hasSTT && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`w-full font-bold py-3 px-4 rounded flex items-center justify-center gap-2 transition-all ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                >
                  <Mic size={20} />
                  {isListening ? '🎤 Listening...' : '🎤 Speak Answer'}
                </button>
              )}
            </div>

            {/* Listening Feedback */}
            {isListening && listeningTranscript && (
              <div className="bg-purple-600 text-white p-3 rounded mb-4 text-center italic">
                Hearing: "{listeningTranscript}"
              </div>
            )}

            {/* Answer Input */}
            <div className="space-y-4">
              <input
                ref={answerInputRef}
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                placeholder="What is... / Who is... / Where is..."
                className="w-full p-3 md:p-4 rounded font-semibold text-base md:text-lg text-center bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                autoFocus
              />

              <button
                onClick={checkAnswer}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2 transition-all"
              >
                <Send size={20} /> Submit Answer
              </button>
            </div>

            {/* Feedback */}
            {feedback && (
              <div
                className={`mt-6 p-4 rounded font-semibold text-center text-sm md:text-base ${
                  feedback.includes('✓')
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {feedback}
              </div>
            )}

            {loading && (
              <div className="text-center text-yellow-300 mt-4 animate-pulse">
                Generating clue...
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
