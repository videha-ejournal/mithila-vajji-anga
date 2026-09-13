/* oxlint-disable next/no-html-link-for-pages -- GitHub Pages archive routes use exported documents. */

import type { ArchiveGroup, ArchiveUnit } from './archive-data';
import { groupRoute, maithiliReading, routeFor, workUnits } from './archive-data';
import styles from './archive/archive.module.css';

type ArchiveReaderProps = {
  unit: ArchiveUnit;
  language: 'mai' | 'en';
};

function editionStatement(group: ArchiveGroup, language: 'mai' | 'en') {
  if (group === 'philosophy') {
    return language === 'mai'
      ? 'ई स्रोत स्वयं मैथिली–अंग्रेजी द्विभाषी परम्पराक भाग अछि; मूल संस्कृत लेखक, टीकाकार आ अनुवादक/सम्पादकक भूमिका स्रोत-मेटाडेटामे अलग राखल गेल अछि।'
      : 'This is a genuinely bilingual Maithili–English source. Original Sanskrit authorship, commentary and translator/editor roles are kept distinct in the source metadata.';
  }
  return language === 'mai'
    ? 'ई मैथिली पाठ मूल प्रकाशित अनुवाद नहि अछि। ई मूल अंग्रेजी स्रोतक आधार पर विदेह डिजिटल रिसर्च आर्काइव लेल तैयार मैथिली शोध-संस्करण अछि। उद्धरण, पृष्ठ-संख्या आ पाठालोचन लेल लिंक कएल मूल PDF केँ प्रामाणिक स्रोत मानू।'
    : 'The paired Maithili text is not represented as an original published translation. It is a Maithili research edition prepared for the Videha Digital Research Archive from the English source. Use the linked PDF as the authority for quotation, pagination and textual verification.';
}

export default function ArchiveReader({ unit, language }: ArchiveReaderProps) {
  const isMaithili = language === 'mai';
  const reading = isMaithili ? maithiliReading(unit) : unit.description;
  const siblings = workUnits(unit.group, unit.workId);
  const index = siblings.findIndex((item) => item.key === unit.key);
  const previous = index > 0 ? siblings[index - 1] : undefined;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;
  const pairedRoute = routeFor(unit, isMaithili ? 'en' : 'mai');

  return (
    <main className={styles.page} lang={isMaithili ? 'mai' : 'en'}>
      <div className={styles.shell}>
        <div className={styles.topline}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <a href={isMaithili ? '/' : '/en/'}>{isMaithili ? 'मुख्य अभिलेखागार' : 'Archive home'}</a>
            <span aria-hidden="true">/</span>
            <a href={groupRoute(unit.group, language)}>{unit.group}</a>
            <span aria-hidden="true">/</span>
            <span>{unit.workSequence}</span>
          </nav>
          <nav className={styles.language} aria-label="Language">
            <a href={pairedRoute} hrefLang={isMaithili ? 'en' : 'mai'}>
              {isMaithili ? 'English' : 'मैथिली'}
            </a>
          </nav>
        </div>

        <article>
          <header className={styles.hero}>
            <p className={styles.eyebrow}>
              {unit.workTitle} · {isMaithili ? 'इकाइ' : 'Unit'} {unit.number}
            </p>
            <h1>{unit.title}</h1>
            <p className={styles.deck}>{unit.region}</p>
            <p className={styles.status}>{editionStatement(unit.group, language)}</p>
          </header>

          <section className={styles.reader}>
            <h2>{isMaithili ? 'मैथिली पाठ' : 'Research reading'}</h2>
            {reading ? (
              <p>{reading}</p>
            ) : (
              <p>
                {isMaithili
                  ? 'एहि इकाइक सत्यापित मैथिली शोध-पाठ एखन स्रोत-नियन्त्रित डेटा सेटमे नहि अछि; तेँ खाली अथवा बनावटी पाठ प्रकाशित नहि कएल गेल अछि।'
                  : 'No source-controlled reading is available for this unit, so no placeholder text has been published.'}
              </p>
            )}
          </section>

          {unit.sections.length > 0 && (
            <section className={styles.source}>
              <h2>{isMaithili ? 'अनुक्रमित विषय' : 'Indexed contents'}</h2>
              <ol className={styles.sections}>
                {unit.sections.map((section) => (
                  <li key={section}>{section}</li>
                ))}
              </ol>
            </section>
          )}

          <section className={styles.source}>
            <h2>{isMaithili ? 'स्रोत आ विद्वत्-भूमिका' : 'Source and scholarly roles'}</h2>
            <dl>
              <dt>{isMaithili ? 'पोथी' : 'Work'}</dt>
              <dd>{unit.workTitle}</dd>
              <dt>{isMaithili ? 'क्रम' : 'Sequence'}</dt>
              <dd>{unit.workSequence}</dd>
              <dt>{isMaithili ? 'लेखकत्व / भूमिका' : 'Authorship / roles'}</dt>
              <dd>{unit.authorship}</dd>
              <dt>{isMaithili ? 'स्रोत-भाषा' : 'Source language'}</dt>
              <dd>{unit.sourceLanguage}</dd>
              <dt>{isMaithili ? 'स्रोत-टिप्पणी' : 'Source note'}</dt>
              <dd>{unit.sourceNote}</dd>
              <dt>PDF</dt>
              <dd>
                <a className={styles.textLink} href={unit.sourcePdf} target="_blank" rel="noreferrer">
                  {isMaithili ? 'मूल स्रोत PDF खोलू' : 'Open the source PDF'}
                </a>
              </dd>
            </dl>
          </section>

          <nav className={styles.pager} aria-label={isMaithili ? 'आस-पासक इकाइ' : 'Adjacent units'}>
            {previous ? (
              <a href={routeFor(previous, language)}>← {previous.number}. {previous.title}</a>
            ) : <span />}
            {next ? (
              <a href={routeFor(next, language)}>{next.number}. {next.title} →</a>
            ) : <span />}
          </nav>
        </article>
      </div>
    </main>
  );
}
