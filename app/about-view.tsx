import { ArrowLeft, BookOpen, Database, ExternalLink, FileCheck2, GitBranch, Languages, MapPinned, Quote } from 'lucide-react';
/* oxlint-disable next/no-html-link-for-pages -- exported GitHub Pages routes use full navigation. */

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';

export default function AboutView({ language }: { language: 'mai' | 'en' }) {
  const mai = language === 'mai';
  const base = mai ? site : `${site}/en`;
  return (
    <main className="reference-page" lang={language}>
      <header className="reference-hero">
        <a href={`${base}/`}><ArrowLeft /> {mai ? 'मुख्य अभिलेखागार पर आपस जाउ' : 'Return to the archive'}</a>
        <p className="eyebrow">{mai ? 'अभिलेखागारक परिचय' : 'ABOUT THE ARCHIVE'}</p>
        <h1>{mai ? 'मिथिला–वज्जि–अंग लेल विदेह डिजिटल शोध अभिलेखागार' : 'Videha Digital Research Archive for Mithila, Vajji & Anga'}</h1>
        <p>{mai ? 'ई स्रोत-नियन्त्रित डिजिटल मानविकी शोध परिवेश भारत आ नेपालक मिथिला, वज्जि आ अंगक जुड़ल इतिहास, पञ्जी-वंशावली, साहित्य, दर्शन, स्थान, पाठ आ कालक्रमकेँ स्थायी, उद्धरणयोग्य आ मशीन-पठनीय रूपमे प्रस्तुत करैत अछि।' : 'This source-controlled digital-humanities research environment presents the connected histories, Panji genealogy, literature, philosophy, places, texts and chronology of Mithila, Vajji and Anga across India and Nepal as permanent, citable and machine-readable research objects.'}</p>
        <a href={mai ? `${site}/en/about/` : `${site}/about/`} hrefLang={mai ? 'en' : 'mai'}>{mai ? 'English' : 'मैथिली'}</a>
      </header>

      <section className="status-ledger">
        <article><MapPinned /><div><h2>{mai ? 'भौगोलिक आ ऐतिहासिक केन्द्र' : 'Geographical and historical focus'}</h2><p>{mai ? 'अभिलेखागारक मूल केन्द्र मिथिला–वज्जि–अंग अछि। आधुनिक स्थान-बिन्दु दिशाबोध लेल अछि; प्राचीन वा मध्यकालीन सीमा केवल स्रोत-समर्थित, अनिश्चितता-सहित ज्यामिति उपलब्ध भेले पर देखाओल जाइत अछि।' : 'The archive’s governing focus is Mithila–Vajji–Anga. Modern points are orientation aids; ancient or medieval boundaries are shown only when source-qualified geometry is available and uncertainty is explicit.'}</p></div></article>
        <article><BookOpen /><div><h2>{mai ? 'शोध-संग्रह' : 'Research collections'}</h2><p>{mai ? '१७८ इतिहास अध्याय, १७२ समानान्तर दर्शन अध्याय, समानान्तर साहित्येतिहास, पञ्जी-अध्ययन, संस्कृत–मैथिली दार्शनिक पाठ आ सत्यापित स्रोत-पोथी एक-दोसरा सँ जोड़ल अछि।' : 'The archive connects 178 History chapters, 172 Parallel Philosophy chapters, Parallel Literary History, Panji studies, Sanskrit–Maithili philosophical texts and verified source books.'}</p></div></article>
        <article><Database /><div><h2>{mai ? 'शोध-अवसंरचना' : 'Scholarly infrastructure'}</h2><p>{mai ? 'स्थायी URL, CSL-JSON/BibTeX/RIS उद्धरण, डेटासेट, checksum, IIIF, provenance graph, sitemap, JSON-LD आ स्रोत-PDF सूची बिल्डसँ उत्पन्न आ जाँचल जाइत अछि।' : 'Permanent URLs, CSL-JSON/BibTeX/RIS citations, datasets, checksums, IIIF, provenance graphs, sitemap, JSON-LD and source-PDF catalogues are generated and verified by the build.'}</p></div></article>
        <article><Languages /><div><h2>{mai ? 'द्विभाषी नीति' : 'Bilingual policy'}</h2><p>{mai ? 'मैथिली आ अंग्रेजी इंटरफेसक जोड़ीदार पथ अछि। स्रोत-सत्यापित अंग्रेजी शीर्षक वा शोध-सारांशक समीक्षित मैथिली रूप नहि रहने ओकरा अंग्रेजी स्रोत-भाषामे चिन्हित कऽ राखल जाइत अछि; मशीनी अनुवादकेँ सम्पादकीय रूपसँ स्वीकृत पाठ नहि मानल जाइत अछि।' : 'Maithili and English editions use paired routes. When a verified English catalogue title or research summary has no reviewed Maithili counterpart, it remains explicitly marked in the source language; machine translation is not presented as editorially approved scholarship.'}</p></div></article>
        <article><FileCheck2 /><div><h2>{mai ? 'Fail-closed प्रकाशन' : 'Fail-closed publication'}</h2><p>{mai ? 'अपूर्ण वा अनिश्चित स्रोत-संरचनासँ बनावटी विवरण प्रकाशित नहि होइत अछि। पञ्जीक १०५ अनसुलझल स्रोत-संरचना बिन्दु एहने कारण विस्तृत प्रकाशनसँ रोकल अछि।' : 'Incomplete or uncertain source structure never produces synthetic detail publication. The 105 unresolved Panji source-structure issues therefore remain blocked from detailed publication.'}</p></div></article>
        <article><GitBranch /><div><h2>{mai ? 'संस्करण आ पुनरुत्पादन' : 'Versioning and reproducibility'}</h2><p>{mai ? 'स्रोत-नियन्त्रित डेटा, commit-pinned बाहरी PDF, checksum आ प्रकाशन-रिपोर्ट शोध-अभिलेखकेँ पुनरुत्पाद्य बनबैत अछि।' : 'Source-controlled data, commit-pinned external PDFs, checksums and release reports make the research archive reproducible and auditable.'}</p></div></article>
      </section>

      <section className="reference-hero">
        <p className="eyebrow">{mai ? 'उद्धरण आ सत्यापन' : 'CITATION AND VERIFICATION'}</p>
        <h2>{mai ? 'अभिलेखकेँ उद्धृत करू, स्रोतकेँ जाँचू' : 'Cite the record; verify the source'}</h2>
        <p>{mai ? 'स्थायी शोध-पन्नाक उद्धरण निर्यात उपलब्ध अछि। स्रोत-PDF, provenance आ संस्करण-जानकारी जहाँ सत्यापित अछि, ओतय अभिलेखसँ जोड़ल अछि; असत्यापित PDF पृष्ठ-सूचक बनाओल नहि जाइत अछि।' : 'Citation exports are available for permanent research pages. Verified source PDFs, provenance and edition information are linked where established; unverified PDF page locators are never invented.'}</p>
        <nav className="reference-actions">
          <a href={`${site}/citations/`}><Quote /> {mai ? 'उद्धरण' : 'Citations'}</a>
          <a href={`${site}/source-library/`}><BookOpen /> {mai ? 'स्रोत PDF पुस्तकालय' : 'Source PDF library'}</a>
          <a href={`${site}/provenance/`}><GitBranch /> Provenance</a>
          <a href="https://www.videha.co.in/" target="_blank" rel="noreferrer">Videha <ExternalLink /></a>
        </nav>
      </section>
    </main>
  );
}
