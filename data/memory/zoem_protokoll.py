#!/usr/bin/env python3
"""
Zoem-Protokoll: vererbbares, geprueftes Wissen zwischen Organismen
Version: 0.2.0
Autor: Builder-Swarm; ueberarbeitet 28.08.2026
Beschreibung: Export und Import von Wissenspaketen mit Integritaets-
              pruefung, optionaler Signatur und struktureller Quarantaene.

Fassung 0.1.0 war ein Geruest: jede Funktion ein TODO, export() gab ein
leeres Manifest zurueck, import_knowledge() das Wort "stub". Der Auftrag
lautete "IMPORT und EXPORT fertigstellen", und die Vorgabe dazu war
ausdruecklich "nur lauffaehiger Code zaehlt, kein Design-Dokument".

Drei Fehler aus 0.1.0, die dabei mit weggeraeumt wurden:

  1. import_knowledge() hatte einen Parameter "verify_signature", der die
     gleichnamige Modulfunktion VERDECKTE. Sobald das TODO "Pruefe
     Signatur" mit dem naheliegenden Aufruf gefuellt worden waere, haette
     es "TypeError: 'bool' object is not callable" geworfen. Der Parameter
     heisst jetzt signatur_pruefen.
  2. immune_check() gab unbedingt True zurueck - die Pruefung, die
     schuetzen soll, winkte alles durch. verify_signature() gab unbedingt
     False zurueck. Beide Vorgaben standen also verkehrt herum.
  3. Der Modulkopf datierte die Datei auf den 31.08.2026 - drei Tage in
     der Zukunft, frei erfunden.

AUSDRUECKLICH KEINE SICHERHEITSGRENZE - dieselbe Ehrlichkeit wie im
schutzwall.py: immune_check() prueft STRUKTUR (Pflichtfelder, bekannte
Art, Groesse), nicht Absicht. Ein Beweisrezept bleibt fremder Code und
gehoert vor der Ausfuehrung in den Sandkasten, nicht hierher.
"""
from __future__ import annotations

import hashlib
import hmac
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

SCHEMA_VERSION = "1.0"
ARTEN = ("fact", "skill", "memory", "pattern")
MAX_INHALT_BYTES = 256_000


def _jetzt() -> str:
    """UTC mit Zeitzone. datetime.utcnow() ist seit Python 3.12 veraltet
    und lieferte NAIV - das angehaengte "Z" war eine Behauptung."""
    return datetime.now(timezone.utc).isoformat()


@dataclass
class KnowledgePacket:
    """Einzelnes Wissenselement fuer den Transfer."""
    id: str
    type: str                      # fact, skill, memory, pattern
    content: Dict[str, Any]
    schema_version: str = SCHEMA_VERSION
    created_at: str = ""
    source_organism: str = ""
    signature: str = ""

    def __post_init__(self) -> None:
        if not self.created_at:
            self.created_at = _jetzt()


@dataclass
class ExportManifest:
    """Container fuer ein Export-Paket."""
    schema_version: str = SCHEMA_VERSION
    exported_at: str = ""
    source_organism: str = ""
    # 0.1.0 stand hier "List[KnowledgePacket] = None" - die Annotation log,
    # der Wert war None. field(default_factory=list) sagt dasselbe ohne
    # Luege und ohne den Mutable-Default-Fallstrick.
    packets: List[KnowledgePacket] = field(default_factory=list)
    manifest_hash: str = ""
    signature: str = ""

    def __post_init__(self) -> None:
        if not self.exported_at:
            self.exported_at = _jetzt()


# --------------------------------------------------------------- Integritaet

def _rumpf(manifest: ExportManifest) -> Dict[str, Any]:
    """Die gehashten Felder - Hash und Signatur selbst gehoeren nicht dazu."""
    d = asdict(manifest)
    d.pop("manifest_hash", None)
    d.pop("signature", None)
    return d


