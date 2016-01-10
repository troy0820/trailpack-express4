/**
 * Created by jaumard on 16/12/2015.
 */
'use strict'

const _ = require('lodash')
const express = require('express')
const expressBodyParser = require('body-parser')
const consolidate = require('consolidate')
const expressBoom = require('express-boom')

module.exports = {
  port: null,
  host: null,
  serverRoutes: {},
  serverPolicies: {},
  serverHandlers: {},

  createServer (config) {
    const server = express()
    this.port = config.port
    this.host = config.host
    server.use(express.static('.tmp/public')) //FIXME: need to change this and get output directory from app config
    server.use(expressBodyParser.urlencoded({extended: false}))
    server.use(expressBodyParser.json())
    server.use(expressBoom())
    return server
  },

  registerViews (app, server) {
    const viewEngine = app.config.views.engine

    if (!viewEngine) {
      app.log.info('config.views: No view engine is set')
      return
    }

    server.set('views', process.cwd() + '/views')
    server.engine('html', consolidate[viewEngine])
    server.set('view engine', 'html')

  },

  mapMethods(methods, handlers){
    handlers.forEach(handler => {
      const parts = handler.split('.')
      this.serverHandlers[handler] = methods[parts[0]][parts[1]]
    })
  },

  registerMethods (app, server) {
    const routes = app.routes.reverse() //reverse routes to have parametize route at the end
    const controllers = app.api.controllers
    const policies = app.api.policies
    const handlers = _.unique(_.pluck(routes, 'handler'))
    const prerequisites = _.unique(_.pluck(_.flatten(_.pluck(routes, 'config.pre')), 'method'))
    this.mapMethods(controllers, handlers)
    this.mapMethods(policies, prerequisites)

    _.each(app.config.policies, (policy, controllerId) => {
      _.each(policy, (handlers, methodId) => {
        const id = controllerId + '.' + methodId
        if (handlers instanceof Array) {
          this.serverPolicies[id] = []
          handlers.forEach(h => {
            this.serverPolicies[id].push(this.serverHandlers[h])
          })
        }
        else {
          this.serverPolicies[id] = [this.serverHandlers[handlers]]
        }
      })
    })

    routes.forEach(route => {
      if (route.method == '*')route.method = 'ALL'

      if (route.method instanceof Array) {
        route.method.forEach(method => {
          this.serverRoutes[method + ' ' + route.path] = route
        })
      }
      else {
        this.serverRoutes[route.method + ' ' + route.path] = route
      }
    })
  },

  registerRoutes (app, server) {

    _.each(this.serverRoutes, (route, path) => {

      const parts = path.split(' ')
      if (parts[0].toLowerCase() == 'patch')return

      let methods = []
      if (this.serverPolicies[route.handler]) {
        methods = methods.concat(this.serverPolicies[route.handler].slice())
      }

      methods.push(this.serverHandlers[route.handler])
      methods.unshift(route.path.replace(/{/g, ':').replace(/}/g, ''))//FIXME: Format route to express4 protocol, maybe `trailpack-router` can do this

      server[parts[0].toLowerCase()].apply(server, methods)
    })
  },

  start (server) {
    return new Promise((resolve, reject) => {
      server.listen(this.port, this.host, function (err) {
        if (err) return reject(err)

        resolve()
      })
    })
  }
}