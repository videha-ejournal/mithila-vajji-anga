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
      <span>GitHub mirror:</span>{' '}
      <a href={mirrorUrl}>https://videha-ejournal.github.io/videha/</a>
      <span aria-hidden="true"> · </span>
      <span>Digital Research Archives on GitHub:</span>{' '}
      <a href={githubUrl}>https://github.com/videha-ejournal</a>
    </aside>
  );
}
