/* oxlint-disable next/no-html-link-for-pages -- GitHub Pages archive routes use exported documents. */

import type { ArchiveGroup } from './archive-data';
import {
  archiveBasePath,
  archiveGroups,
  getLibraryWork,
  groupRoute,
  literatureInventory,
  panjiWorkInventory,
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
              ? 'केवल स्रोत-सत्यापित अध्याय वा इकाइकेँ स्थायी पृष्ठ बनाओल जाइत अछि। अप्रमाणित शीर्षक, बनावटी अध्याय वा सामान्य placeholder प्रकाशित नहि कएल जाइत अछि।'
              : 'Only source-verified chapters or units receive permanent pages. Unverified titles, synthetic chapters and generic placeholders are not published.'}
          </p>
        </header>

        <section className={styles.grid} aria-label={isMaithili ? 'स्रोत-पोथी' : 'Source works'}>
          {config.workIds.map((workId) => {
            const work = getLibraryWork(workId);
            const units = workUnits(group, workId);
            const literatureSourceInventory =
              group === 'literature' && workId === 'parallel-history' ? literatureInventory : [];
            const panjiSourceInventory = group === 'panji' ? panjiWorkInventory(workId) : [];
            const verifiedSourceInventory =
              literatureSourceInventory.length > 0 ? literatureSourceInventory : panjiSourceInventory;
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
                    : verifiedSourceInventory.length > 0
                      ? group === 'panji'
                        ? isMaithili
                          ? `${verifiedSourceInventory.length} अध्यायक स्रोत-सूची कठोर संरचना-जाँचसँ सत्यापित अछि। मैथिली शोध-संस्करणक स्रोत-मिलान आ पाठ-जाँच पूरा भेलापर मात्र स्थायी अध्याय-लिंक सक्रिय होएत।`
                          : `${verifiedSourceInventory.length} source chapters passed the strict structural audit. Detail links remain disabled until the paired Maithili research editions pass editorial source review.`
                        : isMaithili
                          ? `${verifiedSourceInventory.length} अध्यायक स्रोत-सूची सत्यापित अछि। मैथिली शोध-संस्करण आ जोड़ीदार स्थायी पृष्ठक पाठ-जाँच पूरा भेलापर मात्र अध्याय-लिंक सक्रिय होएत।`
                          : `${verifiedSourceInventory.length} chapter titles are source-verified. Detail links remain disabled until the paired Maithili research editions and permanent-page payloads pass validation.`
                      : isMaithili
                        ? 'स्रोत-सूची सत्यापनाधीन अछि — कोनो बनावटी अध्याय प्रकाशित नहि कएल जाइत अछि।'
                        : 'Source inventory pending verification — no synthetic chapters published.'}
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
                {units.length === 0 && verifiedSourceInventory.length > 0 && (
                  <ul className={styles.unitList} aria-label={isMaithili ? 'सत्यापित स्रोत-सूची' : 'Verified source inventory'}>
                    {verifiedSourceInventory.map((record) => (
                      <li key={record.number}>
                        <span>
                          <span className={styles.unitNo}>
                            {isMaithili ? 'अध्याय' : 'Chapter'} {record.number}
                            {'tome' in record ? ` · Tome ${record.tome}` : ''}
                          </span>
                          {record.title}
                        </span>
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
