// Historical identifiers are isolated here so existing installs and snapshots
// remain readable. New UI, events, requests and exports use the Eivra identity.
export const LEGACY_BRAND = Object.freeze({
  storagePrefix: 'dugou',
  ownerHeader: 'x-dugou-arsenal',
  timeSnapshotSchema: 'dugou_time_snapshot_v1',
  cloudSnapshotTable: 'dugou_sync_snapshots',
})

export const isTimeSnapshotSchema = (schema) =>
  schema === 'eivra_time_snapshot_v1' || schema === LEGACY_BRAND.timeSnapshotSchema
