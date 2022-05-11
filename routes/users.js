var express = require('express');
var router = express.Router();
const aws = require('aws-sdk');
const bcryptjs = require('bcryptjs');

aws.config.update({
  region: 'us-east-1'
});
const dynamodb = new aws.DynamoDB.DocumentClient();
const dynamodbTableName = process.env.USERS_TABLE

// verify user credentials
router.post('/auth', async (req, res, next) => {
  const { email, password } = req.body;
  const lowerCaseEmail = email.toLowerCase();

  const params = {
    TableName: dynamodbTableName,
    Key: {
      email: lowerCaseEmail,
    }
  }

  await dynamodb
    .get(params)
    .promise()
    .then(response => {
      console.log(response);
      const userDoc = response.Item;
      if (!userDoc || !bcryptjs.compareSync(password, userDoc.passwordHash)) {

        return res.status(400).json({ error: 'email or password is invalid' });
      }
      return res.json(userDoc);
    }, error => {
      console.error(error);
      return res.status(500).send(error);
    })
})

// create user
router.post('/new', async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are mandatory' })
    return
  }

  const passwordHash = bcryptjs.hashSync(password, 10);
  const lowerCaseEmail = email.toLowerCase();
  const params = {
    TableName: dynamodbTableName,
    Item: {
      email: lowerCaseEmail,
      passwordHash
    },
    ConditionExpression: "attribute_not_exists(email)"
  }

  dynamodb
    .put(params)
    .promise()
    .then(response => {
      console.log(response);
      return res.json({ email: lowerCaseEmail, passwordHash });
    })
    .catch(err => {
      console.log(err);
      return res.status(400).json({ error: 'The email already exists' });
    })
})

module.exports = router;
