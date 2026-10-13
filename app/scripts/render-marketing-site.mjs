import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COACHING_MAILTO,
  COACHING_TIERS,
  CONSULTING_MAILTO,
  FREE_COURSE_HREF,
  individualSlotMarkup,
} from "../marketing-site/js/checkout-switch.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "marketing-site");
const legalDir = join(root, "scripts", "marketing-legal");
const legal = (name) => readFileSync(join(legalDir, name), "utf8").trim();

const NAV = [
  ["/how-it-works", "How it works"],
  ["/families", "Families"],
  ["/teams", "Teams"],
  ["/pricing", "Pricing"],
  ["/ben", "Ben"],
];

const SIGN_IN = "https://portal.fieldschool.ai/login";
const SKILL = "https://portal.fieldschool.ai/tools/skill";
const INTELLIGENCE = "https://portal.fieldschool.ai/tools/intelligence";

const RULES = [
  ["Everything Is Made Up", "People wrote the rules. God wrote the world. Do not treat a policy like gravity, or gravity like a policy."],
  ["You Own Your Response", "The freeze gets a vote. It does not get the last word. The next move is yours."],
  ["Reality over hope", "The world keeps its own books. Look first. Then interpret. Hope does not close a deal."],
  ["Ego Destroys Kingdoms", "Certainty about yourself is the blindness you cannot see. Stay a student on purpose, especially when you are winning."],
  ["Working In vs. Working On", "Work inside the system. Also step out long enough to see what it is for."],
  ["No Game Is Played on Neutral Ground", "Name the players and what each is rewarded for before the next move."],
  ["Nothing Exists in Isolation", "Name the kind of system you are in before you act."],
  ["Information Must Be Interpreted, Not Just Received", "People rarely say exactly what they mean. How they act is data. Notice, guess carefully, then ask. Listen under the words."],
  ["People Move When Value Outweighs Risk", "People move when the good looks bigger than the scare. Talk about the whole pile, not only the price."],
  ["You Cannot Reason From What You Do Not Understand", "A recommendation is only as strong as the model under it."],
  ["To Advise Is to Share in the Decision", "A recommendation is a judgment someone may act on. Do not just hand over facts. Help them know what to do."],
  ["Read the room", "People show the defense they use to feel safe, not who they are. Read the fear under the behavior. Use it for compassion, not as a tool."],
];

const FAQ = [
  ["What is a knowledge brain?", "Everything your people need to know, written down once. AI handles the repeat work. You still make the calls."],
  ["Is this for families or for teams?", "Both. One school. Two rooms. A family and a team do not share a desk."],
  ["Is homeschool a separate product?", "No. It is a mode inside the family room."],
  ["What happens in a session with Ben?", "Ben sits with you for an hour, takes in how the work runs, and builds the knowledge brain with you. You leave with a recap and the next step in the portal."],
  ["What does the free course include?", "Ten lessons. Watch the clip, do the assignment, and pass the quiz. No card."],
  ["Do my people need their own login?", "Teammates may sign in. Children never get accounts or public profiles."],
  ["How much time does it take?", "The free course is built so you can finish it this week. After that, the next step waits. The Saturday email is one note."],
  ["Can the paid seat stop?", "Email Ben and the paid seat can stop. The free course stays open."],
];

function coachingButton(tier) {
  return `<a class="btn btn-outline" data-coaching-cta data-tier="${tier}" href="${COACHING_MAILTO}">Email Ben</a>`;
}

function consultingButton() {
  return `<a class="btn btn-outline" data-consulting-cta href="${CONSULTING_MAILTO}">Email Ben</a>`;
}

function startFree(filled = true) {
  const klass = filled ? "btn btn-primary" : "btn btn-nav";
  return `<a class="${klass}" href="${FREE_COURSE_HREF}">Start free</a>`;
}