def manifest_hash(manifest: ExportManifest) -> str:
    """SHA-256 ueber den kanonisch serialisierten Rumpf.

    sort_keys=True ist Pflicht, nicht Geschmack: ohne feste Reihenfolge
    haengt der Hash von der Einfuegereihenfolge ab und zwei identische
    Manifeste haetten verschiedene Hashes.
    """
    roh = json.dumps(_rumpf(manifest), sort_keys=True,
                     ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(roh.encode("utf-8")).hexdigest()


def signiere(manifest: ExportManifest, schluessel: str) -> ExportManifest:
    """HMAC-SHA256 ueber den Manifest-Hash. Ohne Schluessel keine Signatur."""
    manifest.manifest_hash = manifest_hash(manifest)
    if schluessel:
        manifest.signature = hmac.new(
            schluessel.encode("utf-8"),
            manifest.manifest_hash.encode("utf-8"),
            hashlib.sha256).hexdigest()
    return manifest


def verify_signature(manifest: ExportManifest, schluessel: str) -> bool:
    """Prueft die Signatur gegen den neu berechneten Hash.

    0.1.0 gab hier unbedingt False zurueck. Falsch ist beides: ein festes
    False sperrt alles aus, ein festes True laesst alles durch. Ohne
    Schluessel oder ohne Signatur ist die Antwort ehrlich False - dann ist
    nichts geprueft, und der Aufrufer entscheidet.
    """
    if not schluessel or not manifest.signature:
        return False
    erwartet = hmac.new(schluessel.encode("utf-8"),
                        manifest_hash(manifest).encode("utf-8"),
                        hashlib.sha256).hexdigest()
    return hmac.compare_digest(erwartet, manifest.signature)


# ----------------------------------------------------------- Immunsystem

def immune_check(packet: KnowledgePacket) -> tuple[bool, str]:
    """Strukturelle Quarantaene. Gibt (angenommen, Grund) zurueck.

    0.1.0 gab unbedingt True zurueck - ein Gummistempel an genau der
    Stelle, die schuetzen soll. Geprueft wird, was sich pruefen LAESST:
    Pflichtfelder, bekannte Art, Schema, Groesse. Nicht geprueft wird die
    Absicht des Inhalts; dafuer gibt es das Beweisrezept im Sandkasten.
    """
    if not packet.id or not isinstance(packet.id, str):
        return False, "id fehlt oder ist kein Text"
    if packet.type not in ARTEN:
        return False, f"unbekannte Art {packet.type!r} (erlaubt: {', '.join(ARTEN)})"
    if not isinstance(packet.content, dict) or not packet.content:
        return False, "content fehlt oder ist kein Objekt"
    if packet.schema_version != SCHEMA_VERSION:
        return False, (f"Schema {packet.schema_version!r} statt "
                       f"{SCHEMA_VERSION!r}")
    groesse = len(json.dumps(packet.content, ensure_ascii=False)
                  .encode("utf-8"))
    if groesse > MAX_INHALT_BYTES:
        return False, f"content {groesse} Bytes > {MAX_INHALT_BYTES}"
    return True, ""


# ------------------------------------------------------------------ Export

def export(organism_id: str, knowledge_ids: List[str],
           lade: Optional[Callable[[str], Optional[Dict[str, Any]]]] = None,
           schluessel: str = "") -> ExportManifest:
    """Baut ein Manifest aus den genannten Wissens-IDs.

    `lade` liefert zu einer ID ein dict mit mindestens {"type", "content"}
    - bewusst hereingereicht statt fest verdrahtet: dieses Modul kennt den
    Gedaechtnisspeicher des Organismus nicht, und eine erfundene
    Schnittstelle waere schlimmer als eine offene.
    """
    manifest = ExportManifest(source_organism=organism_id)
    for kid in knowledge_ids:
        roh = lade(kid) if lade else None
        if not roh:
            continue
        manifest.packets.append(KnowledgePacket(
            id=kid,
            type=str(roh.get("type", "fact")),
            content=dict(roh.get("content") or {}),
            source_organism=organism_id))
    return signiere(manifest, schluessel)


def als_json(manifest: ExportManifest) -> bytes:
    return json.dumps(asdict(manifest), ensure_ascii=False).encode("utf-8")


# ------------------------------------------------------------------ Import

def import_knowledge(data: bytes, organism_id: str,
                     signatur_pruefen: bool = True,
                     schluessel: str = "",
                     uebernimm: Optional[Callable[[KnowledgePacket], None]] = None
                     ) -> Dict[str, Any]:
    """Nimmt ein Manifest entgegen und uebernimmt, was die Pruefung besteht.

    Der Parameter hiess in 0.1.0 "verify_signature" und verdeckte damit
    die Modulfunktion gleichen Namens - ein TypeError, der nur deshalb nie
    ausgeloest wurde, weil der Rumpf ein TODO war.
    """
    ergebnis: Dict[str, Any] = {"status": "abgelehnt", "imported": 0,
                                "abgelehnt": 0, "errors": []}
    try:
        roh = json.loads(data.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as e:
        ergebnis["errors"].append(f"Manifest nicht lesbar: {e}")
        return ergebnis

    try:
        pakete = [KnowledgePacket(**p) for p in roh.get("packets", [])]
        manifest = ExportManifest(
            schema_version=roh.get("schema_version", ""),
            exported_at=roh.get("exported_at", ""),
            source_organism=roh.get("source_organism", ""),
            packets=pakete,
            manifest_hash=roh.get("manifest_hash", ""),
            signature=roh.get("signature", ""))
    except (TypeError, ValueError) as e:
        ergebnis["errors"].append(f"Manifest unvollstaendig: {e}")
        return ergebnis

    if manifest.source_organism == organism_id:
        ergebnis["errors"].append("eigenes Manifest - nichts zu erben")
        return ergebnis

    if manifest.manifest_hash and manifest_hash(manifest) != manifest.manifest_hash:
        ergebnis["errors"].append("Manifest-Hash passt nicht - unterwegs veraendert")
        return ergebnis

    if signatur_pruefen and not verify_signature(manifest, schluessel):
        ergebnis["errors"].append(
            "Signatur nicht bestaetigt (kein Schluessel oder keine Signatur)")
        return ergebnis

    for p in manifest.packets:
        ok, grund = immune_check(p)
        if not ok:
            ergebnis["abgelehnt"] += 1
            ergebnis["errors"].append(f"{p.id}: {grund}")
            continue
        if uebernimm:
            uebernimm(p)
        ergebnis["imported"] += 1

    ergebnis["status"] = "ok" if ergebnis["imported"] else "nichts uebernommen"
    return ergebnis


# --------------------------------------------------------- Selbstpruefung

def _selbsttest() -> int:
    """Ein vollstaendiger Erbgang A -> B, ausfuehrbar: python3 zoem_protokoll.py"""
    fehler = 0

    def pruefe(name: str, bedingung: bool) -> None:
        nonlocal fehler
        print(("  OK   " if bedingung else "  FEHL ") + name)
        fehler += 0 if bedingung else 1

    bestand = {
        "z1": {"type": "pattern", "content": {"inhalt": "Mutable Defaults"}},
        "z2": {"type": "unfug",   "content": {"inhalt": "falsche Art"}},
    }
    m = export("organism_A", ["z1", "z2", "fehlt"], bestand.get, schluessel="k")

    pruefe("export nimmt nur vorhandene IDs", len(m.packets) == 2)
    pruefe("manifest_hash ist gesetzt", len(m.manifest_hash) == 64)
    pruefe("Signatur verifiziert", verify_signature(m, "k") is True)
    pruefe("falscher Schluessel faellt durch", verify_signature(m, "x") is False)

    angenommen: List[KnowledgePacket] = []
    r = import_knowledge(als_json(m), "organism_B", schluessel="k",
                         uebernimm=angenommen.append)
    pruefe("ein Paket uebernommen", r["imported"] == 1)
    pruefe("eines abgelehnt (unbekannte Art)", r["abgelehnt"] == 1)
    pruefe("Grund steht dabei", any("unbekannte Art" in e for e in r["errors"]))
    pruefe("uebernommen ist das gute", [p.id for p in angenommen] == ["z1"])

    manipuliert = json.loads(als_json(m))
    manipuliert["packets"][0]["content"]["inhalt"] = "heimlich geaendert"
    r2 = import_knowledge(json.dumps(manipuliert).encode(), "organism_B",
                          schluessel="k")
    pruefe("veraendertes Manifest faellt am Hash durch",
           r2["imported"] == 0 and any("Hash" in e for e in r2["errors"]))

    r3 = import_knowledge(als_json(m), "organism_A", schluessel="k")
    pruefe("eigenes Manifest wird nicht geerbt", r3["imported"] == 0)

    r4 = import_knowledge(b"{kein json", "organism_B")
    pruefe("Muell stuerzt nicht ab", r4["imported"] == 0 and r4["errors"])

    print(f"\n{'alle Pruefungen bestanden' if not fehler else str(fehler) + ' fehlgeschlagen'}")
    return fehler


if __name__ == "__main__":
    raise SystemExit(_selbsttest())
