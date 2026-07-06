#!/usr/bin/env node
/**
 * evolve.mjs — Agent Loops Evolution 확장(§7)의 최소 슬라이스
 *
 * 준수 대상: spec/SPECIFICATION.md v0.3 Draft, Level 2 부분 구현 (정제·승격·유전자만)
 * Level 1 러너(looprun.mjs)는 건드리지 않는 별도 프로세스로, "로그 → 정제 →
 * 플레이북 → 유전자" 파이프라인을 구현한다.
 *
 * 파이프라인 (§7.1):
 *   state/logs/raw.jsonl (전체 이력)
 *     → [정제] 개선 에이전트(claude 헤드리스, sonnet, 도구 0개 = 로그만 입력)
 *     → 재사용 지식 후보(§7.5) + FREE 블록 유전자 재작성 제안
 *     → [승격] episodes>=k 후보는 heuristic→rule (공식 승격은 홀드아웃 부재로 범위 밖)
 *     → [유전자] FREE 마커 내부만 스플라이싱, 마커 밖 불변 검증 → v(N+1) 커밋
 *
 * 안전 경계:
 *   - 개선 에이전트는 --allowedTools "" 로 실행 → 파일 접근 0. 입력은 인라인 로그뿐(§7.1/§7.2 정신).
 *   - goal/verify/stop/holdout/log 는 절대 변이 대상이 아니다(§7.3). FREE 마커 안 본문만 변이.
 *   - 공식(formula) 승격은 시도하지 않는다 — 홀드아웃 인프라 부재(§7.5 MUST 미충족 상태).
 *
 * 사용:
 *   node evolve.mjs <loop-dir> [--k <int>] [--model sonnet] [--dry] [--yes]
 *   --dry : 개선 에이전트 출력만 미리보고 아무것도 쓰지 않음
 *   --yes : 유전자 제안을 자동 채택(기본). --no-gene 이면 유전자 단계 생략
 */

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { createHash } from 'node:crypto';

