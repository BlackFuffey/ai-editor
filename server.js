process.stdout.write("Initializing...");
//read from .env
require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI();
const app = require('express')();

app.use(express.static('static'));

app.post("/api", (req, res) => {
  
}
