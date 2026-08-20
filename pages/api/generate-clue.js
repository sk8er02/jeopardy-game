export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category, amount } = req.body;

  // Validate inputs
  if (!category || !amount) {
    return res.status(400).json({ error: 'Missing category or amount' });
  }

  // Check for API key
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Generate a Jeopardy clue for the category "${category}" worth $${amount}.

Return ONLY a valid JSON object with this exact format (no markdown, no backticks, no preamble):
{
  "clue": "The actual clue to read aloud",
  "answer": "The correct answer in question format (e.g., 'Who is...', 'What is...', 'Where is...')",
  "correctAnswerKeyword": "One key word from the answer to check against"
}

Guidelines:
- Make the clue ${amount <= 400 ? 'easy and straightforward' : amount <= 600 ? 'moderately challenging' : 'quite difficult and tricky'}.
- The clue should be clear and unambiguous.
${amount === 1000 ? '- This is FINAL JEOPARDY! Make it very challenging and profound.' : ''}
- Ensure the answer keyword is a unique, checkable word.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { text: await response.text() };
      }
      console.error('OpenRouter API error:', response.status, errorData);
      return res.status(response.status).json({
        error: 'Failed to generate clue',
        details: errorData.error?.message || JSON.stringify(errorData) || 'Unknown error',
        status: response.status
      });
    }

    const data = await response.json();
    
    // Extract the text content from the response
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({ error: 'Invalid response format' });
    }

    const textContent = data.choices[0].message.content;

    // Parse the JSON response
    let clueData;
    try {
      clueData = JSON.parse(textContent);
    } catch (parseError) {
      console.error('Failed to parse clue response:', textContent);
      return res.status(500).json({ 
        error: 'Invalid clue format',
        details: 'Could not parse generated clue'
      });
    }

    // Validate the clue data
    if (!clueData.clue || !clueData.answer || !clueData.correctAnswerKeyword) {
      return res.status(500).json({ 
        error: 'Incomplete clue data',
        received: clueData
      });
    }

    res.status(200).json(clueData);
  } catch (error) {
    console.error('Error generating clue:', error);
    res.status(500).json({ 
      error: 'Failed to generate clue',
      details: error.message 
    });
  }
}
