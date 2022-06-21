/* eslint-disable space-before-function-paren */
require('dotenv').config()
const express = require('express')
const res = require('express/lib/response')
const app = express()
const PORT = process.env.PORT || 3000
const data = './data.json'
const fs = require('fs')

app.use(express.json())

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT)
})

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Main Page' })
})

app.get('/recipes', getRecipes, (req, res) => {
  const recipes = res.result.recipes
  const recipeNamesList = []
  for (const recipe in recipes) {
    recipeNamesList[recipe] = recipes[recipe].name
  }
  res.status(200).json({ recipeNames: recipeNamesList })
})

app.get('/recipes/details/:name', getRecipes, (req, res) => {
  const name = req.params.name
  const recipes = res.result.recipes
  const recipeDetails = {}
  for (const recipe in recipes) {
    if (recipes[recipe].name === name) {
      if (recipes[recipe].ingredients) {
        recipeDetails.ingredients = recipes[recipe].ingredients
      }
      if (recipes[recipe].instructions) {
        recipeDetails.numSteps = recipes[recipe].instructions.length
      }
      return res.status(200).json({ details: recipeDetails })
    }
  }
  res.status(200).json({})
})

app.post('/recipes', requestBodyParser, getRecipes, (req, res) => {
  const body = res.body
  const recipes = res.result.recipes

  for (const recipe in recipes) {
    if (recipes[recipe].name === body.name) {
      return res.status(400).json({ error: 'Recipe already exists' })
    }
  }

  recipes.push(body)
  const newData = JSON.stringify({ recipes }, null, 2)
  postAndPutRecipes(data, newData)

  return res.status(201).json()
})

app.put('/recipes', requestBodyParser, getRecipes, (req, res) => {
  const body = res.body
  const recipes = res.result.recipes

  for (const recipe in recipes) {
    if (recipes[recipe].name === body.name) {
      recipes[recipe].ingredients = body.ingredients
      recipes[recipe].instructions = body.instructions

      const newData = JSON.stringify({ recipes }, null, 2)
      postAndPutRecipes(data, newData)

      return res.status(204).json()
    }
  }
  return res.status(404).json({ error: 'Recipe does not exist' })
})

function getRecipes(req, res, next) {
  fs.readFile(data, 'utf8', (err, result) => {
    if (err) {
      console.log('Error reading file from disk:', err)
      res.status(500).json({ message: err.message })
    }
    try {
      res.result = JSON.parse(result)
      next()
    } catch (err) {
      console.log('Error parsing JSON string:', err)
      res.status(500).json({ message: err.message })
    }
  })
}

function requestBodyParser(req, res, next) {
  const body = {
    name: req.body.name,
    ingredients: req.body.ingredients,
    instructions: req.body.instructions
  }
  if (!body.name || !body.ingredients || !body.instructions) {
    return res.status(404).json({ error: 'Name, Ingredients, & Instructions required' })
  }
  res.body = body
  next()
}

function postAndPutRecipes(data, newData) {
  fs.writeFile(data, newData, (err, result) => {
    if (err) {
      console.log('Error writing file to disk:', err)
      res.status(500).json({ message: err.message })
    }
  })
}
