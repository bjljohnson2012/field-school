# Field School course MCP server

A small [Model Context Protocol](https://modelcontextprotocol.io) server that lets an
agent (Cursor, Grok, etc.) **create and update courses via the standard schema** —
the same shape the site renders — so course building is consistent and scriptable.

It talks directly to the app's Postgres, so anything an agent writes shows up on the
site immediately (drafts until you publish).

## Tools

| Tool | What it does |
| --- | --- |
| `get_course_schema` | Returns the standard course JSON schema. Call this first. |
| `list_courses` | All courses (slug, title, published, banner style, station count). |
| `get_course` | One full course by slug, in the standard schema. |
| `upsert_course` | Create or update a course (matched by `slug`) from the standard schema. |
| `set_course_published` | Publish / unpublish a course. |
| `delete_course` | Delete a course and its stations/exam. |

## Standard course schema

`upsert_course` accepts `{ course: <Course> }`. Minimal example:

```json
{
  "course": {
    "slug": "prompt-basics",
    "title": "Prompt Basics",
    "tagline": "Write prompts that work",
    "videoUrl": "https://www.youtube.com/watch?v=sAoTrUijP4g",
    "bannerStyle": "gradient",
    "bannerColor": "#4f46e5",
    "published": false,
    "modules": [
      {
        "slug": "station-1",
        "title": "Name the job",
        "durationLabel": "6 min",
        "summary": "Say what you want done.",
        "bullets": ["Be specific", "Give examples"],
        "clips": [{ "start": 0, "end": 90, "label": "Intro", "why": "Sets it up" }],
        "quiz": [
          { "prompt": "Best prompt?", "choices": ["Vague", "Specific"], "answer": 1, "why": "Specific wins" }
        ]
      }
    ],
    "examQuestions": [
      { "prompt": "Prompts should be…", "choices": ["Vague", "Specific"], "answer": 1, "why": "" }
    ]
  }
}
```

Notes:
- `slug` is optional on create (derived from `title`) but **required to update** an existing course.
- Keep **module `slug`s stable** across updates so student progress is preserved.
- `answer` is the 0-based index of the correct choice; `choices` is 2–6 strings.
- `videoUrl` accepts a full YouTube URL or an 11-character video id.

Fields with defaults can be omitted. Call `get_course_schema` for the full field list.

## Run it

The server needs `DATABASE_URL` pointing at the **same Postgres the app uses** (so edits
land on the live site):

```bash
DATABASE_URL='postgres://user:pass@host:5432/db' npm run mcp
# or: DATABASE_URL='…' node mcp/index.mjs
```

It speaks MCP over stdio.

## Connect it to Cursor

Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (this repo):

```json
{
  "mcpServers": {
    "field-school-courses": {
      "command": "node",
      "args": ["/absolute/path/to/field-school/mcp/index.mjs"],
      "env": { "DATABASE_URL": "postgres://user:pass@host:5432/db" }
    }
  }
}
```

Then, in a chat, ask the agent to "create a course …" and it will call `get_course_schema`
and `upsert_course`. Any MCP-capable client (Grok, Claude Desktop, etc.) uses the same
`command` / `args` / `env` shape.

> Tip: point `DATABASE_URL` at a staging database first if you want the agent to draft
> courses without touching production. Courses stay unpublished until `set_course_published`.
