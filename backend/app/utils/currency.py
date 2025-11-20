"""Currency formatting utilities for Lakhs and Crores."""

from decimal import Decimal, ROUND_DOWN
from typing import Literal


CurrencyFormat = Literal["lakhs", "crores"]


def truncate_decimal(value: Decimal, places: int) -> Decimal:
    """
    Truncate decimal to specified places without rounding.
    
    Args:
        value: Decimal value to truncate
        places: Number of decimal places
    
    Returns:
        Decimal: Truncated value
    """
    if value is None:
        return Decimal('0')
    
    quantize_value = Decimal(10) ** -places
    return value.quantize(quantize_value, rounding=ROUND_DOWN)


def convert_to_crores(lakhs: Decimal) -> Decimal:
    """
    Convert lakhs to crores.
    
    Args:
        lakhs: Amount in lakhs
    
    Returns:
        Decimal: Amount in crores
    """
    if lakhs is None:
        return Decimal('0')
    
    return lakhs / Decimal('100')


def format_currency(
    amount: Decimal,
    decimal_places: int = 1,
    currency_format: CurrencyFormat = "lakhs"
) -> str:
    """
    Format currency amount in Lakhs or Crores with truncation (no rounding).
    
    Formatting Rules:
    - Lakhs format:
      - < 100L: 2 decimal places (truncated)
      - >= 100L: 1 decimal place (truncated)
    - Crores format: always 2 decimal places (truncated)
    
    Args:
        amount: Amount to format
        decimal_places: Number of decimal places (default 1)
        currency_format: 'lakhs' or 'crores'
    
    Returns:
        str: Formatted currency string (e.g., "₹12.5L" or "₹1.25Cr")
    """
    if amount is None:
        amount = Decimal('0')
    
    if currency_format == "crores":
        # Convert lakhs to crores
        value_in_crores = convert_to_crores(amount)
        truncated = truncate_decimal(value_in_crores, 2)
        return f"₹{truncated}Cr"
    
    else:  # lakhs
        # Determine decimal places based on amount
        if amount < 100:
            places = 2
        else:
            places = 1
        
        truncated = truncate_decimal(amount, places)
        return f"₹{truncated}L"


def parse_savings_string(savings_str: Optional[str]) -> Decimal:
    """
    Parse savings string like "₹3.2L annually" to decimal value in lakhs.
    
    Args:
        savings_str: Savings string
    
    Returns:
        Decimal: Amount in lakhs
    """
    if not savings_str:
        return Decimal('0')
    
    # Remove currency symbol and extra spaces
    savings_str = savings_str.replace('₹', '').strip()
    
    # Extract numeric value and unit
    parts = savings_str.split()
    if not parts:
        return Decimal('0')
    
    # Find the numeric part
    numeric_part = None
    unit = None
    
    for part in parts:
        # Check if it contains a number followed by L or Cr
        if 'L' in part.upper() or 'CR' in part.upper():
            # Extract number
            if 'CR' in part.upper():
                numeric_part = part.upper().replace('CR', '').strip()
                unit = 'crores'
            else:
                numeric_part = part.upper().replace('L', '').strip()
                unit = 'lakhs'
            break
    
    if numeric_part is None:
        return Decimal('0')
    
    try:
        value = Decimal(numeric_part)
        
        # Convert to lakhs if in crores
        if unit == 'crores':
            value = value * Decimal('100')
        
        return value
    
    except (ValueError, decimal.InvalidOperation):
        return Decimal('0')

