import React, { useState } from 'react';

export default function JeopardyGame() {
  const [clicked, setClicked] = useState(false);
  const [message, setMessage] = useState('Click a button to test');

  const handleTest = () => {
    setClicked(true);
    setMessage('✓ Button works! React is running.');
    setTimeout(() => setClicked(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-5xl font-bold text-yellow-300 text-center mb-8">JEOPARDY!</h1>

        <div className="bg-blue-800 rounded-lg p-8 text-center">
          <p className="text-white text-2xl mb-6">{message}</p>

          <button
            onClick={handleTest}
            className={`px-8 py-4 rounded font-bold text-lg transition-all ${
              clicked
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 hover:bg-blue-400 text-white'
            }`}
          >
            TEST BUTTON
          </button>

          <div className="mt-8 bg-blue-900 p-6 rounded text-left text-white text-sm">
            <p className="mb-2">If you can read this and the button works:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>React is loaded ✓</li>
              <li>Tailwind CSS is working ✓</li>
              <li>Event handlers are attached ✓</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
