"""Contract tests for extract_units. Stdlib only."""

from __future__ import annotations

import ast
import json
import subprocess
import sys
import tempfile
import unittest
import zlib
from pathlib import Path

from extract import extract_units

ORG = "org-team-1"
MEMBER = "leader-membership-1"
ROOT = Path(__file__).resolve().parent


def message(**extra):
    base = {"org_id": ORG, "membership_id": MEMBER, "kind": "text"}
    base.update(extra)
    return base


def build_pdf(stream_text: str, flate: bool = False) -> bytes:
    payload = stream_text.encode("latin-1")
    filters = ""
    if flate:
        payload = zlib.compress(payload)
        filters = " /Filter /FlateDecode"
    stream = (
        f"4 0 obj << /Length {len(payload)}{filters} >> stream\n".encode("latin-1")
        + payload
        + b"\nendstream\nendobj\n"
    )
    objects = [
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R "
        b"/Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
        stream,
        b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
    ]
    body = bytearray(b"%PDF-1.4\n")
    offsets = []
    for obj in objects:
        offsets.append(len(body))
        body.extend(obj)
    xref_at = len(body)
    body.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    body.extend(b"0000000000 65535 f \n")
    for offset in offsets:
        body.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))
    body.extend(
        f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_at}\n%%EOF\n".encode(
            "latin-1"
        )
    )
    return bytes(body)


class ExtractUnitsTest(unittest.TestCase):
    def test_blank_lines_split_units(self):
        result = extract_units(
            message(
                text="Open the next step\nThe leader names the path.\n\nLeave a unit the team can run\n"
            )
        )
        self.assertEqual(result["org_id"], ORG)
        self.assertEqual(
            [unit["title"] for unit in result["units"]],
            ["Open the next step", "Leave a unit the team can run"],
        )
        for unit in result["units"]:
            self.assertEqual(set(unit), {"id", "title", "source_unit_id"})
            self.assertEqual(unit["source_unit_id"], unit["id"])
            self.assertTrue(unit["source_unit_id"])

    def test_long_title_caps_at_eighty(self):
        first = "A" * 90
        result = extract_units(message(text=first + "\nbody stays off the title"))
        self.assertEqual(len(result["units"]), 1)
        self.assertEqual(result["units"][0]["title"], ("A" * 77) + "…")

    def test_empty_text_returns_no_units(self):
        self.assertEqual(extract_units(message(text="  \n\n  "))["units"], [])

    def test_stt_transcript_uses_the_same_split(self):
        result = extract_units(
            message(kind="stt", text="Heard on the call\n\nThe next portion still runs")
        )
        self.assertEqual(
            [unit["title"] for unit in result["units"]],
            ["Heard on the call", "The next portion still runs"],
        )

    def test_scope_keys_are_required(self):
        with self.assertRaisesRegex(ValueError, "org_id required"):
            extract_units({"membership_id": MEMBER, "kind": "text", "text": "One"})
        with self.assertRaisesRegex(ValueError, "membership_id required"):
            extract_units({"org_id": ORG, "kind": "text", "text": "One"})

    def test_one_source_only(self):
        with self.assertRaisesRegex(ValueError, "not both"):
            extract_units(message(text="One", pdf_path="/tmp/nope.pdf"))
        with self.assertRaisesRegex(ValueError, "text kind needs text"):
            extract_units(message())
        with self.assertRaisesRegex(ValueError, "kind must be"):
            extract_units(message(kind="audio", text="no audio"))

    def test_pdf_path_two_units(self):
        stream = "\n".join(
            [
                "BT",
                "/F1 12 Tf",
                "72 700 Td",
                "(Open the next step) Tj",
                "0 -24 Td",
                "(Leave a unit the team can run) Tj",
                "ET",
            ]
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "source.pdf"
            path.write_bytes(build_pdf(stream, flate=True))
            result = extract_units(message(kind="pdf", pdf_path=str(path)))
        self.assertEqual(
            [unit["title"] for unit in result["units"]],
            ["Open the next step", "Leave a unit the team can run"],
        )
        self.assertTrue(all(unit["source_unit_id"] == unit["id"] for unit in result["units"]))

    def test_pdf_small_gap_stays_one_unit(self):
        stream = "\n".join(
            [
                "BT",
                "/F1 12 Tf",
                "72 700 Td",
                "(Short title) Tj",
                "0 -14 Td",
                "(Body line stays in the same unit) Tj",
                "ET",
            ]
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "one.pdf"
            path.write_bytes(build_pdf(stream))
            result = extract_units({"org_id": ORG, "membership_id": MEMBER, "kind": "pdf", "pdf_path": str(path)})
        self.assertEqual([unit["title"] for unit in result["units"]], ["Short title"])

    def test_pdf_escapes_and_tj_array(self):
        stream = "\n".join(
            [
                "BT",
                "/F1 12 Tf",
                "72 700 Td",
                "(Path \\(fit to now\\)) Tj",
                "0 -24 Td",
                "[(Leave) -250 (a unit)] TJ",
                "ET",
            ]
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "esc.pdf"
            path.write_bytes(build_pdf(stream))
            result = extract_units(
                {"org_id": ORG, "membership_id": MEMBER, "kind": "pdf", "pdf_path": str(path)}
            )
        self.assertEqual(
            [unit["title"] for unit in result["units"]],
            ["Path (fit to now)", "Leave a unit"],
        )

    def test_pdf_refusals(self):
        with self.assertRaisesRegex(ValueError, "local file"):
            extract_units(
                {"org_id": ORG, "membership_id": MEMBER, "kind": "pdf", "pdf_path": "https://example.com/a.pdf"}
            )
        with self.assertRaises(FileNotFoundError):
            extract_units(
                {"org_id": ORG, "membership_id": MEMBER, "kind": "pdf", "pdf_path": "/tmp/missing-field-school-extract.pdf"}
            )
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "notes.txt"
            path.write_text("not a pdf", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "not a PDF"):
                extract_units(
                    {"org_id": ORG, "membership_id": MEMBER, "kind": "pdf", "pdf_path": str(path)}
                )

    def test_pdf_quote_operator_breaks_the_line(self):
        stream = "\n".join(
            [
                "BT",
                "/F1 12 Tf",
                "72 700 Td",
                "(Short title) Tj",
                "(Body via quote) '",
                "ET",
            ]
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "quote.pdf"
            path.write_bytes(build_pdf(stream))
            result = extract_units(
                {"org_id": ORG, "membership_id": MEMBER, "kind": "pdf", "pdf_path": str(path)}
            )
        self.assertEqual([unit["title"] for unit in result["units"]], ["Short title"])

    def test_worker_source_has_no_forbidden_stack(self):
        source = (ROOT / "extract.py").read_text(encoding="utf-8")
        tree = ast.parse(source)
        imported: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported.update(alias.name.split(".", 1)[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported.add(node.module.split(".", 1)[0])
        self.assertTrue(imported.isdisjoint({"django", "celery", "qdrant", "fastapi"}))

    def test_cli_prints_units(self):
        proc = subprocess.run(
            [
                sys.executable,
                str(ROOT / "extract.py"),
                "--org-id",
                ORG,
                "--membership-id",
                MEMBER,
                "--kind",
                "text",
                "--text",
                "Open the next step\n\nLeave a unit the team can run",
            ],
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr)
        payload = json.loads(proc.stdout)
        self.assertEqual(len(payload["units"]), 2)
        self.assertEqual(payload["units"][0]["source_unit_id"], payload["units"][0]["id"])


if __name__ == "__main__":
    unittest.main()
