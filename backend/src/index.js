import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'UHWF API is running...' })
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})