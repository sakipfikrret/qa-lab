import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { nextSeq } from '../src/lib/ids';
import { computeResultStatus } from '../src/lib/execution';

describe('nextSeq', () => {
  test('never collides with existing codes', () => {
    assert.equal(nextSeq('BUG', ['BUG-101', 'BUG-007']), 'BUG-102');
    assert.equal(nextSeq('TC', []), 'TC-001');
  });
});

describe('computeResultStatus', () => {
  test('unmarked steps never count as passed', () => {
    assert.equal(computeResultStatus(['PENDING', 'PENDING']), null);
    assert.equal(computeResultStatus(['PASS', 'PENDING']), null);
  });
  test('fail beats blocked beats pass', () => {
    assert.equal(computeResultStatus(['PASS', 'FAIL', 'BLOCKED']), 'Failed');
    assert.equal(computeResultStatus(['PASS', 'BLOCKED']), 'Blocked');
    assert.equal(computeResultStatus(['PASS', 'PASS']), 'Passed');
  });
});
