export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, activeTasks, timerActive, timeLeft } = req.body;
  const apiKey = process.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured.' });
  }

  try {
    let systemPrompt = `You are a strict, no-nonsense disciplinarian coach. 
Your goals:
1. Answer ANY question the user asks you (be helpful, but keep the strict tone).
2. Make the user disciplined, focused, and hardworking. Give tough love.
3. When the user discusses tasks or work, you MUST assign them a strict deadline or time limit.
4. To automatically set a timer for the user, output a JSON block at the end of your response like this: {"action": "set_timer", "minutes": 30}
Always use markdown formatting like bold text for emphasis.`;

    if (activeTasks && activeTasks.length > 0) {
      systemPrompt += `\nThe user currently has these active tasks: ${activeTasks}. Remind them to finish them.`;
    }
    if (timerActive) {
      systemPrompt += `\nThe user is currently in a Grind Session with ${Math.ceil(timeLeft / 60)} minutes left. Tell them to stay focused on the timer!`;
    }

    // Sliding Window: Keep the last 10 messages max to prevent token overflow
    const MAX_HISTORY = 10;
    const history = messages.slice(Math.max(messages.length - MAX_HISTORY, 0));

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...history
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'poolside/laguna-xs-2.1:free',
        messages: apiMessages
      })
    });

    const data = await response.json();

    if (data && data.choices && data.choices.length > 0) {
      res.status(200).json({ reply: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: 'Invalid response from model.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during API call.' });
  }
}
