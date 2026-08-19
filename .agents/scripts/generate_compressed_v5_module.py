from pathlib import Path
import base64, gzip, json
quiz = Path('.agents/outputs/quiz-v5.ts').read_text()
# Recover generated JSON by slicing between array markers.
quiz_json = quiz.split('export const V5_QUESTIONS: Question[] = [', 1)[1].rsplit('];', 1)[0]
# Each row has a trailing comma. Wrap as valid JSON.
spot = json.loads('[' + quiz_json.strip().rstrip(',') + ']')
fd = Path('.agents/outputs/detective-v5.ts').read_text()
fd_json = fd[fd.index('=') + 1:].strip().rstrip(';').strip()
updates = json.loads(fd_json)

def pack(value):
    raw = json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()
    return base64.b64encode(gzip.compress(raw, compresslevel=9)).decode()
spot_b64, fd_b64 = pack(spot), pack(updates)
module=f'''// Generated from GFF_Fraud_Arena_Question_Bank_v5.xlsx. The compact payload keeps the shipped
// content aligned with the reviewed workbook without duplicating a large authoring file by hand.
import type {{ DetectiveCase }} from './detective';
import type {{ Question }} from './quiz';

const SPOT_DATA = '{spot_b64}';
const DETECTIVE_DATA = '{fd_b64}';

async function unpack<T>(payload: string): Promise<T> {{
  const bytes = Uint8Array.from(atob(payload), (char) => char.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text()) as T;
}}

let spotQuestionCache: Promise<Question[]> | undefined;
let detectiveUpdateCache: Promise<Record<string, Pick<DetectiveCase, 'sector' | 'title' | 'clues' | 'brief' | 'answer' | 'explanation' | 'hook'>>> | undefined;

export function loadV5SpotQuestions() {{
  spotQuestionCache ??= unpack<Question[]>(SPOT_DATA);
  return spotQuestionCache;
}}

export function applyV5DetectiveContent(cases: DetectiveCase[]) {{
  detectiveUpdateCache ??= unpack<Record<string, Pick<DetectiveCase, 'sector' | 'title' | 'clues' | 'brief' | 'answer' | 'explanation' | 'hook'>>>(DETECTIVE_DATA);
  return detectiveUpdateCache.then((updates) => cases.map((caseData) => ({{
    ...caseData,
    ...(updates[caseData.id] ?? {{}}),
  }})));
}}
'''
Path('.agents/outputs/question-bank-v5.ts').write_text(module)
print('spot compressed chars',len(spot_b64),'detective compressed chars',len(fd_b64),'module',len(module))
