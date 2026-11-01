import {ComponentPropsWithoutRef} from 'react';
import Markdown from 'react-markdown';

import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import {markdownText} from './MarkdownText.css';

/** the CSP blocks remote images anyway; dropping them avoids a broken image icon */
const DISALLOWED_ELEMENTS = ['img'];

/** a click goes to main, which opens web pages in the system browser and refuses anything else */
const ExternalLink = ({href, children}: ComponentPropsWithoutRef<'a'>) => (
  <a href={href} target="_blank" rel="noreferrer">
    {children}
  </a>
);

interface MarkdownTextProps {
  text: string;
}

/**
 * Text the user wrote, as Markdown with GitHub's tables, task lists and strikethrough. A single line break stays a line
 * break, so plain text reads as it did before. Raw HTML is shown as text (react-markdown's default).
 */
const MarkdownText = ({text}: MarkdownTextProps) => (
  <div className={markdownText}>
    <Markdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      disallowedElements={DISALLOWED_ELEMENTS}
      components={{a: ExternalLink}}
    >
      {text}
    </Markdown>
  </div>
);

export default MarkdownText;
