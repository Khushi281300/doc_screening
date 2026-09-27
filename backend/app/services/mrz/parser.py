import re
from typing import Dict, Any, List, Optional, Tuple

ICAO_WEIGHTS = [7, 3, 1]

CHAR_TO_VALUE = {
    **{str(i): i for i in range(10)},
    **{chr(c): c - ord('A') + 10 for c in range(ord('A'), ord('Z') + 1)},
    '<': 0
}

def calculate_check_digit(data_str: str) -> int:
    """Calculates ICAO 7-3-1 check digit for a string."""
    total = 0
    for idx, char in enumerate(data_str):
        val = CHAR_TO_VALUE.get(char.upper(), 0)
        weight = ICAO_WEIGHTS[idx % 3]
        total += val * weight
    return total % 10

def sanitize_mrz_line(line: str) -> str:
    """Sanitizes line characters and uppercase normalization."""
    clean = re.sub(r'[^A-Z0-9<]', '', line.upper().strip())
    return clean

def correct_ocr_confusions(text: str, expected_type: str = "ALPHANUMERIC") -> str:
    """
    Auto-corrects common OCR misreads based on expected field type.
    """
    if expected_type == "NUMERIC":
        mapping = {'O': '0', 'I': '1', 'Z': '2', 'S': '5', 'B': '8', 'G': '6', 'D': '0', '<': '0'}
        return "".join(mapping.get(c, c) for c in text)
    elif expected_type == "ALPHA":
        mapping = {'0': 'O', '1': 'I', '2': 'Z', '5': 'S', '8': 'B', '6': 'G'}
        return "".join(mapping.get(c, c) for c in text)
    return text

def _safe_format_dob(dob_raw: str) -> str:
    """Safely formats raw YYMMDD birth date to standard string without crashing on OCR noise."""
    num_str = correct_ocr_confusions(dob_raw or '', "NUMERIC")
    cleaned = re.sub(r'[^0-9]', '0', num_str).ljust(6, '0')[:6]
    try:
        yy = int(cleaned[0:2])
    except (ValueError, TypeError):
        yy = 90
    year_prefix = "19" if yy > 30 else "20"
    return f"{year_prefix}{cleaned[0:2]}-{cleaned[2:4]}-{cleaned[4:6]}"

def _safe_format_expiry(expiry_raw: str) -> str:
    """Safely formats raw YYMMDD expiry date to standard string without crashing on OCR noise."""
    num_str = correct_ocr_confusions(expiry_raw or '', "NUMERIC")
    cleaned = re.sub(r'[^0-9]', '0', num_str).ljust(6, '0')[:6]
    return f"20{cleaned[0:2]}-{cleaned[2:4]}-{cleaned[4:6]}"


def parse_mrz_td3(line1: str, line2: str) -> Dict[str, Any]:
    """
    Parses ICAO Doc 9303 TD3 (Passport - 2 lines of 44 characters).
    Line 1: P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<
    Line 2: L898902C36UTO7408122F1204159ZE184226B<<<<<10
    """
    line1 = sanitize_mrz_line(line1).ljust(44, '<')[:44]
    line2 = sanitize_mrz_line(line2).ljust(44, '<')[:44]

    doc_code = line1[0:2]
    issuing_country = line1[2:5].replace('<', '')
    
    # Names parsing
    names_part = line1[5:44]
    name_split = names_part.split('<<')
    surname = name_split[0].replace('<', ' ').strip()
    given_names = name_split[1].replace('<', ' ').strip() if len(name_split) > 1 else ""

    # Line 2 components
    doc_number = line2[0:9].replace('<', '')
    doc_num_check = line2[9]
    nationality = line2[10:13].replace('<', '')
    
    dob_raw = line2[13:19]
    dob_check = line2[19]
    
    sex = line2[20].replace('<', 'X')
    
    expiry_raw = line2[21:27]
    expiry_check = line2[27]
    
    optional_data = line2[28:42]
    optional_check = line2[42] if line2[42] != '<' else None
    
    composite_check = line2[43]

    # Validate Check Digits
    doc_num_calc = calculate_check_digit(line2[0:9])
    dob_calc = calculate_check_digit(dob_raw)
    expiry_calc = calculate_check_digit(expiry_raw)
    
    # Composite data string: line2[0:10] + line2[13:20] + line2[21:43]
    composite_data = line2[0:10] + line2[13:20] + line2[21:43]
    composite_calc = calculate_check_digit(composite_data)

    doc_num_valid = str(doc_num_calc) == doc_num_check
    dob_valid = str(dob_calc) == dob_check
    expiry_valid = str(expiry_calc) == expiry_check
    composite_valid = str(composite_calc) == composite_check

    all_valid = doc_num_valid and dob_valid and expiry_valid and composite_valid

    # Format dates to standard strings
    dob_formatted = _safe_format_dob(dob_raw)
    expiry_formatted = _safe_format_expiry(expiry_raw)

    return {
        "format": "TD3",
        "doc_type": "PASSPORT",
        "issuing_country": issuing_country,
        "surname": surname,
        "given_names": given_names,
        "full_name": f"{given_names} {surname}".strip(),
        "document_number": doc_number,
        "nationality": nationality,
        "date_of_birth": dob_formatted,
        "expiry_date": expiry_formatted,
        "sex": sex,
        "check_digits": {
            "document_number": {"expected": doc_num_check, "calculated": str(doc_num_calc), "valid": doc_num_valid},
            "date_of_birth": {"expected": dob_check, "calculated": str(dob_calc), "valid": dob_valid},
            "expiry_date": {"expected": expiry_check, "calculated": str(expiry_calc), "valid": expiry_valid},
            "composite": {"expected": composite_check, "calculated": str(composite_calc), "valid": composite_valid}
        },
        "all_check_digits_valid": all_valid,
        "raw_mrz": [line1, line2]
    }

