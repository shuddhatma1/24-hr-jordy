const express = require('express')

const app = express()
app.use(express.json())

const MOCK_RESPONSES = [
  'Sure! Here are the latest stats for the league you asked about.',
  'Great question! The top scorer this season has been absolutely dominant.',
  'Based on recent results, the standings look very competitive right now.',
  'The team you mentioned has had an impressive run of form lately.',
  'I can help with that! Here is what the data shows for this season.',
]

app.post('/chat', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()

  if (res.socket) {
    res.socket.setNoDelay(true)
  }

  const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]
  const words = response.split(' ')

  let i = 0
  const interval = setInterval(() => {
    if (i < words.length) {
      const token = i === 0 ? words[i] : ' ' + words[i]
      const chunk = `data: ${JSON.stringify({ token })}\n\n`
      res.write(chunk)
      i++
    } else {
      res.write('data: [DONE]\n\n')
      clearInterval(interval)
      res.end()
    }
  }, 80)

  res.on('close', () => {
    clearInterval(interval)
  })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Mock bot running on http://localhost:${PORT}`)
})
