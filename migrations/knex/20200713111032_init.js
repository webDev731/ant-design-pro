const { mergeFunction, mergeFunctionName } = require('../util/stl_jsonb_deep_merge')
const {
  createHypertable,
  addCompressionPolicy,
  createContinuousAggregate,
  removeContinuousAggregate,
} = require('../util/timescaleDB')

const timestampPrecision = 3 // 10E-3 = 1 millisecond

exports.up = async (knex) => {
  const { schema } = knex.client.connectionSettings || {}
  // We need to inject schema name in function body for recursion
  if (!schema) throw new Error(`Schema name required to create ${mergeFunctionName} function`)
  await knex.schema.raw(mergeFunction(schema))

  await knex.schema.createTable('apiKey', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('name')
    table.string('key')
    table.jsonb('roles')
    table.jsonb('permissions')
    table.jsonb('readNamespaces')
    table.jsonb('editNamespaces')
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index(['createdDate', 'id'], 'apiKey_createdDate_id_index')
    table.index(['updatedDate', 'id'], 'apiKey_updatedDate_id_index')
    table.unique('key', 'apiKey_key_unique')
  })

  await knex.schema.createTable('assessment', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('statement')
    table.string('status')
    table.string('assetId')
    table.string('transactionId')
    table.string('ownerId')
    table.string('takerId')
    table.string('emitterId')
    table.string('receiverId')
    table.jsonb('signers')
    table.jsonb('signCodes')
    table.integer('nbSigners')
    table.string('expirationDate', 24)
    table.string('signedDate', 24)
    table.string('assessmentDate', 24)
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index('assetId', 'assessment_assetId_index')
    table.index('ownerId', 'assessment_ownerId_index')
    table.index('takerId', 'assessment_takerId_index')
    table.index('emitterId', 'assessment_emitterId_index')
    table.index('receiverId', 'assessment_receiverId_index')
  })

  await knex.schema.createTable('asset', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('name')
    table.string('ownerId')
    table.text('description')
    table.string('categoryId')
    table.jsonb('locations')
    table.boolean('validated')
    table.boolean('active')
    table.string('assetTypeId')
    table.integer('quantity')
    table.string('currency')
    table.float('price')
    table.jsonb('customAttributes')
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index(['createdDate', 'id'], 'asset_createdDate_id_index')
    table.index(['updatedDate', 'id'], 'asset_updatedDate_id_index')
    table.index('ownerId', 'asset_ownerId_index')
    table.index('categoryId', 'asset_categoryId_index')
    table.index('assetTypeId', 'asset_assetTypeId_index')
    table.index('customAttributes', 'asset_customAttributes_gin_index', 'GIN')
  })

  await knex.schema.createTable('assetType', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('name')
    table.boolean('timeBased')
    table.boolean('infiniteStock')
    table.jsonb('pricing')
    table.jsonb('timing')
    table.jsonb('unavailableWhen')
    table.jsonb('transactionProcess')
    table.jsonb('namespaces')
    table.boolean('isDefault')
    table.boolean('active')
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index(['createdDate', 'id'], 'assetType_createdDate_id_index')
    table.index(['updatedDate', 'id'], 'assetType_updatedDate_id_index')
  })

  await knex.schema.createTable('authMean', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('password')
    table.string('provider')
    table.string('identifier')
    table.jsonb('tokens')
    table.string('userId')

    table.index('identifier', 'authMean_identifier_index')
    table.index('userId', 'authMean_userId_index')
  })

  await knex.schema.createTable('authToken', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('type')
    table.string('value')
    table.string('userId')
    table.jsonb('reference')
    table.string('expirationDate', 24)

    table.unique('value', 'authToken_value_unique')
    table.index('userId', 'authToken_userId_index')
  })

  await knex.schema.createTable('availability', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('assetId')
    table.string('startDate', 24)
    table.string('endDate', 24)
    table.string('quantity')
    table.string('recurringPattern')
    table.string('recurringTimezone')
    table.jsonb('recurringDuration')
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index(['createdDate', 'id'], 'availability_createdDate_id_index')
    table.index(['updatedDate', 'id'], 'availability_updatedDate_id_index')
    table.index('assetId', 'availability_assetId_index')
  })

  await knex.schema.createTable('category', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('name')
    table.string('parentId')
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index(['createdDate', 'id'], 'category_createdDate_id_index')
    table.index(['updatedDate', 'id'], 'category_updatedDate_id_index')
  })

  await knex.schema.createTable('config', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('access')
    table.jsonb('stelace')
    table.jsonb('custom')
    table.jsonb('theme')

    table.unique('access', 'config_access_unique')
  })

  await knex.schema.createTable('customAttribute', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('name')
    table.string('type')
    table.jsonb('listValues')
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index(['createdDate', 'id'], 'customAttribute_createdDate_id_index')
    table.index(['updatedDate', 'id'], 'customAttribute_updatedDate_id_index')
    table.unique('name', 'customAttribute_name_unique')
  })

  await knex.schema.createTable('document', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('authorId')
    table.string('targetId')
    table.string('type')
    table.string('label')
    table.jsonb('data')
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index(['createdDate', 'id'], 'document_createdDate_id_index')
    table.index(['updatedDate', 'id'], 'document_updatedDate_id_index')
    table.index('type', 'document_type_index')
    table.index('authorId', 'document_authorId_index')
    table.index('targetId', 'document_targetId_index')
    table.index('data', 'document_data_gin_index', 'GIN')
  })

  await knex.schema.createTable('entry', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('collection')
    table.string('locale')
    table.string('name')
    table.jsonb('fields')
    table.jsonb('metadata')

    table.index(['createdDate', 'id'], 'entry_createdDate_id_index')
    table.index(['updatedDate', 'id'], 'entry_updatedDate_id_index')
    table.index('collection', 'entry_collection_index')
    table.index('name', 'entry_name_index')
    table.unique(['locale', 'name'], 'entry_locale_name_unique')
  })

  await knex.schema.createTable('event', table => {
    table.string('id')
    table.string('createdDate', 24)
    table.timestamp('createdTimestamp', { useTz: true, precision: timestampPrecision })
    table.string('type')
    table.string('objectType')
    table.string('objectId')
    table.jsonb('object')
    table.jsonb('changesRequested')
    table.jsonb('relatedObjectsIds')
    table.string('apiVersion')
    table.string('parentId')
    table.string('emitter')
    table.string('emitterId')
    table.jsonb('metadata')

    table.index('id', 'event_id_index')
    table.index(['createdTimestamp', 'id'], 'event_createdTimestamp_id_index')
    table.index('type', 'event_type_index')
    table.index('objectId', 'event_objectId_index')
    table.index('objectType', 'event_objectType_index')
    table.index('object', 'event_object_gin_index', 'GIN')
    table.index('parentId', 'event_parentId_index')
    table.index('emitterId', 'event_emitterId_index')
    table.index('metadata', 'event_metadata_gin_index', 'GIN')
  })

  await knex.schema.createTable('internalAvailability', table => {
    table.bigIncrements('id').primary()
    table.string('assetId')
    table.string('transactionId')
    table.string('assetTypeId')
    table.string('transactionStatus')
    table.boolean('unavailable')
    table.specificType('datesRange', 'tstzrange')
    table.timestamp('startDate')
    table.timestamp('endDate')
    table.integer('quantity')

    table.index('assetId', 'internalAvailability_asset_index')
    table.index('transactionId', 'internalAvailability_transactionId_index')
    table.index(['assetId', 'datesRange'], 'internalAvailability_assetId_datesRange_index')
  })

  await knex.schema.createTable('message', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('topicId')
    table.string('conversationId')
    table.text('content')
    table.jsonb('attachments')
    table.boolean('read')
    table.string('senderId')
    table.string('receiverId')
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index(['createdDate', 'id'], 'message_createdDate_id_index')
    table.index(['updatedDate', 'id'], 'message_updatedDate_id_index')
    table.index('conversationId', 'message_conversationId_index')
    table.index('topicId', 'message_topicId_index')
    table.index('senderId', 'message_senderId_index')
    table.index('receiverId', 'message_receiverId_index')
  })

  await knex.schema.createTable('order', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.jsonb('lines')
    table.jsonb('moves')
    table.float('amountDue')
    table.float('amountPaid')
    table.float('amountRemaining')
    table.string('currency')
    table.string('payerId')
    table.boolean('paymentAttempted')
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index('lines', 'order_lines_gin_index', 'GIN')
    table.index('moves', 'order_moves_gin_index', 'GIN')
    table.index('payerId', 'order_payerId_index')
  })

  await knex.schema.createTable('role', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('name')
    table.string('value')
    table.jsonb('customRole')
    table.string('parentId')
    table.jsonb('permissions')
    table.jsonb('readNamespaces')
    table.jsonb('editNamespaces')
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index(['createdDate', 'id'], 'role_createdDate_id_index')
    table.index(['updatedDate', 'id'], 'role_updatedDate_id_index')
    table.index('value', 'role_value_index')
  })

  await knex.schema.createTable('task', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('executionDate', 24)
    table.string('recurringPattern')
    table.string('recurringTimezone')
    table.string('eventType')
    table.jsonb('eventMetadata')
    table.string('eventObjectId')
    table.boolean('active')
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index(['createdDate', 'id'], 'task_createdDate_id_index')
    table.index(['updatedDate', 'id'], 'task_updatedDate_id_index')
    table.index('eventType', 'task_eventType_index')
    table.index('eventObjectId', 'task_eventObjectId_index')
  })

  await knex.schema.createTable('transaction', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('assetId')
    table.jsonb('assetSnapshot')
    table.string('assetTypeId')
    table.jsonb('assetType')
    table.string('status')
    table.jsonb('statusHistory')
    table.string('ownerId')
    table.string('takerId')
    table.integer('quantity')
    table.string('startDate', 24)
    table.string('endDate', 24)
    table.jsonb('duration')
    table.string('timeUnit')
    table.float('unitPrice')
    table.float('value')
    table.float('ownerAmount')
    table.float('takerAmount')
    table.float('platformAmount')
    table.float('ownerFees')
    table.float('takerFees')
    table.string('currency')
    table.string('completedDate', 24)
    table.string('cancelledDate', 24)
    table.string('cancellationReason')
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index(['createdDate', 'id'], 'transaction_createdDate_id_index')
    table.index(['updatedDate', 'id'], 'transaction_updatedDate_id_index')
    table.index('assetTypeId', 'transaction_assetTypeId_index')
    table.index('ownerId', 'transaction_ownerId_index')
    table.index('takerId', 'transaction_takerId_index')
    table.index('assetId', 'transaction_assetId_index')
  })

  await knex.schema.createTable('user', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('username')
    table.string('displayName')
    table.string('firstname')
    table.string('lastname')
    table.string('email')
    table.text('description')
    table.jsonb('roles')
    table.jsonb('organizations')
    table.string('orgOwnerId')
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index(['createdDate', 'id'], 'user_createdDate_id_index')
    table.index(['updatedDate', 'id'], 'user_updatedDate_id_index')
    table.unique('username', 'user_username_unique')
    table.index('organizations', 'user_organizations_gin_index', 'GIN')
    table.index('orgOwnerId', 'user_orgOwnerId_index')
    table.index('roles', 'user_roles_gin_index', 'GIN')
  })

  await knex.schema.createTable('webhook', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('name')
    table.string('targetUrl')
    table.string('event')
    table.string('apiVersion')
    table.boolean('active')
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index(['createdDate', 'id'], 'webhook_createdDate_id_index')
    table.index(['updatedDate', 'id'], 'webhook_updatedDate_id_index')
    table.index('event', 'webhook_event_index')
  })

  await knex.schema.createTable('webhookLog', table => {
    table.string('id')
    table.string('createdDate', 24)
    table.timestamp('createdTimestamp', { useTz: true, precision: timestampPrecision })
    table.string('webhookId')
    table.string('eventId')
    table.string('status')
    table.jsonb('metadata')

    table.index('id', 'webhookLog_id_index')
    table.index(['createdTimestamp', 'id'], 'webhookLog_createdTimestamp_id_index')
    table.index('status', 'webhookLog_status_index')
    table.index('webhookId', 'webhookLog_webhookId_index')
    table.index('eventId', 'webhookLog_eventId_index')
  })

  await knex.schema.createTable('workflow', table => {
    table.string('id').primary()
    table.string('createdDate', 24)
    table.string('updatedDate', 24)
    table.string('name')
    table.text('description')
    table.jsonb('context')
    table.string('notifyUrl')
    table.string('event')
    table.jsonb('run')
    table.jsonb('computed')
    table.boolean('active')
    table.jsonb('stats')
    table.string('apiVersion')
    table.jsonb('metadata')
    table.jsonb('platformData')

    table.index(['createdDate', 'id'], 'workflow_createdDate_id_index')
    table.index(['updatedDate', 'id'], 'workflow_updatedDate_id_index')
    table.index('event', 'workflow_event_index')
  })

  await knex.schema.createTable('workflowLog', table => {
    table.string('id')
    table.string('createdDate', 24)
    table.timestamp('createdTimestamp', { useTz: true, precision: timestampPrecision })
    table.string('workflowId')
    table.string('eventId')
    table.string('runId')
    table.string('type')
    table.integer('statusCode')
    table.jsonb('step')
    table.jsonb('metadata')

    table.index('id', 'workflowLog_id_index')
    table.index(['createdTimestamp', 'id'], 'workflowLog_createdTimestamp_id_index')
    table.index('type', 'workflowLog_type_index')
    table.index('workflowId', 'workflowLog_workflowId_index')
    table.index('eventId', 'workflowLog_eventId_index')
    table.index('runId', 'workflowLog_runId_index')
  })

  await knex.schema.raw(createHypertable(schema, 'event'))
  await knex.schema.raw(createHypertable(schema, 'webhookLog'))
  await knex.schema.raw(createHypertable(schema, 'workflowLog'))

  await knex.schema.raw(addCompressionPolicy(schema, 'event', 'objectId'))
  await knex.schema.raw(addCompressionPolicy(schema, 'webhookLog', 'webhookId'))
  await knex.schema.raw(addCompressionPolicy(schema, 'workflowLog', 'workflowId'))

  await knex.schema.raw(createContinuousAggregate({
    viewName: 'event_hourly',
    schema,
    table: 'event',
    interval: '1 hour',
    timeBucketLabel: 'hour',
    refreshLag: '1 hour',
    refreshInterval: '1 hour',
    secondaryColumn: 'type',
  }))
  await knex.schema.raw(createContinuousAggregate({
    viewName: 'event_daily',
    schema,
    table: 'event',
    interval: '1 day',
    timeBucketLabel: 'day',
    refreshLag: '1 day',
    refreshInterval: '1 day',
    secondaryColumn: 'type',
  }))
  await knex.schema.raw(createContinuousAggregate({
    viewName: 'event_monthly',
    schema,
    table: 'event',
    interval: '30 day',
    timeBucketLabel: 'month',
    refreshLag: '1 day',
    refreshInterval: '1 day',
    secondaryColumn: 'type',
  }))

  await knex.schema.raw(createContinuousAggregate({
    viewName: 'webhookLog_hourly',
    schema,
    table: 'webhookLog',
    interval: '1 hour',
    timeBucketLabel: 'hour',
    refreshLag: '1 hour',
    refreshInterval: '1 hour',
  }))
  await knex.schema.raw(createContinuousAggregate({
    viewName: 'webhookLog_daily',
    schema,
    table: 'webhookLog',
    interval: '1 day',
    timeBucketLabel: 'day',
    refreshLag: '1 day',
    refreshInterval: '1 day',
  }))
  await knex.schema.raw(createContinuousAggregate({
    viewName: 'webhookLog_monthly',
    schema,
    table: 'webhookLog',
    interval: '30 day',
    timeBucketLabel: 'month',
    refreshLag: '1 day',
    refreshInterval: '1 day',
  }))

  await knex.schema.raw(createContinuousAggregate({
    viewName: 'workflowLog_hourly',
    schema,
    table: 'workflowLog',
    interval: '1 hour',
    timeBucketLabel: 'hour',
    refreshLag: '1 hour',
    refreshInterval: '1 hour',
    secondaryColumn: 'type',
  }))
  await knex.schema.raw(createContinuousAggregate({
    viewName: 'workflowLog_daily',
    schema,
    table: 'workflowLog',
    interval: '1 day',
    timeBucketLabel: 'day',
    refreshLag: '1 day',
    refreshInterval: '1 day',
    secondaryColumn: 'type',
  }))
  await knex.schema.raw(createContinuousAggregate({
    viewName: 'workflowLog_monthly',
    schema,
    table: 'workflowLog',
    interval: '30 day',
    timeBucketLabel: 'month',
    refreshLag: '1 day',
    refreshInterval: '1 day',
    secondaryColumn: 'type',
  }))
}

