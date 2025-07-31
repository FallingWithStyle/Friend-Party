import fs from 'node:fs';
import path from 'node:path';

// Minimal styles consistent with app; using inline classes to avoid new CSS files
function Badge({ children, color }: { children: React.ReactNode; color: 'green' | 'yellow' | 'gray' }) {
  const map = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  } as const;
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${map[color]}`}>
      {children}
    </span>
  );
}

type StoryStatus = 'completed' | 'in_progress' | 'pending';

interface StoryItem {
  file: string;
  title: string;
  status: StoryStatus;
  section?: string;
  subtotals?: {
    completed: number;
    in_progress: number;
    pending: number;
    total: number;
  };
  meta?: {
    as_a?: string;
    i_want?: string;
    so_that?: string;
    acceptance_criteria?: string[];
    status_text?: string;
  };
  links?: {
    inferredFiles: string[];
  };
}

interface Totals {
  completed: number;
  in_progress: number;
  pending: number;
  total: number;
}

const ROOT = process.cwd();

function readSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function parseStatusFromCheckbox(line: string): StoryStatus | null {
  // Matches "- [x] Title", "- [-] Title", "- [ ] Title" or "* [x]" variants
  const m = /[-*]\s+\[(x|-|\s)\]\s+/i.exec(line);
  if (!m) return null;
  const mark = m[1].toLowerCase();
  if (mark === 'x') return 'completed';
  if (mark === '-') return 'in_progress';
  return 'pending';
}

function inferStatusFromFreeform(statusText: string | undefined): StoryStatus | null {
  if (!statusText) return null;
  const s = statusText.toLowerCase();
  if (/(done|complete|completed|approved|merged|shipped|released)\b/.test(s)) return 'completed';
  if (/(in\s*progress|wip|implementing|building|working|ready\s*for\s*review|ready\s*for\s*qa)\b/.test(s)) return 'in_progress';
  if (/(todo|backlog|pending|not\s*started|blocked)\b/.test(s)) return 'pending';
  return null;
}

function statusBadge(status: StoryStatus) {
  if (status === 'completed') return <Badge color="green">Completed</Badge>;
  if (status === 'in_progress') return <Badge color="yellow">In Progress</Badge>;
  return <Badge color="gray">Pending</Badge>;
}

function computeTotals(items: StoryItem[]): Totals {
  const t: Totals = { completed: 0, in_progress: 0, pending: 0, total: 0 };
  for (const it of items) {
    t.total += 1;
    if (it.status === 'completed') t.completed += 1;
    else if (it.status === 'in_progress') t.in_progress += 1;
    else t.pending += 1;
  }
  return t;
}

function parseFrontMatterLikeStatus(raw: string): string | undefined {
  // Look for "## Status" block or "Status:" single line
  const headerBlock = raw.match(/^\s*##\s*Status\s*([\s\S]*?)(^\s*##\s+|$\s*)/im);
  if (headerBlock) {
    const body = headerBlock[1].trim();
    // First non-empty line from the block
    const line = body.split('\n').map((l) => l.trim()).find((l) => l.length > 0);
    if (line) return line;
  }
  const single = raw.match(/^\s*Status:\s*(.+)$/im);
  if (single) return single[1].trim();
  return undefined;
}

function parseUserStoryMeta(raw: string) {
  // Extract "As a", "I want", "so that" lines if present
  const as_a = raw.match(/\*\*As a\*\*\s*:?\s*([^,\n]+),?/i)?.[1]?.trim()
    ?? raw.match(/\*\*As a\*\*\s+(.+?)\s*(?:,|$)/i)?.[1]?.trim();
  const i_want = raw.match(/\*\*I want\*\*\s*:?\s*(.+?)(?:,|\n|$)/i)?.[1]?.trim();
  const so_that = raw.match(/\*\*so that\*\*\s*:?\s*(.+?)(?:\.|\n|$)/i)?.[1]?.trim();

  // First few acceptance criteria bullet points
  const acBlock = raw.match(/^\s*##\s*Acceptance Criteria:?([\s\S]*?)(^\s*##\s+|$\s*)/im);
  let acceptance_criteria: string[] | undefined = undefined;
  if (acBlock) {
    const list = acBlock[1]
      .split('\n')
      .map((l) => l.trim().replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''))
      .filter((l) => l.length > 0)
      .slice(0, 4);
    if (list.length > 0) acceptance_criteria = list;
  }

  return { as_a, i_want, so_that, acceptance_criteria };
}

function parseStoriesDir(): StoryItem[] {
  const storiesDir = path.join(ROOT, '..', 'docs', 'stories');
  let files: string[] = [];
  try {
    files = fs
      .readdirSync(storiesDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => path.join(storiesDir, f));
  } catch {
    return [];
  }

  const items: StoryItem[] = [];

  for (const f of files) {
    const raw = readSafe(f);
    if (!raw) continue;

    const base = path.basename(f);
    // Title: first markdown heading or filename fallback
    const titleMatch = raw.match(/^\s*#\s+(.+)\s*$/m);
    const title = titleMatch ? titleMatch[1].trim() : base;

    // Section: infer from a "x.y." style prefix or from second-level heading
    let section: string | undefined;
    const fnPrefix = base.match(/^(\d+\.\d+)\./);
    if (fnPrefix) {
      section = fnPrefix[1];
    } else {
      const h2 = raw.match(/^\s*##\s+(.+)\s*$/m);
      if (h2) section = h2[1].trim();
    }

    // Determine story-level status:
    // Priority 1: explicit status from block/line then NLP inference
    let status: StoryStatus | null = null;
    const statusText = parseFrontMatterLikeStatus(raw);
    const normalizedExplicit = statusText?.toLowerCase().trim();
    if (normalizedExplicit) {
      if (/^(completed|complete|done|approved)$/.test(normalizedExplicit)) status = 'completed';
      else if (/^(in\s*progress|wip|implementing|building|working|ready\s*for\s*review|ready\s*for\s*qa)$/.test(normalizedExplicit)) status = 'in_progress';
      else if (/^(pending|todo|backlog|not\s*started|blocked)$/.test(normalizedExplicit)) status = 'pending';
      else status = inferStatusFromFreeform(statusText) ?? null;
    }

    // Priority 2: aggregate from checkboxes if no explicit status
    const checkboxLines = raw.split('\n').filter((l) => /[-*]\s+\[(x|-|\s)\]\s+/i.test(l));
    let subtotals: StoryItem['subtotals'] | undefined = undefined;
    if (!status && checkboxLines.length > 0) {
      let c = 0,
        p = 0,
        i = 0;
      for (const l of checkboxLines) {
        const st = parseStatusFromCheckbox(l);
        if (st === 'completed') c += 1;
        else if (st === 'in_progress') i += 1;
        else p += 1;
      }
      const total = checkboxLines.length;
      subtotals = { completed: c, in_progress: i, pending: p, total };
      if (c === total && total > 0) status = 'completed';
      else if (i > 0 || (c > 0 && c < total)) status = 'in_progress';
      else status = 'pending';
    }

    // Fallback heuristic: if story contains "### Final Status" with ✅/✗, use that
    if (!status) {
      const finalStatusBlock = raw.match(/^\s*###\s*Final Status\s*([\s\S]*?)(^\s*###\s+|^\s*##\s+|$)/im);
      const finalLine = finalStatusBlock?.[1]?.split('\n').map((l) => l.trim()).find((l) => l.length > 0);
      if (finalLine) {
        if (/✓|✔|✅|approved|pass|accepted|changes\s*approved/i.test(finalLine)) status = 'completed';
        else if (/✗|✖|❌|changes\s*required|needs\s*work|pending/i.test(finalLine)) status = 'in_progress';
      }
    }

    // Last fallback: try general inference from freeform "Status" captured earlier
    if (!status && statusText) {
      status = inferStatusFromFreeform(statusText) ?? null;
    }

    // Final fallback: pending
    if (!status) status = 'pending';

    const meta = parseUserStoryMeta(raw);

    // Try to infer referenced files (for quick navigation hints)
    const inferredFiles = Array.from(raw.matchAll(/`([^`]+?\.(?:tsx?|sql|md))`/g)).map((m) => m[1]);

    items.push({
      file: base,
      title,
      status,
      section,
      subtotals,
      meta: {
        ...meta,
        status_text: statusText,
      },
      links: { inferredFiles },
    });
  }

  return items.sort((a, b) => a.file.localeCompare(b.file));
}

