#!/usr/bin/env python3
"""Utilities for transforming numeric datasets."""
from __future__ import annotations

from dataclasses import dataclass
from statistics import mean


def normalise(values: list[float]) -> list[float]:
    """Scale numbers into the 0-1 range while preserving proportions."""
    if not values:
        return []

    lower, upper = min(values), max(values)
    if lower == upper:
        return [1.0 for _ in values]
    spread = upper - lower
    return [(value - lower) / spread for value in values]


@dataclass(slots=True)
class Summary:
    count: int
    average: float


def summarise(values: list[float]) -> Summary:
    cleaned = [value for value in values if value is not None]
    return Summary(count=len(cleaned), average=mean(cleaned) if cleaned else 0.0)
