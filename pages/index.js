import dynamic from 'next/dynamic';

const JeopardyGame = dynamic(() => import('../components/jeopardy-game'), {
  ssr: false,
});

export default function Home() {
  return (
    <div>
      <head>
        <title>AI Jeopardy - Play with Speech Recognition</title>
        <meta name="description" content="AI-powered Jeopardy game with text-to-speech and speech-to-text" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <JeopardyGame />
    </div>
  );
}
