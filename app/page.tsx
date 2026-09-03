'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, ChevronRight, ExternalLink, FileText, Menu, Search, X } from 'lucide-react';

const regions = [
  { id: 'mithila', name: 'Mithila', eyebrow: 'VIDEHA HEARTLAND', period: 'c. 1200 BCE — present', text: 'Texts, dynasties, learned traditions, and the long cultural geography of the northern Gangetic plain.', accent: 'ochre', themes: ['Videha kingship', 'Maithil scholarship', 'Karnata & Oiniwar courts'] },
  { id: 'vajji', name: 'Vajji', eyebrow: 'REPUBLICAN CONFEDERACY', period: 'c. 700 — 400 BCE', text: 'The Licchavis, Videhans, and allied clans examined through literary, political, and archaeological evidence.', accent: 'green', themes: ['Gana-sangha polity', 'Vaishali', 'Buddhist & Jain traditions'] },
  { id: 'anga', name: 'Anga', eyebrow: 'EASTERN JANAPADA', period: 'c. 800 — 300 BCE', text: 'Trade, state formation, and the eastern corridors linking Campa, Magadha, and the wider subcontinent.', accent: 'blue', themes: ['Campa', 'Riverine exchange', 'Magadhan expansion'] },
];

const chronology = [
  { date: 'c. 1200–800 BCE', region: 'Mithila', title: 'Videha in the later Vedic horizon', text: 'Texts associate the eastward movement of Vedic culture with Videha and the courtly world remembered around Janaka.' },
  { date: 'c. 800–600 BCE', region: 'Anga', title: 'Anga emerges in the eastern janapada landscape', text: 'Literary traditions place Anga among the important polities of the lower and middle Gangetic east.' },
  { date: 'c. 700–500 BCE', region: 'Vajji', title: 'Formation of the Vajji confederacy', text: 'Licchavis, Videhans, and other groups appear within a shared republican or oligarchic political order.' },
  { date: '6th–5th c. BCE', region: 'Vajji', title: 'Vaishali in Buddhist and Jain traditions', text: 'The city becomes a major setting for accounts of Mahavira, the Buddha, monastic institutions, and political debate.' },
  { date: 'c. 5th c. BCE', region: 'Anga', title: 'Anga and Magadha', text: 'Traditions of conquest by Bimbisara situate Anga within the expansion of Magadhan power.' },
  { date: '11th–14th c. CE', region: 'Mithila', title: 'Karnata rule in Mithila', text: 'The Simraungadh-centered polity links the plains north and south of today’s India–Nepal border.' },
  { date: '14th–16th c. CE', region: 'Mithila', title: 'Oiniwar courts and scholarly production', text: 'Courtly patronage supports distinctive intellectual and literary traditions in Sanskrit and Maithili.' },
  { date: '16th–18th c. CE', region: 'Mithila', title: 'Khandavala / Darbhanga Raj formation', text: 'A new landed and political order develops through Mughal-era grants and regional consolidation.' },
  { date: '1816 CE onward', region: 'Context', title: 'A modern border across an older cultural region', text: 'The India–Nepal boundary formalizes political jurisdictions while Maithil networks continue across the Tarai and Bihar.' },
];

const sources = [
  { kind: 'Primary traditions', title: 'Vedic, Buddhist, Jain, and epic corpora', text: 'Read as layered textual traditions whose composition, transmission, and geography require separate evaluation.' },
  { kind: 'Material record', title: 'Archaeology, inscriptions, coins, and sites', text: 'Use dated material evidence to test, refine, or limit narratives derived from texts and later chronicles.' },
  { kind: 'Modern scholarship', title: 'Critical editions and historical studies', text: 'Record edition, translation, argument, and historiographic context so that every claim remains traceable.' },
];

