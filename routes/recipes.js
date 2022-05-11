var express = require('express');
var router = express.Router();

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
const dynamodbTableName = process.env.USERS_TABLE

router.post('/add', (req, res) => {

  const { email, recipe } = req.body;

  if (!email) {
    res.status(400).json({ error: 'email is mandatory' })
    return
  }

  ddbClient.send(new GetCommand({ TableName: dynamodbTableName, Key: { email: email } }))
    .then(response => {
      const user = response.Item
      const recipes = user.recipes ? user.recipes : [];
      recipes.push(recipe);
      user.recipes = recipes;
      return ddbClient.send(new PutCommand({ TableName: dynamodbTableName, Item: user }))
    })
    .then(response => {
      res.json(response)
    })
    .catch(err => res.status(500).json({ error: err }))
})

router.post('/delete', (req, res) => {
  const { email, id } = req.body;

  if (!email) {
    res.status(400).json({ error: 'email is mandatory' })
    return
  }

  ddbClient.send(new GetCommand({ TableName: dynamodbTableName, Key: { email: email } }))
    .then(response => {
      const user = response.Item
      const recipes = user.recipes;
      if (!recipes || !recipes.length) throw 'user does not have recipes'

      // try to locate recipe
      let recipeIndex;
      recipes.every((recipe, index) => {
        if (recipe.id === id) {
          recipeIndex = index;
          return false
        }
        return true
      });

      // if located, remove it. else, throw error
      if (recipeIndex === undefined) throw "recipe not found in user's recipes"

      recipes.splice(recipeIndex, 1)

      return ddbClient.send(new PutCommand({ TableName: dynamodbTableName, Item: user }))
    })
    .then(response => {
      res.json(response)
    })
    .catch(err => res.status(500).json({ error: err }))
})

module.exports = router;