function parsePrdSections(): string[] {
  const prdPath = path.join(ROOT, '..', 'docs', 'prd.md');
  const raw = readSafe(prdPath);
  if (!raw) return [];
  // Collect H2 sections to provide loose grouping labels
  const sections = [...raw.matchAll(/^\s*##\s+(.+)\s*$/gm)].map((m) => m[1].trim());
  return sections;
}

export default async function ProgressPage() {
  // Hide in production
  if (process.env.NODE_ENV === 'production') {
    // Return a minimal 404-like page
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Not Found</h1>
        <p style={{ color: '#555' }}>This page is only available in development.</p>
      </div>
    );
  }

  const stories = parseStoriesDir();
  const totals = computeTotals(stories);
  const prdSections = parsePrdSections();

  // Group by inferred section (string) when available
  const bySection = new Map<string, StoryItem[]>();
  for (const it of stories) {
    const key = it.section ?? 'Ungrouped';
    if (!bySection.has(key)) bySection.set(key, []);
    bySection.get(key)!.push(it);
  }

  // Order sections: first those that match PRD H2 order (when names line up),
  // then remaining sections alphabetically.
  const sectionOrder: string[] = [];
  for (const s of prdSections) {
    if (bySection.has(s)) sectionOrder.push(s);
  }
  const remaining = [...bySection.keys()].filter((s) => !sectionOrder.includes(s)).sort();
  const finalSections = [...sectionOrder, ...remaining];

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>PRD Progress</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div className="rounded border p-3">
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold">{totals.total}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-700">{totals.completed}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-2xl font-bold text-yellow-700">{totals.in_progress}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-gray-700">{totals.pending}</div>
        </div>
      </div>

      {finalSections.map((sec) => {
        const list = bySection.get(sec)!;
        const sTotals = computeTotals(list);
        return (
          <div key={sec} className="rounded border p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">{sec}</h2>
              <div className="text-sm text-gray-600">
                {sTotals.completed}/{sTotals.total} completed
              </div>
            </div>
            <div className="space-y-3">
              {list.map((st) => (
                <div key={st.file} className="flex items-start gap-3">
                  <div style={{ minWidth: 110 }}>{statusBadge(st.status)}</div>
                  <div className="flex-1">
                    <div className="font-medium">{st.title}</div>
                    <div className="text-xs text-gray-600">{st.file}</div>

                    {/* Meta detail: As a / I want / so that */}
                    {st.meta?.as_a || st.meta?.i_want || st.meta?.so_that ? (
                      <div className="text-sm text-gray-700 mt-1">
                        {st.meta?.as_a ? <div><strong>As a:</strong> {st.meta.as_a}</div> : null}
                        {st.meta?.i_want ? <div><strong>I want:</strong> {st.meta.i_want}</div> : null}
                        {st.meta?.so_that ? <div><strong>So that:</strong> {st.meta.so_that}</div> : null}
                      </div>
                    ) : null}

                    {/* Acceptance Criteria preview */}
                    {st.meta?.acceptance_criteria && st.meta.acceptance_criteria.length > 0 ? (
                      <div className="text-xs text-gray-700 mt-2">
                        <div className="font-semibold mb-1">Acceptance Criteria (preview):</div>
                        <ul className="list-disc ml-5 space-y-0.5">
                          {st.meta.acceptance_criteria.map((ac, idx) => (
                            <li key={idx}>{ac}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {/* Subtask subtotals */}
                    {st.subtotals ? (
                      <div className="text-xs text-gray-700 mt-2">
                        Subtasks: {st.subtotals.completed} completed, {st.subtotals.in_progress} in progress, {st.subtotals.pending} pending
                      </div>
                    ) : null}

                    {/* Status text hint (for ambiguous statuses) */}
                    {st.meta?.status_text ? (
                      <div className="text-[11px] text-gray-500 mt-1">Status note: “{st.meta.status_text}”</div>
                    ) : null}

                    {/* Inferred file references */}
                    {st.links?.inferredFiles && st.links.inferredFiles.length > 0 ? (
                      <div className="text-[11px] text-gray-500 mt-1">
                        Files: {st.links.inferredFiles.slice(0, 3).join(', ')}
                        {st.links.inferredFiles.length > 3 ? '…' : ''}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {finalSections.length === 0 ? (
        <div className="rounded border p-4">
          <div className="font-medium">No stories found</div>
          <p className="text-sm text-gray-600 mt-1">
            Ensure markdown story files exist in docs/stories and follow basic checklist or status patterns.
          </p>
        </div>
      ) : null}
    </div>
  );
}