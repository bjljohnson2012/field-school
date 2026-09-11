import type { Module, QuizQuestion } from "./types";

export const COURSE_NAME = "Grok Bot vs OpenClaw and Hermes";
export const COURSE_TAGLINE =
	"A bottom-up mini-course on Grok Bot, from one job to a staff that ships while you sleep.";
export const modules: Module[] = [
	{
		slug: "briefing",
		station: "01",
		title: "What this actually is",
		kicker: "Stop thinking ChatGPT. Start thinking staff.",
		durationLabel: "8 min",
		summary: "Grok Bot is not another chat thread. Ray Fernando treats it as named teammates with jobs, a phone-and-desktop iMessage surface, and a cloud computer that keeps working when your laptop is closed.",
		thesis: "The primitive is not 'an AI.' The primitive is a teammate you can text. Everything later in this course compounds from that reframe.",
		bullets: [
			"Cursor (now joined with xAI) shipped Grok Bot as AI teammates you spin up with a persona.",
			"Setup pain from Hermes / OpenClaw — new agents re-signing into Chrome, copying configs — is the thing this product is trying to delete.",
			"Each bot can use your machine and a dedicated cloud computer that stays signed into Gmail, Slack, Notion, Luma, Vercel.",
			"Desktop plus phone. The conversation looks like iMessage and continues when you walk away.",
			"Early access sat on Cursor Ultra (~$200) or SuperGrok Heavy (~$300). Weekly usage is included; extra is token-billed."
		],
		quotes: [{
			text: "It kind of feels like a teammate or like a whole staff working for you.",
			t: "4:27"
		}, {
			text: "You don't have to have your computer open for all the stuff to keep running. It can just keep running on the cloud.",
			t: "4:47"
		}],
		clips: [{
			start: 0,
			end: 140,
			label: "Teammates, not a chatbot",
			why: "The opening pitch: personas, plugins, dual computers, phone + desktop."
		}],
		assignment: {
			title: "Name the work, not the tool",
			brief: "Before you hire a bot, list the work you already hand to a colleague over text. This is the bottom rung. Do not mention models or plugins yet.",
			items: [
				{
					id: "list8",
					label: "Write 8 tasks you currently 'text a colleague' about",
					hint: "Inbox triage, event follow-up, research, status, booking, reporting…",
					required: true
				},
				{
					id: "star3",
					label: "Star 3 that are repetitive, rules-based, and annoying",
					required: true
				},
				{
					id: "outcome",
					label: "For the top one, write the outcome in one sentence (not the steps)",
					required: true
				}
			],
			notesPlaceholder: "e.g. 1) Monday guest list from Luma  2) Follow-up after a sales call  …\nStarred: 1, 4, 7\nOutcome: A dashboard of who is coming and what they want to demo, in my pocket by 9am."
		},
		quiz: [
			{
				id: "q1",
				prompt: "How does Ray frame Grok Bot, versus ChatGPT?",
				choices: [
					"A faster coding model inside Cursor",
					"Named teammates with jobs, not one chat entity",
					"An open-source runtime you host on a Mac Mini",
					"A Slack replacement like Buzz"
				],
				answer: 1,
				why: "The whole video is the shift from one entity / many threads to a staff of personas."
			},
			{
				id: "q2",
				prompt: "What are the two computers?",
				choices: [
					"A Windows VM and a Linux VM",
					"Your local machine and a signed-in cloud computer",
					"Cursor Cloud and GitHub Actions",
					"iPhone and iPad only"
				],
				answer: 1,
				why: "Local plus a data-center desktop that keeps cookies and keeps running."
			},
			{
				id: "q3",
				prompt: "What interface does he compare it to?",
				choices: [
					"Jira",
					"A terminal multiplexer",
					"iMessage",
					"A kanban board"
				],
				answer: 2,
				why: "Desktop and phone both feel like texting a person."
			},
			{
				id: "q4",
				prompt: "In the stream, who typically gets Grok Bot?",
				choices: [
					"Anyone on free Grok",
					"Cursor Pro at $20",
					"Cursor Ultra (~$200) or SuperGrok Heavy (~$300)",
					"Only enterprise SSO seats"
				],
				answer: 2,
				why: "He reads it as Ultra or Super Grok Heavy; Teams/enterprise is a separate conversation."
			}
		]
	},
	{
		slug: "two-computers",
		station: "02",
		title: "The two computers",
		kicker: "Shared logins are the whole product.",
		durationLabel: "10 min",
		summary: "OpenClaw and Hermes make you re-authenticate every agent. Grok Bot keeps one cloud desktop whose cookies are shared, plus a hook into your real machines over Tailscale/SSH.",
		thesis: "If the bot cannot stay signed in, it is a demo. The cloud computer is why Ray can say 'you're already logged into my Luma account' and walk away.",
		bullets: [
			"Old world: every new agent signs into Chrome again and copies config files.",
			"New world: one cloud computer, credentials shared, fresh desktop per session, same cookies.",
			"You can still drive your own hardware — Mac Mini, DGX Spark, laptop — because general staff can SSH over Tailscale.",
			"The cloud box sits in a data center, so computer-use is fast even if your cafe Wi-Fi is not.",
			"Sensitive actions go through auto-review. Enterprise gets DLP, proxies, network controls. Still marked beta."
		],
		quotes: [{
			text: "No matter what agents you spin up, those agents will have access to it.",
			t: "1:23"
		}, {
			text: "The credentials are shared across the different computers and it's the same cloud computer.",
			t: "28:05"
		}],
		clips: [{
			start: 64,
			end: 140,
			label: "Why shared logins matter",
			why: "The Hermes/OpenClaw headache versus one signed-in cloud box."
		}, {
			start: 1662,
			end: 1734,
			label: "Cloud VM + local Tailscale",
			why: "He opens the remote desktop: Gmail already signed in, plus local SSH."
		}],
		assignment: {
			title: "Draw your login map",
			brief: "A bot without logins is a chatbot. List the accounts the cloud computer must already be holding, and what must stay local.",
			items: [
				{
					id: "cloud",
					label: "List 5 accounts the cloud computer should stay signed into",
					required: true
				},
				{
					id: "local",
					label: "List 2 things that should stay on your machine (or not be given to a bot yet)",
					hint: "Banking, production deploy keys, a private OpenClaw database…",
					required: true
				},
				{
					id: "why-cloud",
					label: "Write one sentence: why this job dies if it can only run while your laptop is open",
					required: true
				}
			],
			notesPlaceholder: "Cloud: Gmail, Calendar, Luma, Notion, Vercel\nLocal-only: 1Password, production DB\nWhy cloud: the 7am guest digest has to land while I'm driving."
		},
		quiz: [
			{
				id: "q1",
				prompt: "What setup tax does Ray keep hitting on Hermes / OpenClaw?",
				choices: [
					"They cannot write code",
					"Every new agent re-signs into Chrome and recopies configs",
					"They have no memory",
					"They only run on Windows"
				],
				answer: 1,
				why: "Shared cookies are the unlock he repeats all stream."
			},
			{
				id: "q2",
				prompt: "If he opens a fresh browser on a bot's cloud desktop, what is still true?",
				choices: [
					"It is a brand-new Google account",
					"It is logged out of everything",
					"It is a different browser, same shared credentials",
					"It can only open Cursor"
				],
				answer: 2,
				why: "Fresh desktop, shared cookies."
			},
			{
				id: "q3",
				prompt: "How does general staff reach his OpenClaw on the Mac Mini?",
				choices: [
					"Emailing himself a zip",
					"Tailscale / SSH into the home machines",
					"AirDrop",
					"It cannot; cloud only"
				],
				answer: 1,
				why: "General staff has the tailnet: Spark, Mini, laptop."
			},
			{
				id: "q4",
				prompt: "Where does the cloud computer actually run?",
				choices: [
					"Only as a Chrome tab on his laptop",
					"In a data center, as a real remote desktop",
					"Inside iMessage",
					"On a Raspberry Pi under the desk"
				],
				answer: 1,
				why: "He speed-tests it and treats it as a data-center machine."
			}
		]
	},
	{
		slug: "hire-one",
		station: "03",
		title: "Hire one bot, one job",
		kicker: "Do not start with a fleet.",
		durationLabel: "8 min",
		summary: "The plus button asks what this bot is around for — content, research, ops, or something new — then you fill in the job. One persona. One outcome. Then you connect tools.",
		thesis: "A staff of confused generalists is how Discord OpenClaw goes insane. A named job with a memory is how Grok Bot compounds.",
		bullets: [
			"Hit plus, describe the job, let it propose a shape, then correct it.",
			"Onboarding is multiple-choice plus free text: content, research, ops, or whatever is on your mind.",
			"Matt Schumer's line: an agent for everything, not just code; bots that each have a job and get better as they learn how you work.",
			"You can later add members to a conversation. You do not start there.",
			"Custom plugins are allowed — anything you can do in Cursor plugins, you can install."
		],
		quotes: [{
			text: "All you have to do is hit this little plus and then just describe what you want the bot to do.",
			t: "43:48"
		}, {
			text: "The best way I can describe it is an agent for everything, not just code.",
			t: "32:13"
		}],
		clips: [{
			start: 20,
			end: 83,
			label: "Personas versus setup hell",
			why: "The first minute of why a named bot beats a raw agent runtime."
		}, {
			start: 2628,
			end: 2702,
			label: "The plus button",
			why: "He creates a bot live: what do you want me around for?"
		}],
		assignment: {
			title: "Write the first job description",
			brief: "Take the starred outcome from station 01. Hire exactly one bot. If you need a second bot to make the sentence work, your job is too big.",
			items: [
				{
					id: "name",
					label: "Name the bot like a coworker (not 'Assistant')",
					required: true
				},
				{
					id: "job",
					label: "Five-line job: who they report to, what done looks like, what they must never do",
					required: true
				},
				{
					id: "first-task",
					label: "Write the first message you would actually send them",
					required: true
				}
			],
			notesPlaceholder: "Name: Luma Floor\nJob: Own guest intel for live events. Done = a dashboard + talk shortlist in my pocket. Never: email attendees or charge cards.\nFirst message: You're already in Luma. Pull tonight's RSVPs and tell me who wants a lightning demo."
		},
		quiz: [
			{
				id: "q1",
				prompt: "How do you start a new Grok Bot in the video?",
				choices: [
					"Clone a GitHub template and SSH in",
					"Hit plus and describe the job",
					"Invite it from Slack",
					"Buy a Mac Mini"
				],
				answer: 1,
				why: "The plus button is the entire onboarding."
			},
			{
				id: "q2",
				prompt: "What does the new bot ask first?",
				choices: [
					"For your credit card CVV",
					"What it is around for — content, research, ops, or something new",
					"Which Vim colorscheme you use",
					"To disable privacy mode"
				],
				answer: 1,
				why: "He shows the multiple-choice kickoff."
			},
			{
				id: "q3",
				prompt: "Why start with one bot, not five?",
				choices: [
					"The product only allows one",
					"A named job compounds; a pile of generalists thrashes",
					"Phone notifications have a cap of one",
					"Cursor Ultra forbids multiplayer"
				],
				answer: 1,
				why: "He contrasts refined staff chat with Discord agents going crazy."
			},
			{
				id: "q4",
				prompt: "Can you install custom plugins?",
				choices: [
					"No, marketplace only",
					"Yes — same plugin surface as Cursor, on your dedicated machine",
					"Only if they are written in Rust",
					"Only Gmail"
				],
				answer: 1,
				why: "He answers a live-chat question: custom plugins, dedicated cloud + local."
			}
		]
	},
	{
		slug: "plugins",
		station: "04",
		title: "Plugins and MCP",
		kicker: "This is how it touches the business.",
		durationLabel: "9 min",
		summary: "Plugins are the business layer: Gmail, Calendar, Slack, Notion, Vercel, plus any MCP you can teach it to find. Ray's Withings scale was not in the catalog — the bot found the MCP and logged in through the browser.",
		thesis: "A teammate with no connectors is a diary. Connect the minimum tools that make the job real, then stop. More plugins is not more power if the job is still vague.",
		bullets: [
			"Open plugins at the bottom of the UI. Connect, or build your own.",
			"Vercel is how 'make me a dashboard / make me an app' left the chat and became a URL.",
			"MCP is the unlock for long-running personal systems (health, CRM, internal tools).",
			"If a server is not listed, the bot can still hunt, then authenticate with computer use.",
			"You can attach multiple accounts through the same MCP / same computer."
		],
		quotes: [{
			text: "These plugins are going to be the power for how it actually will connect to your business.",
			t: "5:14"
		}, {
			text: "The actual Grok Bot found that there actually is a Withings Health Coach MCP and they connected it for me.",
			t: "9:28"
		}],
		clips: [{
			start: 314,
			end: 355,
			label: "Plugins as the business layer",
			why: "Gmail, meetings, Slack, Notion — then Vercel as the ship button."
		}, {
			start: 568,
			end: 612,
			label: "MCP that was not in the catalog",
			why: "Withings: search, discover MCP, browser login, then it just pulls data."
		}],
		assignment: {
			title: "Three plugins, one failure mode",
			brief: "Give your first bot only three connectors. If the job still needs six, the job is too big — go back to station 03.",
			items: [
				{
					id: "three",
					label: "Name 3 plugins / MCPs this bot is allowed to use",
					required: true
				},
				{
					id: "missing",
					label: "Write the failure if plugin #1 is missing",
					required: true
				},
				{
					id: "accounts",
					label: "Split personal vs business accounts — which identity does this bot wear?",
					required: true
				}
			],
			notesPlaceholder: "Plugins: Luma, Vercel, Notion\nIf no Luma: it invents a guest list and we look stupid at the door.\nIdentity: business Google only. Personal Gmail stays off this bot."
		},
		quiz: [
			{
				id: "q1",
				prompt: "What does Ray say will actually connect Grok Bot to a business?",
				choices: [
					"A bigger context window",
					"Plugins / connectors",
					"Training on company PDFs overnight",
					"A human intern copying outputs"
				],
				answer: 1,
				why: "He points at the plugins tray as the power."
			},
			{
				id: "q2",
				prompt: "How did he get a dashboard out of Luma responses?",
				choices: [
					"He pasted a CSV into ChatGPT",
					"The bot was in Luma, then shipped a page because Vercel was connected",
					"He hired a contractor on Fiverr",
					"Airtable automations"
				],
				answer: 1,
				why: "Computer use plus Vercel is the compound move."
			},
			{
				id: "q3",
				prompt: "What happened with Withings?",
				choices: [
					"It was a featured plugin on the home screen",
					"Not listed; the bot found an MCP and authenticated in the browser",
					"He wrote a REST client by hand",
					"It is not possible"
				],
				answer: 1,
				why: "Search → MCP → browser login → pull."
			},
			{
				id: "q4",
				prompt: "Can two Grok Bots auth to different Google accounts?",
				choices: [
					"No, one Google identity per workspace",
					"Yes — plugins are shared and you can auth different accounts, including via MCP",
					"Only with a second Ultra subscription",
					"Only if they never talk"
				],
				answer: 1,
				why: "He confirms personal vs business split in Q&A."
			}
		]
	},
	{
		slug: "teach-task",
		station: "05",
		title: "Teach task",
		kicker: "Record it once. Never click it again.",
		durationLabel: "8 min",
		summary: "Teach Task records you clicking a workflow on the cloud computer and turns it into a skill file. Ray used it for admin forms and a parking ticket: photo in, fields filled, he only paid.",
		thesis: "If a human already knows the click path, do not prompt it in prose. Demonstrate it. This is the bottom of the automation stack — beneath routines, beneath staff chat.",
		bullets: [
			"Open the cloud computer → Teach Task → click the path → save a skill.",
			"Best fit: the same admin form, the same portal, the same exception process.",
			"Ticket Snagger: picture of a parking ticket, bot fills the city form, human enters the card at the end.",
			"This is the conversation he wants to have with local businesses: record the morning report, then stop paying a person to click it.",
			"Codex and Claude can record too; Grok Bot's difference is the named entity that keeps the skill in a chat."
		],
		quotes: [{
			text: "Literally just hit this record button, hit teach task, do it, and then it'll make a little skill file for you.",
			t: "17:35"
		}, {
			text: "Here's the picture of the ticket. Can you just go fill in the details?",
			t: "18:00"
		}],
		clips: [{
			start: 1033,
			end: 1096,
			label: "Teach Task + Ticket Snagger",
			why: "Record a session, get a skill file, reuse it on the next client or ticket."
		}, {
			start: 3790,
			end: 3806,
			label: "The button on the computer",
			why: "He points at Teach Task on the remote desktop."
		}],
		assignment: {
			title: "Storyboard a five-click skill",
			brief: "Pick one weekly click-path. You do not need Grok Bot yet. Write the recording script so clearly a stranger could perform it.",
			items: [
				{
					id: "path",
					label: "Name the workflow and the site/app it lives in",
					required: true
				},
				{
					id: "steps",
					label: "Write 5 numbered clicks, including the URL you start on",
					required: true
				},
				{
					id: "human",
					label: "Mark the one step a human must still do (pay, approve, send)",
					required: true
				}
			],
			notesPlaceholder: "Workflow: city parking ticket pay portal\n1) Open pay.city.gov  2) Upload photo  3) OCR plate  4) Confirm amount  5) Stop before card form\nHuman: last four of card + submit."
		},
		quiz: [
			{
				id: "q1",
				prompt: "What does Teach Task produce?",
				choices: [
					"A Zoom recording for your manager",
					"A skill file the bot can repeat",
					"A legal contract",
					"A Chrome extension you publish"
				],
				answer: 1,
				why: "Record → skill file → 'do this for the next client.'"
			},
			{
				id: "q2",
				prompt: "What was Ticket Snagger?",
				choices: [
					"A concert-ticket scalper",
					"A parking ticket: photo in, form filled, human pays at the end",
					"A Linear issue template",
					"A Gmail filter"
				],
				answer: 1,
				why: "Computer use plus a human in the loop for money."
			},
			{
				id: "q3",
				prompt: "Who is Teach Task for, in Ray's pitch to local businesses?",
				choices: [
					"Only staff engineers",
					"Anyone repeating the same admin click-path every morning",
					"Only people with a DGX Spark",
					"People who refuse to sign into Gmail"
				],
				answer: 1,
				why: "Record the admin job, then send that person after bigger work."
			},
			{
				id: "q4",
				prompt: "What should you still not fully automate in his ticket example?",
				choices: [
					"Reading the ticket number",
					"The final payment / credential step",
					"Opening the website",
					"Taking the photo"
				],
				answer: 1,
				why: "He fills details, then he enters the card."
			}
		]
	},
	{
		slug: "routines",
		station: "06",
		title: "Routines",
		kicker: "The bot wakes up. You do not.",
		durationLabel: "10 min",
		summary: "Routines are per-bot schedules: check the scale by 9, nag if missing, Sunday recomp review. Ray did not write the instructions — the agent did. You can also just ask the chat to create the trigger.",
		thesis: "A taught skill that only runs when you remember is still a chore. Routines are how the staff gets a circadian rhythm.",
		bullets: [
			"Sidebar computer icon → plus, or just tell the bot to create it.",
			"Name, what it should do, when to run. Can Slack you, touch Git, update Linear.",
			"Health example: 9am weigh-in check, noon recheck, Sunday review of food + numbers.",
			"Tied to the conversation / bot, not a global cron UI you maintain by hand.",
			"Triggers can also be event-like: spec update, Sentry, PagerDuty, new Linear issue."
		],
		quotes: [{
			text: "I did not write these instructions. The agent did it itself.",
			t: "11:38"
		}, {
			text: "If I haven't, by nine o'clock it's going to recheck and then send me a message saying, hey Ray, you haven't weighed in yet.",
			t: "11:07"
		}],
		clips: [{
			start: 612,
			end: 698,
			label: "Morning weigh-in + Sunday review",
			why: "The health routines, written by the bot, running on a schedule."
		}, {
			start: 1593,
			end: 1638,
			label: "Routines per bot, created in chat",
			why: "How routines interact with Grok Bots: talk it into existence."
		}],
		assignment: {
			title: "One routine, one nag, one review",
			brief: "Schedule the skill from station 05. A routine without a success check is just a notification you will mute.",
			items: [
				{
					id: "cron",
					label: "Write: name, when, what it does, what 'done' looks like",
					required: true
				},
				{
					id: "nag",
					label: "Write the exact phone message if it fails",
					required: true
				},
				{
					id: "review",
					label: "Write a weekly review trigger that reads memory, not just the last run",
					required: true
				}
			],
			notesPlaceholder: "Name: Door list  When: 7:00 local  Does: pull Luma RSVPs, publish dashboard  Done: URL in my pocket\nNag: 'Ray — 42 RSVPs, dashboard is stale, Luma login died.'\nSunday: summarize no-shows vs lightning-talk demand."
		},
		quiz: [
			{
				id: "q1",
				prompt: "What is a routine in Grok Bot?",
				choices: [
					"A gym program",
					"A scheduled wake-up that runs a job for that bot",
					"A Cursor rules file",
					"A Slack huddle"
				],
				answer: 1,
				why: "Schedule + job + that conversation's bot."
			},
			{
				id: "q2",
				prompt: "Who wrote Ray's recomp review instructions?",
				choices: [
					"Lauren from Cursor",
					"The agent itself",
					"A Notion template he bought",
					"OpenAI"
				],
				answer: 1,
				why: "He is explicit: he did not write them."
			},
			{
				id: "q3",
				prompt: "How are routines scoped?",
				choices: [
					"One global cron for the whole workspace",
					"Per Grok Bot / conversation",
					"Per GitHub repo only",
					"Only on the phone"
				],
				answer: 1,
				why: "Q&A: routines are per the Grok Bot."
			},
			{
				id: "q4",
				prompt: "Besides a clock, what else can trigger work?",
				choices: [
					"Nothing — clock only",
					"Things like spec updates, Linear/Sentry, PagerDuty — described in chat",
					"Only incoming SMS",
					"Only Git push hooks you write in bash"
				],
				answer: 1,
				why: "He tells people to just explain the trigger in the conversation."
			}
		]
	},
	{
		slug: "staff-chat",
		station: "07",
		title: "A staff in one thread",
		kicker: "They talk. You leave.",
		durationLabel: "12 min",
		summary: "General staff, researcher, and Max Recomp sit in one chat and argue a widget into existence using a week of health memory. The same thread lives on the phone. That is the difference from Discord agents going feral.",
		thesis: "Multi-bot is not 'more tokens.' It is specialists with permission to correct each other against a shared memory, on a surface you already check.",
		bullets: [
			"Summon multiple bots into one conversation. They keep their jobs.",
			"Recomp bot is not technical but knows Ray's targets, so it dictates glance-able widget fields.",
			"Researcher names platform constraints (iOS widget = glance, no camera).",
			"General staff holds the machines and the source of truth.",
			"Phone parity is the feature people underestimate — you are not tied to the desk."
		],
		quotes: [{
			text: "I don't have to be in this conversation. I'm just handing it off.",
			t: "12:44"
		}, {
			text: "I've seen so many people struggle just getting them talking to each other in Discord… they just kind of go crazy.",
			t: "13:18"
		}],
		clips: [{
			start: 408,
			end: 781,
			label: "Three bots, one widget",
			why: "Staff + researcher + recomp negotiate an iOS glance widget from memory."
		}, {
			start: 798,
			end: 840,
			label: "The same chat on the phone",
			why: "He taps the thread on iOS and it just continues."
		}],
		assignment: {
			title: "Design a three-bot argument",
			brief: "Add two specialists beside your first bot. Give each a lane and a veto. If they all have the same job, you built a committee.",
			items: [
				{
					id: "three-bots",
					label: "Name 3 bots and one sentence each on what they uniquely know",
					required: true
				},
				{
					id: "handoff",
					label: "Write the message you send, then the room you leave",
					required: true
				},
				{
					id: "veto",
					label: "Give one bot a veto (e.g. health bot blocks calorie-blind UI)",
					required: true
				}
			],
			notesPlaceholder: "Luma Floor — guest intel\nResearcher — iOS / web constraints\nRecomp — what Ray will actually glance at\nHandoff: 'Design a door-list widget. I want glance + website. I'm leaving.'\nVeto: Recomp can kill any field that needs a keyboard."
		},
		quiz: [
			{
				id: "q1",
				prompt: "Which three bots share the widget chat?",
				choices: [
					"CEO, CFO, intern",
					"General staff, researcher, recomp / health",
					"Grok, Claude, GPT",
					"Luma, Vercel, Clerk"
				],
				answer: 1,
				why: "He summons those three by name."
			},
			{
				id: "q2",
				prompt: "What does the recomp bot contribute that the others cannot?",
				choices: [
					"A Kubernetes manifest",
					"Ray's actual health requirements from a week of conversation",
					"App Store screenshots",
					"A legal disclaimer"
				],
				answer: 1,
				why: "Calories left, last meal, day type — from memory, not from a spec."
			},
			{
				id: "q3",
				prompt: "Why does he say this beats his OpenClaw Discord setup?",
				choices: [
					"It is free",
					"Refined multi-bot chat plus the same thread on the phone",
					"It cannot access the internet",
					"It only writes Python"
				],
				answer: 1,
				why: "Polish + phone, versus agents going insane in Discord."
			},
			{
				id: "q4",
				prompt: "Do you have to stay in the thread while they work?",
				choices: [
					"Yes, or they halt",
					"No — he hands it off and they keep talking",
					"Only on desktop",
					"Only if potato mode is on"
				],
				answer: 1,
				why: "'I don't have to be in this conversation.'"
			}
		]
	},
	{
		slug: "ship-from-chat",
		station: "08",
		title: "Ship from the chat",
		kicker: "Spreadsheet → dashboard → live app.",
		durationLabel: "14 min",
		summary: "The Luma coordinator reads 187 RSVPs, finds 32 lightning-talk hopefuls, builds a dashboard, then — when eight slots are not enough — spins a QR app on Next.js, Convex, and Clerk via a Cursor cloud agent. Ray never opened the Cursor site.",
		thesis: "Computer use gathers the facts. Plugins ship the artifact. P-Stack is how the artifact is not slop. That chain is the product.",
		bullets: [
			"Cloud computer is already in Luma: it writes event copy and guest questions.",
			"Responses arrive as a giant spreadsheet — perfect bot work.",
			"Dashboard first. App only when the dashboard proves you have a new problem (32 speakers, 8 slots, no pitch decks).",
			"Handoff: 'open in Cursor' → cloud agent (he mentions Opus) → merge to main with P-Stack.",
			"He still has to paste Convex/Clerk keys. The human remaining work is credentials, not scaffolding."
		],
		quotes: [{
			text: "I never even looked at it. I just P-stacked it.",
			t: "52:41"
		}, {
			text: "From the Grok Bot it spins up in Cursor Cloud, does all the work for me.",
			t: "55:19"
		}],
		clips: [{
			start: 140,
			end: 390,
			label: "Luma night: guests to dashboard to app",
			why: "The first telling of the event coordinator loop."
		}, {
			start: 3202,
			end: 3398,
			label: "The same story with the PR on the phone",
			why: "He retraces it: cloud agent, merge, QR at the door, phone thread."
		}],
		assignment: {
			title: "Spec a ship-from-chat app",
			brief: "Do not open an editor. Write the smallest app your bot is allowed to emit after it has seen real data. Scope is a weapon.",
			items: [
				{
					id: "user",
					label: "Who scans / visits, and what they must not be able to do",
					required: true
				},
				{
					id: "data",
					label: "Where the source data already lives (the bot must already be logged in)",
					required: true
				},
				{
					id: "stack",
					label: "Name host, database, auth — or explicitly say 'static page'",
					required: true
				},
				{
					id: "refuse",
					label: "Write three things you refuse to build in v0 (slide decks, payments, etc.)",
					required: true
				}
			],
			notesPlaceholder: "User: attendees, QR, no pitch decks, no file uploads\nData: Luma guest questions\nStack: Next on Vercel, Convex, Clerk\nRefuse: marketing site, payments, speaker CRM, iOS native."
		},
		quiz: [
			{
				id: "q1",
				prompt: "About how many people had signed up for the Convex HQ event?",
				choices: [
					"12",
					"32",
					"187",
					"1,000"
				],
				answer: 2,
				why: "187 signed up; 32 wanted lightning rounds."
			},
			{
				id: "q2",
				prompt: "Why did a dashboard turn into an app?",
				choices: [
					"He needed ads",
					"Too many lightning-talk hopefuls; he wanted QR applications, real demos, no pitch decks",
					"Luma went down",
					"Vercel was having a hackathon"
				],
				answer: 1,
				why: "Filter at the door, not another spreadsheet."
			},
			{
				id: "q3",
				prompt: "What stack did the bot reach for?",
				choices: [
					"Rails + Heroku + Devise",
					"Next.js on Vercel, Convex, Clerk",
					"PHP + FTP",
					"Only a Google Sheet"
				],
				answer: 1,
				why: "He says it twice, hours apart."
			},
			{
				id: "q4",
				prompt: "What did Ray still have to do himself?",
				choices: [
					"Write every React component",
					"Paste credentials / keys after the agent merged",
					"Drive to Vercel HQ",
					"Re-sign into Chrome for each agent"
				],
				answer: 1,
				why: "Scaffold and PR were handed off; secrets stayed human."
			}
		]
	},
	{
		slug: "potato",
		station: "09",
		title: "Potato mode",
		kicker: "Go deep first. Then go parallel.",
		durationLabel: "12 min",
		summary: "Lauren's P-Stack (slash potato) is how Ray turns a night into 25 commits instead of slop. Fearless parallelism, a written design handoff, and a second model to verify. Grok for speed, GPT-Sol to check, Composer when you need the cheap fast loop.",
		thesis: "Cloud agents without a quality bar are a team of 20 slop artists. Potato is the quality harness you hand the staff when you say goodnight.",
		bullets: [
			"Install P-Stack as a Cursor plugin, run setup, then `/potato mode`.",
			"Lauren's line: throughput without quality is not the goal; go deep first.",
			"Ray's example: 'potato mode, I'm going to bed, follow the redesign doc.' Four hours, ~25 commits, checks, dark mode, collapse UI.",
			"He burned 12.5B tokens in 30 days after getting potato-pilled. Lauren is on another planet (100k agents / month).",
			"Trio: Grok, GPT-Sol as verifier, Composer 2.5 for speed. Kimi for UI taste."
		],
		quotes: [{
			text: "Throughput without quality is not a goal I aspire to. If you want to go fast, go deep first.",
			t: "23:12"
		}, {
			text: "I said potato mode, I'm going to bed. Please follow the doc design handoff for the redesign and peace out.",
			t: "23:51"
		}],
		clips: [{
			start: 1317,
			end: 1543,
			label: "What P-Stack is",
			why: "Lauren, fearless parallelism, the overnight redesign."
		}, {
			start: 2972,
			end: 3063,
			label: "The god-mode trio",
			why: "Token burn, Grok + Sol verify + Composer, then Kimi for UI."
		}],
		assignment: {
			title: "Write the goodnight brief",
			brief: "Potato without a design handoff is how you wake up to a different product. Write the brief as if you will not look at a screen for eight hours.",
			items: [
				{
					id: "doc",
					label: "Point at a source of truth (doc, Figma, this course's ship spec)",
					required: true
				},
				{
					id: "bar",
					label: "Write a quality bar in 4 bullets (tests, visual, what slop looks like)",
					required: true
				},
				{
					id: "verify",
					label: "Name who verifies (second model, checklist, you in the morning)",
					required: true
				}
			],
			notesPlaceholder: "Follow desk.md + the QR app spec. Do not add marketing pages.\nBar: typecheck, one happy-path, no pitch-deck upload, mobile 390.\nVerify: Sol on the PR; I only review the QR flow at 8am."
		},
		quiz: [
			{
				id: "q1",
				prompt: "Who made P-Stack / potato mode?",
				choices: [
					"Ray Fernando",
					"Lauren (Cursor) — same skills she uses to ship there",
					"The OpenClaw Discord",
					"Elon"
				],
				answer: 1,
				why: "He spends several minutes on her post and React-compiler bona fides."
			},
			{
				id: "q2",
				prompt: "What is potato's stated enemy?",
				choices: [
					"Slow laptops",
					"Throughput without quality — a team of slop artists",
					"Closed-source models",
					"Mobile Safari"
				],
				answer: 1,
				why: "Go deep first, then parallel."
			},
			{
				id: "q3",
				prompt: "What happened when he went to bed on potato?",
				choices: [
					"Nothing — it waited for input",
					"It ran ~4 hours, planned, ~25 commits, tests, a real redesign",
					"It deleted the repo",
					"It only wrote a README"
				],
				answer: 1,
				why: "Clipping app: from slop to something he would actually show."
			},
			{
				id: "q4",
				prompt: "What is his 'trio' for getting work done?",
				choices: [
					"Photoshop, Figma, Keynote",
					"Grok for the work, GPT-Sol to verify, Composer for speed",
					"Only Opus 4.6 forever",
					"Local Llama and a printer"
				],
				answer: 1,
				why: "He puts it on a slide in words: god-mode trio, plus Kimi for UI."
			}
		]
	},
	{
		slug: "business-fleet",
		station: "10",
		title: "Run it as a business",
		kicker: "Two hundred dollars versus forty hours of clicking.",
		durationLabel: "12 min",
		summary: "Eric's use-case list is the exam: screen a thousand applicants, watch a competitor's pricing page, rebuild a CRM, turn a demo into a clip library. Ray's bet is that Grok Bot is finally something you can sit down with a local business and record their morning.",
		thesis: "The stack is complete only when a non-engineer can receive a phone message and trust it. That is the ChatGPT moment he is calling — not another IDE feature.",
		bullets: [
			"Use cases: meetings, SQL/copy, multi-bot GM, chief of staff router, custom CRM, community ops, ICP screening, recruiting, sales decks, Notion fact-base, LinkedIn digest, ads, competitor prices, voice follow-ups, 'what did we promise this customer.'",
			"EXA monitors (not Firecrawl) power his macro brief: dedupe, cache, cheap, structured — OpenClaw used to drive it, Grok Bot is inheriting it.",
			"Pricing frame: collapse Claude + Codex + hardware OpenClaw into one Ultra if the work is this shape. Keep Codex if you are a token furnace for code.",
			"Privacy: Cursor SSO / privacy mode, encrypted cloud computer, training opt-out, auto-review on sensitive actions.",
			"He would not call any internet-connected agent perfectly safe. Sandbox ≠ safe. That is why it is still beta."
		],
		quotes: [{
			text: "Don't spend 40 hours a week clicking and filling out these forms. I want you to figure out how to automate that.",
			t: "1:01:39"
		}, {
			text: "This is the moment where they're going to start to get much more wider adoption.",
			t: "1:11:05"
		}],
		clips: [{
			start: 1801,
			end: 1918,
			label: "A hundred use cases",
			why: "Eric's list — this is the business exam."
		}, {
			start: 3557,
			end: 3717,
			label: "The $200 argument",
			why: "Collapse tools, record the admin job, send humans after better work."
		}],
		assignment: {
			title: "Pick one use case you will actually run",
			brief: "Score three items from Eric's list. Ship none of them in this box. Choose one for the next 14 days and write the kill criteria.",
			items: [
				{
					id: "score",
					label: "Score 3 use cases: hours saved / week, blast radius if it is wrong, need for human approve",
					required: true
				},
				{
					id: "pick",
					label: "Pick one. Write the 14-day plan in 5 lines",
					required: true
				},
				{
					id: "kill",
					label: "Write the kill switch: what error means we unplug the routine",
					required: true
				}
			],
			notesPlaceholder: "1) Door-list dashboard — 4h, low blast, no send\n2) Applicant ICP screen — 8h, high blast, must approve\n3) Competitor price watch — 1h, medium, Slack-only\nPick: #1 this month.\nKill: if it emails an attendee or publishes PII."
		},
		quiz: [
			{
				id: "q1",
				prompt: "Which of these is on Eric's list as Ray reads it?",
				choices: [
					"Train a 70B model from scratch",
					"Screen a thousand event applicants against an ICP and batch-approve the fits",
					"Replace the App Store review team",
					"Mine Bitcoin on the cloud computer"
				],
				answer: 1,
				why: "Computer use plus a rubric, while you sleep."
			},
			{
				id: "q2",
				prompt: "How does Ray justify $200/month to a business owner?",
				choices: [
					"It is cheaper than electricity",
					"Compare it to hours of clicking / a hire — record the task, send the human after better work",
					"You get a free Mac Mini",
					"It includes Claude Max and Codex"
				],
				answer: 1,
				why: "The whole close of the stream is this ROI reframe."
			},
			{
				id: "q3",
				prompt: "Why does he prefer EXA monitors for the macro brief?",
				choices: [
					"They have a prettier logo",
					"Speed, structured output, dedupe/cache so you pay when results change",
					"They replace the need for a bot",
					"They are built into iMessage"
				],
				answer: 1,
				why: "Firecrawl made him spend tokens cleaning duplicates and junk SEO."
			},
			{
				id: "q4",
				prompt: "What is his honest line on security?",
				choices: [
					"The cloud computer cannot be attacked",
					"Sandbox and review exist, but he would not guarantee safety for any agent on the internet — hence beta",
					"Only OpenClaw is unsafe",
					"Privacy mode is illegal"
				],
				answer: 1,
				why: "He flags it as the question he wants the team to answer more clearly."
			}
		]
	}
];
export const examQuestions: QuizQuestion[] = [
	{
		id: "e1",
		prompt: "The primitive Grok Bot wants you to feel is…",
		choices: [
			"A bigger prompt box",
			"A named teammate you can text, with a computer",
			"An IDE theme",
			"A local LLM in a terminal"
		],
		answer: 1,
		why: "iMessage-shaped staff, not ChatGPT-shaped threads."
	},
	{
		id: "e2",
		prompt: "Shared cookies on the cloud computer mainly save you from…",
		choices: [
			"Paying for tokens",
			"Re-signing every new agent into Chrome",
			"Writing SQL",
			"Using a phone"
		],
		answer: 1,
		why: "The OpenClaw/Hermes tax."
	},
	{
		id: "e3",
		prompt: "Correct first hire?",
		choices: [
			"Twelve bots on day one",
			"One bot, one job, one first message",
			"A bot with no job so it can 'be creative'",
			"Only a coding agent"
		],
		answer: 1,
		why: "Stations 03–04."
	},
	{
		id: "e4",
		prompt: "MCP showed up in the stream as…",
		choices: [
			"A music format",
			"A way to attach tools (even unlisted ones) after a browser login",
			"A Cursor competitor",
			"An iOS widget kit"
		],
		answer: 1,
		why: "Withings."
	},
	{
		id: "e5",
		prompt: "Teach Task is the right move when…",
		choices: [
			"You need a brand-new product strategy",
			"The click path already exists and repeats",
			"You want to train a foundation model",
			"You refuse to give any login"
		],
		answer: 1,
		why: "Record once, skill file, next client."
	},
	{
		id: "e6",
		prompt: "A routine without a success check is…",
		choices: [
			"A certified system",
			"A notification you will mute",
			"Required by Cursor Ultra",
			"The same as Teach Task"
		],
		answer: 1,
		why: "Station 06 assignment."
	},
	{
		id: "e7",
		prompt: "Multi-bot chat pays off when…",
		choices: [
			"Every bot has the same prompt",
			"Specialists hold different memory and may veto each other",
			"You @everyone in Discord",
			"You turn off the phone"
		],
		answer: 1,
		why: "Recomp vs researcher vs staff."
	},
	{
		id: "e8",
		prompt: "In the Luma story, what was the human leftover?",
		choices: [
			"Writing the React queries",
			"Credentials after the cloud agent merged",
			"Designing the lightning-talk rubric in Figma by hand",
			"Manually emailing 187 people"
		],
		answer: 1,
		why: "Keys, not scaffolding."
	},
	{
		id: "e9",
		prompt: "Potato mode's job is to…",
		choices: [
			"Maximize lines of code",
			"Run parallel agents against a quality bar and a written handoff",
			"Replace code review forever",
			"Mine potatoes"
		],
		answer: 1,
		why: "Lauren: go deep first."
	},
	{
		id: "e10",
		prompt: "The business close is…",
		choices: [
			"Buy every AI sub at once",
			"Record the admin work, put $200 against hours/hire, keep a human on send/pay/approve",
			"Fire everyone this week",
			"Wait for Grok 5 before doing anything"
		],
		answer: 1,
		why: "The last twenty minutes."
	}
];
export function getModule(slug: string) {
	return modules.find((m) => m.slug === slug);
}
export function moduleIndex(slug: string) {
	return modules.findIndex((m) => m.slug === slug);
}
export const emptyProgress = (): import("./types").ModuleProgress => ({
	watched: false,
	assignment: {},
	notes: "",
	quizScore: null,
	quizPassed: false,
	passed: false
});
export function requiredAssignmentComplete(mod: Module, assignment: Record<string, boolean>) {
	return mod.assignment.items.filter((i) => i.required).every((i) => assignment[i.id]);
}
export function computePassed(mod: Module, p: import("./types").ModuleProgress) {
	return p.watched && p.quizPassed && requiredAssignmentComplete(mod, p.assignment);
}
export function passingScore(total: number, ratio = 0.75) {
	return Math.ceil(total * ratio);
}
export function allStationsPassed(map: import("./types").ProgressMap, list: Module[] = modules) {
  return list.every((m) => map[m.slug]?.passed);
}