function saturdayForm(id, source) {
  return `<form data-form="saturday_note" data-source="${source}" data-success="You are on the list.">
    <div class="hp">
      <label for="website-${id}">Company</label>
      <input id="website-${id}" name="website" type="text" tabindex="-1" autocomplete="off">
    </div>
    <div class="stack-form">
      <div class="field">
        <label for="email-${id}">Email</label>
        <input id="email-${id}" name="email" type="email" autocomplete="email" required>
      </div>
      <button class="btn btn-outline" type="submit">Get the Saturday email</button>
    </div>
  </form>`;
}

function nav(current) {
  const links = NAV.map(([href, label]) => {
    const currentAttr = href === current ? ' aria-current="page"' : "";
    return `<a class="nav-link" href="${href}"${currentAttr}>${label}</a>`;
  }).join("");
  const mobile = NAV.map(([href, label]) => `<a class="nav-link" href="${href}">${label}</a>`).join("");
  return `<a class="skip" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="header-bar">
      <a class="wordmark" href="/"><img class="wordmark-mark" src="/img/lockup-wide-cream.png" width="640" height="192" alt="Field School"></a>
      <nav class="nav-desktop" aria-label="Site">${links}</nav>
      <div class="header-actions">
        <a class="nav-link" href="${SIGN_IN}">Sign in</a>
        ${startFree(false)}
        <details class="nav-mobile">
          <summary aria-label="Open menu"><span class="burger" aria-hidden="true"></span></summary>
          <nav class="nav-panel" aria-label="Site">
            ${mobile}
            <a class="nav-link" href="${SIGN_IN}">Sign in</a>
            <a class="nav-link" href="${FREE_COURSE_HREF}">Start free</a>
          </nav>
        </details>
      </div>
    </div>
  </header>`;
}

function footer(source) {
  return `<footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        <p class="kicker">Saturday email</p>
        ${saturdayForm(`foot-${source.replace(/\W/g, "")}`, source)}
      </div>
      <div>
        <ul class="footer-links">
          <li><a href="/principles">The twelve rules</a></li>
          <li><a href="/assessment">Free assessment</a></li>
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/terms">Terms</a></li>
        </ul>
        <p class="slogan">Lead yourself. Learn yourself. Do the Work.</p>
      </div>
    </div>
  </footer>
  <aside class="sticky-start" data-sticky-start hidden>
    <p>One course is free. No card.</p>
    ${startFree(true)}
  </aside>`;
}

