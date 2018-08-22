'use strict'

const eu = encodeURIComponent
const figgyPudding = require('figgy-pudding')
const getStream = require('get-stream')
const JSONStream = require('JSONStream')
const npmFetch = require('npm-registry-fetch')
const {PassThrough} = require('stream')
const validate = require('aproba')

const TeamConfig = figgyPudding({
  description: {},
  Promise: {default: () => Promise}
})

const cmd = module.exports = {}

cmd.create = (entity, opts) => {
  opts = TeamConfig(opts)
  return pwrap(opts, () => {
    const {scope, team} = splitEntity(entity)
    validate('SSO', [scope, team, opts])
    return npmFetch.json(`/-/org/${eu(scope)}/team`, opts.concat({
      method: 'PUT',
      scope,
      body: {name: team, description: opts.description}
    }))
  })
}

cmd.destroy = (entity, opts) => {
  opts = TeamConfig(opts)
  return pwrap(opts, () => {
    const {scope, team} = splitEntity(entity)
    validate('SSO', [scope, team, opts])
    return npmFetch.json(`/-/team/${eu(scope)}/${eu(team)}`, opts.concat({
      method: 'DELETE',
      scope
    }))
  })
}

cmd.add = (user, entity, opts) => {
  opts = TeamConfig(opts)
  return pwrap(opts, () => {
    const {scope, team} = splitEntity(entity)
    validate('SSO', [scope, team, opts])
    return npmFetch.json(`/-/team/${eu(scope)}/${eu(team)}/user`, opts.concat({
      method: 'PUT',
      scope,
      body: {user}
    }))
  })
}

cmd.rm = (user, entity, opts) => {
  opts = TeamConfig(opts)
  return pwrap(opts, () => {
    const {scope, team} = splitEntity(entity)
    validate('SSO', [scope, team, opts])
    return npmFetch.json(`/-/team/${eu(scope)}/${eu(team)}/user`, opts.concat({
      method: 'DELETE',
      scope,
      body: {user}
    }))
  })
}

cmd.lsTeams = (...args) => getStream.array(cmd.lsTeams.stream(...args))
cmd.lsTeams.stream = (scope, opts) => {
  opts = TeamConfig(opts)
  const parser = JSONStream.parse('.*')
  pwrap(opts, () => {
    validate('SO', [scope, opts])
    return npmFetch(`/-/org/${eu(scope)}/team`, opts.concat({
      query: {format: 'cli'}
    })).then(res => {
      // NOTE: I couldn't figure out how to test the following, so meh
      /* istanbul ignore next */
      res.body.on('error', err => parser.emit('error', err))
      res.body.pipe(parser)
    })
  }).catch(err => parser.emit('error', err))
  /* istanbul ignore next */
  parser.on('error', err => pt.emit('error', err))
  const pt = new PassThrough({objectMode: true})
  return parser.pipe(pt)
}

cmd.lsUsers = (...args) => getStream.array(cmd.lsUsers.stream(...args))
cmd.lsUsers.stream = (entity, opts) => {
  opts = TeamConfig(opts)
  const parser = JSONStream.parse('.*')
  pwrap(opts, () => {
    const {scope, team} = splitEntity(entity)
    validate('SSO', [scope, team, opts])
    return npmFetch(`/-/team/${eu(scope)}/${eu(team)}/user`, opts.concat({
      query: {format: 'cli'}
    })).then(res => {
      // NOTE: I couldn't figure out how to test the following, so meh
      /* istanbul ignore next */
      res.body.on('error', err => parser.emit('error', err))
      res.body.pipe(parser)
    })
  }).catch(err => parser.emit('error', err))
  /* istanbul ignore next */
  parser.on('error', err => pt.emit('error', err))
  const pt = new PassThrough({objectMode: true})
  return parser.pipe(pt)
}

cmd.edit = () => {
  throw new Error('edit is not implemented yet')
}

function splitEntity (entity = '') {
  let [, scope, team] = entity.match(/^@?([^:]+):(.*)$/) || []
  return {scope, team}
}

function pwrap (opts, fn) {
  return new opts.Promise((resolve, reject) => {
    fn().then(resolve, reject)
  })
}
