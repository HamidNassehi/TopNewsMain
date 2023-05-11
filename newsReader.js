const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') })
const http = require("http");
const express = require("express");
const app = express();
const portNumber = process.argv[2];
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
//app.use('/js', express.static(path.join(__dirname, 'js')));

const axios = require("axios");
// const newsPage = require("templates/.news1");
// app.use("/", newsPage);
// var data = {
//   title: 'Cleaning Supplies',
//   supplies: ['mop', 'broom', 'duster']
// };

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const db = process.env.MONGO_DB_NAME;
const collection = process.env.MONGO_COLLECTION;

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
const databaseAndCollection = { db: db, collection: collection };
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${userName}:${password}@cluster0.g4w2zac.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);
let prompt = "Stop to shutdown the server: \n";
process.stdout.write(prompt);
process.stdin.setEncoding("utf8");
process.stdin.on('readable', () => {
  let dataInput = process.stdin.read();
  if (dataInput !== null) {
    let command = dataInput.trim();
    if (command === "stop") {
      console.log("Shutting down the server");
      process.exit(0);
    } else {
      process.stdout.write(`Invalid command: ${command} \n`);
    }
    process.stdout.write(prompt);
    process.stdin.resume();
  }
});

app.get("/", (request, response) => {
  response.render("index");
});



app.get("/news1", async (request, response) => {
  try {
    const myApi = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=d8a2727e1cf2436a932dbdd2fc5a8fa8`);
    const articles = myApi.data.articles; // Access the articles array within the myApi.data object
   // console.log(myApi.data);
    response.render("news1", { articles });
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
    } else if (error.request) {
      console.log(error.request);
    } else {
      console.log("Error in Json", error.message);
    }
  }
});

app.get("/survey", (request, response) => {
  response.render("survey");
});

app.get("/retrieveInfo", (request, response) => {
  let applicantDataPoint = `http://localhost:${portNumber}/retrieveInfo`;
  response.render("retrieveInfo", { endpoint: applicantDataPoint });
});

app.post("/survey", (request, response) => {
  async function main() {

    const uri = `mongodb+srv://${userName}:${password}@cluster0.g4w2zac.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    try {
      await client.connect();
      const { name, number, Rate, info } = request.body;
      const movieData = {
        name,
        number,
        Rate,
        info
      };

      await insertMovie(client, databaseAndCollection, movieData);

    } catch (e) {
      console.error(e);
    } finally {
      await client.close();
    }
  }
  async function insertMovie(client, databaseAndCollection, newMovie) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newMovie);
  }
  main().catch(console.error);
  response.render("survey", {
    name: request.body.name,
    number: request.body.number,
    Rate: request.body.Rate,
    info: request.body.info,
  });
});

app.post("/retrieveInfo", function (request, response) {
  async function main() {
    const uri = `mongodb+srv://${userName}:${password}@cluster0.g4w2zac.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    let name = {
      name: request.body.name
    };

    try {
      await client.connect();
      const result = await building_emailer(client, databaseAndCollection, name);
      if (result) {
        const { name, number, Rate, info } = result;
        const variables = {
          name,
          number,
          Rate,
          info
        };
        response.render("infoprinter", variables);
      }
    } catch (e) {
      console.error(e);
    } finally {
      await client.close();
    }
  }

  async function building_emailer(client, databaseAndCollection, name) {
    const returning_result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).findOne(name);
    if (returning_result) {
      return returning_result;
    } else {
      console.log("Name not found! Please do the survey first.")
    }
  }
  main().catch(console.error);
});