import Head from 'next/head';
import JeopardyGame from '../components/jeopardy-game';

export default function Home() {
  return (
    <>
      <Head>
        <title>AI Jeopardy - Play with Speech Recognition</title>
        <meta name="description" content="AI-powered Jeopardy game with text-to-speech and speech-to-text" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <JeopardyGame />
    </>
  );
}
