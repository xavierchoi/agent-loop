#!/usr/bin/env node
/**
 * looprun — Agent Loops (LOOP.md) Level 1 레퍼런스 러너 프로토타입
 *
 * 준수 대상: spec/SPECIFICATION.md v0.3 Draft, Level 1 (Runner)
 * 목적: 스펙이 "읽고 구현 가능한 문서"인지의 실물 시험. 구현 중 발견한
 *       스펙 모호함은 SPEC-FINDING 주석으로 표기하고 리뷰 기록에 회부한다.
 *
 * 사용:
 *   node looprun.mjs <loop-dir> --target <dir> [--implementer <cmd>] [--dry]
 *
 * 구현 주체(implementer)는 외부 명령으로 위임한다. 기본값은 claude CLI 헤드리스.
 * 명령은 stdin으로 iteration 입력(§5.3)을 받고, target 작업트리를 수정한다.
 *
 * Level 1 준수 선언 (§6 문서화 MUST):
 *  - §5 실행 모델 ............. 준수 (§5.3 입력 계약 5항 전부 전달 — 잔여 예산 포함)
 *  - stop 강제 ................ 준수. stagnation 무점수 기본 = "pass 동일 AND (verify 출력 + target 트리) 다이제스트 불변"
 *  - budget 강제·계측 범위 ..... duration 계열만 계측·강제. **cost 미계측** — max-cost-usd 선언 루프는 실행 거부
 *  - append-only 로그 ......... O_APPEND 단일 프로세스 직렬 쓰기. 동일 루프의 동시 재활성화는 미지원(거부하지 않음 — 운영 주의)
 *  - 검증 분리 ................ verify는 러너 프로세스가 실행, 구현 주체 출력은 판정 미사용. agent 검증기 미지원 — 선언 시 실행 거부
 *  - 판정 자산 격리 ........... assets 선언 필수 — 미선언 루프는 실행 거부 (§4.2.5/§9.4)
 *  - 환경변수 주입 규칙(§5.6) .. verify.run·구현 주체 모두 러너 프로세스의 환경을 그대로 상속. 러너가 추가 주입하는 변수 없음
 */

import { spawnSync, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';

// ---------- 인자 ----------
const argv = process.argv.slice(2);
if (argv.length < 1) {
  console.error('사용법: node looprun.mjs <loop-dir> --target <dir> [--implementer <cmd>] [--dry]');
  process.exit(2);
}
const loopDir = path.resolve(argv[0]);
function argOf(flag, dflt) {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
}
const DRY = argv.includes('--dry');
// §5.6: 작업 대상은 활성화 파라미터. 미지정 시 루프 디렉터리 자신.
const target = path.resolve(argOf('--target', loopDir));
const implementerCmd = argOf(
  '--implementer',
  // 기본 구현 주체: claude 헤드리스, 파일 도구만 허용 (bash 금지 → 자체 검증 실행 봉쇄)
  'claude -p --model sonnet --allowedTools Read,Edit,Write,Glob,Grep --permission-mode acceptEdits'
);

// ---------- frontmatter 파서 ----------
// SPEC-FINDING(F1): 스펙은 "유효한 YAML frontmatter"(§3 MUST)라고만 하고 YAML 버전/
// 서브셋을 규정하지 않는다. 프로토타입은 실용 서브셋(블록 맵, 플로우 맵/배열,
// 스칼라, '>' 폴드 문자열)만 지원한다. 상호운용을 위해 스펙이 "YAML 1.2 core schema"
// 같은 기준 지정 필요 → v0.4 회부.
function parseScalar(s) {
  s = s.trim();
  if (/^".*"$/.test(s) || /^'.*'$/.test(s)) return s.slice(1, -1);
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s !== '' && !isNaN(Number(s))) return Number(s);
  return s;
}
function parseFlow(s) {
  s = s.trim();
  if (s.startsWith('{')) {
    const inner = s.slice(1, -1);
    const obj = {};
    for (const part of splitTop(inner)) {
      const ci = part.indexOf(':');
      obj[part.slice(0, ci).trim()] = parseFlow(part.slice(ci + 1));
    }
    return obj;
  }
  if (s.startsWith('[')) return splitTop(s.slice(1, -1)).map(parseFlow);
  return parseScalar(s);
}
function splitTop(s) {
  const out = [];
  let depth = 0, cur = '', inq = null;
  for (const ch of s) {
    if (inq) { cur += ch; if (ch === inq) inq = null; continue; }
    if (ch === '"' || ch === "'") { inq = ch; cur += ch; continue; }
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('LOOP.md: frontmatter 없음 (§3 MUST 위반)');
  const fm = {}, lines = m[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (/^\s/.test(line)) continue; // 중첩 블록은 상위 키 처리에서 소비
    const ci = line.indexOf(':');
    const key = line.slice(0, ci).trim();
    let val = line.slice(ci + 1).trim();
    if (val === '>' || val === '>-') { // 폴드 문자열
      const buf = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) buf.push(lines[++i].trim());
      fm[key] = buf.join(' ');
    } else if (val === '') { // 블록 맵/배열
      const buf = [];
      while (i + 1 < lines.length && (/^\s+/.test(lines[i + 1]) || !lines[i + 1].trim())) {
        if (!lines[i + 1].trim()) { i++; continue; }
        buf.push(lines[++i]);
      }
      const items = buf.filter(l => l.trim().startsWith('- '));
      if (items.length) fm[key] = items.map(l => parseFlow(l.trim().slice(2)));
      else {
        const obj = {};
        for (const l of buf) {
          const c2 = l.indexOf(':');
          obj[l.slice(0, c2).trim()] = parseFlow(l.slice(c2 + 1));
        }
        fm[key] = obj;
      }
    } else fm[key] = parseFlow(val);
  }
  return { fm, body: m[2] };
}

