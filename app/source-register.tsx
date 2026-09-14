import { ArrowLeft, ExternalLink, FileText } from 'lucide-react';
/* oxlint-disable next/no-html-link-for-pages -- GitHub Pages uses full document navigation for exported secondary routes. */
import learningData from './learning-data.json';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';

export default function SourceRegister({ language }: { language: 'mai' | 'en' }) {
  const mai = language === 'mai';
  const base = mai ? site : `${site}/en`;
  return (
    <main className="reference-page" id="top" lang={language}>
      <header className="reference-hero">
        <a href={`${base}/#doors`}><ArrowLeft /> {mai ? 'चारि शोध-दुआरि पर आपस जाउ' : 'Return to the four doors'}</a>
        <p className="eyebrow">{mai ? 'विदेह स्रोत-सूची' : 'VIDEHA SOURCE REGISTER'}</p>
        <h1>{mai ? 'शोध-कालक्रम लेल स्थायी स्रोत-अभिलेख' : 'Stable records for the research chronology'}</h1>
        <p>
          {mai
            ? 'प्रत्येक प्रविष्टिक स्थायी अंश-लिङ्क उद्धरण आ सत्यापन लेल देल अछि। पृष्ठ-सन्दर्भ उपलब्ध शोध-खण्डक स्थान बतबैत अछि; सार्वजनिक प्रतिकृति-लिङ्क केवल स्वीकृत डिजिटल संस्करण उपलब्ध भेलापर जोड़ल जाएत।'
            : 'Each entry has a permanent fragment link for citation and verification. Page references identify the supplied research volume; public facsimile links will be added only when an approved digital edition is available.'}
        </p>
        {mai && <p role="note">नीचाँक स्रोत-शीर्षक आ उद्धरण सत्यापित स्रोत-भाषामे राखल गेल अछि; ओकर मशीनी मैथिली अनुवाद प्रकाशित नहि कएल गेल अछि।</p>}
        <div className="reference-meta"><strong>{learningData.chronology.length} {mai ? 'उद्धृत प्रविष्टि' : 'cited entries'}</strong><span>{mai ? 'स्रोत-संग्रह सुरक्षित; शोध-अवसंरचना १४ सितम्बर २०२६ धरि अद्यतन' : 'Source corpus retained; scholarly infrastructure updated 14 September 2026'}</span></div>
      </header>
      <nav className="reference-actions" aria-label={mai ? 'स्रोत-सूची नियन्त्रण' : 'Source register controls'}>
        <a href={`${base}/#wing-2`}>{mai ? 'ऐतिहासिक मानचित्र' : 'Historical map'}</a>
        <a href={`${base}/history/`}>{mai ? 'इतिहास देखू' : 'Browse histories'}</a>
        <a href={`${site}/records/`}>{mai ? 'स्थायी अभिलेख' : 'Permanent records'}</a>
        <a href={`${site}/method/`}>{mai ? 'सम्पादकीय पद्धति' : 'Editorial method'}</a>
        <a href="https://www.videha.co.in/" target="_blank" rel="noreferrer">Videha <ExternalLink /></a>
        <a href={mai ? `${site}/en/sources/` : `${site}/sources/`} hrefLang={mai ? 'en' : 'mai'}>{mai ? 'English' : 'मैथिली'}</a>
      </nav>
      <section className="source-register" aria-labelledby="source-register-title">
        <h2 id="source-register-title">{mai ? 'कालक्रमक स्रोत-अभिलेख' : 'Chronology source records'}</h2>
        {learningData.chronology.map((item) => (
          <article key={item.id} id={`record-${item.id}`}>
            <FileText aria-hidden="true" />
            <div lang="en"><span>{item.displayDate}</span><h3>{item.label}</h3><p>{item.source}</p><a href={`#record-${item.id}`} aria-label={`${mai ? 'स्थायी लिङ्क' : 'Permanent link to'} ${item.label}`}>{mai ? 'एहि अभिलेखक स्थायी लिङ्क' : 'Permanent link to this record'}</a></div>
          </article>
        ))}
      </section>
    </main>
  );
}
