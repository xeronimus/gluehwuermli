import {ComponentPropsWithoutRef} from 'react';
import Markdown from 'react-markdown';

import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import {isOpenableExternalUrl} from '@shared/links';

import {markdownText} from './MarkdownText.css';

/** the CSP blocks remote images anyway; dropping them avoids a broken image icon */
const DISALLOWED_ELEMENTS = ['img'];

/**
 * A click goes to main, which opens web pages in the system browser. Any other link (relative, #anchor, file:, …) is
 * shown as text: main would refuse it, and Chromium would first resolve a relative one against the app's own page.
 */
const ExternalLink = ({href, children}: ComponentPropsWithoutRef<'a'>) =>
  href !== undefined && isOpenableExternalUrl(href) ? (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <span>{children}</span>
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
