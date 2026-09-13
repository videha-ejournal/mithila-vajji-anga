/* oxlint-disable next/no-html-link-for-pages -- GitHub Pages archive routes use exported documents. */

import type { ArchiveGroup } from './archive-data';
import {
  archiveBasePath,
  archiveGroups,
  getLibraryWork,
  groupRoute,
  routeFor,
  workUnits,
} from './archive-data';
import styles from './archive/archive.module.css';

type ArchiveIndexProps = {
  group: ArchiveGroup;
  language: 'mai' | 'en';
};

const siteUrl = 'https://videha-ejournal.github.io/mithila-vajji-anga';

export default function ArchiveIndex({ group, language }: ArchiveIndexProps) {
  const config = archiveGroups[group];
  const isMaithili = language === 'mai';
  const counterpart = groupRoute(group, isMaithili ? 'en' : 'mai');
  const title = isMaithili ? config.maithiliTitle : config.englishTitle;
  const deck = isMaithili ? config.maithiliDeck : config.englishDeck;

  return (
    <main className={styles.page} lang={isMaithili ? 'mai' : 'en'}>
      <div className={styles.shell}>
        <div className={styles.topline}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <a href={isMaithili ? `${archiveBasePath}/` : `${archiveBasePath}/en/`}>
              {isMaithili ? 'मुख्य अभिलेखागार' : 'Archive home'}
            </a>
            <span aria-hidden="true">/</span>
            <span>{title}</span>
          </nav>
          <nav className={styles.language} aria-label="Language">
            <a href={counterpart} hrefLang={isMaithili ? 'en' : 'mai'}>
              {isMaithili ? 'English' : 'मैथिली'}
            </a>
          </nav>
        </div>

        <header className={styles.hero}>
          <p className={styles.eyebrow}>
            {isMaithili ? 'मिथिला–वज्जि–अंग डिजिटल रिसर्च आर्काइव' : 'Mithila–Vajji–Anga Digital Research Archive'}
          </p>
          <h1>{title}</h1>
          <p className={styles.deck}>{deck}</p>
          <p className={styles.status}>
            {isMaithili
              ? 'केवल स्रोत-सत्यापित अध्याय/इकाइएँ स्थायी पृष्ठ बनैत छथि। अप्रमाणित शीर्षक, बनावटी अध्याय अथवा सामान्य placeholder प्रकाशित नहि कएल जाएत।'
              : 'Only source-verified chapters or units receive permanent pages. Unverified titles, synthetic chapters and generic placeholders are not published.'}
          </p>
        </header>

        <section className={styles.grid} aria-label={isMaithili ? 'स्रोत-पोथी' : 'Source works'}>
          {config.workIds.map((workId) => {
            const work = getLibraryWork(workId);
            const units = workUnits(group, workId);
            if (!work) return null;
            return (
              <article className={styles.card} key={workId}>
                <p className={styles.meta}>{work.sequence} · {work.extent}</p>
                <h2>{work.title}</h2>
                <p>{work.subtitle}</p>
                <p>{work.description}</p>
                <p className={styles.meta}>
                  {units.length > 0
                    ? isMaithili
                      ? `${units.length} स्रोत-सत्यापित स्थायी इकाइ`
                      : `${units.length} source-verified permanent units`
                    : isMaithili
                      ? 'स्रोत-सूची सत्यापनाधीन — कोनो बनावटी अध्याय प्रकाशित नहि'
                      : 'Source inventory pending verification — no synthetic chapters published'}
                </p>
                {units.length > 0 && (
                  <ul className={styles.unitList}>
                    {units.map((unit) => (
                      <li key={unit.key}>
                        <a href={routeFor(unit, language)}>
                          <span className={styles.unitNo}>
                            {isMaithili ? 'इकाइ' : 'Unit'} {unit.number}
                          </span>
                          {unit.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </section>

        <section className={styles.source}>
          <h2>{isMaithili ? 'द्विभाषी संरचना' : 'Bilingual architecture'}</h2>
          <p>
            {isMaithili
              ? 'मैथिली संस्करण सामान्य साइट-पथ पर अछि। एकर जोड़ीदार अंग्रेजी संस्करण /en/ पथ पर अछि। दुनू पृष्ठ पर परस्पर भाषा-लिंक देल गेल अछि।'
              : 'The Maithili edition occupies the normal site path. Its paired English edition lives under /en/. Corresponding pages link to one another reciprocally.'}
          </p>
          <p>
            <a className={styles.textLink} href={`${siteUrl}/history/`}>
              {isMaithili ? '178 पूर्ण इतिहास अध्याय देखू' : 'Browse the 178 completed History chapters'}
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
