/**
 * Created by jaumard on 16/12/2015.
 */
'use strict'

const Trailpack = require('trailpack')
const lib = require('./lib')
const _ = require('lodash')

/**
 * Express4 Trailpack
 *
 * @class Express4
 * @see {@link http://trailsjs.io/doc/trailpack
 *
 * Bind application routes to Express4.js (from trailpack-router)
 */
module.exports = class Express4 extends Trailpack {

	/**
	 * Ensure that config/web is valid, and that no other competing web
	 * server trailpacks are installed (e.g. express)
	 */
	validate () {
		if (_.contains(_.keys(this.app.config.main.packs), 'express4', 'koa', 'koa2', 'restify')) {
			return Promise.reject(new Error('There is another web services trailpack installed that conflicts with trailpack-hapi!'))
		}

		return Promise.resolve()
	}

	/**
	 * Start Express4 Server
	 */
	initialize () {
		const server = lib.Server.createServer(this.app.config.web)

		lib.Server.registerMethods(this.app, server)
		lib.Server.registerRoutes(this.app, server)
		lib.Server.registerViews(this.app, server)

		return lib.Server.start(server)
	}

	constructor (app, config) {
		super(app, {
			config: require('./config'),
			api: require('./api'),
			pkg: require('./package')
		})
	}

}
