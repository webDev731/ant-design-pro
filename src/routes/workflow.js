const _ = require('lodash')

let requester

function init (server, { middlewares, helpers } = {}) {
  const {
    checkPermissions
  } = middlewares
  const {
    wrapAction,
    populateRequesterParams
  } = helpers

  server.get({
    name: 'workflow.list',
    path: '/workflows'
  }, checkPermissions([
    'workflow:list:all'
  ]), wrapAction(async (req, res) => {
    const fields = [
      'orderBy',
      'order',
      'nbResultsPerPage',

      // cursor pagination
      'startingAfter',
      'endingBefore',

      'id',
      'createdDate',
      'updatedDate',
      'event',
      'active',
    ]

    const payload = _.pick(req.query, fields)

    let params = populateRequesterParams(req)({
      type: 'list'
    })

    params = Object.assign({}, params, payload)

    const result = await requester.send(params)
    return result
  }))

  server.get({
    name: 'workflow.read',
    path: '/workflows/:id'
  }, checkPermissions([
    'workflow:read:all'
  ]), wrapAction(async (req, res) => {
    const { id } = req.params
    const fields = [
      'logs'
    ]
    const payload = _.pick(req.query, fields)

    let params = populateRequesterParams(req)({
      type: 'read',
      workflowId: id
    })

    params = Object.assign({}, params, payload)

    const result = await requester.send(params)
    return result
  }))

  server.post({
    name: 'workflow.create',
    path: '/workflows'
  }, checkPermissions([
    'workflow:create:all'
  ], { checkData: true }), wrapAction(async (req, res) => {
    const fields = [
      'name',
      'description',
      'notifyUrl',
      'context',
      'event',
      'run',
      'computed',
      'apiVersion',
      'active',
      'metadata',
      'platformData'
    ]

    const payload = _.pick(req.body, fields)

    let params = populateRequesterParams(req)({
      type: 'create'
    })

    params = Object.assign({}, params, payload)

    const result = await requester.send(params)
    return result
  }))

  server.patch({
    name: 'workflow.update',
    path: '/workflows/:id'
  }, checkPermissions([
    'workflow:edit:all'
  ], { checkData: true }), wrapAction(async (req, res) => {
    const workflowId = req.params.id
    const fields = [
      'name',
      'description',
      'notifyUrl',
      'context',
      'event',
      'run',
      'computed',
      'apiVersion',
      'active',
      'metadata',
      'platformData'
    ]

    const payload = _.pick(req.body, fields)

    let params = populateRequesterParams(req)({
      type: 'update',
      workflowId
    })

    params = Object.assign({}, params, payload)

    const result = await requester.send(params)
    return result
  }))

  server.del({
    name: 'workflow.remove',
    path: '/workflows/:id'
  }, checkPermissions([
    'workflow:remove:all'
  ]), wrapAction(async (req, res) => {
    const { id } = req.params

    const params = populateRequesterParams(req)({
      type: 'remove',
      workflowId: id
    })

    const result = await requester.send(params)
    return result
  }))

  // //////////// //
  // WORKFLOW LOG //
  // //////////// //

  server.get({
    name: 'workflow.listLogs',
    path: '/workflow-logs'
  }, checkPermissions([
    'workflowLog:list:all'
  ]), wrapAction(async (req, res) => {
    const fields = [
      'orderBy',
      'order',
      'nbResultsPerPage',

      // cursor pagination
      'startingAfter',
      'endingBefore',

      'id',
      'createdDate',
      'workflowId',
      'eventId',
      'runId',
    ]

    const payload = _.pick(req.query, fields)

    let params = populateRequesterParams(req)({
      type: 'listLogs',
      logType: req.query.type,
    })

    params = Object.assign({}, params, payload)

    return requester.send(params)
  }))

  server.get({
    name: 'workflow.getLogsHistory',
    path: '/workflow-logs/history'
  }, checkPermissions([
    'workflowLog:stats:all' // only system can request this endpoint for now
  ]), wrapAction(async (req, res) => {
    const fields = [
      'orderBy',
      'order',
      'nbResultsPerPage',
      'startingAfter',
      'endingBefore',

      'groupBy',

      'id',
      // 'type' // parsing manually below to avoid conflict with côte requester 'type'
      'createdDate',
      'workflowId',
      'eventId',
      'runId',
    ]

    const payload = _.pick(req.query, fields)

    let params = populateRequesterParams(req)({
      type: 'getLogsHistory'
    })

    params = Object.assign({}, params, payload)

    if (req.query) params.logType = req.query.type

    return requester.send(params)
  }))

  server.get({
    name: 'workflow.readLog',
    path: '/workflow-logs/:id'
  }, checkPermissions([
    'workflowLog:read:all'
  ]), wrapAction(async (req, res) => {
    const { id } = req.params

    const params = populateRequesterParams(req)({
      type: 'readLog',
      workflowLogId: id
    })

    return requester.send(params)
  }))
}

function start ({ communication }) {
  const { getRequester } = communication

  requester = getRequester({
    name: 'Workflow route > Workflow Requester',
    key: 'workflow'
  })
}

function stop () {
  requester.close()
  requester = null
}

module.exports = {
  init,
  start,
  stop
}
