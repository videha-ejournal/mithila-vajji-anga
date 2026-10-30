const primaryUrl = 'https://www.videha.co.in/';
const mirrorUrl = 'https://videha-ejournal.github.io/videha/';

export default function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Videha attribution">
      <p>
        (c) Gajendra Thakur, Editor, Videha, First Maithili Fortnightly eJournal ·{' '}
        <a href={primaryUrl} target="_blank" rel="noreferrer">https://www.videha.co.in/</a>{' '}&amp;{' '}
        <a href={mirrorUrl} target="_blank" rel="noreferrer">https://videha-ejournal.github.io/videha/</a>
      </p>
    </footer>
  );
}
