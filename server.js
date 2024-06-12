console.log("Initializing...");

//read from .env
require('dotenv').config();

const OpenAI = require('openai');
const fs = require('fs');

const openai = new OpenAI();
const express = require('express');
const app = express();
const prompts = JSON.parse(fs.readFileSync('data/prompts.json', "utf-8"));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} ${req.ip}`);
  next();
});

app.use(express.static('static'));

app.use(express.json());

app.get("/api/modelist", async (req, res) => {
  res.send(prompts.map((prompt) => {
    return prompt.name;
  }))
});

app.post("/api/evaluate", async (req, res) => {

  const prompt = prompts.find(prompt => prompt.name === req.body.mode);
  const body = req.body.body;

  if (typeof prompt == "undefined" || typeof body == "undefined") res.status(400).send();
  
  const response = (await openai.chat.completions.create({
    messages: [
      { role: "system", content: prompt.body },
      { role: "user", content: body }
    ],
    model: "gpt-4-turbo",
    response_format: { type: "json_object" }
  })).choices[0];
  
  switch (response.finish_reason !== "stop"){
    case "stop":  
      res.send(JSON.parse(response.message.content));
    case "content_filter": 
      res.status(422).send({ status: "failed", message: "The AI refused to evaluate your paragraph, please adjust your wording and try again." });
    default: 
      res.status(500).send({ status: "failed", message: "An error occured when trying to process your request" });
  }

});

const port = process.env.PORT;

app.listen(port, () => {
  console.log("Finished!");
  console.log(`Server running on port ${port}`);
});