def parse_mrz_td1(line1: str, line2: str, line3: str) -> Dict[str, Any]:
    """
    Parses ICAO Doc 9303 TD1 (National ID - 3 lines of 30 characters).
    """
    line1 = sanitize_mrz_line(line1).ljust(30, '<')[:30]
    line2 = sanitize_mrz_line(line2).ljust(30, '<')[:30]
    line3 = sanitize_mrz_line(line3).ljust(30, '<')[:30]

    doc_code = line1[0:2]
    issuing_country = line1[2:5].replace('<', '')
    doc_number = line1[5:14].replace('<', '')
    doc_num_check = line1[14]

    dob_raw = line2[0:6]
    dob_check = line2[6]
    sex = line2[7].replace('<', 'X')
    expiry_raw = line2[8:14]
    expiry_check = line2[14]
    nationality = line2[15:18].replace('<', '')
    composite_check = line2[29]

    name_parts = line3.split('<<')
    surname = name_parts[0].replace('<', ' ').strip()
    given_names = name_parts[1].replace('<', ' ').strip() if len(name_parts) > 1 else ""

    doc_num_calc = calculate_check_digit(line1[5:14])
    dob_calc = calculate_check_digit(dob_raw)
    expiry_calc = calculate_check_digit(expiry_raw)
    
    composite_data = line1[5:30] + line2[0:7] + line2[8:15] + line2[18:29]
    composite_calc = calculate_check_digit(composite_data)

    doc_num_valid = str(doc_num_calc) == doc_num_check
    dob_valid = str(dob_calc) == dob_check
    expiry_valid = str(expiry_calc) == expiry_check
    composite_valid = str(composite_calc) == composite_check

    all_valid = doc_num_valid and dob_valid and expiry_valid and composite_valid

    dob_formatted = _safe_format_dob(dob_raw)
    expiry_formatted = _safe_format_expiry(expiry_raw)

    return {
        "format": "TD1",
        "doc_type": "NATIONAL_ID",
        "issuing_country": issuing_country,
        "surname": surname,
        "given_names": given_names,
        "full_name": f"{given_names} {surname}".strip(),
        "document_number": doc_number,
        "nationality": nationality,
        "date_of_birth": dob_formatted,
        "expiry_date": expiry_formatted,
        "sex": sex,
        "check_digits": {
            "document_number": {"expected": doc_num_check, "calculated": str(doc_num_calc), "valid": doc_num_valid},
            "date_of_birth": {"expected": dob_check, "calculated": str(dob_calc), "valid": dob_valid},
            "expiry_date": {"expected": expiry_check, "calculated": str(expiry_calc), "valid": expiry_valid},
            "composite": {"expected": composite_check, "calculated": str(composite_calc), "valid": composite_valid}
        },
        "all_check_digits_valid": all_valid,
        "raw_mrz": [line1, line2, line3]
    }

