const VIDEHA_MAIN = 'https://www.videha.co.in/';
const VIDEHA_MIRROR = 'https://videha-ejournal.github.io/videha/';
const VIDEHA_ARCHIVES = 'https://github.com/videha-ejournal';

export default function VidehaCitationFooter() {
  return (
    <footer className="videha-citation-footer" aria-label="Videha publication and archive citation">
      <p className="videha-citation-kicker">Publication & archive attribution · प्रकाशन आ अभिलेख उल्लेख</p>
      <p>
        <strong>Videha — First Maithili Fortnightly eJournal · विदेह प्रथम मैथिली पाक्षिक ई-पत्रिका</strong>{' '}
        <span>ISSN 2229-547X</span>
      </p>
      <p>
        <a href={VIDEHA_MAIN}>Videha</a>{' · '}
        <a href={VIDEHA_MIRROR}>GitHub mirror</a>{' · '}
        <a href={VIDEHA_ARCHIVES}>Videha Digital Research Archives at GitHub</a>
      </p>
      <p className="videha-citation-text">
        Cite the archive as: Gajendra Thakur, editor, <em>Videha Digital Research Archive</em>, Videha — First Maithili Fortnightly eJournal, ISSN 2229-547X, with the relevant work ISBN where displayed; main site {VIDEHA_MAIN}; GitHub mirror {VIDEHA_MIRROR}; Digital Research Archives {VIDEHA_ARCHIVES}.
      </p>
    </footer>
  );
}
