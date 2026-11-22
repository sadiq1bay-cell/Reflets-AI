import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGeminiHistory,
  deriveThreadTitle,
  filterCommunityQuestions,
  formatLatencySeconds,
  INITIAL_COMMUNITY_QUESTIONS,
  parseMarkdownBlocks,
  validateAuthForm,
} from './helyumeLogic';

test('formatLatencySeconds formats milliseconds into clean tenths of a second', () => {
  assert.equal(formatLatencySeconds(420), '0.4 sn');
  assert.equal(formatLatencySeconds(1280), '1.3 sn');
  assert.equal(formatLatencySeconds(30), '0.1 sn');
  assert.equal(formatLatencySeconds(undefined), '0.4 sn');
});

test('deriveThreadTitle trims and truncates long prompts cleanly', () => {
  assert.equal(deriveThreadTitle('sa'), 'sa');
  assert.equal(deriveThreadTitle('   ', true), 'Medya Analizi');
  assert.equal(deriveThreadTitle('   ', false), 'Yeni Sohbet');
  const longPrompt = 'Kuantum bilgisayarların çalışma prensibini detaylı açıkla';
  const title = deriveThreadTitle(longPrompt);
  assert.ok(title.endsWith('...'));
  assert.ok(title.length <= 34);
});

test('buildGeminiHistory skips error messages and preserves multimodal parts', () => {
  const turns = buildGeminiHistory([
    {
      id: '1',
      role: 'user',
      content: 'Bu görseli analiz et',
      engine: 'crush',
      createdAt: 1,
      attachments: [
        {
          id: 'a1',
          name: 'ui.png',
          mimeType: 'image/png',
          size: 100,
          dataBase64: 'ZmFrZQ==',
        },
      ],
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hata oluştu',
      engine: 'crush',
      createdAt: 2,
      isError: true,
    },
    {
      id: '3',
      role: 'assistant',
      content: 'Görselde modern bir arayüz görünüyor.',
      engine: 'crush',
      createdAt: 3,
    },
  ]);

  assert.equal(turns.length, 2);
  assert.equal(turns[0].role, 'user');
  assert.equal(turns[0].parts.length, 2);
  assert.deepEqual(turns[0].parts[0], {
    inlineData: { data: 'ZmFrZQ==', mimeType: 'image/png' },
  });
  assert.equal(turns[1].role, 'model');
});

test('filterCommunityQuestions filters by category, engine, and search term', () => {
  const all = filterCommunityQuestions(INITIAL_COMMUNITY_QUESTIONS, '', 'Tümü');
  assert.equal(all.length, 3);

  const crushOnly = filterCommunityQuestions(INITIAL_COMMUNITY_QUESTIONS, '', 'Crush');
  assert.equal(crushOnly.length, 1);
  assert.equal(crushOnly[0].engine, 'crush');

  const queryMatch = filterCommunityQuestions(INITIAL_COMMUNITY_QUESTIONS, 'idempotency', 'Tümü');
  assert.equal(queryMatch.length, 1);
  assert.equal(queryMatch[0].id, 'cq-3');
});

test('validateAuthForm rejects empty/invalid inputs and accepts valid inputs', () => {
  const invalidLogin = validateAuthForm('login', 'bad-email', '123');
  assert.equal(invalidLogin.valid, false);
  assert.ok(invalidLogin.errors.email);
  assert.ok(invalidLogin.errors.password);

  const invalidRegister = validateAuthForm('register', 'ali@helyume.ai', '123456', 'A');
  assert.equal(invalidRegister.valid, false);
  assert.ok(invalidRegister.errors.name);

  const validRegister = validateAuthForm('register', 'ali@helyume.ai', 'secret99', 'Ali Yılmaz');
  assert.equal(validRegister.valid, true);
  assert.deepEqual(validRegister.errors, {});
});

test('parseMarkdownBlocks parses headings, lists, paragraphs, and fenced code blocks', () => {
  const md = [
    '## Hızlı Özet',
    '',
    'Bu bir **test** paragrafıdır.',
    '',
    '- Birinci madde',
    '- İkinci madde',
    '',
    '```ts',
    'const speed = "0.4 sn";',
    '```',
  ].join('\n');

  const blocks = parseMarkdownBlocks(md);
  assert.equal(blocks[0].type, 'heading');
  assert.equal(blocks[1].type, 'paragraph');
  assert.equal(blocks[2].type, 'list');
  assert.equal(blocks[3].type, 'code');
  if (blocks[3].type === 'code') {
    assert.equal(blocks[3].language, 'ts');
    assert.equal(blocks[3].code, 'const speed = "0.4 sn";');
  }
});

import { computeOrbitalPosition, createStarfield } from './spaceScene';

test('createStarfield generates deterministic star count within normalized bounds', () => {
  const stars = createStarfield(120, 2026);
  assert.equal(stars.length, 120);
  for (const s of stars) {
    assert.ok(s.xNorm >= 0 && s.xNorm <= 1);
    assert.ok(s.yNorm >= 0 && s.yNorm <= 1);
    assert.ok(s.radius > 0);
  }
});

test('computeOrbitalPosition places planets accurately on ellipse', () => {
  const pos0 = computeOrbitalPosition({
    centerX: 500,
    centerY: 300,
    radiusX: 100,
    radiusY: 50,
    angleRad: 0,
  });
  assert.equal(Math.round(pos0.x), 600);
  assert.equal(Math.round(pos0.y), 300);

  const pos90 = computeOrbitalPosition({
    centerX: 500,
    centerY: 300,
    radiusX: 100,
    radiusY: 50,
    angleRad: Math.PI / 2,
  });
  assert.equal(Math.round(pos90.x), 500);
  assert.equal(Math.round(pos90.y), 350);
});
