# Extract

N12. Team room. Serves C7 Dev and C6 Ops.

When I am accountable for people's development and for the organization's success, and I cannot sit with them every hour, I invest in Field School so each person keeps moving on a path fit to who they are now, they get better, the organization gets better, and the learning actually takes.

The hirer is the leader (the User). The person in development is a teammate. The teammate is not the buyer and does not own the path. This worker does not create a child login. Household is a different ticket.

A leader can leave the room and the path still has units to cite. Each unit carries `source_unit_id`. A later quiz item that omits `source_unit_id` does not persist.

Launch stays CLOSED. Count stays 0/8.

## What it does

`extract_units` accepts one message and returns units shaped `{id, title, source_unit_id}`.

Inputs:

- `kind: "text"` with `text`. Blank lines split units. The same rule as supplied text in the composer. The worker does not fetch a URL.
- `kind: "stt"` with `text`. The speech-to-text transcript is already text. This package does not take audio.
- `kind: "pdf"` with `pdf_path`. A local PDF file. Text showing operators become lines. A vertical gap of 18 points or more becomes the blank line that splits a unit. A scanned page with no text operators returns no units.

`source_unit_id` equals `id`. The extracted unit is the source.

`org_id` and `membership_id` are required. Units are for that org. `membership_id` is the leader who asked. It is not copied onto the unit.

No Django. No pages. No Qdrant. No Celery package. Python 3.11+ standard library only.

## Call

```bash
python services/extract/extract.py \
  --org-id ORG \
  --membership-id MEMBERSHIP \
  --kind text \
  --text $'Open the next step\n\nLeave a unit the team can run'
```

```python
from extract import extract_units

extract_units(
    {
        "org_id": "ORG",
        "membership_id": "MEMBERSHIP",
        "kind": "pdf",
        "pdf_path": "/var/field-school/inbox/source.pdf",
    }
)
```

Result:

```json
{
  "org_id": "ORG",
  "units": [
    {"id": "<uuid>", "title": "Open the next step", "source_unit_id": "<uuid>"}
  ]
}
```

Title is the first line of the block. A title longer than 80 characters keeps 77 characters and an ellipsis.

## Queue shape

Celery and Redis are the Cycle 2 broker. They are not installed here. A later worker process imports `extract_units` and binds the name below. This file is the contract.

| Field | Value |
| --- | --- |
| Task name | `fieldschool.extract.units` |
| Queue | `extract` |
| Body | One JSON object, the `extract_units` message |
| Result | `{"org_id", "units": [{id, title, source_unit_id}]}` |

```python
# Installed later, not by this package.
# @celery.task(name="fieldschool.extract.units", queue="extract")
# def extract_units_task(message: dict) -> dict:
#     return extract_units(message)
```

Message:

```json
{
  "org_id": "<org uuid>",
  "membership_id": "<leader membership uuid>",
  "kind": "text",
  "text": "<supplied text or STT transcript>"
}
```

```json
{
  "org_id": "<org uuid>",
  "membership_id": "<leader membership uuid>",
  "kind": "pdf",
  "pdf_path": "<absolute path the worker host can read>"
}
```

Send text or a PDF path, not both. `kind` is `text`, `pdf`, or `stt`. Do not send audio, a URL, or a child login.

The worker reads only `org_id`, `membership_id`, `kind`, `text`, and `pdf_path`.

## Check

```bash
cd services/extract && python3 -m unittest test_extract.py
```