function page({ path, title, description, current, body, home = false }) {
  const sticky = home ? "" : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="stylesheet" href="/css/fonts.css">
  <link rel="stylesheet" href="/css/site.css">
  <link rel="icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/brand/png/apple-touch-180.png">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="https://fieldschool.ai/brand/png/og-1200x630.png">
  <meta name="twitter:card" content="summary_large_image">
</head>
<body>
  ${nav(current)}
  <main id="main" class="main">
    ${body}
  </main>
  ${footer(path)}
  ${sticky}
  <script src="/js/forms.js" defer></script>
  <script src="/js/site.js" defer></script>
  <script type="module" src="/js/checkout-switch.mjs"></script>
</body>
</html>
`;
}

function screen(title, copy, callouts) {
  const notes = callouts.map((line, index) => `<li>${String(index + 1).padStart(2, "0")} ${line}</li>`).join("");
  return `<article class="screen">
    <h3>${title}</h3>
    <p>${copy}</p>
    <ol class="callouts">${notes}</ol>
  </article>`;
}

function heroScreen() {
  return `<div class="hero-visual">
    <img class="seal" src="/img/seal.png" width="520" height="515" alt="">
    <div class="screen">
      <div class="screen-top">
        <p class="kicker">Next step</p>
        <div class="toggle" data-room-toggle role="group" aria-label="Family or org">
          <button type="button" data-room="family" aria-pressed="true">Family</button>
          <button type="button" data-room="org" aria-pressed="false">Org</button>
        </div>
      </div>
      <div data-room-panel="family">
        <p class="screen-title">Hale household</p>
        <p>Tuesday job is written down. Lesson 2 of 10 is the next step.</p>
      </div>
      <div data-room-panel="org" hidden>
        <p class="screen-title">Hale team</p>
        <p>The standard is the close. People practice it while you are in meetings.</p>
      </div>
      <ol class="callouts"><li>01 Next step</li><li>02 Lesson</li><li>03 Quiz</li></ol>
    </div>
  </div>`;
}

function tierCards() {
  return COACHING_TIERS.map((tier) => `<article class="card">
    <h3>${tier.name}. ${tier.price} a month.</h3>
    <p>${tier.line}</p>
    ${coachingButton(tier.key)}
  </article>`).join("");
}

function faqBlock(items = FAQ) {
  return `<div class="faq">${items.map(([q, a]) => `<details>
    <summary>${q}</summary>
    <p>${a}</p>
  </details>`).join("")}</div>`;
}

const home = page({
  path: "/",
  title: "Field School",
  description: "Field School builds a knowledge brain for your family or your team, so your people keep moving when you are not there. Start free.",
  current: "/",
  home: true,
  body: `
    <section class="band" id="hero" data-hero>
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <p class="kicker">Knowledge brains</p>
          <h1>The knowledge brain for families and teams who cannot be in the room every hour.</h1>
          <p class="lede">Field School builds a knowledge brain for your family or your team, so the people you are responsible for keep learning on the days you cannot be there.</p>
          <p class="risk">One course is free. No card.</p>
          <div class="actions">
            ${startFree(true)}
            <a class="btn btn-outline" href="/pricing">See pricing</a>
          </div>
          <ul class="chips" aria-label="Who starts here">
            <li>Families</li>
            <li>Teams</li>
            <li>Homeschool</li>
          </ul>
        </div>
        ${heroScreen()}
      </div>
    </section>
    <section class="band band-white" id="credential">
      <div class="wrap credential">
        <p>Built by a sales leader who runs a team and a household.</p>
        <ul class="chips">
          <li>Director of Mid-Market Sales at Euna</li>
          <li>CAE team built at Ministry Brands</li>
        </ul>
      </div>
    </section>
    <section class="band" id="voice">
      <div class="wrap">
        <figure class="quote">
          <p>It is for people who still have a number, a family, and a week that has to move.</p>
          <footer>Ben, Founder.</footer>
        </figure>
      </div>
    </section>
    <section class="band band-white reveal" id="problem-a">
      <div class="wrap split">
        <div>
          <h2>You taught it once. Then the week happened.</h2>
          <p class="lede">The lesson lived in the room. The week did not keep it. A knowledge brain keeps the next step when you are gone.</p>
        </div>
        ${screen("Path", "Hale household. The next step is already on the page.", ["Next step", "Owner", "Due"])}
      </div>
    </section>
    <section class="band reveal" id="problem-b">
      <div class="wrap split">
        ${screen("Knowledge brain", "What the Hale team knows, written down once.", ["Standard", "Practice", "Owner"])}
        <div>
          <h2>You are the one who knows. You are also the one who is never free.</h2>
          <p class="lede">The standard stays when the best people are in meetings, or when they leave.</p>
        </div>
      </div>
    </section>
    <section class="band band-white reveal" id="how">
      <div class="wrap">
        <h2>Write it down once. The next step is always waiting.</h2>
        <p class="lede">Everything your people need to know, written down once. AI handles the repeat work. You still make the calls.</p>
        <div class="cols-3">
          <article class="card"><h3>Write it down</h3><p>The standard, the lesson, and the next step live in one place.</p></article>
          <article class="card"><h3>AI does the repeat work</h3><p>Free course: give an AI one clear job it can keep doing while you are away.</p></article>
          <article class="card"><h3>The next step is waiting</h3><p>Written down over remembered. Practice over watching. The next step over the next meeting.</p></article>
        </div>
      </div>
    </section>
    <section class="band reveal" id="included">
      <div class="wrap">
        <h2>Everything your people need on the days you are gone.</h2>
        <div class="cols-4">
          <article class="card"><h3>Knowledge Brain</h3><p>What your people need to know, written down once.</p></article>
          <article class="card"><h3>Lessons in the portal</h3><p>Clip, assignment, and quiz. The next one is already chosen.</p></article>
          <article class="card"><h3>The Saturday email</h3><p>One note a week your people can use the same week.</p></article>
          <article class="card"><h3>Coaching</h3><p>Assess, Model, and Build. <a href="/pricing">See pricing</a>.</p></article>
        </div>
        <div class="actions">${startFree(true)}</div>
      </div>
    </section>
    <section class="band band-white reveal" id="rooms">
      <div class="wrap">
        <h2>One school. Two rooms.</h2>
        <div class="cols-2">
          <article class="card">
            <h3>Families</h3>
            <p>You set the path. They do the next lesson on Tuesday, even if you are at work. Homeschool? Run the whole year from here.</p>
            <a class="btn btn-outline" href="/families">Open the family room</a>
          </article>
          <article class="card">
            <h3>Teams</h3>
            <p>You set the standard. Your people practice it on the days you are in meetings. What your best people know stays when they leave.</p>
            <a class="btn btn-outline" href="/teams">Open the team room</a>
          </article>
        </div>
      </div>
    </section>
    <section class="band reveal" id="start">
      <div class="wrap">
        <h2>Start with one course you can finish this week.</h2>
        <div class="cols-2">
          <article class="card">
            <h3>Free course</h3>
            <p>Ten lessons. Give an AI one clear job it can keep doing while you are away.</p>
            <p class="tag">Free</p>
            <a class="btn btn-outline" href="${FREE_COURSE_HREF}">Start free</a>
          </article>
          <article class="card">
            <h3>The Twelve</h3>
            <p>Twelve rules Field School will not treat as optional.</p>
            <p class="tag">Free</p>
            <a class="btn btn-outline" href="/principles">Read the rules</a>
          </article>
        </div>
      </div>
    </section>
    <section class="band band-white reveal" id="week">
      <div class="wrap">
        <h2>The week</h2>
        <div class="rows">
          <div><strong>Assess</strong><span>One session a month.</span></div>
          <div><strong>Model</strong><span>Two sessions a month.</span></div>
          <div><strong>Build</strong><span>Four working sessions a month.</span></div>
          <div><strong>Saturday email</strong><span>One note a week.</span></div>
          <div><strong>Self-paced lessons</strong><span>The next step waits on the days you are gone.</span></div>
        </div>
      </div>
    </section>
    <section class="band band-ink reveal" id="ask">
      <div class="wrap">
        <p class="kicker">Tuesday</p>
        <h2>See what your person sees on Tuesday.</h2>
        <p class="lede">Not a video library. Not a chatbot. A place where the next step waits.</p>
        <div class="actions">${startFree(true)}</div>
      </div>
    </section>
    <section class="band reveal" id="coaching">
      <div class="wrap coaching-layout">
        <div>
          <h2>Coaching</h2>
          <p class="lede">$300, $600, or $1,500 a month. Every plan includes the portal, the Saturday email, and your knowledge brain.</p>
          <ul class="chips">
            <li>Portal</li>
            <li>Saturday email</li>
            <li>Your knowledge brain</li>
          </ul>
        </div>
        <div class="cols-3" style="grid-template-columns: 1fr;">
          ${tierCards()}
        </div>
      </div>
      <div class="wrap">
        <p>Not ready? Start with one free course or the <a href="/assessment">free assessment</a>.</p>
      </div>
    </section>
    <section class="band band-white reveal" id="close">
      <div class="wrap split">
        <img class="portrait" src="/img/ben.jpg" width="480" height="319" alt="Ben Johnson">
        <div>
          <h2>Ben.</h2>
          <p class="lede">Ben Johnson runs a mid-market sales team, built a sales team from zero, and builds systems so people keep working when he is not in the room. Field School is that system, opened up.</p>
          <p>Ben built Field School for the hours he cannot be there.</p>
          <p><a href="/ben">More on Ben</a></p>
        </div>
      </div>
      <div class="wrap">
        <h2>Questions</h2>
        ${faqBlock()}
      </div>
      <div class="wrap final">
        <img class="final-seal" src="/img/seal.png" width="96" height="95" alt="">
        <div>
          <h2>Start with one free course.</h2>
          <p class="risk">One course is free. No card.</p>
          <div class="actions">
            ${startFree(true)}
            <a class="btn btn-outline" href="${COACHING_MAILTO}">Email Ben</a>
          </div>
          ${saturdayForm("final", "/")}
        </div>
      </div>
    </section>`,
});

const how = page({
  path: "/how-it-works",
  title: "How it works · Field School",
  description: "Field School writes down what your people need to know and puts the next step in front of them. See how a knowledge brain works.",
  current: "/how-it-works",
  body: `<section class="band">
    <div class="wrap">
      <p class="kicker">How it works</p>
      <h1>Write it down once. The next step is always waiting.</h1>
      <p class="lede">Field School writes down what your people need to know and puts the next step in front of them.</p>
      <div class="cols-3">
        <article class="card"><h3>1. Write it down</h3><p>The path, the standard, and the lesson live in the knowledge brain.</p></article>
        <article class="card"><h3>2. AI does the repeat work</h3><p>Give an AI one clear job it can keep doing while you are away.</p></article>
        <article class="card"><h3>3. The next step waits</h3><p>People open the portal and do the next thing. You still make the calls.</p></article>
      </div>
      <div class="cols-3" style="margin-top:1.5rem">
        ${screen("Path", "The next step is named before the week gets loud.", ["Next step"])}
        ${screen("Lesson", "Clip, assignment, and quiz. One task on the screen.", ["Clip", "Assignment", "Quiz"])}
        ${screen("Knowledge brain", "What the team knows, kept when someone is out.", ["Standard"])}
      </div>
      <h2 style="margin-top:2.5rem">Short answers</h2>
      ${faqBlock(FAQ.slice(0, 4))}
      <div class="actions">${startFree(true)}</div>
    </div>
  </section>`,
});

const families = page({
  path: "/families",
  title: "Families · Field School",
  description: "A knowledge brain for your family. They do the next lesson on the days you cannot be there. Homeschool runs as a mode, not a separate product.",
  current: "/families",
  body: `<section class="band">
    <div class="wrap measure">
      <p class="kicker">Families</p>
      <h1>A knowledge brain for your family.</h1>
      <p class="lede">They do the next lesson on the days you cannot be there. Homeschool runs as a mode, not a separate product.</p>
      <p>You set the path. They do the next lesson on Tuesday, even if you are at work. Homeschool? Run the whole year from here.</p>
      <p>Children never get accounts or public profiles. The adult keeps the desk.</p>
      <div class="actions">${startFree(true)} <a class="btn btn-outline" href="/assessment">Take the free assessment</a></div>
    </div>
  </section>`,
});

const teams = page({
  path: "/teams",
  title: "Teams · Field School",
  description: "A knowledge brain for your team. You set the standard. Your people practice it when you are in meetings.",
  current: "/teams",
  body: `<section class="band">
    <div class="wrap measure">
      <p class="kicker">Teams</p>
      <h1>A knowledge brain for your team.</h1>
      <p class="lede">You set the standard. Your people practice it when you are in meetings.</p>
      <p>You set the standard. Your people practice it on the days you are in meetings. What your best people know stays when they leave.</p>
      <p><a href="/teams/services">Three ways to build your team's knowledge brain</a>.</p>
      <div class="actions">${startFree(true)} <a class="btn btn-outline" href="/pricing">See pricing</a></div>
    </div>
  </section>`,
});

const services = page({
  path: "/teams/services",
  title: "Three ways to build your team's knowledge brain · Field School",
  description: "Three ways to build your team's knowledge brain: Do It Yourself, Coaching, and Consulting. Start free, or email Ben.",
  current: "/teams",
  body: `<section class="band">
    <div class="wrap">
      <p class="kicker">Teams</p>
      <h1>Three ways to build your team's knowledge brain.</h1>
      <p class="lede">Field School helps an organization write down what people need to know, and put modern tools to work in the field.</p>
      <div class="cols-3">
        <article class="card" data-offer="diy">
          <h2>Do It Yourself</h2>
          <p>The team uses the platform on its own. One free course is the way in.</p>
          <p>Included: one free course with no card, the platform on your own time, and your knowledge brain built from the work the team already does.</p>
          ${startFree(true)}
        </article>
        <article class="card" data-offer="coaching">
          <h2>Coaching</h2>
          <p>Ben sits with you for an hour, takes in how the work runs, and builds the knowledge brain with you.</p>
          ${COACHING_TIERS.map((tier) => `<h3>${tier.name}. ${tier.price} a month.</h3><p>${tier.line}</p>${coachingButton(tier.key)}`).join("")}
        </article>
        <article class="card" data-offer="consulting">
          <h2>Consulting</h2>
          <p>A local business gets a scoped project to put modern tools into the field and leave a practice the team can run.</p>
          <p>Included: one implementation scoped before the work starts, time with the people who use the tool away from the desk, and a project price set for that scope.</p>
          ${consultingButton()}
        </article>
      </div>
    </div>
  </section>`,
});

const pricing = page({
  path: "/pricing",
  title: "Pricing · Field School",
  description: "Coaching is $300, $600, or $1,500 a month. One course is free. Email Ben to start. No card on the free course.",
  current: "/pricing",
  body: `<section class="band">
    <div class="wrap">
      <p class="kicker">Pricing</p>
      <h1>Coaching</h1>
      <p class="lede">$300, $600, or $1,500 a month. Every plan includes the portal, the Saturday email, and your knowledge brain.</p>
      <p>One course is free. No card.</p>
      <p>A leader buys the same seat. The work is the team's standard, not a different price.</p>
      <p>In person in Dayton is available when you are both there.</p>
      <p>Short on time? One Saturday email a week still keeps your people moving.</p>
      <div class="cols-3">${tierCards()}</div>
      ${individualSlotMarkup()}
      <p>Not ready? Start with one free course or the <a href="/assessment">free assessment</a>.</p>
      <div class="actions">${startFree(true)}</div>
    </div>
  </section>`,
});

const ben = page({
  path: "/ben",
  title: "Ben · Field School",
  description: "Ben Johnson runs mid-market sales at Euna and built Field School for the hours he cannot be there.",
  current: "/ben",
  body: `<section class="band">
    <div class="wrap split">
      <img class="portrait" src="/img/ben.jpg" width="480" height="319" alt="Ben Johnson">
      <div class="measure">
        <p class="kicker">Ben</p>
        <h1>Ben.</h1>
        <p class="lede">Ben Johnson runs a mid-market sales team, built a sales team from zero, and builds systems so people keep working when he is not in the room. Field School is that system, opened up.</p>
        <p>Ben built Field School for the hours he cannot be there.</p>
        <ul class="chips">
          <li>Director of Mid-Market Sales at Euna</li>
          <li>CAE team built at Ministry Brands</li>
        </ul>
        <figure class="quote" style="text-align:left;margin-top:1.5rem">
          <p>It is for people who still have a number, a family, and a week that has to move.</p>
          <footer>Ben, Founder.</footer>
        </figure>
      </div>
    </div>
  </section>`,
});

const principles = page({
  path: "/principles",
  title: "The twelve rules · Field School",
  description: "Twelve rules Field School will not treat as optional, including Reality over hope and Read the room.",
  current: "",
  body: `<section class="band">
    <div class="wrap">
      <p class="kicker">The Twelve</p>
      <h1>Twelve rules</h1>
      <p class="lede">These are the rules Field School will not treat as optional. The courses and the Saturday email use them.</p>
      <div class="rules">
        ${RULES.map(([title, body], index) => `<details id="rule-${index + 1}">
          <summary>${title}</summary>
          <p>${body}</p>
        </details>`).join("")}
      </div>
    </div>
  </section>`,
});

const newsletter = page({
  path: "/newsletter",
  title: "Saturday email · Field School",
  description: "The Saturday email. One note a week your people can use the same week.",
  current: "",
  body: `<section class="band">
    <div class="wrap measure">
      <p class="kicker">Saturday email</p>
      <h1>The Saturday email</h1>
      <p class="lede">One note a week your people can use the same week.</p>
      <p>One email each Saturday. Use it the same week.</p>
      ${saturdayForm("news", "/newsletter")}
      <p><a href="${FREE_COURSE_HREF}">Start free</a> when you want the lessons, not only the note.</p>
    </div>
  </section>`,
});

const assessment = page({
  path: "/assessment",
  title: "Free assessment · Field School",
  description: "Take a free Field School assessment. See the next step, then start the free course. No card.",
  current: "",
  body: `<section class="band">
    <div class="wrap measure">
      <p class="kicker">Assessment</p>
      <h1>See the next step.</h1>
      <p class="lede">Take a free Field School assessment. See the next step, then start the free course. No card.</p>
      <div class="cols-2">
        <article class="card">
          <h2>Skill assessment</h2>
          <p>Name one job you can already do. The result shows on the page.</p>
          <a class="btn btn-primary" href="${SKILL}">Take the free assessment</a>
        </article>
        <article class="card">
          <h2>Intelligence assessment</h2>
          <p>A second free look at how you take in the work.</p>
          <a class="btn btn-outline" href="${INTELLIGENCE}">Start this assessment</a>
        </article>
      </div>
      <div class="actions">${startFree(false)}</div>
    </div>
  </section>`,
});

function legalPage({ path, title, description, kicker, ledeFile, dateFile, mainFile }) {
  return page({
    path,
    title,
    description,
    current: "",
    body: `<section class="band">
      <div class="wrap legal">
        <p class="kicker">${kicker}</p>
        <h1>${title.replace(" · Field School", "")}</h1>
        <p class="lede">${legal(ledeFile)}</p>
        <p class="date">${legal(dateFile)}</p>
        ${legal(mainFile)}
      </div>
    </section>`,
  });
}

const files = {
  "index.html": home,
  "how-it-works.html": how,
  "families.html": families,
  "teams.html": teams,
  "teams/services.html": services,
  "pricing.html": pricing,
  "ben.html": ben,
  "principles.html": principles,
  "newsletter.html": newsletter,
  "assessment.html": assessment,
  "privacy.html": legalPage({
    path: "/privacy",
    title: "Privacy Policy · Field School",
    description:
      "How Field School collects, uses, and stores information on fieldschool.ai and portal.fieldschool.ai.",
    kicker: "Privacy",
    ledeFile: "privacy-lede.html",
    dateFile: "privacy-date.html",
    mainFile: "privacy-main.html",
  }),
  "terms.html": legalPage({
    path: "/terms",
    title: "Terms of Service · Field School",
    description:
      "Terms for using the Field School campus at fieldschool.ai and portal.fieldschool.ai.",
    kicker: "Terms",
    ledeFile: "terms-lede.html",
    dateFile: "terms-date.html",
    mainFile: "terms-main.html",
  }),
};

const retired = ["Learn", "with", "Ben"].join(" ");
const closedRooms = [71, 121, 109, 124, 70, 111, 117, 110, 100, 114, 121, 124, 82, 101, 116, 97, 105, 110, 101, 114]
  .map((code) => String.fromCharCode(code))
  .join("")
  .split("|");
const banned = new RegExp(
  `${retired}|\\u2014|\\b(?:${closedRooms.join("|")})\\b|\\$10(?!\\d)|\\$50(?!\\d)|\\$1,059|plan=10\\b|plan=50\\b|plan=1059\\b|buy\\.stripe\\.com`,
);

for (const [rel, html] of Object.entries(files)) {
  if (banned.test(html)) {
    throw new Error(`Banned copy in ${rel}`);
  }
  const dest = join(site, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
}

for (const stale of [
  "about.html",
  "coaching.html",
  "community.html",
  "founder.html",
  "portal.html",
  "shop.html",
  "tools.html",
  "twelve.html",
]) {
  rmSync(join(site, stale), { force: true });
}

console.log(`wrote ${Object.keys(files).length} pages`);
