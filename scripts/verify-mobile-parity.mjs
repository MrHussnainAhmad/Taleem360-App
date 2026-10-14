import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const requireBackend = createRequire(path.resolve('../lms-backend/package.json'));
const { build } = requireBackend('esbuild');
const output = path.resolve('.codex/mobile-parity');
fs.mkdirSync(output, { recursive: true });
const performanceMode = process.argv.includes('--performance') || process.env.MOBILE_PERFORMANCE === '1';
const mocks = {
  'fixture-processing-state': `let state='active';const callbacks=new Set();window.setProcessingActive=active=>{state=active?'active':'background';callbacks.forEach(callback=>callback(state));};export const AppState={get currentState(){return state;},addEventListener:(_event,callback)=>{callbacks.add(callback);return {remove:()=>callbacks.delete(callback)};}};`,
  'jwt-decode': `export const jwtDecode=()=>({userId:7,role:'STAFF',institutionId:1});`,
  'tus-js-client': `export class Upload{constructor(_file,options){this.options=options;}start(){window.transferCount=(window.transferCount||0)+1;queueMicrotask(()=>this.options.onSuccess());}}`,
  '@expo/vector-icons/Ionicons': `export default ()=>null;`,
  'expo-linear-gradient': `import React from 'react';import {View} from 'react-native';export const LinearGradient=({children,colors,start,end,...props})=><View {...props}>{children}</View>;`,
  'react-native-safe-area-context': `export const useSafeAreaInsets=()=>({top:0,bottom:0,left:0,right:0});`,
  'expo-router': `import {useEffect} from 'react';const router={push:path=>window.navigation=path,back:()=>{},replace:()=>{}};export const useRouter=()=>router;export const useLocalSearchParams=()=>({id:'1',sectionId:'1'});export const useFocusEffect=callback=>useEffect(callback,[callback]);`,
  '@expo/vector-icons': `export const Ionicons=()=>null;`,
  '@/context/ThemePreferencesContext': `import {Colors} from '@/constants/theme';export const useThemeColors=()=>Colors.light;export const useThemePreferences=()=>({isGlass:false});export const useResolvedColorScheme=()=> 'light';`,
  '@/context/PortalVisualContext': `export const usePortalVisuals=()=>false;`,
  '@/context/AuthContext': `export const useAuth=()=>({logout:()=>{},user:{role:'PARENT'}});`,
  '@/context/ParentPortalContext': `import React,{createContext,useContext,useState} from 'react';const Context=createContext(null);export const useParentPortal=()=>useContext(Context);export function FixtureParentProvider({children}){const [id,setId]=useState(1);window.selectChild=setId;return <Context.Provider value={{selectedStudentId:id,period:'MONTHLY',periodAnchor:'2026-10-10',selectedChild:{id,name:'Student '+id},children:[],loading:false,error:''}}>{children}</Context.Provider>;}`,
  '@/components/parent/ParentChildSwitcher': `import React from 'react';import {Text} from 'react-native';import {useParentPortal} from '@/context/ParentPortalContext';export const ParentChildSwitcher=()=>{const p=useParentPortal();return <Text>Selected child {p.selectedStudentId}</Text>;};`,
  '@/components/ui/ScreenShell': `import React from 'react';import {View,Text} from 'react-native';export const ScreenShell=({title,children})=><View style={{padding:16,gap:12}}><Text>{title}</Text>{children}</View>;`,
  '@/components/ui/Skeleton': `import React from 'react';import {Text} from 'react-native';export const SkeletonPage=()=> <Text>Loading…</Text>;export const SkeletonList=SkeletonPage;export const SkeletonTable=SkeletonPage;export const CardListSkeleton=SkeletonPage;export const FormSkeleton=SkeletonPage;`,
  '@/components/ui/GlassCard': `import React from 'react';import {View} from 'react-native';export const GlassCard=({children})=><View>{children}</View>;`,
  '@/utils/auth-storage': `export const getAccessToken=async()=> 'fixture-token';export const getRefreshToken=async()=> 'fixture-refresh';export const setAuthTokens=async()=>{};export const clearAuthTokens=async()=>{};`,
  '@react-native-async-storage/async-storage': `export default {getItem:async key=>localStorage.getItem(key),setItem:async(key,value)=>localStorage.setItem(key,value),removeItem:async key=>localStorage.removeItem(key)};`,
  'expo-document-picker': `export const getDocumentAsync=async()=>({canceled:false,assets:[window.pickedFile||{name:'receipt.png',uri:'data:image/png;base64,iVBORw0KGgo=',mimeType:'image/png',size:8}]});`,
  'expo-file-system/legacy': `export const cacheDirectory='file:///fixture/';export const FileSystemUploadType={MULTIPART:1};export const writeAsStringAsync=async()=>{};export const getInfoAsync=async()=>({exists:true,size:100});export const uploadAsync=async()=>{throw Error('Native upload must not be called on web');};`,
  'expo-image-manipulator': `export const SaveFormat={WEBP:'webp'};export const manipulateAsync=async uri=>({uri});`,
  'expo-print': `export const printAsync=async data=>window.printRequests.push(data);export const printToFileAsync=async data=>{window.printRequests.push(data);return {uri:'file:///fixture/document.pdf'};};`,
  'expo-sharing': `export const isAvailableAsync=async()=>true;export const shareAsync=async(...args)=>window.printRequests.push(args);`,
};
await build({
  entryPoints: ['scripts/mobile-parity-fixture.jsx'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  outfile: path.join(output, 'app.js'),
  jsx: 'automatic',
  define: {
    'process.env.NODE_ENV': '"development"',
    'process.env.EXPO_PUBLIC_API_URL': '"https://fixture.test"',
  },
  plugins: [
    {
      name: 'native-boundaries',
      setup(builder) {
        builder.onResolve({ filter: /.*/ }, (args) => {
          if (args.path === 'react-native' && args.importer.endsWith('use-processing-activity.ts')) return { path: 'fixture-processing-state', namespace: 'fixture' };
          if (args.path === 'react-native')
            return { path: path.resolve('node_modules/react-native-web/dist/index.js') };
          let key = args.path;
          if (args.path.startsWith('.')) {
            const absolute = path.resolve(args.resolveDir, args.path);
            if (absolute.startsWith(path.resolve('src')))
              key = '@/' + path.relative(path.resolve('src'), absolute).replaceAll('\\', '/');
          }
          if (performanceMode && key === '@/components/ui/ScreenShell') return;
          if (mocks[key]) return { path: key, namespace: 'fixture' };
        });
        builder.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
          contents: mocks[args.path],
          loader: 'jsx',
          resolveDir: process.cwd(),
        }));
      },
    },
  ],
});
fs.writeFileSync(
  path.join(output, 'index.html'),
  '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex;flex-direction:column}</style><div id="root"></div><script src="/app.js"></script>',
);
const server = http.createServer((req, res) => {
  const name = req.url === '/app.js' ? 'app.js' : 'index.html';
  res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : 'text/html');
  res.end(fs.readFileSync(path.join(output, name)));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const profile = fs.mkdtempSync(path.join(output, 'browser-'));
const browser = process.env.BROWSER_BIN || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const child = spawn(
  browser,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { windowsHide: true, stdio: 'ignore' },
);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const checks = [],
  errors = [];
let socket;
try {
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await delay(100);
  assert(fs.existsSync(portFile));
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0],
    targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find((row) => row.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  let serial = 0;
  const waiting = new Map();
  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.id) {
      const entry = waiting.get(data.id);
      waiting.delete(data.id);
      data.error ? entry.reject(Error(data.error.message)) : entry.resolve(data.result);
    } else if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails);
  });
  const call = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++serial;
      waiting.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async (expression, label) => {
    for (let i = 0; i < 100; i++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw Error('Timed out: ' + label + '\n' + (await evaluate('document.body.innerText')));
  };
  const text = (value) => until(`document.body.innerText.includes(${JSON.stringify(value)})`, value);
  const click = async (label, contains = false) => {
    const query = `[...document.querySelectorAll('button,[role="button"],[tabindex="0"]')].find(b=>${contains ? `b.textContent.includes(${JSON.stringify(label)})` : `b.textContent.trim()===${JSON.stringify(label)}`}&&b.getAttribute('aria-disabled')!=='true'&&!b.disabled)`;
    await until(`Boolean(${query})`, label);
    await evaluate(`(${query}).click()`);
    await delay(120);
  };
  const fill = async (label, value) => {
    await evaluate(
      `(()=>{const label=[...document.querySelectorAll('div,label')].find(e=>e.textContent===${JSON.stringify(label)}&&e.children.length===0);const input=label?.parentElement.querySelector('input,textarea');if(!input)throw Error('Missing field '+${JSON.stringify(label)});Object.getOwnPropertyDescriptor(input instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
  };
  const visit = async (screen, label) => {
    await evaluate(`window.showScreen(${JSON.stringify(screen)})`);
    await text(label);
  };
  const check = (label) => {
    checks.push(label);
    console.log('PASS ' + label);
  };
  await call('Runtime.enable');
  await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await call('Page.navigate', { url: `http://127.0.0.1:${server.address().port}` });
  await text('Current test');
  await click('Load more');
  await text('Older test');
  check('Student test list accepts paginated response and loads older tests');
  await visit('submissions', 'Current assignment');
  await click('Load more');
  await text('Older assignment');
  check('Student assignment pagination');
  await visit('fees', 'Admission charge');
  await text('23,000');
  await text('Unclear receipt');
  await click('Admission charge', true);
  await text('RECEIPT-1');
  await click('More items and receipts');
  await text('RECEIPT-2');
  await click('Next challans');
  await text('Older challan');
  check('Fee global balance, one-time labels, rejection notes, invoice detail and invoice pagination');
  await visit('parentFees', 'Selected child 1');
  await click('Pay challan');
  await click('Second Bank · School · 222');
  await fill('Amount (PKR)', '300');
  await fill('Source bank or wallet', 'My Bank');
  await fill('Transaction ID', 'TX-123');
  await click('Choose receipt image or PDF');
  await text('receipt.png');
  await click('Submit payment');
  await text('Payment submitted.');
  assert(
    await evaluate(
      `window.requests.some(r=>r.path==='/api/student/fees'&&r.body?.action==='complete'&&r.body.paymentAccountId==='bank2'&&r.body.amount===300&&r.query.includes('studentId=1'))`,
    ),
  );
  await evaluate('window.selectChild(2)');
  await text('Selected child 2');
  await until(
    `window.requests.some(r=>r.path==='/api/student/fees'&&r.query.includes('studentId=2'))`,
    'child fee scope',
  );
  check(
    'Parent partial payment sends selected account, signed upload fields and child scope; child switching remounts fees',
  );
  await visit('hosted', 'Hosted quiz');
  await text('1 submissions');
  await click('Hosted quiz', true);
  await text('Student One');
  await click('Grade');
  await text('A fraction is part of a whole.');
  await fill('Score (Max 5)', '4');
  await click('Save Grade');
  await until(
    `window.requests.some(r=>r.path==='/api/staff/host-tests/100/grade'&&r.body.shortScores['1']==='4')`,
    'grade submission',
  );
  await click('Load more tests');
  await text('Older hosted test');
  check('Hosted-test counts, separate detail/answer requests, short-answer grading and pagination');
  await visit('assignments', 'Current class assignment');
  await click('Load more assignments');
  await text('Older class assignment');
  check('Teacher assignment pagination');
  await visit('marks', 'Manual quiz');
  await click('Download roster CSV');
  await until(`window.requests.some(r=>r.path==='/api/staff/marks/template')`, 'CSV download');
  await evaluate(
    `window.pickedFile={name:'marks.csv',uri:'data:text/csv,Roll%20Number%2CMarks%20Obtained%2CTotal%20Marks%0A1%2C8%2C10',mimeType:'text/csv',size:60}`,
  );
  await click('Upload marks CSV');
  await text('CSV marks saved.');
  await click('Publish saved results');
  await click('Confirm publication');
  await text('Results published');
  assert(
    await evaluate(
      `window.requests.some(r=>r.path==='/api/staff/marks/tools'&&r.body.action==='upload'&&!r.headers['content-type'])`,
    ),
  );
  check(
    'CSV template download, multipart upload without JSON content type and confirmed assessment publication',
  );
  await visit('studentAnnouncements', 'Current notice');
  await click('Next');
  await text('Older notice');
  check('Student announcement history');
  await visit('teacherAnnouncements', 'Create announcement');
  await fill('Title', 'Class reminder');
  await fill('Message', 'Bring your notebooks.');
  await click('Send announcement');
  await text('Announcement sent.');
  await text('Class reminder');
  assert(
    await evaluate(
      `window.requests.some(r=>r.path==='/api/staff/announcements'&&r.body?.targetSectionId===1&&r.body.targetClassId===1)`,
    ),
  );
  await click('Next');
  await text('Older notice');
  await click('Next sent');
  await text('Page 2');
  await fill('Title', 'Second class reminder');
  await fill('Message', 'Bring your textbooks.');
  await evaluate(`window.broadcastReadsBefore=window.requests.filter(r=>r.path==='/api/staff/announcements'&&r.method==='GET').length`);
  await click('Send announcement');
  await text('Second class reminder');
  await text('Page 1');
  await delay(250);
  assert(await evaluate(`window.requests.filter(r=>r.path==='/api/staff/announcements'&&r.method==='GET').length-window.broadcastReadsBefore===1`), 'sending from page two reloads announcements once');
  check('Teacher assigned-section broadcast, sent history and received history');
  await visit('streaming', 'institution');
  await click('MUX');
  await fill('Access token ID', 'token-id');
  await fill('Access token secret', 'token-secret');
  await click('Verify and save');
  await text('verified and saved');
  await click('Remove personal credentials');
  await click('Confirm removal');
  await text('Personal credentials removed.');
  check(
    'Streaming settings save verified provider credentials, show institution override and remove configuration',
  );
  await visit('results', 'Current result');
  await text('Best 95%');
  await click('Next results');
  await text('Earlier result');
  await click('FINAL');
  await text('Current result');
  assert(
    await evaluate(
      `window.requests.some(r=>r.path==='/api/parent/portal'&&r.query.includes('type=FINAL')&&r.query.includes('page=1'))`,
    ),
  );
  check('Parent type filters reset paging; result pagination and best percentage');
  await visit('account', 'Student record');
  await text('student@example.test');
  await text('guardian@example.test');
  await text('2020');
  await text('03001234567');
  check('Parent full identity, enrollment and contact fields');
  await visit('diary', 'chapter.pdf');
  check('Parent homework attachment filename');
  await visit('idCard', 'My ID Card');
  await text('Principal / Head');
  assert(await evaluate(`document.querySelectorAll('img').length>=2`));
  await click('Save / share ID card PDF');
  await until(
    `document.querySelector('iframe')?.srcdoc.includes('Scan to verify student identity')`,
    'ID print document',
  );
  check('ID card signature and PDF document includes verification QR and both sides');
  await visit('transcript', 'Annual Exam');
  await text('Fixture School');
  await text('Grading reference');
  await click('Save / share transcript PDF');
  await until(
    `[...document.querySelectorAll('iframe')].some(frame=>frame.srcdoc.includes('Official Transcript'))`,
    'transcript PDF',
  );
  const html = await evaluate('window.documentHtml()');
  assert(html.includes('Principal / Head'));
  assert(html.includes('90.0%'));
  assert(html.includes('Student One'));
  check('Branded signed transcript, marks totals and printable PDF');
  await visit('promotion', 'Congratulations, you are promoted');
  await click('Continue');
  await visit('tests', 'Current test');
  await visit('promotion', '');
  await delay(400);
  assert(!(await evaluate(`document.body.innerText.includes('Congratulations, you are promoted')`)));
  check('Promotion notification acknowledgment persists');
  assert(await evaluate(`window.requests.filter(r=>r.path==='/api/student/promotion-result').length===1`), 'home revisit reuses promotion result');
  await visit('staffCourses', 'Video course');
  await click('Video course', true);
  await until(`Boolean(document.querySelector('input[placeholder="Lecture number"]'))`, 'lecture form');
  for (const [placeholder, value] of [['Lecture number', '1'], ['Lecture title', 'First lecture']]) {
    await evaluate(`(()=>{const input=document.querySelector(${JSON.stringify('input[placeholder="' + placeholder + '"]')});if(!input)throw Error('Missing course field');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  }
  await evaluate(`window.pickedFile={name:'lesson.mp4',uri:'file:///lesson.mp4',mimeType:'video/mp4',size:100};window.processingReady=false;window.setProcessingActive(false)`);
  await evaluate(`document.querySelector('[aria-label="Choose video from device"]').click()`);
  await delay(120);
  await click('Upload & save');
  await delay(250);
  assert(await evaluate(`!window.requests.some(r=>r.path==='/api/staff/courses/uploads'&&r.method==='POST')`), 'background screen does not start upload/status calls');
  await evaluate('window.setProcessingActive(true)');
  await until(`window.requests.some(r=>r.path==='/api/staff/courses/uploads'&&r.method==='GET')`, 'processing status');
  await visit('tests', 'Current test');
  const statusBeforeReturn = await evaluate(`window.requests.filter(r=>r.path==='/api/staff/courses/uploads'&&r.method==='GET').length`);
  await visit('staffCourses', 'Resume & save');
  await delay(300);
  assert.equal(await evaluate(`window.requests.filter(r=>r.path==='/api/staff/courses/uploads'&&r.method==='GET').length`), statusBeforeReturn, 'restored draft waits for resume');
  await evaluate('window.processingReady=true');
  await click('Resume & save');
  await until(`window.requests.some(r=>r.path==='/api/staff/courses/1'&&r.method==='POST')`, 'resumed lecture saved');
  assert(await evaluate(`window.transferCount===1&&window.requests.filter(r=>r.path==='/api/staff/courses/uploads'&&r.method==='POST').length===1`), 'resuming does not upload again');
  await until(`![...Array(localStorage.length)].map((_,index)=>localStorage.key(index)).some(key=>key.startsWith('course-video:'))`, 'draft cleared after save');
  check('Video processing pauses in background, cancels on unmount, and resumes a saved upload without reuploading');
  if (performanceMode) {
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await until('window.motionReduced === true', 'reduced motion enabled');
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await until('window.motionReduced === false', 'reduced motion disabled');
    check('Motion preference responds to OS setting changes without restarting');
    await evaluate('window.largeLists=true');
    for (const screen of ['tests', 'submissions', 'hosted', 'assignments']) {
      await visit(screen, 'Performance row 1');
      await delay(500);
      const countRows = () => evaluate("[...document.querySelectorAll('div')].filter(e=>e.children.length===0 && /^Performance row [0-9]+$/.test(e.textContent)).length");
      const initialRows = await countRows();
      assert(initialRows > 0 && initialRows < 100, screen + ': should render a bounded window, got ' + initialRows);
      const hasViewport = await evaluate("(()=>{const list=document.querySelector('[data-testid=\"performance-list\"]');return list && list.clientHeight>100 && list.clientHeight<900 && list.scrollHeight>list.clientHeight;})()");
      assert(hasViewport, screen + ': list must have its own bounded scrolling viewport');
      for (let attempt = 0; attempt < 80; attempt++) {
        await evaluate("(()=>{const list=document.querySelector('[data-testid=\"performance-list\"]');list.scrollTop=list.scrollHeight;list.dispatchEvent(new Event('scroll'));})()");
        await delay(200);
        if (await evaluate("document.body.innerText.includes('Performance row 300')")) break;
      }
      await text('Performance row 300');
      // VirtualizedList batches its window updates after a large jump.
      await until("[...document.querySelectorAll('div')].filter(e=>e.children.length===0 && /^Performance row [0-9]+$/.test(e.textContent)).length < 150", screen + ': settle to a bounded render window');
      check(screen + ': 300 rows virtualized in a bounded viewport; final row reachable');
    }
  }
  assert.equal(errors.length, 0, JSON.stringify(errors));
  await visit('parentFees', 'Fees & payments');
  const shot = await call('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(output, 'parent-fees-mobile.png'), Buffer.from(shot.data, 'base64'));
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ checks, errors }, null, 2));
  console.log(checks.length + ' mobile browser scenario groups passed.');
} catch (error) {
  console.error('Browser errors:', JSON.stringify(errors));
  throw error;
} finally {
  socket?.close();
  child.kill();
  server.close();
}