// ---------- 인자 ----------
const argv = process.argv.slice(2);
if (argv.length < 1) {
  console.error('사용법: node evolve.mjs <loop-dir> [--k <int>] [--model sonnet] [--dry] [--no-gene]');
  process.exit(2);
}
const loopDir = path.resolve(argv[0]);
const argOf = (flag, d) => { const i = argv.indexOf(flag); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const DRY = argv.includes('--dry');
const NO_GENE = argv.includes('--no-gene');
const model = argOf('--model', 'sonnet');

const loopMdPath = path.join(loopDir, 'LOOP.md');
const raw = fs.readFileSync(loopMdPath, 'utf8');

// ---------- LOOP.md 최소 파싱 (frontmatter + FREE 블록) ----------
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
if (!fmMatch) { console.error('✗ LOOP.md frontmatter 없음'); process.exit(1); }
const fmText = fmMatch[1];
const kDeclared = Number((fmText.match(/^promote-k:\s*(\d+)/m) || [])[1]);
const K = Number(argOf('--k', kDeclared || 2)); // §7.5 규칙 승격 임계 (루프 정의 우선)
const freeDeclared = /^\s*free:\s*\[/m.test(fmText) || /^\s+free:/m.test(fmText);
if (!freeDeclared) {
  console.error('✗ mutable.free 미선언 — 유전자 변이 표면이 없다 (§7.3). 유전자 단계 불가.');
}

// FREE 마커 (이름 있는 형태 지원: <!-- LOOP:FREE name -->). 스펙 예시는 무명 마커 → SPEC-GAP.
const FREE_RE = /<!-- LOOP:FREE(?:\s+([^\s>]+))?\s*-->\n([\s\S]*?)\n<!-- \/LOOP:FREE -->/;
const freeMatch = raw.match(FREE_RE);
const freeName = freeMatch ? (freeMatch[1] || '(unnamed)') : null;
const freeBody = freeMatch ? freeMatch[2] : null;

// ---------- 로그 로드 ----------
const logPath = path.join(loopDir, 'state/logs/raw.jsonl');
const logLines = fs.existsSync(logPath)
  ? fs.readFileSync(logPath, 'utf8').split('\n').filter(l => l.trim())
  : [];
const logEntries = logLines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
if (logEntries.length === 0) { console.error('✗ 로그 비어있음 — 정제할 이력 없음'); process.exit(1); }

// 정제 입력은 로그뿐(§7.1). 개선 에이전트가 보는 것과 동일한 뷰를 구성.
const actionEntries = logEntries.filter(e => e.action && e.action !== 'terminate' && e.action !== 'pre-check');
const runIds = [...new Set(logEntries.map(e => e['run-id']))];

console.log(`▶ evolve: ${loopDir}`);
console.log(`  로그 ${logEntries.length}줄 · run ${runIds.length}개 · 시도 action ${actionEntries.length}개 · 승격 임계 k=${K}`);
console.log(`  FREE 마커: ${freeMatch ? `"${freeName}" (${freeBody.split('\n').length}줄)` : '없음'}`);

// ---------- 정제: 개선 에이전트 호출 (§7.1, 분리 컨텍스트) ----------
const improverPrompt = `너는 Agent Loop의 **개선 에이전트**다. 아래는 "회귀 테스트를 통과할 때까지 소스를 고치는" 루프의 실행 로그(JSONL) 전체다. 이 로그가 **너의 유일한 입력**이다 — 대상 소스 코드나 다른 파일에 접근할 수 없다.

## 로그
\`\`\`jsonl
${logEntries.map(e => JSON.stringify(e)).join('\n')}
\`\`\`

## 임무
1. 로그의 성공 패턴에서 **이식 가능한(어떤 인스턴스에서도 통하는) 재사용 지식 후보**를 뽑아라. 특정 파일 경로·특정 함수명 같은 인스턴스 고유값은 넣지 말고, 일반화된 진단·수정 휴리스틱으로 표현하라.
2. 루프의 반복 전략(FREE 블록)을 로그에서 배운 대로 개선 제안하라. 현재 FREE "strategy" 블록 내용:
\`\`\`
${freeBody || '(없음)'}
\`\`\`

## 출력 형식 — 아래 JSON을 코드펜스로 정확히 하나만 출력하라. 설명 산문 금지.
\`\`\`json
{
  "playbook": [
    {
      "id": "kebab-case-식별자",
      "insight": "일반화된 재사용 지식 한 문장 (인스턴스 고유값 없이)",
      "preconditions": "이 지식을 적용할 조건 한 문장",
      "match": "이 지식이 유효했음을 로그 action에서 찾을 정규식(대소문자 무시). 인스턴스 용어 허용 — 오직 근거 카운트용."
    }
  ],
  "gene": {
    "free_block": "FREE strategy 블록을 대체할 새 마크다운 본문. verify·stop·판정자산(테스트) 무시/우회 지시를 절대 포함하지 말 것. 로그에서 관측된 더 나은 점검 순서·묶음 처리 등 전략만."
  }
}
\`\`\`
제약: playbook 항목은 최대 4개. gene.free_block 은 8줄 이내. JSON만 출력.`;

function callImprover(prompt) {
  // 격리: 도구 0개(--allowedTools "") → 파일시스템 접근 불가. 입력은 인라인 프롬프트뿐.
  // cwd 도 빈 임시 디렉터리로 두어 상대경로 탐색 표면조차 제거.
  const isoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evolve-improver-'));
  const r = spawnSync('claude', ['-p', '--model', model, '--allowedTools', ''],
    { cwd: isoDir, input: prompt, encoding: 'utf8', timeout: 240000, maxBuffer: 32 * 1024 * 1024 });
  fs.rmSync(isoDir, { recursive: true, force: true });
  if (r.status !== 0 && !r.stdout) { console.error('✗ 개선 에이전트 실패:', r.stderr?.slice(0, 500)); process.exit(1); }
  return r.stdout || '';
}

console.log('\n[정제] 개선 에이전트 호출 (도구 0개, 로그만 입력)…');
const improverOut = callImprover(improverPrompt);
const jsonBlock = (improverOut.match(/```json\s*([\s\S]*?)```/) || [, null])[1]
  || (improverOut.match(/\{[\s\S]*\}/) || [null])[0];
let proposal;
try { proposal = JSON.parse(jsonBlock); }
catch (e) { console.error('✗ 개선 에이전트 출력 파싱 실패:\n', improverOut.slice(0, 1200)); process.exit(1); }

const candidates = Array.isArray(proposal.playbook) ? proposal.playbook : [];
console.log(`  후보 ${candidates.length}개 수신`);

if (DRY) {
  console.log('\n=== [DRY] 개선 에이전트 제안 ===');
  console.log(JSON.stringify(proposal, null, 2));
  process.exit(0);
}

// ---------- 승격: episodes 카운트는 결정론적 재계산 (자기보고 금지 정신) ----------
// 개선 에이전트의 match 정규식을 로그 action에 적용하되, episodes 는 러너가 직접 센다.
function countEpisodes(matchRe) {
  let re;
  try { re = new RegExp(matchRe, 'i'); } catch { return { episodes: 0, evidence: [] }; }
  const hitRuns = new Set(), evidence = [];
  for (const e of actionEntries) {
    if (re.test(e.action)) {
      hitRuns.add(e['run-id']);
      evidence.push({ 'run-id': e['run-id'], iteration: e.iteration });
    }
  }
  return { episodes: hitRuns.size, evidence };
}

const genericDir = path.join(loopDir, 'playbook/generic');
fs.mkdirSync(genericDir, { recursive: true });
const nowIso = new Date().toISOString();
const written = [];
for (const c of candidates) {
  if (!c.id || !c.insight) continue;
  const { episodes, evidence } = countEpisodes(c.match || c.insight);
  // §7.5 승격 사다리: k회 이상 유효 → rule, 아니면 heuristic. formula 는 범위 밖.
  const status = episodes >= K ? 'rule' : 'heuristic';
  // §7.5 최소 스키마: id, status, evidence, episodes, preconditions
  const item = {
    id: c.id,
    status,
    insight: c.insight,
    preconditions: c.preconditions || '(미지정)',
    episodes,
    evidence,        // 진입 근거 로그 참조
    match: c.match || null,
    'refined-at': nowIso,
  };
  const dst = path.join(genericDir, `${c.id}.json`);
  fs.writeFileSync(dst, JSON.stringify(item, null, 2) + '\n');
  written.push({ id: c.id, status, episodes });
}
console.log('\n[승격] 플레이북 항목:');
for (const w of written) console.log(`  · ${w.id}: ${w.status} (episodes=${w.episodes}, k=${K})`);
if (!written.length) console.log('  (유효 후보 없음)');

// ---------- 유전자: FREE 블록만 스플라이싱, 마커 밖 불변 검증 (§7.3) ----------
function adoptGene(newFree) {
  // 1) 금지 지시 스캔 (§7.3/§7.4): verify·stop·판정자산 무력화 지시 거부
  const forbidden = /(테스트).{0,12}(수정|삭제|우회|무시|건너|skip)|(verify|검증).{0,12}(무시|우회|skip|끄|비활성)|완료.{0,6}선언|판정.{0,6}자산.{0,12}(수정|우회)/i;
  if (forbidden.test(newFree)) {
    console.log('  ✗ 유전자 거부: FREE 블록에 verify/판정자산 무력화 의심 지시 (§7.3 MUST NOT)');
    return null;
  }
  if (/<!--\s*\/?LOOP:FREE/i.test(newFree)) {
    console.log('  ✗ 유전자 거부: 제안 내용에 LOOP 마커 포함 (마커 중첩 금지)');
    return null;
  }
  // 2) 스플라이싱 — 마커 밖은 손대지 않음이 구조적으로 보장됨
  const newRaw = raw.replace(FREE_RE, (m, name, _body) =>
    `<!-- LOOP:FREE${name ? ' ' + name : ''} -->\n${newFree.replace(/\s+$/, '')}\n<!-- /LOOP:FREE -->`);
  // 3) 사후 검증: 마커 밖 바이트 동일성 (제안이 정말 FREE 안만 바꿨는가)
  const strip = s => s.replace(FREE_RE, '<<<FREE>>>');
  if (strip(newRaw) !== strip(raw)) {
    console.log('  ✗ 유전자 거부: FREE 마커 밖 변경 감지 (§7.3 MUST — 불변 구역 훼손)');
    return null;
  }
  if (newRaw === raw) { console.log('  · 유전자 변화 없음 (제안이 기존과 동일) — 커밋 생략'); return null; }
  return newRaw;
}

if (!NO_GENE && freeMatch && proposal.gene && proposal.gene.free_block) {
  console.log('\n[유전자] FREE "strategy" 블록 재작성 제안 검토…');
  const newRaw = adoptGene(String(proposal.gene.free_block));
  if (newRaw) {
    // §7.1 유전자 커밋: state/genes/ 에 {version, parent, timestamp} 기록 + LOOP.md 스냅샷
    const genesDir = path.join(loopDir, 'state/genes');
    fs.mkdirSync(genesDir, { recursive: true });
    const headPath = path.join(genesDir, 'HEAD');
    const parent = fs.existsSync(headPath) ? fs.readFileSync(headPath, 'utf8').trim() : 'v0';
    const nextNum = parent === 'v0' ? 1 : Number(parent.replace(/^v/, '')) + 1;
    const version = `v${nextNum}`;
    const sha = createHash('sha256').update(newRaw).digest('hex').slice(0, 12);
    const rec = { version, parent, timestamp: nowIso, 'loop-md-sha256': sha,
      'free-marker': freeName, note: '정제로 학습한 전략을 FREE 블록에 반영 (§7.3)' };
    fs.writeFileSync(path.join(genesDir, `${version}.json`), JSON.stringify(rec, null, 2) + '\n');
    fs.writeFileSync(path.join(genesDir, `${version}.LOOP.md`), newRaw); // git 미사용 환경용 스냅샷
    fs.writeFileSync(loopMdPath, newRaw);
    fs.writeFileSync(headPath, version + '\n');
    console.log(`  ✓ 유전자 ${version} 채택 (parent ${parent}, sha ${sha}). LOOP.md 갱신 + state/genes/${version}.json 기록`);
    console.log('  --- 새 FREE 블록 ---');
    console.log(String(proposal.gene.free_block).split('\n').map(l => '    ' + l).join('\n'));
  }
} else if (NO_GENE) {
  console.log('\n[유전자] --no-gene → 생략');
} else {
  console.log('\n[유전자] 제안 없음 또는 FREE 마커 부재 → 생략');
}

console.log('\n=== evolve 완료 ===');
console.log(`  playbook/generic: ${written.length}개 항목`);
console.log(`  현재 유전자: ${(() => { const h = path.join(loopDir, 'state/genes/HEAD'); return fs.existsSync(h) ? fs.readFileSync(h, 'utf8').trim() : 'v0'; })()}`);