def parse_mrz_td2(line1: str, line2: str) -> Dict[str, Any]:
    """
    Parses ICAO Doc 9303 TD2 (Visa / Official Travel Doc - 2 lines of 36 characters).
    Line 1: V<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<
    Line 2: L898902C36UTO7408122F1204159<<<<<<<0
    """
    line1 = sanitize_mrz_line(line1).ljust(36, '<')[:36]
    line2 = sanitize_mrz_line(line2).ljust(36, '<')[:36]

    doc_code = line1[0:2]
    issuing_country = line1[2:5].replace('<', '')
    
    # Names parsing
    names_part = line1[5:36]
    name_split = names_part.split('<<')
    surname = name_split[0].replace('<', ' ').strip()
    given_names = name_split[1].replace('<', ' ').strip() if len(name_split) > 1 else ""

    # Line 2 components
    doc_number = line2[0:9].replace('<', '')
    doc_num_check = line2[9]
    nationality = line2[10:13].replace('<', '')
    
    dob_raw = line2[13:19]
    dob_check = line2[19]
    
    sex = line2[20].replace('<', 'X')
    
    expiry_raw = line2[21:27]
    expiry_check = line2[27]
    
    optional_data = line2[28:35]
    composite_check = line2[35]

    # Validate Check Digits
    doc_num_calc = calculate_check_digit(line2[0:9])
    dob_calc = calculate_check_digit(dob_raw)
    expiry_calc = calculate_check_digit(expiry_raw)
    
    # Composite data string: line2[0:10] + line2[13:20] + line2[21:35]
    composite_data = line2[0:10] + line2[13:20] + line2[21:35]
    composite_calc = calculate_check_digit(composite_data)

    doc_num_valid = str(doc_num_calc) == doc_num_check
    dob_valid = str(dob_calc) == dob_check
    expiry_valid = str(expiry_calc) == expiry_check
    composite_valid = str(composite_calc) == composite_check

    all_valid = doc_num_valid and dob_valid and expiry_valid and composite_valid

    dob_formatted = _safe_format_dob(dob_raw)
    expiry_formatted = _safe_format_expiry(expiry_raw)

    doc_type = "VISA" if doc_code.startswith("V") else "OFFICIAL_TRAVEL_DOC_TD2"

    return {
        "format": "TD2",
        "doc_type": doc_type,
        "issuing_country": issuing_country,
        "surname": surname,
        "given_names": given_names,
        "full_name": f"{given_names} {surname}".strip(),
        "document_number": doc_number,
        "nationality": nationality,
        "date_of_birth": dob_formatted,
        "expiry_date": expiry_formatted,
        "sex": sex,
        "check_digits": {
            "document_number": {"expected": doc_num_check, "calculated": str(doc_num_calc), "valid": doc_num_valid},
            "date_of_birth": {"expected": dob_check, "calculated": str(dob_calc), "valid": dob_valid},
            "expiry_date": {"expected": expiry_check, "calculated": str(expiry_calc), "valid": expiry_valid},
            "composite": {"expected": composite_check, "calculated": str(composite_calc), "valid": composite_valid}
        },
        "all_check_digits_valid": all_valid,
        "raw_mrz": [line1, line2]
    }

def parse_mrz_text(mrz_lines: List[str]) -> Dict[str, Any]:
    """
    Auto-detects MRZ format (TD1, TD2, TD3) and executes full ICAO validation.
    """
    cleaned = [sanitize_mrz_line(l) for l in mrz_lines if sanitize_mrz_line(l)]
    
    if len(cleaned) == 2:
        max_len = max(len(cleaned[0]), len(cleaned[1]))
        if max_len <= 38:
            return parse_mrz_td2(cleaned[0], cleaned[1])
        elif max_len >= 40:
            return parse_mrz_td3(cleaned[0], cleaned[1])
        else:
            return {
                "format": "INVALID_LENGTH",
                "doc_type": "UNKNOWN",
                "all_check_digits_valid": False,
                "error": f"Invalid MRZ line length ({max_len} chars). TD2 expects 36 chars, TD3 expects 44 chars.",
                "raw_mrz": mrz_lines
            }
    elif len(cleaned) == 3:
        return parse_mrz_td1(cleaned[0], cleaned[1], cleaned[2])
    else:
        return {
            "format": "UNKNOWN",
            "doc_type": "UNKNOWN",
            "all_check_digits_valid": False,
            "error": "Invalid number of MRZ lines (expected 2 for TD2/TD3 or 3 for TD1)",
            "raw_mrz": mrz_lines
        }
