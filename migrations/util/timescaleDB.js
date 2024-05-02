const { retentionLogDuration } = require('../../src/util/timeSeries')

// https://docs.timescale.com/latest/using-timescaledb/hypertables
// The option `migrateData` must be true if the table isn't empty, otherwise an error will be thrown
// It is suitable for small tables (e.g. less than 1M rows)

// For large existing tables, it may be worth to create an empty hypertable and to import data
// because it would take significantly less time
// https://docs.timescale.com/latest/getting-started/migrating-data
function createHypertable (schema, table, { column = 'createdTimestamp', migrateData = false } = {}) {
  return `
    SELECT public.create_hypertable(
      '${schema}."${table}"', '${column}'
      ${migrateData ? ', migrate_data => true' : ''}
    )
  `
}

// https://docs.timescale.com/latest/using-timescaledb/compression
function addCompressionPolicy (schema, table, segmentBy, duration = retentionLogDuration) {
  return `
    ALTER TABLE ${schema}."${table}" SET (
      timescaledb.compress,
      timescaledb.compress_segmentby = '"${segmentBy}"'
    );

    SELECT public.add_compress_chunks_policy('"${schema}"."${table}"', INTERVAL '${duration}')
  `
}

// https://docs.timescale.com/v1.3/using-timescaledb/continuous-aggregates
function createContinuousAggregate ({
  viewName,
  schema,
  table,
  interval,
  timeBucketLabel,

  // Only one extra column supported for now
  // because any additional dimension will greatly increase the number of rows
  // (for each dimension, multiply by the number of possible values)
  // and will counter compression benefits.

  // However, if there are use cases for more than two dimensions in the future,
  // transform this variable into array after monitoring the number of rows
  secondaryColumn,

  column = 'createdTimestamp',

  // By default `refresh_lag` is equal to `bucket_width`
  // and `refresh_interval` is also equal to `bucket_width`
  // That will leave too many non-materialized data

  // Even though continuous aggregates are real-time aggregates and integrate non-materialized data
  // from version 1.7, too many non-materialized data can have a bad performance impact.
  // For instance, for a bucket width of 1 month:
  // view will be refreshed every month (`refresh_interval`) and data from 2 last months
  // won't be materialized (`refresh_lag` + `bucket_width`)

  // We recommend to set:
  // - '1 day' for `refresh_lag` and `refresh_interval` if `bucket_width` superior to '1 day'
  // - the same value of `bucket_width` if it's inferior to '1 day'
  refreshLag = '1 day',
  refreshInterval = '1 day',

  // Any modifications on rows whose date is beyond this period won't be propagated to continuous aggregate
  // This will enable rows removal (to save storage space) without impacting continuous aggregates
  ignoreInvalidationOlderThan = '90 day',
} = {}) {
  return `
    CREATE OR REPLACE VIEW "${schema}"."${viewName}" WITH (timescaledb.continuous)
    AS
    SELECT public.time_bucket(INTERVAL '${interval}', "${column}") as ${timeBucketLabel}, COUNT(*) as count
    ${secondaryColumn ? `, ${secondaryColumn}` : ''}
    FROM ${schema}."${table}"
    GROUP BY ${timeBucketLabel}${secondaryColumn ? `, ${secondaryColumn}` : ''};

    ALTER VIEW "${schema}"."${viewName}" SET (
      timescaledb.refresh_lag = '${refreshLag}',
      timescaledb.refresh_interval = '${refreshInterval}',
      timescaledb.ignore_invalidation_older_than = '${ignoreInvalidationOlderThan}'
    )
  `
}

function removeContinuousAggregate ({ viewName, schema }) {
  return `
    DROP VIEW IF EXISTS "${schema}"."${viewName}" CASCADE
  `
}

module.exports = {
  createHypertable,
  addCompressionPolicy,
  createContinuousAggregate,
  removeContinuousAggregate,
}
