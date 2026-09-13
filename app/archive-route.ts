import type { Metadata } from 'next';
import type { ArchiveGroup, ArchiveUnit } from './archive-data';
import { archiveUnits, routeFor } from './archive-data';

const siteUrl = 'https://videha-ejournal.github.io/mithila-vajji-anga';

export function staticParamsFor(group: ArchiveGroup) {
  return archiveUnits
    .filter((unit) => unit.group === group)
    .map((unit) => ({ work: unit.workId, unit: unit.unitId }));
}

export function metadataFor(unit: ArchiveUnit | undefined, language: 'mai' | 'en'): Metadata {
  if (!unit) {
    return {
      title: language === 'mai' ? 'स्रोत इकाइ उपलब्ध नहि' : 'Source unit unavailable',
      robots: { index: false, follow: false },
    };
  }
  const isMaithili = language === 'mai';
  const route = routeFor(unit, language);
  const paired = routeFor(unit, isMaithili ? 'en' : 'mai');
  const canonical = `${siteUrl}${route}`;
  const description = unit.description.replace(/\s+/g, ' ').trim().slice(0, 300);

  return {
    title: `${unit.title} — ${unit.workTitle}`,
    description,
    alternates: {
      canonical,
      languages: isMaithili
        ? { en: `${siteUrl}${paired}` }
        : { mai: `${siteUrl}${paired}` },
    },
    openGraph: {
      type: 'article',
      url: canonical,
      title: unit.title,
      description,
    },
    other: {
      citation_title: unit.title,
      citation_author: 'Gajendra Thakur',
      citation_journal_title: 'Videha Maithili eJournal',
      citation_issn: '2229-547X',
      citation_publication_date: '2026',
      citation_pdf_url: unit.sourcePdf,
    },
  };
}
