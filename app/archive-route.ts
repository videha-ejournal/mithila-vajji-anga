import type { Metadata } from 'next';
import type { ArchiveGroup, ArchiveUnit } from './archive-data';
import { archiveUnits, getLibraryWork, maithiliReading, routeFor } from './archive-data';

const siteOrigin = 'https://videha-ejournal.github.io';
const videhaUrl = 'https://www.videha.co.in/';
const videhaMirrorUrl = 'https://videha-ejournal.github.io/videha/';
const videhaGithubUrl = 'https://github.com/videha-ejournal';

function isbnFromExtent(extent = '') {
  return extent.match(/ISBN\s+([0-9-]{13,17})/i)?.[1] ?? '';
}

function parentWorkContext(unit: ArchiveUnit) {
  const direct = getLibraryWork(unit.workId);
  let isbn = isbnFromExtent(direct?.extent ?? '');
  let title = direct?.title ?? unit.workTitle;
  if (!isbn && unit.workId.startsWith('parallel-philosophy-')) {
    const parent = getLibraryWork('parallel-philosophy');
    isbn = isbnFromExtent(parent?.extent ?? '');
    title = parent?.title ?? title;
  }
  return { isbn, title };
}

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
  const canonical = `${siteOrigin}${route}`;
  const description = unit.description.replace(/\s+/g, ' ').trim().slice(0, 300);
  const hasMaithiliReading = Boolean(maithiliReading(unit).trim());
  const languageAlternates: Record<string, string> = isMaithili
    ? { en: `${siteOrigin}${paired}` }
    : hasMaithiliReading
      ? { mai: `${siteOrigin}${paired}` }
      : {};
  const parentWork = parentWorkContext(unit);

  return {
    title: `${unit.title} — ${unit.workTitle}`,
    description,
    alternates: {
      canonical,
      languages: languageAlternates,
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
      citation_journal_title: 'Videha — First Maithili Fortnightly eJournal',
      citation_issn: '2229-547X',
      citation_publication_date: '2026',
      citation_website_url: videhaUrl,
      citation_mirror_url: videhaMirrorUrl,
      citation_archive_network_url: videhaGithubUrl,
      ...(parentWork.isbn ? {
        citation_parent_isbn: parentWork.isbn,
        citation_parent_title: parentWork.title,
      } : {}),
    },
  };
}
