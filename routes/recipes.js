var express = require('express');
var router = express.Router();

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
const dynamodbTableName = process.env.USERS_TABLE

// create new recipe to user's recipes
router.post('/create', (req, res) => {

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

// Read recipe by recipe id
router.get('/read', (req, res) => {
  const { email, id } = req.query;

  if (!email || !id) {
    res.status(400).json({ error: 'email and recipe id are mandatory' })
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

      res.json(recipes[recipeIndex]);
    })
    .catch(err => res.status(500).json({ error: err }))
})

// Read all user's recipes
router.get('/read_all', (req, res) => {
  const { email } = req.query;

  if (!email || !id) {
    res.status(400).json({ error: 'email and recipe id are mandatory' })
    return
  }

  ddbClient.send(new GetCommand({ TableName: dynamodbTableName, Key: { email: email } }))
    .then(response => {
      const user = response.Item
      const recipes = user.recipes;

      if (!recipes || !recipes.length) throw 'user does not have recipes'

      res.json(recipes);
    })
    .catch(err => res.status(500).json({ error: err }))
})

// Update recipe by recipe id
router.post('/update', (req, res) => {
  const { email, recipe } = req.body;

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

      recipes.splice(recipeIndex, 1, recipe);

      return ddbClient.send(new PutCommand({ TableName: dynamodbTableName, Item: user }))
    })
    .then(response => {
      res.json(response)
    })
    .catch(err => res.status(500).json({ error: err }))
})

// Delete recipe by recipe id
router.get('/delete', (req, res) => {
  const { email, id } = req.query;

  if (!email || !id) {
    res.status(400).json({ error: 'email and recipe id are mandatory' })
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