'use client';

import { lazy, Suspense, useEffect, useRef, useState } from 'react';

const ResearchExpansion = lazy(() => import('./research-expansion'));
const LearningLab = lazy(() => import('./learning-lab'));

const specialistHashes = new Set([
  '#wing-1',
  '#wing-2',
  '#wing-3',
  '#wing-4',
  '#wing-5',
  '#learning-lab',
]);

export default function DeferredResearchRooms() {
  const gatewayRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const loadForHash = () => {
      if (specialistHashes.has(window.location.hash)) setShouldLoad(true);
    };

    loadForHash();
    window.addEventListener('hashchange', loadForHash);

    const gateway = gatewayRef.current;
    if (!gateway || !('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return () => window.removeEventListener('hashchange', loadForHash);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '1200px 0px', threshold: 0 },
    );

    observer.observe(gateway);
    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', loadForHash);
    };
  }, []);

  useEffect(() => {
    if (!shouldLoad || !specialistHashes.has(window.location.hash)) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      const target = document.querySelector(window.location.hash);
      if (target) {
        window.clearInterval(timer);
        target.scrollIntoView({ block: 'start' });
      } else if ((attempts += 1) > 80) {
        window.clearInterval(timer);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [shouldLoad]);

  return (
    <div ref={gatewayRef} id="specialist-research-gateway">
      {shouldLoad ? (
        <Suspense
          fallback={
            <section className="project-status" aria-live="polite">
              <div>
                <p className="eyebrow">OPENING SPECIALIST RESEARCH ROOMS</p>
                <h2>Loading map, graph, reader and classroom data…</h2>
              </div>
            </section>
          }
        >
          <ResearchExpansion />
          <LearningLab />
        </Suspense>
      ) : (
        <section className="project-status" aria-label="Specialist research rooms">
          <div>
            <p className="eyebrow">SPECIALIST RESEARCH ROOMS</p>
            <h2>Map, graph, multiscript reader and classroom load when needed</h2>
          </div>
          <p>
            This gateway keeps the initial archive lightweight. The complete specialist corpus is preserved and opens automatically as you approach it or select a specialist-room link.
          </p>
          <button type="button" onClick={() => setShouldLoad(true)}>
            Open specialist research rooms
          </button>
        </section>
      )}
    </div>
  );
}