exports.down = async (knex) => {
  const { schema } = knex.client.connectionSettings || {}

  if (!schema) throw new Error('Schema name required to remove continuous aggregates')

  await knex.schema.raw(removeContinuousAggregate({ viewName: 'workflowLog_hourly', schema }))
  await knex.schema.raw(removeContinuousAggregate({ viewName: 'workflowLog_daily', schema }))
  await knex.schema.raw(removeContinuousAggregate({ viewName: 'workflowLog_monthly', schema }))

  await knex.schema.raw(removeContinuousAggregate({ viewName: 'webhookLog_hourly', schema }))
  await knex.schema.raw(removeContinuousAggregate({ viewName: 'webhookLog_daily', schema }))
  await knex.schema.raw(removeContinuousAggregate({ viewName: 'webhookLog_monthly', schema }))

  await knex.schema.raw(removeContinuousAggregate({ viewName: 'event_hourly', schema }))
  await knex.schema.raw(removeContinuousAggregate({ viewName: 'event_daily', schema }))
  await knex.schema.raw(removeContinuousAggregate({ viewName: 'event_monthly', schema }))

  await knex.schema.dropTableIfExists('workflowLog')
  await knex.schema.dropTableIfExists('workflow')
  await knex.schema.dropTableIfExists('webhookLog')
  await knex.schema.dropTableIfExists('webhook')
  await knex.schema.dropTableIfExists('user')
  await knex.schema.dropTableIfExists('transaction')
  await knex.schema.dropTableIfExists('task')
  await knex.schema.dropTableIfExists('role')
  await knex.schema.dropTableIfExists('order')
  await knex.schema.dropTableIfExists('message')
  await knex.schema.dropTableIfExists('internalAvailability')
  await knex.schema.dropTableIfExists('event')
  await knex.schema.dropTableIfExists('entry')
  await knex.schema.dropTableIfExists('document')
  await knex.schema.dropTableIfExists('customAttribute')
  await knex.schema.dropTableIfExists('config')
  await knex.schema.dropTableIfExists('category')
  await knex.schema.dropTableIfExists('availability')
  await knex.schema.dropTableIfExists('authToken')
  await knex.schema.dropTableIfExists('authMean')
  await knex.schema.dropTableIfExists('assetType')
  await knex.schema.dropTableIfExists('asset')
  await knex.schema.dropTableIfExists('assessment')
  await knex.schema.dropTableIfExists('apiKey')

  await knex.schema.raw(`DROP FUNCTION IF EXISTS ${mergeFunctionName}(jsonb, jsonb)`)
}
