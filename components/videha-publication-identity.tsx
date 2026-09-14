import CitationCopyButton from './citation-copy-button';

const primaryUrl = 'https://www.videha.co.in/';
const mirrorUrl = 'https://videha-ejournal.github.io/videha/';
const githubUrl = 'https://github.com/videha-ejournal';

export default function VidehaPublicationIdentity() {
  return (
    <aside
      className="videha-publication-identity"
      data-videha-publication-identity="true"
      aria-label="Videha publication identity"
    >
      <strong>Videha</strong>
      <span aria-hidden="true"> · </span>
      <a href={primaryUrl}>https://www.videha.co.in/</a>
      <span aria-hidden="true"> · </span>
      <span>ISSN 2229-547X</span>
      <span aria-hidden="true"> · </span>
      <span>and its GitHub mirror site:</span>{' '}
      <a href={mirrorUrl}>https://videha-ejournal.github.io/videha/</a>
      <span aria-hidden="true"> · </span>
      <span>&amp; its Digital Research Archives at GitHub:</span>{' '}
      <a href={githubUrl}>https://github.com/videha-ejournal</a>
      <CitationCopyButton />
      <style>{`
        .videha-publication-identity .videha-citation-copy {
          min-height: 30px;
          margin-left: .2rem;
          padding: .28rem .55rem;
          border: 1px solid #7b241c;
          border-radius: 999px;
          background: #fff;
          color: #7b241c;
          font: inherit;
          font-weight: 850;
          cursor: pointer;
        }
        .videha-publication-identity .videha-citation-copy:hover {
          background: #7b241c;
          color: #fff;
        }
        .videha-publication-identity .videha-citation-copy:focus-visible {
          outline: 3px solid #e39b45;
          outline-offset: 2px;
        }
      `}</style>
    </aside>
  );
}
