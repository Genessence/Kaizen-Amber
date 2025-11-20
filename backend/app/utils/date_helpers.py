"""Date and time utility functions."""

from datetime import datetime, date, timedelta
from typing import Tuple, List, Optional


def get_current_year() -> int:
    """Get current year."""
    return datetime.utcnow().year


def get_current_month() -> int:
    """Get current month (1-12)."""
    return datetime.utcnow().month


def get_year_month_tuple() -> Tuple[int, int]:
    """Get current year and month as tuple."""
    now = datetime.utcnow()
    return now.year, now.month


def get_first_day_of_month(year: int, month: int) -> date:
    """Get first day of specified month."""
    return date(year, month, 1)


def get_last_day_of_month(year: int, month: int) -> date:
    """Get last day of specified month."""
    if month == 12:
        return date(year, 12, 31)
    else:
        return date(year, month + 1, 1) - timedelta(days=1)


def get_month_date_range(year: int, month: int) -> Tuple[date, date]:
    """
    Get date range for a specific month.
    
    Args:
        year: Year
        month: Month (1-12)
    
    Returns:
        Tuple: (start_date, end_date)
    """
    start_date = get_first_day_of_month(year, month)
    end_date = get_last_day_of_month(year, month)
    return start_date, end_date


def get_ytd_date_range(year: Optional[int] = None) -> Tuple[date, date]:
    """
    Get year-to-date range.
    
    Args:
        year: Year (defaults to current year)
    
    Returns:
        Tuple: (start_date, end_date)
    """
    if year is None:
        year = get_current_year()
    
    start_date = date(year, 1, 1)
    end_date = datetime.utcnow().date()
    
    return start_date, end_date


def get_months_in_year(year: int) -> List[Tuple[int, int]]:
    """
    Get list of (year, month) tuples for all months in a year up to current month.
    
    Args:
        year: Year
    
    Returns:
        List of (year, month) tuples
    """
    current_year, current_month = get_year_month_tuple()
    
    if year < current_year:
        # Full year
        return [(year, m) for m in range(1, 13)]
    elif year == current_year:
        # Up to current month
        return [(year, m) for m in range(1, current_month + 1)]
    else:
        # Future year - return empty
        return []


def format_month_label(year: int, month: int) -> str:
    """
    Format month label for display.
    
    Args:
        year: Year
        month: Month (1-12)
    
    Returns:
        str: Formatted label (e.g., "2025-01", "Jan 2025")
    """
    return f"{year}-{month:02d}"


def parse_month_label(label: str) -> Tuple[int, int]:
    """
    Parse month label to year and month.
    
    Args:
        label: Month label (e.g., "2025-01")
    
    Returns:
        Tuple: (year, month)
    """
    parts = label.split('-')
    return int(parts[0]), int(parts[1])