// ---------- 로드 + 정규화 ----------
const loopMdPath = path.join(loopDir, 'LOOP.md');
const raw = fs.readFileSync(loopMdPath, 'utf8');
const { fm, body } = parseFrontmatter(raw);

// §4.1 필수 5필드 검증
for (const req of ['name', 'description', 'goal', 'stop', 'verify'])
  if (fm[req] === undefined) fail(`필수 필드 누락: ${req} (§4.1)`);
// §4.2.1 name 규칙 + 디렉터리 일치
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fm.name) || fm.name.length > 64)
  fail(`name 규칙 위반 (§4.2.1): ${fm.name}`);
if (path.basename(loopDir) !== fm.name)
  fail(`디렉터리명(${path.basename(loopDir)}) ≠ name(${fm.name}) (§2 MUST)`);

// §4.1 단축 표기 정규화
let stop = typeof fm.stop === 'number' ? { 'max-iterations': fm.stop } : fm.stop;
let verifiers = fm.verify;
if (typeof verifiers === 'string') verifiers = [{ run: verifiers }];
if (!Array.isArray(verifiers)) verifiers = [verifiers];
// §4.2.4: 상한 계열 최소 1개 MUST
if (!stop['max-iterations'] && !stop['max-duration'])
  fail('stop에 max-iterations 또는 max-duration 필요 (§4.2.4 MUST)');
for (const v of verifiers)
  if (!v.run && !v.agent) fail('verify에 run 또는 agent 필요 (§4.2.5 MUST)');
// SPEC-FINDING(F2): §4.2.5는 agent 검증기의 "지시문 파일" 실행 방법(어떤 CLI로,
// 판정을 어떻게 종료코드화하는지)을 정의하지 않는다. 프로토타입은 run만 지원하고
// agent 검증기는 미구현으로 남긴다 → 스펙에 "판정 프로토콜(종료코드/구조화 출력)" 필요.
// §4.2.5 MUST: 배열의 모든 검증기가 통과해야 통과 — 실행 못 하는 검증기가 있으면 completed를 낼 수 없으므로 거부
if (verifiers.some(v => v.agent))
  fail('agent 검증기 미지원 — 배열 전체 통과 요구(§4.2.5 MUST)를 충족할 수 없어 실행 거부 (판정 프로토콜 미정의 = SPEC-FINDING F2, v0.4 회부)');

const budget = fm.budget || {};
// §4.2.6 MUST: max-cost-usd는 LLM 토큰 비용 합산 계측 필요 — 이 러너는 cost 미계측이므로 선언 루프 거부
if (budget['max-cost-usd'] !== undefined || (typeof budget['per-iteration'] === 'object' && budget['per-iteration']['cost-usd'] !== undefined))
  fail('이 러너는 비용 계측 미구현 — max-cost-usd / per-iteration.cost-usd 선언 루프는 실행 거부 (§4.2.6 MUST, 계측 범위는 파일 헤더에 문서화)');
