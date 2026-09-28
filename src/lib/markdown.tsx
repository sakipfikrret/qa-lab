import React from 'react';

/** Minimal, dependency-free markdown → React. Never uses dangerouslySetInnerHTML. */
function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) nodes.push(<strong key={`${keyPrefix}-${i++}`} className="font-semibold text-white">{tok.slice(2, -2)}</strong>);
    else nodes.push(<code key={`${keyPrefix}-${i++}`} className="px-1 py-0.5 rounded bg-white/[0.08] font-mono text-[0.92em]">{tok.slice(1, -1)}</code>);
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i++]);
      i++;
      blocks.push(<pre key={key++} className="p-2.5 rounded-md bg-black/40 border border-white/[0.08] overflow-x-auto font-mono text-xs">{buf.join('\n')}</pre>);
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      blocks.push(<div key={key++} className="font-semibold text-white mt-1">{inline(h[2], `h${key}`)}</div>);
      i++;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ''));
      blocks.push(<ul key={key++} className="list-disc pl-5 space-y-1">{items.map((t, n) => <li key={n}>{inline(t, `u${key}-${n}`)}</li>)}</ul>);
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
      blocks.push(<ol key={key++} className="list-decimal pl-5 space-y-1">{items.map((t, n) => <li key={n}>{inline(t, `o${key}-${n}`)}</li>)}</ol>);
      continue;
    }

    if (line.trim() === '') { i++; continue; }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^(\s*[-*]\s+|\s*\d+[.)]\s+|#{1,4}\s|```)/.test(lines[i])) para.push(lines[i++]);
    blocks.push(<p key={key++}>{inline(para.join(' '), `p${key}`)}</p>);
  }

  return <div className="space-y-2">{blocks}</div>;
}
