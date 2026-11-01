'use strict';

// Detached fictional fixture adapter. No real approval authentication or live integration.
const { createHash } = require('node:crypto');
const { isPromise } = require('node:util').types;

const CATALOG_SCHEMA = 'coach-companion-fictional-catalog-v1';
const REQUEST_SCHEMA = 'coach-companion-fictional-request-v1';
const VERSION = 'coach-companion-fictional-adapter-v1';
const LIMITS = Object.freeze({ bytes: 262144, nodes: 6000, depth: 12, keys: 32, array: 256, string: 4096, sources: 32, claims: 128, text: 2048, results: 5 });
const DRIVERS = new Set([
  'cellular_hydration', 'systemic_detoxification', 'electrobiology_rhythms',
  'the_living_diet', 'functional_training', 'holistic_recovery',
  'gastrointestinal_renovation', 'hormone_balancing', 'neural_repatterning',
  'momentum_regimens', 'mentality_realignment', 'wise_budgeting'
]);
const BAD_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const PRIVATE_KEYS = new Set(['answers', 'clientId', 'personId', 'assessmentId', 'assessment', 'contactId', 'patient', 'report', 'document', 'session', 'actor', 'organizationId', 'tenantId', 'approvalJson', 'query']);
const HEX = /^[a-f0-9]{64}$/;
const TOKEN = /^[a-z][a-z0-9_-]{0,79}$/;
const FIXTURE_ID = /^fictional-[a-z0-9][a-z0-9_-]{0,69}$/;

class Rejected extends Error {
  constructor(code) { super(code); this.code = code; }
}
function need(condition, code = 'malformed_input') { if (!condition) throw new Rejected(code); }

// Copy data descriptors only. No getters, toJSON hooks, inherited state or cycles.
function copyJson(input) {
  const seen = new Set();
  let nodes = 0, bytes = 0;
  function walk(value, depth) {
    need(++nodes <= LIMITS.nodes && depth <= LIMITS.depth, 'input_limit_exceeded');
    if (value === null || typeof value === 'boolean') { bytes += 5; return value; }
    if (typeof value === 'number') { need(Number.isSafeInteger(value)); bytes += 24; return value; }
    if (typeof value === 'string') {
      const size = Buffer.byteLength(value, 'utf8');
      need(size <= LIMITS.string, 'input_limit_exceeded'); bytes += size;
      need(bytes <= LIMITS.bytes, 'input_limit_exceeded'); return value;
    }
    need(typeof value === 'object' && value !== null, 'unsafe_object');
    need(!seen.has(value), 'unsafe_object'); seen.add(value);
    const proto = Object.getPrototypeOf(value), array = Array.isArray(value);
    need(array ? proto === Array.prototype : proto === Object.prototype || proto === null, 'unsafe_object');
    const keys = Reflect.ownKeys(value);
    need(keys.every(key => typeof key === 'string'), 'unsafe_object');
    if (array) {
      const length = Object.getOwnPropertyDescriptor(value, 'length').value;
      need(length <= LIMITS.array, 'input_limit_exceeded');
      need(keys.length === length + 1, 'unsafe_object');
      const out = [];
      for (let i = 0; i < length; i++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
        need(descriptor && 'value' in descriptor && descriptor.enumerable, 'unsafe_object');
        out.push(walk(descriptor.value, depth + 1));
      }
      seen.delete(value); return out;
    }
    need(keys.length <= LIMITS.keys, 'input_limit_exceeded');
    const out = {};
    for (const key of keys) {
      need(!BAD_KEYS.has(key), 'unsafe_object');
      need(!PRIVATE_KEYS.has(key), 'private_payload_rejected');
      bytes += Buffer.byteLength(key, 'utf8');
      need(bytes <= LIMITS.bytes, 'input_limit_exceeded');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      need(descriptor && 'value' in descriptor && descriptor.enumerable, 'unsafe_object');
      out[key] = walk(descriptor.value, depth + 1);
    }
    seen.delete(value); return out;
  }
  const result = walk(input, 0);
  need(bytes <= LIMITS.bytes && Buffer.byteLength(canonical(result), 'utf8') <= LIMITS.bytes, 'input_limit_exceeded');
  return result;
}
function fields(object, required, optional = []) {
  need(object && typeof object === 'object' && !Array.isArray(object));
  const keys = Object.keys(object), allowed = new Set([...required, ...optional]);
  need(required.every(key => Object.hasOwn(object, key)) && keys.every(key => allowed.has(key)), 'unexpected_or_missing_field');
}
function oneOf(value, choices) { need(choices.includes(value)); }
function token(value) { need(typeof value === 'string' && TOKEN.test(value)); }
function fixtureId(value) { need(typeof value === 'string' && FIXTURE_ID.test(value), 'fictional_input_required'); }
function hex(value) { need(typeof value === 'string' && HEX.test(value)); }
function generation(value) { need(Number.isSafeInteger(value) && value > 0); }
function text(value, max) { need(typeof value === 'string' && value.trim().length > 0 && Buffer.byteLength(value, 'utf8') <= max); }
function list(value, choices) {
  need(Array.isArray(value) && value.length > 0 && new Set(value).size === value.length);
  need(value.every(item => choices.includes(item)));
}
function freeze(value) {
  if (value && typeof value === 'object') { for (const item of Object.values(value)) freeze(item); Object.freeze(value); }
  return value;
}
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
function hash(value) { return createHash('sha256').update(canonical(value)).digest('hex'); }
// Integrity helper only: producing a hash never approves a source or claim.
function fingerprint(value) { return hash(copyJson(value)); }
function without(value, keys) { return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key))); }
function finish(status, reasons = [], rest = {}) {
  const payload = { adapterVersion: VERSION, fixtureOnly: true, productionEligible: false, persisted: false, issued: false, status, reasons: [...new Set(reasons)].sort(), ...rest };
  return freeze({ ...payload, resultHash: hash(payload) });
}
function reason(error) { return error instanceof Rejected ? error.code : 'malformed_input'; }