const greenNeed = stop['green-runs'] || 1;
const stagLimit = stop['stagnation'] || Infinity;
const maxIter = stop['max-iterations'] || Infinity;
const maxDurMs = parseDur(stop['max-duration'] || budget['max-duration']) ?? Infinity;
const perIterMs = parseDur(
  typeof budget['per-iteration'] === 'object' ? budget['per-iteration'].duration : budget['per-iteration']
) ?? Infinity;
function parseDur(d) {
  if (!d) return null;
  const m = String(d).match(/^(\d+)(ms|s|m|h)$/);
  if (!m) return null;
  return Number(m[1]) * { ms: 1, s: 1e3, m: 6e4, h: 36e5 }[m[2]];
}

// ---------- 상태 / 로그 ----------
const stateDir = path.join(loopDir, 'state');
const logPath = path.join(loopDir, (fm.log && fm.log.path) || 'state/logs/raw.jsonl');
fs.mkdirSync(path.dirname(logPath), { recursive: true });
fs.mkdirSync(path.join(stateDir), { recursive: true });

// §5.2 재활성화 = 새 run. run-id 부여, 카운터 리셋, 로그는 누적.
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const runStart = Date.now();
// SPEC-FINDING(F3, 해소됨): §4.2.6 vs §5.2의 시계 원점 충돌은 스펙 v0.3.1에서
// "run 시작부터, 모든 상한은 run당"으로 정정됨. 이 러너의 runStart 기준 측정이 곧 준수.

// §4.2.8 gene 식별자: Evolution(§7)을 켠 루프는 state/genes/HEAD의 버전을 태깅, 아니면 v0-해시.
const genesHead = path.join(stateDir, 'genes', 'HEAD');
const geneId = fs.existsSync(genesHead)
  ? fs.readFileSync(genesHead, 'utf8').trim() + '-' + createHash('sha256').update(raw).digest('hex').slice(0, 8)
  : 'v0-' + createHash('sha256').update(raw).digest('hex').slice(0, 8);

// §5.3 MAY: playbook/generic/ 항목 요약을 iteration 입력에 포함 (Evolution 정제 산물 소비)
function loadPlaybookSummary() {
  const dir = path.join(loopDir, 'playbook', 'generic');
  if (!fs.existsSync(dir)) return null;
  const items = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
    .map(f => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return null; } })
    .filter(Boolean)
    // §7.5: rule 을 heuristic 보다 우선 노출
    .sort((a, b) => (a.status === 'rule' ? 0 : 1) - (b.status === 'rule' ? 0 : 1));
  if (!items.length) return null;
  return items.map(i => `- [${i.status}] ${i.insight}${i.preconditions && i.preconditions !== '(미지정)' ? ` (적용조건: ${i.preconditions})` : ''}`).join('\n');
}
const playbookSummary = loadPlaybookSummary();
const logFd = fs.openSync(logPath, 'a'); // O_APPEND: 원자적 단일 append (§4.2.7)
function logEntry(obj) {
  fs.writeSync(logFd, JSON.stringify({ 'run-id': runId, gene: geneId, timestamp: new Date().toISOString(), ...obj }) + '\n');
}

// ---------- 판정 자산 격리 (§4.2.5 v0.3) ----------
// SPEC-FINDING(F4): 스펙은 판정 자산 격리를 MUST로 요구하지만 "무엇이 판정 자산인지
// 선언하는 필드"가 없다. 프로토타입은 verify[].assets(경로 배열) 확장 필드를 도입
// — v0.4에서 스펙 필드로 승격 제안. assets 미선언 시 격리를 적용할 수 없어 경고만 한다.
const assetPaths = [...new Set(verifiers.flatMap(v => v.assets || []))];
const assetSnapDir = path.join(stateDir, 'verify-assets', runId);
if (assetPaths.length) {
  for (const p of assetPaths) {
    const src = path.join(target, p), dst = path.join(assetSnapDir, p);
    fs.cpSync(src, dst, { recursive: true });
  }
} else fail('판정 자산(verify.assets) 미선언 — 격리 없이는 Level 1 실행 불가 (§4.2.5/§9.4 MUST). verify에 assets: [경로…]를 선언하라 (필드 표준화는 SPEC-FINDING F4, v0.4 회부)');
function restoreAssets() {
  let restored = false;
  for (const p of assetPaths) {
    const snap = path.join(assetSnapDir, p), live = path.join(target, p);
    const before = dirDigest(live);
    fs.rmSync(live, { recursive: true, force: true });
    fs.cpSync(snap, live, { recursive: true });
    if (before !== dirDigest(live)) restored = true; // 구현 주체가 판정 자산을 건드렸었음
  }
  return restored;
}
function dirDigest(p) {
  const h = createHash('sha256');
  (function walk(q) {
    if (!fs.existsSync(q)) return h.update('∅');
    const st = fs.statSync(q);
    if (st.isDirectory()) for (const e of fs.readdirSync(q).sort()) {
      if (e === '.git' || e === 'node_modules') continue;
      walk(path.join(q, e));
    }
    else h.update(q).update(fs.readFileSync(q));
  })(p);
  return h.digest('hex');
}

