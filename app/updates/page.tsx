import UpdatesView from '../updates-view';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';

export const metadata = {
  title: 'स्थिति आ आगाँक योजना | मिथिला–वज्जि–अंग',
  description: 'जीवित विदेह शोध-अभिलेखागारक परिवर्तन-सूची, पूर्णता-स्थिति, प्रकाशन-अखण्डता आ बाँकी स्रोत-काज।',
  alternates: {
    canonical: `${site}/updates/`,
    languages: { mai: `${site}/updates/`, en: `${site}/en/updates/`, 'x-default': `${site}/updates/` },
  },
  other: { 'DC.language': 'mai' },
};
export const dynamic = 'force-static';

export default function UpdatesPage() {
  return <UpdatesView language="mai" />;
}
