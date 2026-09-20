'use client';

import { usePathname } from 'next/navigation';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';

export default function EditionSwitch() {
  const pathname = usePathname();
  const active: 'mai' | 'en' = /(?:^|\/)en(?:\/|$)/.test(pathname ?? '') ? 'en' : 'mai';

  return (
    <nav className="edition-switch" aria-label="Archive edition">
      <a
        href={`${site}/`}
        hrefLang="mai"
        lang="mai"
        aria-current={active === 'mai' ? 'page' : undefined}
        className={active === 'mai' ? 'active' : undefined}
      >
        मैथिली
      </a>
      <a
        href={`${site}/en/`}
        hrefLang="en"
        aria-current={active === 'en' ? 'page' : undefined}
        className={active === 'en' ? 'active' : undefined}
      >
        English
      </a>
    </nav>
  );
}
