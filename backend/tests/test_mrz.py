import pytest
from app.services.mrz.parser import calculate_check_digit, parse_mrz_td3, parse_mrz_td2, parse_mrz_td1, correct_ocr_confusions

def test_calculate_check_digit():
    # 'L898902C3' -> ICAO 7-3-1 check digit should be '6'
    # Calculation: L(21)*7 + 8*3 + 9*1 + 8*7 + 9*3 + 0*1 + 2*7 + C(12)*3 + 3*1 = 147+24+9+56+27+0+14+36+3 = 316 % 10 = 6
    doc_num = "L898902C3"
    assert calculate_check_digit(doc_num) == 6

def test_parse_mrz_td3_valid():
    line1 = "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<"
    line2 = "L898902C36UTO7408122F1204159ZE184226B<<<<<10"
    res = parse_mrz_td3(line1, line2)
    assert res["doc_type"] == "PASSPORT"
    assert res["surname"] == "ERIKSSON"
    assert res["given_names"] == "ANNA MARIA"
    assert res["document_number"] == "L898902C3"
    assert res["all_check_digits_valid"] is True

def test_parse_mrz_td3_tampered_dob():
    line1 = "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<"
    # Tampered DOB 740812 -> 840812 but kept check digit '2'
    line2 = "L898902C36UTO8408122F1204159ZE184226B<<<<<10"
    res = parse_mrz_td3(line1, line2)
    assert res["check_digits"]["date_of_birth"]["valid"] is False
    assert res["all_check_digits_valid"] is False

def test_parse_mrz_td2_valid():
    line1 = "V<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<"
    line2 = "L898902C36UTO7408122F1204159<<<<<<<0"
    res = parse_mrz_td2(line1, line2)
    assert res["format"] == "TD2"
    assert res["doc_type"] == "VISA"
    assert res["surname"] == "ERIKSSON"
    assert res["given_names"] == "ANNA MARIA"
    assert res["document_number"] == "L898902C3"

def test_ocr_confusion_correction():
    text_with_errors = "L8989O2C3"  # 'O' instead of '0'
    corrected = correct_ocr_confusions(text_with_errors, expected_type="NUMERIC")
    assert corrected == "L898902C3"
