'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CircleHelp,
  Download,
  GitCompareArrows,
  MapPinned,
  NotebookPen,
  RotateCcw,
  Search,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import researchData from './research-data.json';
import libraryData from './library-data.json';
import deepData from './deep-data.json';
import learningData from './learning-data.json';

type ActivityId =
  | 'archive'
  | 'detective'
  | 'debate'
  | 'journey'
  | 'notebook'
  | 'identity'
  | 'chronology'
  | 'panji'
  | 'comparator'
  | 'architecture'
  | 'daily'
  | 'classification';
type NotebookEntry = {
  id: string;
  title: string;
  body: string;
  source: string;
  created: string;
};
type DailyProgress = { lastDay: string; streak: number };

const activities: Array<{
  id: ActivityId;
  number: number;
  label: string;
  note: string;
  count?: number;
}> = [
  {
    id: 'archive',
    number: 1,
    label: 'Ask the Archive',
    note: 'Search the complete index',
  },
  {
    id: 'detective',
    number: 2,
    label: 'Source Detective',
    note: 'Trace excerpts to record types',
    count: learningData.detective.length,
  },
  {
    id: 'debate',
    number: 3,
    label: 'Pūrvapakṣa Debate',
    note: 'Objection, answer, synthesis',
    count: learningData.debates.length,
  },
  {
    id: 'journey',
    number: 4,
    label: 'Map Journey',
    note: 'Every location opens',
    count: learningData.places.length,
  },
  {
    id: 'notebook',
    number: 5,
    label: 'Research Notebook',
    note: 'Save and export notes',
  },
  {
    id: 'identity',
    number: 6,
    label: 'Who am I?',
    note: 'Figures from literary history',
    count: learningData.identities.length,
  },
  {
    id: 'chronology',
    number: 7,
    label: 'Build a Chronology',
    note: 'Dated source passages',
    count: learningData.chronology.length,
  },
  {
    id: 'panji',
    number: 8,
    label: 'Panji Laboratory',
    note: 'Real manuscript headings',
    count: learningData.panji.length,
  },
  {
    id: 'comparator',
    number: 9,
    label: 'Concept Comparator',
    note: 'Parallel Philosophy index',
    count: learningData.comparators.length,
  },
  {
    id: 'architecture',
    number: 10,
    label: 'Architecture Viewer',
    note: 'Material-landscape index',
    count: learningData.architecture.length,
  },
  {
    id: 'daily',
    number: 11,
    label: 'Daily Challenge',
    note: 'Daily entry plus full bank',
    count: learningData.daily.length,
  },
  {
    id: 'classification',
    number: 12,
    label: 'Memory or Evidence?',
    note: 'Classify indexed records',
    count: learningData.classification.length,
  },
];

const archiveRecords = [
  ...researchData.political.map((c) => ({
    id: c.id,
    kind: 'History chapter',
    title: c.title,
    text: `${c.summary} ${c.sections.join(' ')}`,
    source: `${c.collection} · ${c.volume} · ${c.part} · ${c.pages}`,
  })),
  ...researchData.social.map((c) => ({
    id: c.id,
    kind: 'History chapter',
    title: c.title,
    text: `${c.summary} ${c.sections.join(' ')}`,
    source: `${c.collection} · ${c.volume} · ${c.part} · ${c.pages}`,
  })),
  ...libraryData.map((w) => ({
    id: w.id,
    kind: 'Book',
    title: w.title,
    text: `${w.description} ${w.structure.join(' ')}`,
    source: `${w.creator} · ${w.sequence} · ${w.extent}`,
  })),
  ...deepData.people.map((p) => ({
    id: p.id,
    kind: 'Person',
    title: p.name,
    text: `${p.description} ${p.field} ${p.era}`,
    source: p.source,
  })),
  ...deepData.philosophyChapters.map((c) => ({
    id: c.id,
    kind: 'Philosophy chapter',
    title: c.title,
    text: `${c.summary} Pūrvapakṣa: ${c.purvapaksha}. Uttarapakṣa: ${c.uttarapaksha}. ${c.synthesis}`,
    source: `Parallel Philosophy · ${c.part} · Chapter ${c.number}`,
  })),
];

const formatDate = (date: number) =>
  date < 0 ? `${Math.abs(date)} BCE` : `${date} CE`;
const truncate = (value: string, length = 220) =>
  value.length > length ? `${value.slice(0, length).trim()}…` : value;

