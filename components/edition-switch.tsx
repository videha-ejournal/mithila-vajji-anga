const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';

type EditionSwitchProps = {
  active: 'mai' | 'en';
};

export default function EditionSwitch({ active }: EditionSwitchProps) {
  return (
    <nav className="edition-switch" aria-label="Archive edition">
      <a
        href={`${site}/`}
        hrefLang="mai"
        lang="mai"
        aria-current={active === 'mai' ? 'page' : undefined}
        className={active === 'mai' ? 'active' : undefined}
      >
        मैथिली
      </a>
      <a
        href={`${site}/en/`}
        hrefLang="en"
        aria-current={active === 'en' ? 'page' : undefined}
        className={active === 'en' ? 'active' : undefined}
      >
        English
      </a>
    </nav>
  );
}
