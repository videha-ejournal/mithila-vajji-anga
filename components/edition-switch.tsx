'use client';

/* oxlint-disable next/no-html-link-for-pages -- GitHub Pages bilingual route switching requires full-document navigation. */

import { usePathname } from 'next/navigation';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const mirroredPrefixes = ['/history', '/chapters', '/philosophy', '/literature', '/panji', '/sources', '/updates', '/about', '/isbn'];

function counterpart(pathname: string | null, target: 'mai' | 'en') {
  const raw = pathname || '/';
  const normalized = raw.replace(/^\/mithila-vajji-anga/, '') || '/';
  const isEnglish = normalized === '/en' || normalized.startsWith('/en/');
  const localPath = isEnglish ? normalized.replace(/^\/en(?=\/|$)/, '') || '/' : normalized;
  const mirrored = localPath === '/' || mirroredPrefixes.some((prefix) => localPath === prefix || localPath.startsWith(`${prefix}/`));
  if (!mirrored) return target === 'mai' ? `${site}/` : `${site}/en/`;
  if (target === 'mai') return `${site}${localPath === '/' ? '/' : `${localPath.replace(/\/$/, '')}/`}`;
  return `${site}/en${localPath === '/' ? '/' : `${localPath.replace(/\/$/, '')}/`}`;
}

export default function EditionSwitch() {
  const pathname = usePathname();
  const normalized = (pathname || '/').replace(/^\/mithila-vajji-anga/, '') || '/';
  const active: 'mai' | 'en' = normalized === '/en' || normalized.startsWith('/en/') ? 'en' : 'mai';

  return (
    <nav className="edition-switch" aria-label="Archive edition">
      <a href={counterpart(pathname, 'mai')} hrefLang="mai" lang="mai" aria-current={active === 'mai' ? 'page' : undefined} className={active === 'mai' ? 'active' : undefined}>मैथिली</a>
      <a href={counterpart(pathname, 'en')} hrefLang="en" aria-current={active === 'en' ? 'page' : undefined} className={active === 'en' ? 'active' : undefined}>English</a>
    </nav>
  );
}
