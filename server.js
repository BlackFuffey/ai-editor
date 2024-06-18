console.log("Initializing...");

//read from .env
require('dotenv').config();

const OpenAI = require('openai');
const fs = require('fs');

const openai = new OpenAI();
const express = require('express');
const app = express();
const prompts = JSON.parse(fs.readFileSync('data/prompts.json', "utf-8"));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} ${req.body} ${req.ip}`);
  next();
});

app.use(express.static('static'));

app.get("/api/modelist", async (req, res) => {
  res.send(Object.keys(prompts).map((key) => {
    return { key: key, name: prompts[key].name };
  }))
});

app.post("/api/evaluate", async (req, res) => {

  const prompt = prompts[req.body.mode];
  const body = req.body.body;

  if (typeof prompt == "undefined" || typeof body == "undefined") return res.status(400).send();
  
  let total = "";
  try{
    for (let i = 1; i <= 10; i++){

      let conv = [
        { role: "system", content: prompt.prompt },
        { role: "user", content: body }
      ];

      if (total !== "") conv.push({ role: "assistant", content: total });

      const response = (await openai.chat.completions.create({
        messages: conv,
        model: "gpt-4-turbo",
        response_format: { type: "json_object" },
        max_tokens: null
      })).choices[0];
      
      total += response.message.content;

      switch (response.finish_reason){
        case "stop":  
          console.log(total);
          return res.send({ status: "ok", body: JSON.parse(total)});
        case "content_filter": 
          return res.status(422).send({ status: "err", message: "The AI refuses to evaluate your paragraph, please adjust your wording and try again." });
        case "length":
          continue;
        default: 
          throw new Error();
      }
    }
    throw new Error();
  } catch (error) {
        console.log(error);
        return res.status(500).send({ status: "err", message: "An error occured when trying to process your request" });
  }

});

const port = process.env.PORT;

app.listen(port, () => {
  console.log("Finished!");
  console.log(`Server running on port ${port}`);
});
