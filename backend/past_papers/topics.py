"""Curated topic list per subject, mirrored from the frontend mock data.

Kept here so the extraction endpoint can snap LLM-proposed topics to a known
label without needing the frontend to pass the list in every request.
"""

from __future__ import annotations

import re
from difflib import SequenceMatcher
from typing import Dict, List, Optional

TOPICS: Dict[str, List[str]] = {
    "Mathematics": [
        "Algebra", "Trigonometry", "Geometry", "Calculus", "Probability", "Statistics",
        "Functions", "Sequences", "Modelling", "Complex Numbers", "Matrices",
        "Differential Equations", "Heart of Algebra", "Problem Solving", "Advanced Math",
    ],
    "Physics": [
        "Mechanics", "Electrostatics", "Optics", "Thermodynamics", "Modern Physics", "Waves",
    ],
    "Chemistry": [
        "Organic", "Inorganic", "Physical", "Coordination Compounds", "Equilibrium",
    ],
    "Biology": [
        "Cell Biology", "Genetics", "Ecology", "Human Physiology", "Plant Physiology",
    ],
    "Social Science": [
        "History", "Geography", "Civics", "Economics",
    ],
    "English": [
        "Reading Comprehension", "Grammar", "Vocabulary", "Writing",
    ],
    "Computer Applications": [
        "Java Basics", "OOP", "Arrays", "Strings",
    ],
    "Economics": [
        "Microeconomics", "Macroeconomics", "International Trade",
    ],
    "SAT Reading & Writing": [
        "Passages", "Vocabulary in Context", "Rhetoric",
    ],
}


# A tiny keyword catalog used before falling back to fuzzy string matching. Each
# entry says "if the LLM mentions any of these substrings for this subject, the
# canonical topic is ...". This handles cases where the LLM invents a synonym
# ("Newton's Laws of Motion" -> "Mechanics").
_KEYWORD_HINTS: Dict[str, List[tuple]] = {
    "Physics": [
        (("newton", "force", "friction", "momentum", "acceleration", "gravity", "projectile", "energy", "work", "kinematic"), "Mechanics"),
        (("charge", "coulomb", "electric field", "capacitor", "voltage"), "Electrostatics"),
        (("lens", "mirror", "refraction", "diffraction", "polarisation", "optics", "light"), "Optics"),
        (("heat", "temperature", "thermal", "entropy", "carnot", "gas law"), "Thermodynamics"),
        (("photon", "quantum", "atomic", "photoelectric", "de broglie", "nuclear"), "Modern Physics"),
        (("wave", "sound", "resonance", "frequency", "amplitude", "doppler"), "Waves"),
    ],
    "Mathematics": [
        (("polynomial", "equation", "linear", "quadratic", "inequality"), "Algebra"),
        (("sin", "cos", "tan", "trigonometric", "identity"), "Trigonometry"),
        (("angle", "circle", "polygon", "triangle", "coordinate geometry"), "Geometry"),
        (("derivative", "integral", "limit", "differentiat"), "Calculus"),
        (("probability", "chance", "combination", "permutation"), "Probability"),
        (("mean", "median", "mode", "variance", "distribution"), "Statistics"),
    ],
    "Chemistry": [
        (("alkane", "alkene", "alcohol", "carbonyl", "ester", "organic"), "Organic"),
        (("periodic", "metal", "acid", "salt", "inorganic"), "Inorganic"),
        (("rate", "kinetic", "enthalpy", "gibbs", "thermochemistry"), "Physical"),
        (("ligand", "coordination", "complex ion", "transition metal"), "Coordination Compounds"),
        (("equilibrium", "le chatelier", "kc", "kp"), "Equilibrium"),
    ],
    "Biology": [
        (("cell", "organelle", "mitochondria", "chloroplast", "membrane"), "Cell Biology"),
        (("gene", "dna", "allele", "chromosome", "inherit", "mendel"), "Genetics"),
        (("ecosystem", "food web", "biodiversity", "population", "pollution"), "Ecology"),
        (("respiration", "circulation", "digestion", "kidney", "hormone", "nervous system"), "Human Physiology"),
        (("photosynthesis", "xylem", "phloem", "stomata", "plant", "chlorophyll"), "Plant Physiology"),
    ],
}


def _fuzzy(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def normalize_topic(subject: str, proposed: Optional[str]) -> Optional[str]:
    """Snap an LLM-proposed topic label to the closest canonical topic for the
    subject. Falls back to the first topic in the list if nothing matches.
    Returns None only when the subject is unknown.
    """
    valid = TOPICS.get(subject)
    if not valid:
        return proposed  # unknown subject, keep whatever the LLM said
    if not proposed:
        return valid[0]
    guess_lower = proposed.strip().lower()
    # 1) Exact match against canonical list.
    for t in valid:
        if t.lower() == guess_lower:
            return t
    # 2) Keyword-based hints for this subject.
    for keywords, canonical in _KEYWORD_HINTS.get(subject, []):
        # Keywords must start a word: a bare substring test sent "using" to
        # Trigonometry ("sin"), "meaning" to Statistics ("mean") and
        # "excellent" to Cell Biology ("cell").
        if any(re.search(rf"\b{re.escape(k)}", guess_lower) for k in keywords):
            if canonical in valid:
                return canonical
    # 3) Fuzzy string similarity to canonical topics.
    best = max(valid, key=lambda t: _fuzzy(t, proposed))
    if _fuzzy(best, proposed) >= 0.55:
        return best
    # 4) Give up and pick a stable default.
    return valid[0]
