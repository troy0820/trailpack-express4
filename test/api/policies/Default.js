'use strict'
const Policy = require('trails-policy')

/**
 * @module Default
 * @description Test document Policy
 */
module.exports = class Default extends Policy {
  intercept(req, res, next) {
    res.status(201).json({result: 'intercept'})
  }

  success(req, res, next) {
    next()
  }

  fail(req, res, next) {
    res.status(500).send('Policy fail')
  }
}
