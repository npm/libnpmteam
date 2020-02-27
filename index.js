'use strict'

const eu = encodeURIComponent
const npmFetch = require('npm-registry-fetch')
const validate = require('aproba')

const cmd = module.exports = {}

cmd.create = (entity, opts = { description: undefined }) => {
  return Promise.resolve().then(() => {
    const { scope, team } = splitEntity(entity)
    validate('SSO', [scope, team, opts])
    const uri = `/-/org/${eu(scope)}/team`
    return npmFetch.json(uri, {
      ...opts,
      method: 'PUT',
      scope,
      body: { name: team, description: opts.description }
    })
  })
}

cmd.destroy = (entity, opts = {}) => {
  return Promise.resolve().then(() => {
    const { scope, team } = splitEntity(entity)
    validate('SSO', [scope, team, opts])
    const uri = `/-/team/${eu(scope)}/${eu(team)}`
    return npmFetch.json(uri, {
      ...opts,
      method: 'DELETE',
      scope
    })
  })
}

cmd.add = (user, entity, opts = {}) => {
  return Promise.resolve().then(() => {
    const { scope, team } = splitEntity(entity)
    validate('SSO', [scope, team, opts])
    const uri = `/-/team/${eu(scope)}/${eu(team)}/user`
    return npmFetch.json(uri, {
      ...opts,
      method: 'PUT',
      scope,
      body: { user }
    })
  })
}

cmd.rm = (user, entity, opts = {}) => {
  return Promise.resolve().then(() => {
    const { scope, team } = splitEntity(entity)
    validate('SSO', [scope, team, opts])
    const uri = `/-/team/${eu(scope)}/${eu(team)}/user`
    return npmFetch.json(uri, {
      ...opts,
      method: 'DELETE',
      scope,
      body: { user }
    })
  })
}

cmd.lsTeams = (scope, opts = {}) => {
  return Promise.resolve().then(() => {
    return cmd.lsTeams.stream(scope, { ...opts }).collect()
  })
}
cmd.lsTeams.stream = (scope, opts = {}) => {
  validate('SO', [scope, opts])
  const uri = `/-/org/${eu(scope)}/team`
  return npmFetch.json.stream(uri, '.*', {
    ...opts,
    query: { format: 'cli' }
  })
}

cmd.lsUsers = (entity, opts = {}) => {
  return Promise.resolve().then(() => {
    return cmd.lsUsers.stream(entity, { ...opts }).collect()
  })
}
cmd.lsUsers.stream = (entity, opts = {}) => {
  const { scope, team } = splitEntity(entity)
  validate('SSO', [scope, team, opts])
  const uri = `/-/team/${eu(scope)}/${eu(team)}/user`
  return npmFetch.json.stream(uri, '.*', {
    ...opts,
    query: { format: 'cli' }
  })
}

cmd.edit = () => {
  throw new Error('edit is not implemented yet')
}

function splitEntity (entity = '') {
  const [, scope, team] = entity.match(/^@?([^:]+):(.*)$/) || []
  return { scope, team }
}