function optionsFor(input) {
  need(input && typeof input === 'object' && Object.getPrototypeOf(input) === Object.prototype, 'fictional_mode_required');
  const descriptors = Object.getOwnPropertyDescriptors(input);
  need(Reflect.ownKeys(descriptors).every(key => typeof key === 'string' && ['mode', 'fixtureVerifier'].includes(key)), 'unexpected_or_missing_field');
  need(Object.values(descriptors).every(d => 'value' in d && d.enumerable), 'unsafe_object');
  need(descriptors.mode?.value === 'fictional-preview', 'trusted_registry_unavailable');
  const verifier = descriptors.fixtureVerifier?.value;
  need(verifier === undefined || typeof verifier === 'function', 'fixture_verifier_unavailable');
  return { verifier };
}
function approvalShape(a) {
  fields(a, ['state', 'receiptHash', 'targetHash', 'generation', 'scopes']);
  oneOf(a.state, ['approved', 'pending', 'revoked', 'superseded']);
  hex(a.receiptHash); hex(a.targetHash); generation(a.generation);
  list(a.scopes, ['education', 'selection', 'sequence', 'monitoring', 'progression', 'adaptation', 'relationship', 'mission40']);
}
function conflictShape(c) {
  fields(c, ['state'], ['decisionReceiptHash']); oneOf(c.state, ['none', 'unresolved', 'resolved']);
  if (Object.hasOwn(c, 'decisionReceiptHash')) hex(c.decisionReceiptHash);
}
function sourceShape(s) {
  fields(s, ['id', 'version', 'sha256', 'dataClass', 'category', 'speakerStatus', 'attributionReceiptHash', 'approval', 'conflict', 'audiences']);
  fixtureId(s.id); fixtureId(s.version); hex(s.sha256); need(s.dataClass === 'fictional', 'fictional_input_required');
  oneOf(s.category, ['founder_foundation', 'approved_education', 'intake', 'participant', 'outside']);
  oneOf(s.speakerStatus, ['founder_authored_document', 'verified_founder', 'unknown', 'participant', 'outside_expert']);
  need(s.attributionReceiptHash === null || HEX.test(s.attributionReceiptHash));
  approvalShape(s.approval); conflictShape(s.conflict);
  list(s.audiences, ['fictional_reviewer', 'unavailable_audience']);
}
function claimShape(c) {
  fields(c, ['id', 'sourceId', 'sourceVersion', 'sourceHash', 'dataClass', 'driver', 'topic', 'kind', 'text', 'locator', 'sha256', 'approval', 'conflict', 'scope', 'clinicalProtocol', 'safetyHold', 'audiences']);
  fixtureId(c.id); fixtureId(c.sourceId); fixtureId(c.sourceVersion); hex(c.sourceHash); hex(c.sha256);
  need(c.dataClass === 'fictional' && typeof c.text === 'string' && c.text.startsWith('SYNTHETIC ONLY:'), 'fictional_input_required');
  need(DRIVERS.has(c.driver)); token(c.topic);
  oneOf(c.kind, ['education', 'selection', 'sequence', 'monitoring', 'progression', 'adaptation', 'relationship', 'mission40']);
  text(c.text, LIMITS.text); text(c.locator, 160);
  approvalShape(c.approval); conflictShape(c.conflict);
  oneOf(c.scope, ['global', 'assessment']);
  need(typeof c.clinicalProtocol === 'boolean' && typeof c.safetyHold === 'boolean');
  list(c.audiences, ['fictional_reviewer', 'unavailable_audience']);
}
function readCatalog(input) {
  const catalog = copyJson(input);
  fields(catalog, ['schemaVersion', 'dataClass', 'version', 'foundationHash', 'approvalGeneration', 'sources', 'claims', 'sha256']);
  need(catalog.schemaVersion === CATALOG_SCHEMA, 'catalog_schema_mismatch');
  need(catalog.dataClass === 'fictional', 'fictional_input_required');
  fixtureId(catalog.version); hex(catalog.foundationHash); hex(catalog.sha256); generation(catalog.approvalGeneration);
  need(Array.isArray(catalog.sources) && catalog.sources.length <= LIMITS.sources, 'input_limit_exceeded');
  need(Array.isArray(catalog.claims) && catalog.claims.length <= LIMITS.claims, 'input_limit_exceeded');
  catalog.sources.forEach(sourceShape); catalog.claims.forEach(claimShape);
  need(new Set(catalog.sources.map(s => s.id)).size === catalog.sources.length, 'duplicate_source_id');
  need(new Set(catalog.claims.map(c => c.id)).size === catalog.claims.length, 'duplicate_claim_id');
  need(hash(without(catalog, ['sha256'])) === catalog.sha256, 'catalog_hash_mismatch');
  return freeze(catalog);
}
function checkConflict(conflict) {
  if (conflict.state === 'unresolved') return ['conflict_unresolved'];
  if (conflict.state === 'resolved' && !conflict.decisionReceiptHash) return ['conflict_receipt_missing'];
  return [];
}
function checkApproval(kind, item, targetHash, catalog, verifier) {
  const a = item.approval, reasons = [];
  if (a.state !== 'approved') reasons.push('approval_' + a.state);
  if (!a.scopes.includes('education')) reasons.push('education_scope_not_approved');
  if (a.targetHash !== targetHash) reasons.push('approval_target_mismatch');
  if (a.generation !== catalog.approvalGeneration) reasons.push('approval_generation_mismatch');
  if (reasons.length) return reasons;
  if (!verifier) return ['approval_verifier_unavailable'];
  // The caller owns this synchronous fixture callback. It is not sandboxed or trusted auth.
  try {
    const response = verifier(freeze({ fixtureOnly: true, kind, id: item.id, targetHash, receiptHash: a.receiptHash, generation: catalog.approvalGeneration }));
    if (isPromise(response)) {
      Promise.prototype.then.call(response, () => {}, () => {});
      return ['fixture_verifier_unavailable'];
    }
    const v = copyJson(response);
    fields(v, ['fixtureOnly', 'verdict', 'targetHash', 'receiptHash', 'generation']);
    if (v.fixtureOnly !== true || v.targetHash !== targetHash || v.receiptHash !== a.receiptHash || v.generation !== catalog.approvalGeneration) return ['fixture_verifier_mismatch'];
    if (v.verdict !== 'approved') return [['revoked', 'superseded'].includes(v.verdict) ? 'approval_' + v.verdict : 'fixture_verifier_rejected'];
    return [];
  } catch { return ['fixture_verifier_unavailable']; }
}
function admit(catalog, verifier) {
  const sources = new Map(), accepted = [], held = [], heldSources = [];
  for (const source of catalog.sources) {
    const reasons = checkConflict(source.conflict);
    if (!['founder_foundation', 'approved_education'].includes(source.category)) reasons.push('source_not_approved_education');
    if (!['founder_authored_document', 'verified_founder'].includes(source.speakerStatus) || !source.attributionReceiptHash) reasons.push('founder_attribution_unresolved');
    reasons.push(...checkApproval('source', source, hash(without(source, ['approval'])), catalog, verifier));
    sources.set(source.id, { source, reasons });
    if (reasons.length) heldSources.push({ sourceId: source.id, reasons: [...new Set(reasons)].sort() });
  }
  for (const claim of catalog.claims) {
    const record = sources.get(claim.sourceId), reasons = checkConflict(claim.conflict);
    if (!record) reasons.push('source_missing');
    else {
      reasons.push(...record.reasons);
      if (claim.sourceHash !== record.source.sha256 || claim.sourceVersion !== record.source.version) reasons.push('source_version_mismatch');
    }
    const claimHash = hash(without(claim, ['sha256', 'approval']));
    if (claim.sha256 !== claimHash) reasons.push('claim_hash_mismatch');
    if (claim.kind !== 'education') reasons.push('unsupported_rule_kind');
    if (claim.scope !== 'global') reasons.push('case_scope_unavailable');
    if (claim.clinicalProtocol || claim.safetyHold) reasons.push('safety_hold');
    if (!claim.audiences.includes('fictional_reviewer') || (record && !record.source.audiences.includes('fictional_reviewer'))) reasons.push('audience_denied');
    reasons.push(...checkApproval('claim', claim, claimHash, catalog, verifier));
    if (reasons.length) held.push({ claimId: claim.id, sourceId: claim.sourceId, reasons: [...new Set(reasons)].sort() });
    else accepted.push({ claim, source: record.source });
  }
  accepted.sort((a, b) => a.claim.id < b.claim.id ? -1 : a.claim.id > b.claim.id ? 1 : 0);
  held.sort((a, b) => a.claimId < b.claimId ? -1 : a.claimId > b.claimId ? 1 : 0);
  heldSources.sort((a, b) => a.sourceId < b.sourceId ? -1 : a.sourceId > b.sourceId ? 1 : 0);
  return { accepted, held, heldSources };
}
function pins(catalog) { return { version: catalog.version, sha256: catalog.sha256, foundationHash: catalog.foundationHash, approvalGeneration: catalog.approvalGeneration }; }

