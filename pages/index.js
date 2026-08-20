import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useState, useEffect } from 'react';

const JeopardyGame = dynamic(() => import('../components/jeopardy-game'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>,
});

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Head>
        <title>AI Jeopardy - Play with Speech Recognition</title>
        <meta name="description" content="AI-powered Jeopardy game with text-to-speech and speech-to-text" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {mounted && <JeopardyGame />}
    </>
  );
}