// ---------- 검증 (§5.4) ----------
function runVerify() {
  const tampered = restoreAssets(); // 격리: 스냅샷 원복 후 검증
  const results = [];
  for (const v of verifiers) { // §4.2.5 배열: 순서대로 전부 실행, 단락 금지
    if (!v.run) continue;
    const r = spawnSync('sh', ['-c', v.run], { cwd: target, encoding: 'utf8', timeout: 120000 });
    const full = r.stdout + r.stderr;
    results.push({ cmd: v.run, pass: r.status === 0, full, out: full.slice(-800) });
  }
  const pass = results.length > 0 && results.every(r => r.pass);
  // 점수 파생: 전체 출력에서 실패 수 추출 (결함1 수정 — 발췌가 아닌 full 대상)
  const failCount = (results.map(r => (r.full.match(/fail (\d+)/) || [])[1]).find(x => x !== undefined));
  const score = failCount !== undefined ? -Number(failCount) : null; // higher-better 정규화(실패 수의 음수)
  // §4.2.4 무점수 stagnation 기본용 다이제스트: verify 출력 + target 트리 (판정과 산출물의 결합 상태)
  const digest = createHash('sha256')
    .update(results.map(r => r.full).join('\u0000'))
    .update(dirDigest(target))
    .digest('hex');
  return { pass, score, tampered, results, digest };
}

