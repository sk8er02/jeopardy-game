export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category, amount, previousAnswers } = req.body;

  // Validate inputs
  if (!category || !amount) {
    return res.status(400).json({ error: 'Missing category or amount' });
  }

  const avoidList = Array.isArray(previousAnswers) ? previousAnswers.filter(Boolean) : [];

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
        model: 'nvidia/nemotron-3-nano-30b-a3b:free',
        max_tokens: 500,
        reasoning: { enabled: false },
        messages: [
          {
            role: 'user',
            content: `Generate a Jeopardy clue for the category "${category}" worth $${amount}.

Return ONLY a valid JSON object with this exact format (no markdown, no backticks, no preamble):
{
  "clue": "The actual clue to read aloud",
  "answer": "The correct answer in question format (e.g., 'Who is...', 'What is...', 'Where is...')",
  "acceptableAnswers": ["2 to 5 short keywords or phrases a player might reasonably say that should count as correct — include the core term, its full expansion if it's an abbreviation, and any common synonym or description a person might use instead of the exact term"]
}

Guidelines:
- Make the clue ${amount <= 400 ? 'easy and straightforward' : amount <= 600 ? 'moderately challenging' : amount <= 800 ? 'quite difficult and tricky' : 'the hardest clue in the category, expert-level'}.
- The clue should be clear and unambiguous.
- Ensure every entry in acceptableAnswers is something that, if a player said it, a reasonable human judge would accept as correct.${avoidList.length > 0 ? `
- This clue must be about a completely different fact/topic than all of these already-used answers in this category — do not repeat or closely rephrase any of them: ${avoidList.join('; ')}.` : ''}`,
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

    const textContent = data.choices[0].message.content || '';

    // Extract JSON object from the response (models sometimes wrap it in markdown or add preamble)
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in clue response:', textContent);
      return res.status(500).json({
        error: 'Invalid clue format',
        details: 'Could not find JSON in generated clue'
      });
    }

    let clueData;
    try {
      clueData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse clue response:', textContent);
      return res.status(500).json({
        error: 'Invalid clue format',
        details: 'Could not parse generated clue'
      });
    }

    // Validate the clue data
    if (!clueData.clue || !clueData.answer || !Array.isArray(clueData.acceptableAnswers) || clueData.acceptableAnswers.length === 0) {
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