export default function LearningLab() {
  const [activity, setActivity] = useState<ActivityId>('archive');
  const [ask, setAsk] = useState('Panji social history');
  const [query, setQuery] = useState('Panji social history');
  const [detectiveIndex, setDetectiveIndex] = useState(0);
  const [detectiveChoice, setDetectiveChoice] = useState('');
  const [debateIndex, setDebateIndex] = useState(0);
  const [debateReveal, setDebateReveal] = useState(false);
  const [journeyIndex, setJourneyIndex] = useState(0);
  const [placeSearch, setPlaceSearch] = useState('');
  const [identityIndex, setIdentityIndex] = useState(0);
  const [identitySearch, setIdentitySearch] = useState('');
  const [clueCount, setClueCount] = useState(1);
  const [identityChoice, setIdentityChoice] = useState('');
  const [chronologySearch, setChronologySearch] = useState('');
  const [chronologyPage, setChronologyPage] = useState(0);
  const [orderedChronology, setOrderedChronology] = useState(() =>
    [0, 22, 45, 68, 91, 114, 137, 159]
      .map((i) => learningData.chronology[i])
      .reverse(),
  );
  const [chronologyChecked, setChronologyChecked] = useState(false);
  const [panjiIndex, setPanjiIndex] = useState(0);
  const [panjiSearch, setPanjiSearch] = useState('');
  const [panjiVolume, setPanjiVolume] = useState('All volumes');
  const [conceptA, setConceptA] = useState(learningData.comparators[0].id);
  const [conceptB, setConceptB] = useState(learningData.comparators[1].id);
  const [conceptSearch, setConceptSearch] = useState('');
  const [architectureId, setArchitectureId] = useState(
    learningData.architecture[0].id,
  );
  const [architectureSearch, setArchitectureSearch] = useState('');
  const [dailyIndex, setDailyIndex] = useState(
    () => Math.floor(Date.now() / 86400000) % learningData.daily.length,
  );
  const [dailyChoice, setDailyChoice] = useState('');
  const [classificationIndex, setClassificationIndex] = useState(0);
  const [classificationChoice, setClassificationChoice] = useState('');
  const [today] = useState(() => new Date());
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [notes, setNotes] = useState<NotebookEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(
        localStorage.getItem('videha-research-notebook') ?? '[]',
      ) as NotebookEntry[];
    } catch {
      return [];
    }
  });
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(() => {
    if (typeof window === 'undefined') return { lastDay: '', streak: 0 };
    try {
      return JSON.parse(
        localStorage.getItem('videha-daily-progress') ??
          '{"lastDay":"","streak":0}',
      ) as DailyProgress;
    } catch {
      return { lastDay: '', streak: 0 };
    }
  });

  useEffect(
    () =>
      localStorage.setItem('videha-research-notebook', JSON.stringify(notes)),
    [notes],
  );
  useEffect(
    () =>
      localStorage.setItem(
        'videha-daily-progress',
        JSON.stringify(dailyProgress),
      ),
    [dailyProgress],
  );

  const archiveResults = useMemo(() => {
    const terms = query
      .toLowerCase()
      .split(/[^a-zāīūṛṅñṭḍṇśṣṃḥ]+/u)
      .filter((t) => t.length > 2);
    return archiveRecords
      .map((record) => ({
        record,
        score: terms.reduce(
          (score, term) =>
            score +
            (`${record.title} ${record.text} ${record.source}`
              .toLowerCase()
              .includes(term)
              ? 1
              : 0),
          0,
        ),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((x) => x.record);
  }, [query]);
  const filteredPlaces = useMemo(
    () =>
      learningData.places.filter((p) =>
        `${p.name} ${p.admin} ${p.countryCode} ${p.context}`
          .toLowerCase()
          .includes(placeSearch.toLowerCase()),
      ),
    [placeSearch],
  );
  const filteredIdentities = useMemo(
    () =>
      learningData.identities.filter((p) =>
        `${p.name} ${p.clues.join(' ')} ${p.source}`
          .toLowerCase()
          .includes(identitySearch.toLowerCase()),
      ),
    [identitySearch],
  );
  const filteredChronology = useMemo(
    () =>
      learningData.chronology.filter((x) =>
        `${x.displayDate} ${x.label} ${x.source}`
          .toLowerCase()
          .includes(chronologySearch.toLowerCase()),
      ),
    [chronologySearch],
  );
  const filteredPanji = useMemo(
    () =>
      learningData.panji.filter(
        (x) =>
          (panjiVolume === 'All volumes' || x.volume === panjiVolume) &&
          `${x.heading} ${x.context} ${x.source}`
            .toLowerCase()
            .includes(panjiSearch.toLowerCase()),
      ),
    [panjiSearch, panjiVolume],
  );
  const filteredConcepts = useMemo(
    () =>
      learningData.comparators.filter((x) =>
        `${x.name} ${x.question} ${x.source}`
          .toLowerCase()
          .includes(conceptSearch.toLowerCase()),
      ),
    [conceptSearch],
  );
  const filteredArchitecture = useMemo(
    () =>
      learningData.architecture.filter((x) =>
        `${x.name} ${x.period} ${x.source}`
          .toLowerCase()
          .includes(architectureSearch.toLowerCase()),
      ),
    [architectureSearch],
  );

  const place = learningData.places[journeyIndex];
  const identity =
    filteredIdentities[identityIndex] ?? learningData.identities[0];
  const panji = learningData.panji[panjiIndex];
  const conceptOne =
    learningData.comparators.find((x) => x.id === conceptA) ??
    learningData.comparators[0];
  const conceptTwo =
    learningData.comparators.find((x) => x.id === conceptB) ??
    learningData.comparators[1];
  const architecture =
    learningData.architecture.find((x) => x.id === architectureId) ??
    learningData.architecture[0];
  const detective = learningData.detective[detectiveIndex];
  const debate = learningData.debates[debateIndex];
  const daily = learningData.daily[dailyIndex];
  const classification = learningData.classification[classificationIndex];
  const todayKey = today.toISOString().slice(0, 10);
  const chronologyCorrect = orderedChronology.every(
    (item, i) => i === 0 || orderedChronology[i - 1].date <= item.date,
  );

  const addNote = (title: string, body: string, source: string) =>
    setNotes((current) => [
      {
        id: `${Date.now()}-${title}`,
        title,
        body,
        source,
        created: new Date().toLocaleDateString(),
      },
      ...current,
    ]);
  const exportNotes = () => {
    const body = notes
      .map(
        (n, i) =>
          `${i + 1}. ${n.title}\n${n.body}\nSource: ${n.source}\nSaved: ${n.created}\n`,
      )
      .join('\n');
    const href = URL.createObjectURL(
      new Blob([`VIDEHA RESEARCH NOTEBOOK\n\n${body}`], { type: 'text/plain' }),
    );
    const link = document.createElement('a');
    link.href = href;
    link.download = 'videha-research-notebook.txt';
    link.click();
    URL.revokeObjectURL(href);
  };
  const moveChronology = (index: number, direction: number) => {
    const destination = index + direction;
    if (destination < 0 || destination >= orderedChronology.length) return;
    const next = [...orderedChronology];
    [next[index], next[destination]] = [next[destination], next[index]];
    setOrderedChronology(next);
    setChronologyChecked(false);
  };
  const nextIdentity = (direction: number) => {
    if (!filteredIdentities.length) return;
    setIdentityIndex(
      (identityIndex + direction + filteredIdentities.length) %
        filteredIdentities.length,
    );
    setIdentityChoice('');
    setClueCount(1);
  };

  return (
    <section
      className="learning-lab"
      id="learning-lab"
      aria-labelledby="learning-lab-title"
    >
      <div className="lab-shell">
        <header className="lab-intro">
          <div>
            <span className="lab-kicker">
              VIDEHA INTERACTIVE RESEARCH COMMONS
            </span>
            <h2 id="learning-lab-title">
              Read, test, compare, and keep the trail.
            </h2>
            <p>
              Twelve source-led activities built from the indexed books and
              attached author manuscripts. Every large bank is searchable or
              sequentially browseable; no fictional practice records remain.
            </p>
          </div>
          <div className="lab-stat-grid">
            <strong>
              <b>{learningData.places.length}</b> mapped places
            </strong>
            <strong>
              <b>{learningData.chronology.length}</b> dated passages
            </strong>
            <strong>
              <b>{learningData.panji.length}</b> Panji headings
            </strong>
            <strong>
              <b>{learningData.comparators.length}</b> comparisons
            </strong>
          </div>
        </header>
        <div className="lab-layout">
          <nav className="lab-nav" aria-label="Interactive research activities">
            {activities.map((item) => (
              <button
                key={item.id}
                className={activity === item.id ? 'active' : ''}
                aria-current={activity === item.id ? 'page' : undefined}
                onClick={() => setActivity(item.id)}
              >
                <b>{String(item.number).padStart(2, '0')}</b>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.note}</small>
                </span>
                {item.count ? <em>{item.count}</em> : null}
              </button>
            ))}
          </nav>
          <main className="lab-workbench">
            {activity === 'archive' && (
              <section className="lab-activity">
                <Heading
                  icon={<Archive />}
                  code="01 · INDEXED SEARCH"
                  title="Ask the Archive"
                  note={`${archiveRecords.length} indexed books, chapters, figures, and arguments`}
                />
                <form
                  className="archive-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setQuery(ask.trim());
                  }}
                >
                  <label htmlFor="archive-query">
                    Research question or keyword
                  </label>
                  <div>
                    <input
                      id="archive-query"
                      value={ask}
                      onChange={(e) => setAsk(e.target.value)}
                    />
                    <button>
                      <Search /> Search
                    </button>
                  </div>
                </form>
                <div className="archive-results">
                  {archiveResults.length ? (
                    archiveResults.map((r) => (
                      <article key={r.id}>
                        <span>{r.kind}</span>
                        <h4>{r.title}</h4>
                        <p>{truncate(r.text)}</p>
                        <small>{r.source}</small>
                        <button
                          onClick={() => addNote(r.title, r.text, r.source)}
                        >
                          <NotebookPen /> Save
                        </button>
                      </article>
                    ))
                  ) : (
                    <Empty text="Try a book title, person, place, method, or chapter subject." />
                  )}
                </div>
              </section>
            )}

            {activity === 'detective' && (
              <section className="lab-activity">
                <Heading
                  icon={<Search />}
                  code="02 · SOURCE-TYPE BANK"
                  title="Source Detective"
                  note={`${learningData.detective.length} source-traceable excerpts`}
                />
                <Pager
                  index={detectiveIndex}
                  total={learningData.detective.length}
                  previous={() => {
                    setDetectiveIndex(
                      (detectiveIndex - 1 + learningData.detective.length) %
                        learningData.detective.length,
                    );
                    setDetectiveChoice('');
                  }}
                  next={() => {
                    setDetectiveIndex(
                      (detectiveIndex + 1) % learningData.detective.length,
                    );
                    setDetectiveChoice('');
                  }}
                />
                <Question
                  item={detective}
                  choice={detectiveChoice}
                  setChoice={setDetectiveChoice}
                />
              </section>
            )}

            {activity === 'debate' && (
              <section className="lab-activity">
                <Heading
                  icon={<GitCompareArrows />}
                  code="03 · PARALLEL PHILOSOPHY"
                  title="Pūrvapakṣa Debate Game"
                  note={`${learningData.debates.length} chapter-grounded debates`}
                />
                <Pager
                  index={debateIndex}
                  total={learningData.debates.length}
                  previous={() => {
                    setDebateIndex(
                      (debateIndex - 1 + learningData.debates.length) %
                        learningData.debates.length,
                    );
                    setDebateReveal(false);
                  }}
                  next={() => {
                    setDebateIndex(
                      (debateIndex + 1) % learningData.debates.length,
                    );
                    setDebateReveal(false);
                  }}
                />
                <div className="debate-board">
                  <article>
                    <span>TOPIC</span>
                    <h4>{debate.topic}</h4>
                    <small>{debate.source}</small>
                  </article>
                  <article className="objection">
                    <span>PŪRVAPAKṢA</span>
                    <p>{debate.objection}</p>
                  </article>
                  <button
                    className="primary-lab-action"
                    onClick={() => setDebateReveal(!debateReveal)}
                  >
                    {debateReveal
                      ? 'Hide answer'
                      : 'Reveal uttarapakṣa and synthesis'}
                  </button>
                  {debateReveal && (
                    <div className="debate-reveal">
                      <h5>Chapter frame</h5>
                      <p>{debate.proof}</p>
                      <h5>Uttarapakṣa</h5>
                      <p>{debate.response}</p>
                      <h5>Synthesis</h5>
                      <p>{debate.synthesis}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activity === 'journey' && (
              <section className="lab-activity">
                <Heading
                  icon={<MapPinned />}
                  code="04 · CLICKABLE GAZETTEER"
                  title="Map Journey"
                  note={`${learningData.places.length} places; every marker and list item opens`}
                />
                <Banner>
                  Historical context comes from the attached history volumes.
                  Coordinates come from GeoNames (CC BY 4.0) for modern
                  orientation; they do not prove ancient boundaries or
                  identifications.
                </Banner>
                <Filter
                  label="Find a place"
                  value={placeSearch}
                  setValue={setPlaceSearch}
                  placeholder="Name, region, country, or context"
                />
                <div className="map-lab-grid">
                  <div
                    className="journey-map"
                    aria-label="Clickable orientation map"
                  >
                    <div className="map-river one" />
                    <div className="map-river two" />
                    {learningData.places.map((p, i) => {
                      const left = ((p.longitude - 81) / 10.5) * 100;
                      const top = ((30.8 - p.latitude) / 9.8) * 100;
                      return (
                        <button
                          key={p.id}
                          style={{
                            left: `${Math.max(2, Math.min(98, left))}%`,
                            top: `${Math.max(2, Math.min(98, top))}%`,
                          }}
                          className={journeyIndex === i ? 'active' : ''}
                          aria-label={`Open ${p.name}`}
                          title={p.name}
                          onClick={() => setJourneyIndex(i)}
                        >
                          <span>{i + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="place-directory">
                    <div className="place-list">
                      {filteredPlaces.map((p) => {
                        const i = learningData.places.findIndex(
                          (x) => x.id === p.id,
                        );
                        return (
                          <button
                            key={p.id}
                            className={journeyIndex === i ? 'active' : ''}
                            onClick={() => setJourneyIndex(i)}
                          >
                            <b>{p.name}</b>
                            <small>
                              {p.admin} · {p.countryCode}
                            </small>
                          </button>
                        );
                      })}
                    </div>
                    <article className="place-reading">
                      <span>
                        {journeyIndex + 1} / {learningData.places.length}
                      </span>
                      <h4>{place.name}</h4>
                      <p>{place.frame}</p>
                      <p>{place.context}</p>
                      <dl>
                        <dt>Coordinates</dt>
                        <dd>
                          {place.latitude.toFixed(4)},{' '}
                          {place.longitude.toFixed(4)}
                        </dd>
                        <dt>Record source</dt>
                        <dd>{place.source}</dd>
                        <dt>GeoNames ID</dt>
                        <dd>{place.geonameId}</dd>
                      </dl>
                      <button
                        onClick={() =>
                          addNote(place.name, place.context, place.source)
                        }
                      >
                        <NotebookPen /> Save place note
                      </button>
                    </article>
                  </div>
                </div>
              </section>
            )}

            {activity === 'notebook' && (
              <section className="lab-activity">
                <Heading
                  icon={<NotebookPen />}
                  code="05 · PRIVATE BROWSER NOTEBOOK"
                  title="Research Notebook"
                  note="Entries remain on this device until exported or deleted"
                />
                <div className="notebook-compose">
                  <label>
                    Title
                    <input
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="Research question"
                    />
                  </label>
                  <label>
                    Note
                    <textarea
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      placeholder="Argument, comparison, reference, or question"
                    />
                  </label>
                  <div>
                    <button
                      disabled={!noteTitle.trim() || !noteBody.trim()}
                      onClick={() => {
                        addNote(noteTitle, noteBody, 'Personal research note');
                        setNoteTitle('');
                        setNoteBody('');
                      }}
                    >
                      Save note
                    </button>
                    <button disabled={!notes.length} onClick={exportNotes}>
                      <Download /> Export
                    </button>
                  </div>
                </div>
                <div className="notebook-list">
                  {notes.length ? (
                    notes.map((n) => (
                      <article key={n.id}>
                        <span>{n.created}</span>
                        <h4>{n.title}</h4>
                        <p>{n.body}</p>
                        <small>{n.source}</small>
                        <button
                          aria-label={`Delete ${n.title}`}
                          onClick={() =>
                            setNotes((current) =>
                              current.filter((x) => x.id !== n.id),
                            )
                          }
                        >
                          <X />
                        </button>
                      </article>
                    ))
                  ) : (
                    <Empty text="Save a result from any activity or write a note above." />
                  )}
                </div>
              </section>
            )}

            {activity === 'identity' && (
              <section className="lab-activity">
                <Heading
                  icon={<CircleHelp />}
                  code="06 · LITERARY-HISTORY CATALOG"
                  title="Who am I?"
                  note={`${learningData.identities.length} indexed historical and literary figures`}
                />
                <Filter
                  label="Filter figures"
                  value={identitySearch}
                  setValue={(value) => {
                    setIdentitySearch(value);
                    setIdentityIndex(0);
                    setIdentityChoice('');
                    setClueCount(1);
                  }}
                  placeholder="Name, era, field, description"
                />
                {filteredIdentities.length ? (
                  <>
                    <Pager
                      index={identityIndex}
                      total={filteredIdentities.length}
                      previous={() => nextIdentity(-1)}
                      next={() => nextIdentity(1)}
                    />
                    <div className="identity-game">
                      <div className="clue-stack">
                        {identity.clues.slice(0, clueCount).map((clue, i) => (
                          <p key={i}>
                            <b>{String(i + 1).padStart(2, '0')}</b>
                            {clue}
                          </p>
                        ))}
                        {clueCount < identity.clues.length && (
                          <button onClick={() => setClueCount(clueCount + 1)}>
                            Reveal another clue
                          </button>
                        )}
                      </div>
                      <div className="answer-grid">
                        {identity.choices.map((o) => (
                          <Answer
                            key={o}
                            option={o}
                            answer={identity.name}
                            choice={identityChoice}
                            setChoice={setIdentityChoice}
                          />
                        ))}
                      </div>
                      {identityChoice && (
                        <Explanation
                          correct={identityChoice === identity.name}
                          answer={identity.name}
                          text="The clues reproduce the catalogued field, era, and biographical description."
                          source={identity.source}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <Empty text="No figures match this filter." />
                )}
              </section>
            )}

            {activity === 'chronology' && (
              <section className="lab-activity">
                <Heading
                  icon={<ArrowDown />}
                  code="07 · DATED SOURCE PASSAGES"
                  title="Build a Chronology"
                  note={`${learningData.chronology.length} dated passages plus an eight-item ordering challenge`}
                />
                <Banner>
                  Dates and statements are extracted from the attached history
                  manuscripts. A listed date records what the cited passage
                  says; it is not silently upgraded into independent proof.
                </Banner>
                <h4 className="subhead">Ordering challenge</h4>
                <ol className="chronology-builder">
                  {orderedChronology.map((item, i) => (
                    <li key={item.id}>
                      <b>{i + 1}</b>
                      <span>{item.label}</span>
                      <div>
                        <button
                          disabled={i === 0}
                          onClick={() => moveChronology(i, -1)}
                        >
                          <ArrowUp />
                        </button>
                        <button
                          disabled={i === orderedChronology.length - 1}
                          onClick={() => moveChronology(i, 1)}
                        >
                          <ArrowDown />
                        </button>
                      </div>
                      {chronologyChecked && (
                        <time>{formatDate(item.date)}</time>
                      )}
                    </li>
                  ))}
                </ol>
                <button
                  className="primary-lab-action"
                  onClick={() => setChronologyChecked(true)}
                >
                  Check order
                </button>
                {chronologyChecked && (
                  <div
                    className={`compact-verdict ${chronologyCorrect ? 'correct' : 'incorrect'}`}
                  >
                    {chronologyCorrect ? <Check /> : <RotateCcw />}
                    <span>
                      {chronologyCorrect
                        ? 'Correctly ordered.'
                        : 'Dates are revealed; reorder and check again.'}
                    </span>
                  </div>
                )}
                <h4 className="subhead">Full chronology index</h4>
                <Filter
                  label="Search chronology"
                  value={chronologySearch}
                  setValue={(value) => {
                    setChronologySearch(value);
                    setChronologyPage(0);
                  }}
                  placeholder="Date, event, word, or source"
                />
                <div className="chronology-index">
                  {filteredChronology
                    .slice(chronologyPage * 20, chronologyPage * 20 + 20)
                    .map((item) => (
                      <article key={item.id}>
                        <time>{item.displayDate}</time>
                        <p>{item.label}</p>
                        <small>{item.source}</small>
                        <button
                          onClick={() =>
                            addNote(item.displayDate, item.label, item.source)
                          }
                        >
                          <NotebookPen /> Save
                        </button>
                      </article>
                    ))}
                </div>
                <PageStrip
                  page={chronologyPage}
                  pages={Math.max(1, Math.ceil(filteredChronology.length / 20))}
                  setPage={setChronologyPage}
                />
              </section>
            )}

            {activity === 'panji' && (
              <section className="lab-activity">
                <Heading
                  icon={<Archive />}
                  code="08 · SIX-VOLUME MANUSCRIPT INDEX"
                  title="Panji Decoding Laboratory"
                  note={`${learningData.panji.length} actual headings; no fictional genealogy`}
                />
                <Banner>
                  These headings are extracted from the six author manuscripts.
                  The laboratory teaches document structure and evidentiary
                  limits without displaying or inferring private lineage data.
                </Banner>
                <div className="dual-filters">
                  <Filter
                    label="Find a heading"
                    value={panjiSearch}
                    setValue={setPanjiSearch}
                    placeholder="Practice, term, chapter, ethics…"
                  />
                  <label>
                    Volume
                    <select
                      value={panjiVolume}
                      onChange={(e) => setPanjiVolume(e.target.value)}
                    >
                      <option>All volumes</option>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n}>Volume {n}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="panji-lab">
                  <div className="panji-record">
                    {filteredPanji.map((item) => {
                      const i = learningData.panji.findIndex(
                        (x) => x.id === item.id,
                      );
                      return (
                        <button
                          key={item.id}
                          className={panjiIndex === i ? 'active' : ''}
                          onClick={() => setPanjiIndex(i)}
                        >
                          <small>
                            {item.volume} · level {item.level}
                          </small>
                          {item.heading}
                        </button>
                      );
                    })}
                  </div>
                  <div className="panji-reading">
                    <span>SELECTED MANUSCRIPT HEADING</span>
                    <h4>{panji.heading}</h4>
                    <p>{panji.context}</p>
                    <dl>
                      <dt>What the index can support</dt>
                      <dd>{panji.canSupport}</dd>
                      <dt>What it cannot prove alone</dt>
                      <dd>{panji.cannotProve}</dd>
                      <dt>Manuscript source</dt>
                      <dd>{panji.source}</dd>
                    </dl>
                    <button
                      onClick={() =>
                        addNote(panji.heading, panji.context, panji.source)
                      }
                    >
                      <NotebookPen /> Save
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activity === 'comparator' && (
              <section className="lab-activity">
                <Heading
                  icon={<GitCompareArrows />}
                  code="09 · PHILOSOPHICAL INDEX"
                  title="Concept Comparator"
                  note={`${learningData.comparators.length} chapter and section records`}
                />
                <Filter
                  label="Filter both menus"
                  value={conceptSearch}
                  setValue={setConceptSearch}
                  placeholder="Concept, chapter, section, question"
                />
                <div className="compare-selectors">
                  <label>
                    First record
                    <select
                      value={conceptA}
                      onChange={(e) => setConceptA(e.target.value)}
                    >
                      {filteredConcepts.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Second record
                    <select
                      value={conceptB}
                      onChange={(e) => setConceptB(e.target.value)}
                    >
                      {filteredConcepts.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="concept-comparison">
                  {[conceptOne, conceptTwo].map((x) => (
                    <article key={x.id}>
                      <p>INDEXED INQUIRY</p>
                      <h4>{x.name}</h4>
                      <strong>{x.question}</strong>
                      <h5>Pūrvapakṣa</h5>
                      <p>{x.purvapaksha}</p>
                      <h5>Uttarapakṣa</h5>
                      <p>{x.uttarapaksha}</p>
                      <h5>Synthesis</h5>
                      <p>{x.synthesis}</p>
                      <small>{x.source}</small>
                      <button
                        onClick={() =>
                          addNote(
                            `Comparison: ${x.name}`,
                            `${x.question}\nPūrvapakṣa: ${x.purvapaksha}\nUttarapakṣa: ${x.uttarapaksha}`,
                            x.source,
                          )
                        }
                      >
                        <NotebookPen /> Save
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {activity === 'architecture' && (
              <section className="lab-activity">
                <Heading
                  icon={<Sparkles />}
                  code="10 · MATERIAL & LANDSCAPE INDEX"
                  title="Architecture Viewer"
                  note={`${learningData.architecture.length} source headings with interpretive schematics`}
                />
                <Banner>
                  Each diagram is an abstract reading aid attached to an actual
                  book heading. It is not a reconstruction of a specific
                  monument.
                </Banner>
                <Filter
                  label="Find a structure or landscape"
                  value={architectureSearch}
                  setValue={setArchitectureSearch}
                  placeholder="Temple, settlement, river, road, craft…"
                />
                <div className="architecture-browser">
                  <div className="architecture-tabs">
                    {filteredArchitecture.map((x) => (
                      <button
                        key={x.id}
                        className={architectureId === x.id ? 'active' : ''}
                        onClick={() => setArchitectureId(x.id)}
                      >
                        {x.name}
                        <small>{x.period}</small>
                      </button>
                    ))}
                  </div>
                  <div className={`architecture-stage ${architecture.family}`}>
                    <div className="architecture-diagram">
                      <span className="architecture-core" />
                      <span className="architecture-ring" />
                      <span className="architecture-entry" />
                      <span className="architecture-field" />
                    </div>
                    <div>
                      <p>{architecture.period}</p>
                      <h4>{architecture.name}</h4>
                      <ol>
                        {architecture.parts.map((part, i) => (
                          <li key={part}>
                            <b>{i + 1}</b>
                            {part}
                          </li>
                        ))}
                      </ol>
                      <aside>
                        <strong>Interpretive caution</strong>
                        <p>{architecture.caution}</p>
                      </aside>
                      <small>{architecture.source}</small>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activity === 'daily' && (
              <section className="lab-activity">
                <Heading
                  icon={<Trophy />}
                  code="11 · DAILY + FULL QUESTION BANK"
                  title="Daily Videha Challenge"
                  note={`${learningData.daily.length} questions; today’s opens first, all are browseable`}
                />
                <Pager
                  index={dailyIndex}
                  total={learningData.daily.length}
                  previous={() => {
                    setDailyIndex(
                      (dailyIndex - 1 + learningData.daily.length) %
                        learningData.daily.length,
                    );
                    setDailyChoice('');
                  }}
                  next={() => {
                    setDailyIndex((dailyIndex + 1) % learningData.daily.length);
                    setDailyChoice('');
                  }}
                />
                <div className="daily-card">
                  <div className="daily-meta">
                    <time>
                      {today.toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                    <strong>
                      <Trophy /> {dailyProgress.streak} day streak
                    </strong>
                  </div>
                  <Question
                    item={daily}
                    choice={dailyChoice}
                    setChoice={(option) => {
                      setDailyChoice(option);
                      if (
                        option === daily.answer &&
                        dailyProgress.lastDay !== todayKey
                      ) {
                        const yesterday = new Date(today.getTime() - 86400000)
                          .toISOString()
                          .slice(0, 10);
                        setDailyProgress({
                          lastDay: todayKey,
                          streak:
                            dailyProgress.lastDay === yesterday
                              ? dailyProgress.streak + 1
                              : 1,
                        });
                      }
                    }}
                  />
                </div>
              </section>
            )}

            {activity === 'classification' && (
              <section className="lab-activity">
                <Heading
                  icon={<Search />}
                  code="12 · EVIDENCE-TYPE BANK"
                  title="Memory or Evidence?"
                  note={`${learningData.classification.length} source-labelled classification questions`}
                />
                <Banner>
                  This activity classifies the type of indexed site record. It
                  does not pronounce on a proposition’s truth without reading
                  its cited evidence.
                </Banner>
                <Pager
                  index={classificationIndex}
                  total={learningData.classification.length}
                  previous={() => {
                    setClassificationIndex(
                      (classificationIndex -
                        1 +
                        learningData.classification.length) %
                        learningData.classification.length,
                    );
                    setClassificationChoice('');
                  }}
                  next={() => {
                    setClassificationIndex(
                      (classificationIndex + 1) %
                        learningData.classification.length,
                    );
                    setClassificationChoice('');
                  }}
                />
                <Question
                  item={classification}
                  choice={classificationChoice}
                  setChoice={setClassificationChoice}
                />
              </section>
            )}
          </main>
        </div>
        <footer className="lab-provenance">
          <strong>Data provenance</strong>
          <p>{Object.values(learningData.provenance).join(' · ')}</p>
          <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">
            GeoNames attribution
          </a>
        </footer>
      </div>
    </section>
  );
}

function Heading({
  icon,
  code,
  title,
  note,
}: {
  icon: React.ReactNode;
  code: string;
  title: string;
  note: string;
}) {
  return (
    <div className="activity-heading">
      {icon}
      <div>
        <p>{code}</p>
        <h3>{title}</h3>
        <span>{note}</span>
      </div>
    </div>
  );
}
function Pager({
  index,
  total,
  previous,
  next,
}: {
  index: number;
  total: number;
  previous: () => void;
  next: () => void;
}) {
  return (
    <div className="question-pager">
      <button onClick={previous} aria-label="Previous">
        <ArrowLeft />
      </button>
      <strong>
        {index + 1} of {total}
      </strong>
      <button onClick={next} aria-label="Next">
        <ArrowRight />
      </button>
    </div>
  );
}
function Answer({
  option,
  answer,
  choice,
  setChoice,
}: {
  option: string;
  answer: string;
  choice: string;
  setChoice: (value: string) => void;
}) {
  return (
    <button
      disabled={Boolean(choice)}
      className={
        choice
          ? option === answer
            ? 'correct'
            : option === choice
              ? 'incorrect'
              : ''
          : ''
      }
      onClick={() => setChoice(option)}
    >
      {option}
    </button>
  );
}
function Explanation({
  correct,
  answer,
  text,
  source,
}: {
  correct: boolean;
  answer: string;
  text: string;
  source: string;
}) {
  return (
    <div className={`answer-explanation ${correct ? 'correct' : 'incorrect'}`}>
      <strong>{correct ? 'Correct' : `Best answer: ${answer}`}</strong>
      <p>{text}</p>
      <small>Source: {source}</small>
    </div>
  );
}
function Question({
  item,
  choice,
  setChoice,
}: {
  item: {
    claim: string;
    answer: string;
    options: string[];
    why: string;
    source: string;
  };
  choice: string;
  setChoice: (value: string) => void;
}) {
  return (
    <div className="question-card">
      <h4>{item.claim}</h4>
      <div className="answer-grid">
        {item.options.map((o) => (
          <Answer
            key={o}
            option={o}
            answer={item.answer}
            choice={choice}
            setChoice={setChoice}
          />
        ))}
      </div>
      {choice && (
        <Explanation
          correct={choice === item.answer}
          answer={item.answer}
          text={item.why}
          source={item.source}
        />
      )}
    </div>
  );
}
function Filter({
  label,
  value,
  setValue,
  placeholder,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="lab-filter">
      <Search />
      <span>{label}</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
function Banner({ children }: { children: React.ReactNode }) {
  return <p className="source-banner">{children}</p>;
}
function PageStrip({
  page,
  pages,
  setPage,
}: {
  page: number;
  pages: number;
  setPage: (value: number) => void;
}) {
  return (
    <div className="page-strip">
      <button disabled={page === 0} onClick={() => setPage(page - 1)}>
        <ArrowLeft /> Previous 20
      </button>
      <strong>
        Page {page + 1} of {pages}
      </strong>
      <button disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>
        Next 20 <ArrowRight />
      </button>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="lab-empty">
      <CircleHelp />
      <h5>Nothing to show</h5>
      <p>{text}</p>
    </div>
  );
}