const archiveItems = [
  ...chronology.map((item) => ({ type: 'Chronology', title: item.title, detail: `${item.date} · ${item.region}`, target: '#chronology', haystack: `${item.title} ${item.text} ${item.date} ${item.region}` })),
  ...regions.map((item) => ({ type: 'Region', title: item.name, detail: item.eyebrow, target: `#${item.id}`, haystack: `${item.name} ${item.text} ${item.themes.join(' ')}` })),
  { type: 'Source group', title: 'Textual traditions', detail: 'Vedic · Buddhist · Jain · Epic', target: '#sources', haystack: 'Janaka Licchavi Videha Campa primary sources Vedic Buddhist Jain epic textual traditions' },
  { type: 'Geography', title: 'India–Nepal context', detail: 'Bihar · Madhesh · Tarai', target: '#context', haystack: 'India Nepal Bihar Madhesh Tarai border Mithila Videha geography' },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const results = useMemo(() => query.trim().length < 2 ? [] : archiveItems.filter((item) => item.haystack.toLowerCase().includes(query.toLowerCase())).slice(0, 6), [query]);
  const visibleChronology = filter === 'All' ? chronology : chronology.filter((item) => item.region === filter);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Mithila–Vajji–Anga home"><span className="brand-mark" aria-hidden="true">𑒧</span><span><strong>Mithila–Vajji–Anga</strong><small>A Videha research project</small></span></a>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
        <nav className={menuOpen ? 'nav open' : 'nav'} aria-label="Primary navigation">
          <a onClick={closeMenu} href="#regions">Regions</a><a onClick={closeMenu} href="#chronology">Chronology</a><a onClick={closeMenu} href="#context">Context</a><a onClick={closeMenu} href="#sources">Sources</a><a onClick={closeMenu} href="#volumes">Volumes</a>
          <a className="videha-link" href="https://www.videha.co.in/" target="_blank" rel="noreferrer">Videha ↗</a>
        </nav>
      </header>

      <main id="main">
        <section id="top" className="hero">
          <div className="hero-copy"><p className="kicker">HISTORIES OF THE EASTERN GANGETIC WORLD</p><h1>Three regions.<br/><em>One connected history.</em></h1><p className="lede">A growing research archive for the political, cultural, and intellectual worlds of Mithila, Vajji, and Anga—read across the modern borders of India and Nepal.</p><div className="hero-actions"><a className="primary-button" href="#chronology">Explore the chronology <ArrowRight size={18}/></a><a className="text-link" href="#sources"><BookOpen size={17}/> Browse the sources</a></div></div>
          <aside className="research-search" aria-label="Search the archive">
            <p className="folio">RESEARCH INDEX · 01</p><h2>Search across the archive</h2>
            <label className="search-box"><Search aria-hidden="true" size={19}/><span className="sr-only">Search names, places, periods, or sources</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, place, period, source…"/></label>
            {query.trim().length >= 2 ? <div className="search-results" aria-live="polite">{results.length ? results.map((item) => <a key={`${item.type}-${item.title}`} href={item.target}><span>{item.type}</span><strong>{item.title}</strong><small>{item.detail}</small></a>) : <p>No indexed entry yet. Try a broader term.</p>}</div> : <><p className="search-note">Try “Janaka”, “Licchavi”, “Campa”, or “Tirhuta”.</p><div className="index-line"><span>Chronology</span><strong>{chronology.length} entries</strong></div><div className="index-line"><span>Research regions</span><strong>3 dossiers</strong></div><div className="index-line"><span>Geographic frame</span><strong>India · Nepal</strong></div></>}
          </aside>
        </section>

        <section id="regions" className="section regions-section">
          <div className="section-heading"><div><p className="kicker">REGIONAL DOSSIERS</p><h2>Begin with a region</h2></div><p>Each dossier combines a working chronology, thematic essays, places, people, and a transparent trail back to primary and secondary sources.</p></div>
          <div className="region-grid">{regions.map((region, index) => <article id={region.id} key={region.name} className={`region-card ${region.accent}`}><div className="card-number">0{index + 1}</div><p className="eyebrow">{region.eyebrow}</p><h3>{region.name}</h3><p className="period">{region.period}</p><p>{region.text}</p><ul>{region.themes.map((theme) => <li key={theme}>{theme}</li>)}</ul><a href="#chronology">Trace in chronology <ArrowRight size={17}/></a></article>)}</div>
        </section>

        <section id="chronology" className="section chronology-section">
          <div className="section-heading"><div><p className="kicker">WORKING CHRONOLOGY</p><h2>Time, evidence, and change</h2></div><p>Dates are working ranges, not claims of false precision. Filters reveal regional strands while retaining the larger connected history.</p></div>
          <fieldset className="filter-row"><legend className="sr-only">Filter chronology by region</legend>{['All','Mithila','Vajji','Anga','Context'].map((name) => <button type="button" className={filter === name ? 'active' : ''} onClick={() => setFilter(name)} key={name} aria-pressed={filter === name}>{name}</button>)}</fieldset>
          <div className="timeline">{visibleChronology.map((item) => <article key={item.title} className="timeline-item"><time>{item.date}</time><div className="timeline-dot" aria-hidden="true"/><div><span>{item.region}</span><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div>
          <p className="chronology-note"><strong>Editorial note:</strong> Entries are concise research signposts. Each should be expanded with citations, competing interpretations, and confidence notes as the archive grows.</p>
        </section>

        <section id="context" className="context-section">
          <div className="context-title"><p className="kicker">CONNECTED GEOGRAPHIES</p><h2>Before the border,<br/>beyond the border</h2></div>
          <div className="context-grid"><article><span>01</span><h3>North Bihar</h3><p>Darbhanga, Madhubani, Sitamarhi, Muzaffarpur, Vaishali, Bhagalpur, and adjoining districts hold distinct layers of the archive.</p></article><article><span>02</span><h3>Nepal Tarai</h3><p>Janakpur and the wider Madhesh are integral to the historical and living geography of Mithila, not a peripheral appendix.</p></article><article><span>03</span><h3>Eastern corridors</h3><p>The Ganga, Kosi, Gandak, and their routes connect courts, monasteries, settlements, and trading centers across the region.</p></article></div>
          <div className="context-callout"><strong>Research principle</strong><p>Modern boundaries are essential context, but they should not be projected unchanged onto ancient or medieval political and cultural landscapes.</p></div>
        </section>

        <section id="sources" className="section sources-section">
          <div className="section-heading"><div><p className="kicker">SOURCE ROOM</p><h2>Claims with a visible trail</h2></div><p>A durable historical resource distinguishes source type, date, textual layer, provenance, scholarly interpretation, and uncertainty.</p></div>
          <div className="source-list">{sources.map((source, index) => <article key={source.title}><div className="source-icon"><FileText size={22}/></div><div><span>{source.kind}</span><h3>{source.title}</h3><p>{source.text}</p></div><b>0{index + 1}</b></article>)}</div>
          <div className="bibliography"><div><p className="kicker">BIBLIOGRAPHY FRAMEWORK</p><h3>Built for citations, not just reading lists</h3></div><ul><li>Primary source or artefact</li><li>Edition, translation, or catalogue</li><li>Modern scholarly discussion</li><li>Archive note and confidence level</li></ul><a href="https://www.videha.co.in/" target="_blank" rel="noreferrer">Continue research at Videha <ExternalLink size={16}/></a></div>
        </section>

        <section id="volumes" className="section volumes-section">
          <div className="section-heading"><div><p className="kicker">CUMULATIVE HISTORICAL VOLUMES</p><h2>A shelf designed to grow</h2></div><p>Use this area for successive research volumes, revised editions, catalogues, maps, and documentary appendices.</p></div>
          <div className="shelf"><article className="volume featured"><p>FOUNDATION VOLUME</p><h3>Mithila–Vajji–Anga</h3><span>Connected histories of the eastern Gangetic world</span><a href="#sources">View editorial framework <ChevronRight size={17}/></a></article><article className="volume"><p>FORTHCOMING</p><h3>Volume II</h3><span>Reserved for the next cumulative historical study</span></article><article className="volume"><p>ARCHIVE SERIES</p><h3>Sources & Notes</h3><span>Translations, inscriptions, site records, and bibliographies</span></article></div>
        </section>

        <section className="about-strip"><p className="kicker">ABOUT THE PROJECT</p><h2>Videha identity, researched with breadth and care.</h2><p>This portal is conceived as part of the wider Videha historical research ecosystem: regionally rooted, cross-border in scope, and transparent about the difference between evidence, tradition, and interpretation.</p><a className="primary-button light" href="https://www.videha.co.in/" target="_blank" rel="noreferrer">Visit videha.co.in <ExternalLink size={17}/></a></section>
      </main>

      <footer><a className="brand footer-brand" href="#top"><span className="brand-mark" aria-hidden="true">𑒧</span><span><strong>Mithila–Vajji–Anga</strong><small>A Videha research project</small></span></a><p>Research portal prototype · Dates and summaries are editorial starting points requiring source-level review.</p><div><a href="#sources">Sources</a><a href="#volumes">Volumes</a><a href="https://www.videha.co.in/" target="_blank" rel="noreferrer">Videha</a></div></footer>
    </>
  );
}
