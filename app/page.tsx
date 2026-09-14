/* oxlint-disable next/no-html-link-for-pages -- GitHub Pages bilingual edition switch uses full-document navigation. */

import type { Metadata } from 'next';
import MaithiliHome from './home-maithili';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const languageAlternates: Record<string, string> = {
  mai: site,
  en: `${site}en/`,
  'x-default': site,
};

export const metadata: Metadata = {
  title: {
    absolute: 'विदेह डिजिटल शोध अभिलेखागार | मिथिला–वज्जि–अंग डिजिटल मानविकी शोध परिवेश',
  },
  description:
    'भारत आ नेपालक मिथिला, वज्जि आ अंगक इतिहास, पञ्जी-वंशावली, साहित्य, दर्शन, स्थान, पाठ, कालक्रम आ स्रोतक स्थायी, उद्धरणयोग्य आ संस्करण-नियन्त्रित डिजिटल शोध अभिलेखागार।',
  alternates: {
    canonical: site,
    languages: languageAlternates,
  },
  openGraph: {
    url: site,
    title: 'विदेह डिजिटल शोध अभिलेखागार — मिथिला–वज्जि–अंग',
    description:
      'मिथिला, वज्जि आ अंगक स्रोत-नियन्त्रित डिजिटल मानविकी शोध परिवेश।',
  },
  other: {
    'DC.language': 'mai',
  },
};

export default function HomePage() {
  return (
    <>
      <aside className="maithili-edition-integrity" lang="mai" role="note" aria-label="मैथिली संस्करणक भाषा-नीति">
        <strong>मैथिली संस्करण</strong>
        <span>
          नेविगेशन, नियन्त्रण आ सम्पादकीय मार्गदर्शन मैथिलीमे अछि। स्रोत-सूची, पोथीक मूल शीर्षक,
          शोध-सारांश वा उद्धृत पाठक समीक्षित मैथिली रूप उपलब्ध नहि रहने ओ सामग्री स्रोत-भाषामे राखल
          गेल अछि; ओकरा मशीनी मैथिली अनुवाद मानि कऽ प्रस्तुत नहि कएल गेल अछि।
        </span>
        <a href="./en/" hrefLang="en">English edition →</a>
      </aside>
      <MaithiliHome />
      <style>{`
        .maithili-edition-integrity{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;padding:.72rem clamp(1rem,4vw,3rem);background:#fff8df;border-bottom:1px solid #d8c996;color:#2c2a22;font:600 .88rem/1.5 system-ui,sans-serif}
        .maithili-edition-integrity strong{color:#7f2d1d;white-space:nowrap}
        .maithili-edition-integrity span{flex:1 1 36rem}
        .maithili-edition-integrity a{color:#174c7d;font-weight:800;text-decoration:underline;text-underline-offset:3px}
        .maithili-edition-integrity a:focus-visible{outline:3px solid #e39b45;outline-offset:3px}
      `}</style>
    </>
  );
}