// ---------- 구현 주체 호출 (§5.3) ----------
function runImplementer(input, timeoutMs) {
  return new Promise(resolve => {
    const child = spawn('sh', ['-c', implementerCmd], { cwd: target, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    const t = setTimeout(() => { child.kill('SIGKILL'); resolve({ timedOut: true, out, err }); }, timeoutMs);
    child.stdout.on('data', d => out += d);
    child.stderr.on('data', d => err += d);
    child.on('close', () => { clearTimeout(t); resolve({ timedOut: false, out, err }); });
    child.stdin.write(input);
    child.stdin.end();
  });
}

// ---------- 메인 루프 ----------
function fail(msg) { console.error('✗ ' + msg); process.exit(1); }
function report(status, iter, extra = {}) {
  const rep = { status, iterations: iter, artifacts: target, log: logPath, 'run-id': runId, ...extra };
  logEntry({ iteration: iter, action: 'terminate', verify: null, terminate: rep });
  console.log('\n=== 종료 보고 (§5.5) ===');
  console.log(JSON.stringify(rep, null, 2));
  process.exit(status === 'completed' ? 0 : 3);
}

console.log(`▶ looprun: ${fm.name} (gene ${geneId}, run ${runId})`);
console.log(`  target=${target}\n  stop=${JSON.stringify(stop)} budget=${JSON.stringify(budget)}`);

let green = 0, stag = 0, best = -Infinity, prev = null;
let iter = 0;

// iteration 0 상당의 사전 검증: 이미 목표 달성이면 즉시 종료 (스펙에 규정 없음 —
// SPEC-FINDING(F5): "기동 시점에 이미 goal 충족인 루프"의 동작(즉시 completed? 1회 검증?)이 미정의)
{
  const v0 = runVerify();
  logEntry({ iteration: 0, action: 'pre-check', verify: { pass: v0.pass, score: v0.score } });
  if (v0.pass && greenNeed <= 1) report('completed', 0, { note: 'pre-check green' });
  if (v0.score !== null) best = v0.score;
  prev = { action: 'pre-check', verify: v0, delta: null };
}

while (true) {
  // §4.2.4 / §4.2.6 상한 검사
  if (iter >= maxIter) report('max-iterations', iter);
  if (Date.now() - runStart > maxDurMs) report('max-duration', iter);
  iter++;

  // §5.3 iteration 입력 최소 계약: goal + 본문 + 직전 요약 + 번호/잔여 예산
  const input = [
    `# Agent Loop iteration ${iter}/${Number.isFinite(maxIter) ? maxIter : '∞'}`,
    `## 잔여 예산 (§5.3)\n- 남은 iteration: ${Number.isFinite(maxIter) ? maxIter - iter : '∞'}\n- 남은 run 시간: ${Number.isFinite(maxDurMs) ? Math.max(0, Math.round((maxDurMs - (Date.now() - runStart)) / 1000)) + 's' : '∞'}\n- 이번 iteration 상한: ${Number.isFinite(perIterMs) ? perIterMs / 1000 + 's' : '없음'}`,
    `## GOAL (불변)\n${fm.goal}`,
    `## 운영 지침 (LOOP.md 본문)\n${body.trim()}`,
    ...(playbookSummary ? [`## 플레이북 (playbook/generic — 과거 정제 지식, §5.3 MAY)\n${playbookSummary}`] : []),
    `## 직전 상태\n${prev ? JSON.stringify({ action: prev.action, verify: { pass: prev.verify.pass, score: prev.verify.score, out: prev.verify.results?.map(r => r.out.slice(-400)) }, delta: prev.delta }) : '(첫 iteration)'}`,
    `## 계약`,
    `- 작업 디렉터리의 코드를 수정해 GOAL에 다가가라. 한 iteration에 한 단위 작업.`,
    `- 완료 선언은 무효다. 판정은 러너의 verify가 한다 (자기보고 금지).`,
    `- 판정 자산(${assetPaths.join(', ') || '테스트'})은 수정 금지 — 수정해도 검증 전 원복된다.`,
    `- 마지막 줄에 ACTION: <이번에 한 일 한 줄> 형식으로 출력하라. 접근을 바꿨다면 DELTA: <폐기한 접근 → 새 접근>도.`
  ].join('\n\n');

  if (DRY) { console.log(`\n--- [DRY] iteration ${iter} 입력 ---\n${input.slice(0, 600)}…`); report('aborted', iter, { note: 'dry-run' }); }

  process.stdout.write(`\n[iter ${iter}] 구현 주체 실행… `);
  const impl = await runImplementer(input, perIterMs === Infinity ? 15 * 60 * 1000 : perIterMs);

  // per-iteration 초과 (§4.2.6): green 리셋, stagnation 미계상, max-iterations 계상
  if (impl.timedOut) {
    console.log('per-iteration 초과 (실패 기록, 루프 계속)');
    logEntry({ iteration: iter, action: 'per-iteration-exceeded', verify: null });
    green = 0;
    prev = { action: 'per-iteration-exceeded', verify: { pass: false, score: null }, delta: null };
    continue;
  }
  const action = (impl.out.match(/ACTION:\s*(.+)/) || [, '(무보고)'])[1].trim();
  const delta = (impl.out.match(/DELTA:\s*(.+)/) || [, null])[1];

  // §5.4 검증 — 구현 주체의 어떤 출력도 판정에 쓰지 않는다
  const v = runVerify();
  console.log(`verify ${v.pass ? '✓' : '✗'} score=${v.score}${v.tampered ? ' ⚠판정자산 변조 감지→원복됨' : ''}`);
  logEntry({ iteration: iter, action, delta: delta || undefined, verify: { pass: v.pass, score: v.score, tampered: v.tampered } });

  // green-runs (§4.2.4 리셋 규칙: 완전 통과 외 전부 리셋)
  green = v.pass ? green + 1 : 0;
  if (green >= greenNeed) report('completed', iter);

  // stagnation (§4.2.4 기본 알고리즘: best-so-far 대비)
  if (v.score !== null) {
    if (v.score > best) { best = v.score; stag = 0; }
    else stag++;
  } else {
    // §4.2.4 기본: 무진전 = pass 동일 AND (verify 출력 + 산출물 트리) 다이제스트 불변
    const same = prev?.verify && v.pass === prev.verify.pass && v.digest === prev.verify.digest;
    stag = same ? stag + 1 : 0;
  }
  if (stag >= stagLimit) report('stalled', iter, { 'best-score': best });

  prev = { action, verify: v, delta };
}