function validateCatalog(input, options) {
  try {
    const { verifier } = optionsFor(options), catalog = readCatalog(input), { accepted, held, heldSources } = admit(catalog, verifier);
    return finish(held.length || heldSources.length ? 'held_for_review' : 'valid_catalog', [], { catalog: pins(catalog), acceptedClaimIds: accepted.map(r => r.claim.id), held, heldSources });
  } catch (error) { return finish('held_for_review', [reason(error)], { catalog: null, acceptedClaimIds: [], held: [], heldSources: [] }); }
}
function readRequest(input) {
  const r = copyJson(input);
  fields(r, ['schemaVersion', 'dataClass', 'operation', 'catalogVersion', 'catalogHash', 'approvalGeneration', 'audience', 'driver', 'topic', 'intent', 'safetyHold', 'limit']);
  need(r.schemaVersion === REQUEST_SCHEMA, 'request_schema_mismatch');
  need(r.dataClass === 'fictional', 'fictional_input_required');
  token(r.operation); fixtureId(r.catalogVersion); hex(r.catalogHash); generation(r.approvalGeneration);
  token(r.audience); need(DRIVERS.has(r.driver)); token(r.topic);
  oneOf(r.intent, ['education', 'clinical', 'dosing']); need(typeof r.safetyHold === 'boolean');
  need(Number.isSafeInteger(r.limit) && r.limit > 0 && r.limit <= LIMITS.results, 'input_limit_exceeded');
  return r;
}
function lookupEducational(input, request, options) {
  try {
    const { verifier } = optionsFor(options), r = readRequest(request);
    if (r.audience !== 'fictional_reviewer') return finish('held_for_review', ['audience_denied'], { results: [] });
    if (r.operation !== 'educational_lookup') return finish('held_for_review', ['operation_unavailable'], { results: [] });
    if (r.safetyHold || r.intent !== 'education') return finish('safety_hold', ['human_safety_review_required'], { results: [] });
    const catalog = readCatalog(input);
    if (r.catalogHash !== catalog.sha256 || r.catalogVersion !== catalog.version || r.approvalGeneration !== catalog.approvalGeneration) return finish('held_for_review', ['catalog_pin_mismatch'], { results: [] });
    const { accepted, held } = admit(catalog, verifier);
    const matches = accepted.filter(row => row.claim.driver === r.driver && row.claim.topic === r.topic);
    const matchingIds = new Set(catalog.claims.filter(c => c.driver === r.driver && c.topic === r.topic).map(c => c.id));
    const matchingHeld = held.filter(row => matchingIds.has(row.claimId));
    const results = matches.slice(0, r.limit).map(({ claim, source }) => ({
      claimId: claim.id, text: claim.text, contentType: 'untrusted_source_text',
      citation: { sourceId: source.id, sourceVersion: source.version, sourceHash: source.sha256, claimHash: claim.sha256, locator: claim.locator, sourceReceiptHash: source.approval.receiptHash, claimReceiptHash: claim.approval.receiptHash }
    }));
    // Any relevant unresolved item holds the topic; no conflict hidden by a valid hit.
    if (matchingHeld.length) return finish(matchingHeld.some(row => row.reasons.includes('safety_hold')) ? 'safety_hold' : 'held_for_review', matchingHeld.flatMap(row => row.reasons), { catalog: pins(catalog), results: [] });
    return finish(results.length ? 'supported_education' : 'no_approved_support', results.length ? [] : ['no_approved_match'], { catalog: pins(catalog), results });
  } catch (error) { return finish('held_for_review', [reason(error)], { results: [] }); }
}

module.exports = Object.freeze({ VERSION, CATALOG_SCHEMA, REQUEST_SCHEMA, LIMITS, fingerprint, validateCatalog, lookupEducational });
