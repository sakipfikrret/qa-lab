import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { Markdown } from '../lib/markdown';

describe('Markdown renderer', () => {
  it('renders bold, code, lists and headings', () => {
    const { container } = render(<Markdown source={'## Title\n\n- one **bold**\n- two `code`\n\n1. first\n2. second'} />);
    expect(container.querySelectorAll('li').length).toBe(4);
    expect(container.querySelector('strong')?.textContent).toBe('bold');
    expect(container.querySelector('code')?.textContent).toBe('code');
    expect(container.textContent).not.toContain('**');
  });

  it('never injects raw HTML', () => {
    const { container } = render(<Markdown source={'<img src=x onerror=alert(1)> <script>alert(1)</script>'} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>');
  });

  it('renders fenced code verbatim', () => {
    const { container } = render(<Markdown source={'```\nconst a = **1**;\n```'} />);
    expect(container.querySelector('pre')?.textContent).toBe('const a = **1**;');
  });
});
