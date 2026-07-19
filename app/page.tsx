"use client";

import { useEffect, useMemo, useState } from "react";
import { practicalStations, questions, readinessItems, topics, libraryArticles, type ProgressState, type Question, type StudyTopic } from "./data";

const defaultProgress: ProgressState = { bestScore: 0, answered: 0, stations: [], readiness: [] };

const qualifications = [
  ["03", "years relevant full-time experience"],
  ["32+", "feet: prepared to work at height"],
  ["3", "application methods: brush, roll, spray"],
  ["2", "assessment sides: written + performance"],
];

const sourceLinks = [
  ["SEPTA Careers", "Search current Building Trades openings", "https://jobs.septa.org/"],
  ["SEPTA Skilled Trades", "Official overview of painter and building-trade careers", "https://jobs.septa.org/content/Skilled-Trades/?locale=en_US"],
  ["How SEPTA hires", "Applications, recruiter contact, and what happens next", "https://jobs.septa.org/content/How-We-Hire/?locale=en_US"],
  ["OSHA Hazard Communication", "Labels, safety data sheets, and worker information", "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1200"],
  ["OSHA Respiratory Protection", "Programs, medical evaluation, fit testing, and use", "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.134"],
  ["OSHA Construction Lead", "Exposure assessment, limits, controls, and training", "https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.62"],
  ["OSHA Scaffolds", "Capacity, inspection, access, and fall protection", "https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.451"],
  ["OSHA Ladders", "Placement, access, condition, and safe use", "https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.1053"],
];

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function safeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export default function Home() {
  const [progress, setProgress] = useState<ProgressState>(defaultProgress);
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [activeQuestions, setActiveQuestions] = useState<Question[]>(questions.slice(0, 20));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [length, setLength] = useState("24");
  const [height, setHeight] = useState("10");
  const [openings, setOpenings] = useState("42");
  const [coats, setCoats] = useState("2");
  const [coverage, setCoverage] = useState("400");
  const [waste, setWaste] = useState("10");
  const [ratioA, setRatioA] = useState("4");
  const [ratioB, setRatioB] = useState("1");
  const [batch, setBatch] = useState("5");
  const [temperature, setTemperature] = useState("70");
  const [humidity, setHumidity] = useState("50");
  const [studyMode, setStudyMode] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("painter1131-progress");
    if (saved) {
      try { setProgress({ ...defaultProgress, ...JSON.parse(saved) }); } catch { /* ignore malformed local data */ }
    }
  }, []);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || finished) return;
      if (["1", "2", "3", "4"].includes(event.key) && !submitted) setSelectedAnswer(Number(event.key) - 1);
      if (event.key === "Enter") {
        if (!submitted && selectedAnswer !== null) checkAnswer();
        else if (submitted) nextQuestion();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const area = Math.max(0, safeNumber(length) * safeNumber(height) - safeNumber(openings));
  const rawGallons = coverage === "0" ? 0 : (area * safeNumber(coats)) / Math.max(1, safeNumber(coverage));
  const gallons = rawGallons * (1 + safeNumber(waste) / 100);
  const ratioTotal = safeNumber(ratioA) + safeNumber(ratioB);
  const componentA = ratioTotal ? safeNumber(batch) * safeNumber(ratioA) / ratioTotal : 0;
  const componentB = ratioTotal ? safeNumber(batch) * safeNumber(ratioB) / ratioTotal : 0;
  
  const t = safeNumber(temperature);
  const rh = Math.max(0, Math.min(100, safeNumber(humidity)));
  const dewPoint = t - (0.36 * (100 - rh));
  const safeSurfaceTemp = dewPoint + 5;

  const current = activeQuestions[questionIndex];
  const topicLabel = selectedTopic === "all" ? "Full mixed drill" : topics.find((topic) => topic.id === selectedTopic)?.name ?? "Topic review";
  const answeredInDrill = finished ? activeQuestions.length : questionIndex;
  const percent = activeQuestions.length ? Math.round((answeredInDrill / activeQuestions.length) * 100) : 0;

  const selectedTopicData = useMemo<StudyTopic | undefined>(() => topics.find((topic) => topic.id === selectedTopic), [selectedTopic]);

  function saveProgress(next: ProgressState) {
    setProgress(next);
    window.localStorage.setItem("painter1131-progress", JSON.stringify(next));
  }

  function buildDrill(topicId = selectedTopic) {
    const pool = topicId === "all" ? questions : questions.filter((item) => item.topic === topicId);
    setActiveQuestions(shuffle(pool).slice(0, topicId === "all" ? 20 : pool.length));
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    setScore(0);
    setFinished(false);
    document.getElementById("drill")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function chooseTopic(topicId: string) {
    setSelectedTopic(topicId);
    const pool = topicId === "all" ? questions : questions.filter((item) => item.topic === topicId);
    setActiveQuestions(shuffle(pool).slice(0, topicId === "all" ? 20 : pool.length));
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    setScore(0);
    setFinished(false);
  }

  function checkAnswer() {
    if (submitted || selectedAnswer === null) return;
    if (selectedAnswer === current.answer) setScore((value) => value + 1);
    saveProgress({ ...progress, answered: progress.answered + 1 });
    setSubmitted(true);
  }

  function nextQuestion() {
    if (questionIndex === activeQuestions.length - 1) {
      const finalScore = score;
      const equivalentTwenty = Math.round((finalScore / activeQuestions.length) * 20);
      saveProgress({ ...progress, bestScore: Math.max(progress.bestScore, equivalentTwenty) });
      setFinished(true);
      return;
    }
    setQuestionIndex((value) => value + 1);
    setSelectedAnswer(null);
    setSubmitted(false);
  }

  function toggleStation(id: string) {
    const stations = progress.stations.includes(id) ? progress.stations.filter((item) => item !== id) : [...progress.stations, id];
    saveProgress({ ...progress, stations });
  }

  function toggleReadiness(index: number) {
    const readiness = progress.readiness.includes(index) ? progress.readiness.filter((item) => item !== index) : [...progress.readiness, index];
    saveProgress({ ...progress, readiness });
  }

  return (
    <main>
      <header className="topBar">
        <a className="logo" href="#top" aria-label="Coat Ready home"><span className="logoSwatch" />COAT<span>READY</span></a>
        <nav aria-label="Primary navigation"><a href="#knowledge">Knowledge</a><a href="#drill">Practice exam</a><a href="#practical">Performance</a><a href="#calculator">Calculators</a><a href="#library">Library</a></nav>
        <button onClick={() => buildDrill("all")}>START DRILL <span>↗</span></button>
      </header>

      <section className="hero" id="top">
        <div className="tape tapeOne" aria-hidden="true">INDEPENDENT PREP • NOT OFFICIAL EXAM CONTENT</div>
        <div className="heroCopy">
          <span className="kicker">SEPTA PAINTER • FIRST CLASS 1131</span>
          <h1>PREP IT.<br /><em>COAT IT.</em><br />PROVE IT.</h1>
          <p>A serious practice bench for experienced facilities painters preparing for SEPTA’s written qualifications and performance tests.</p>
          <div className="heroActions"><button onClick={() => buildDrill("all")}>TAKE A 20-QUESTION DRILL <span>→</span></button><a href="#practical">VIEW PRACTICAL STATIONS ↓</a></div>
        </div>
        <aside className="jobCard">
          <div className="jobCardTop"><span>ROLE SNAPSHOT</span><b>1131</b></div>
          <h2>PAINTER<br />FIRST CLASS</h2>
          <p>Structures • facilities • field assignments</p>
          <div className="paintCan" aria-hidden="true"><span>WRITTEN</span><i /><b>+</b><span>PERFORMANCE</span></div>
          <ul><li>Brush + roller + airless spray</li><li>Wood + drywall + concrete + steel</li><li>Mixing + matching + tinting</li><li>Scaffolds + rigging + glazing</li></ul>
        </aside>
        <div className="swatchRail" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      </section>

      <section className="qualificationStrip" aria-label="Role qualifications">
        {qualifications.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
      </section>

      <section className="notice">
        <span>IMPORTANT</span><p>SEPTA states that Painter–First Class candidates must satisfactorily complete written qualification and performance tests. SEPTA does not publish a public painter-test blueprint, question count, time limit, or passing score. This site turns the posted job duties and applicable safety standards into independent practice.</p>
      </section>

      <section className="knowledgeSection" id="knowledge">
        <div className="sectionTitle"><span>01 / KNOWLEDGE MAP</span><h2>Train the full trade,<br />not just the paint.</h2><p>Six original questions live in every topic. Pick one for a focused review or use all eight for a randomized 20-question drill.</p></div>
        <div className="topicGrid">
          {topics.map((topic, index) => (
            <button key={topic.id} className={`topicCard ${selectedTopic === topic.id ? "active" : ""}`} onClick={() => chooseTopic(topic.id)} style={{ "--accent": `var(--${topic.accent})` } as React.CSSProperties}>
              <span>{String(index + 1).padStart(2, "0")}</span><b>{topic.name}</b><p>{topic.description}</p><i>6 QUESTIONS ↗</i>
            </button>
          ))}
        </div>
      </section>

      <section className="drillSection" id="drill">
        <div className="drillIntro">
          <span className="sectionTag">02 / PRACTICE EXAM</span><h2>Find the weak coat<br />before test day.</h2>
          <div className="drillStats"><div><strong>{progress.answered}</strong><span>TOTAL ANSWERED</span></div><div><strong>{progress.bestScore}/20</strong><span>BEST FULL DRILL</span></div></div>
          <div className="topicSelect">
            <label htmlFor="topic-filter">DRILL MODE</label>
            <select id="topic-filter" value={selectedTopic} onChange={(event) => chooseTopic(event.target.value)}>
              <option value="all">Full mixed drill — 20</option>
              {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name} — 6</option>)}
            </select>
          </div>
          <div className="studyToggle">
            <label>
              <input type="checkbox" checked={studyMode} onChange={(e) => setStudyMode(e.target.checked)} />
              <span>Study / Flashcard Mode</span>
            </label>
          </div>
          {selectedTopicData && <p className="focusNote"><b>Focused review:</b> {selectedTopicData.description}</p>}
        </div>

        <div className="quizPanel">
          {finished ? (
            <div className="resultsPanel">
              <span>DRILL COMPLETE</span><div><strong>{score}</strong><b>/{activeQuestions.length}</b></div>
              <h3>{score / activeQuestions.length >= .8 ? "Finish is holding." : score / activeQuestions.length >= .6 ? "Solid base. One more coat." : "The prep work starts here."}</h3>
              <p>Review every missed explanation, then rebuild the drill. A professional result comes from correcting the failure—not hiding it.</p>
              <button onClick={() => buildDrill()}>BUILD A NEW DRILL ↻</button>
            </div>
          ) : (
            <>
              <div className="quizMeta"><div><span>QUESTION {String(questionIndex + 1).padStart(2, "0")} / {String(activeQuestions.length).padStart(2, "0")}</span><b>{topicLabel}</b></div><div className="progressTrack"><i style={{ width: `${percent}%` }} /></div></div>
              <h3>{current.prompt}</h3>
              <div className="answers" role="radiogroup" aria-label="Answer choices">
                {current.choices.map((choice, index) => {
                  const correct = submitted && index === current.answer;
                  const wrong = submitted && selectedAnswer === index && index !== current.answer;
                  return <button key={choice} role="radio" aria-checked={selectedAnswer === index} disabled={submitted} className={`${selectedAnswer === index ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`} onClick={() => setSelectedAnswer(index)}><span>{index + 1}</span><p>{choice}</p><b>{correct ? "✓" : wrong ? "×" : ""}</b></button>;
                })}
              </div>
              {submitted && <div className={`explanation ${selectedAnswer === current.answer ? "good" : "review"}`}><span>{selectedAnswer === current.answer ? "CORRECT" : "REVIEW"}</span><p>{current.explanation}</p><b>{current.reference}</b></div>}
              <div className="quizFooter">
                <span>Keyboard: 1–4 selects • Enter checks/continues</span>
                {submitted ? (
                  <button onClick={nextQuestion}>{questionIndex === activeQuestions.length - 1 ? "SEE RESULTS" : "NEXT QUESTION"} →</button>
                ) : (
                  studyMode ? (
                    <button onClick={() => { setSelectedAnswer(current.answer); setSubmitted(true); }}>SHOW ANSWER →</button>
                  ) : (
                    <button disabled={selectedAnswer === null} onClick={checkAnswer}>CHECK ANSWER →</button>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="practicalSection" id="practical">
        <div className="sectionTitle split"><span>03 / PERFORMANCE TEST</span><h2>Eight stations.<br />Trade-level habits.</h2><div><p>Use these as self-scored practice stations. SEPTA may use a different format; the goal is to rehearse the duties named in the posting.</p><strong>{progress.stations.length}/8 COMPLETE</strong></div></div>
        <div className="stationGrid">
          {practicalStations.map((station) => {
            const done = progress.stations.includes(station.id);
            return <article key={station.id} className={done ? "done" : ""}><div className="stationHead"><span>{station.number}</span><b>{station.time}</b></div><h3>{station.title}</h3><p>{station.brief}</p><ul>{station.checks.map((check) => <li key={check}>{check}</li>)}</ul><button onClick={() => toggleStation(station.id)}>{done ? "✓ MARKED COMPLETE" : "MARK PRACTICED"}</button></article>;
          })}
        </div>
      </section>

      <section className="calculatorSection" id="calculator">
        <div className="sectionTitle light"><span>04 / PAINT MATH</span><h2>Measure twice.<br />Mix once.</h2><p>Practice the arithmetic a professional painter uses for takeoffs and multi-component materials.</p></div>
        <div className="calculatorGrid">
          <article className="calculatorCard">
            <div className="calcLabel"><span>A</span><b>AREA + COVERAGE</b></div>
            <div className="inputGrid"><label>Length (ft)<input inputMode="decimal" value={length} onChange={(e) => setLength(e.target.value)} /></label><label>Height (ft)<input inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} /></label><label>Openings (sq ft)<input inputMode="decimal" value={openings} onChange={(e) => setOpenings(e.target.value)} /></label><label>Coats<input inputMode="numeric" value={coats} onChange={(e) => setCoats(e.target.value)} /></label><label>Coverage (sq ft/gal)<input inputMode="decimal" value={coverage} onChange={(e) => setCoverage(e.target.value)} /></label><label>Waste %<input inputMode="decimal" value={waste} onChange={(e) => setWaste(e.target.value)} /></label></div>
            <div className="calcResult"><div><span>NET AREA</span><strong>{area.toFixed(0)} <small>SQ FT</small></strong></div><div><span>ESTIMATED MATERIAL</span><strong>{gallons.toFixed(2)} <small>GAL</small></strong></div></div>
            <p>Estimate only. Confirm actual spread rate, porosity, loss, coat count, and container sizes.</p>
          </article>
          <article className="calculatorCard ratioCard">
            <div className="calcLabel"><span>B</span><b>MIX-RATIO SPLIT</b></div>
            <div className="ratioInputs"><label>PART A<input inputMode="decimal" value={ratioA} onChange={(e) => setRatioA(e.target.value)} /></label><b>:</b><label>PART B<input inputMode="decimal" value={ratioB} onChange={(e) => setRatioB(e.target.value)} /></label></div><label className="batchInput">TOTAL BATCH (GAL)<input inputMode="decimal" value={batch} onChange={(e) => setBatch(e.target.value)} /></label>
            <div className="mixVisual"><div style={{ flex: safeNumber(ratioA) || 1 }}><span>PART A</span><strong>{componentA.toFixed(2)} GAL</strong></div><div style={{ flex: safeNumber(ratioB) || 1 }}><span>PART B</span><strong>{componentB.toFixed(2)} GAL</strong></div></div>
            <p>Training calculator only. The current product data sheet controls ratio, units, induction time, pot life, and permitted thinning.</p>
          </article>
          <article className="calculatorCard">
            <div className="calcLabel"><span>C</span><b>ENVIRONMENTAL</b></div>
            <div className="inputGrid">
              <label>Ambient Temp (°F)<input inputMode="decimal" value={temperature} onChange={(e) => setTemperature(e.target.value)} /></label>
              <label>Relative Humidity (%)<input inputMode="decimal" value={humidity} onChange={(e) => setHumidity(e.target.value)} /></label>
            </div>
            <div className="calcResult">
              <div><span>DEW POINT</span><strong>{dewPoint.toFixed(1)} <small>°F</small></strong></div>
              <div><span>MIN SURFACE TEMP</span><strong>{safeSurfaceTemp.toFixed(1)} <small>°F</small></strong></div>
            </div>
            <p>Surface temperature must be at least 5°F above the dew point to safely apply coatings without moisture interference.</p>
          </article>
        </div>
      </section>

      <section className="librarySection" id="library">
        <div className="sectionTitle split"><span>05 / REFERENCE LIBRARY</span><h2>Knowledge<br />Base.</h2><p>Quick reference guides for common coating defects, surface preparation standards, and system compatibility.</p></div>
        <div className="libraryGrid">
          {libraryArticles.map(article => (
            <article key={article.id} className="libraryCard">
              <div className="libCategory">{article.category}</div>
              <h3>{article.title}</h3>
              <div className="libContent" dangerouslySetInnerHTML={{ __html: article.content }} />
            </article>
          ))}
        </div>
      </section>

      <section className="readinessSection" id="readiness">
        <div className="readinessIntro"><span>06 / APPLICATION READINESS</span><h2>Bring proof.<br />Bring the trade.</h2><p>The job posting expects documented experience and practical independence—not entry-level familiarity.</p><div className="readinessMeter"><i style={{ width: `${(progress.readiness.length / readinessItems.length) * 100}%` }} /><span>{progress.readiness.length}/{readinessItems.length}</span></div></div>
        <div className="readinessList">{readinessItems.map((item, index) => <label key={item} className={progress.readiness.includes(index) ? "checked" : ""}><input type="checkbox" checked={progress.readiness.includes(index)} onChange={() => toggleReadiness(index)} /><span>{progress.readiness.includes(index) ? "✓" : String(index + 1).padStart(2, "0")}</span><p>{item}</p></label>)}</div>
      </section>

      <section className="sourcesSection">
        <div className="sectionTitle split"><span>06 / SOURCE DESK</span><h2>Verify before<br />you test.</h2><p>Use current SEPTA instructions for hiring and authoritative safety standards for study. Job postings and requirements can change.</p></div>
        <div className="sourceList">{sourceLinks.map(([title, note, href], index) => <a key={title} href={href} target="_blank" rel="noreferrer"><span>{String(index + 1).padStart(2, "0")}</span><div><b>{title}</b><p>{note}</p></div><i>↗</i></a>)}</div>
      </section>

      <footer><a className="logo" href="#top"><span className="logoSwatch" />COAT<span>READY</span></a><p>Independent preparation for SEPTA Painter–First Class 1131 candidates. Not affiliated with or endorsed by SEPTA. Not official test content or a substitute for employer instructions, product data, training, or applicable safety standards.</p><span>RESEARCH CHECKED • JULY 2026</span></footer>
    </main>
  );
}
