// Utility to generate and sanitize standard ICAO Doc 9303 MRZ lines for custom uploads

const ICAO_WEIGHTS = [7, 3, 1];
const CHAR_TO_VAL = {};
for (let i = 0; i <= 9; i++) CHAR_TO_VAL[String(i)] = i;
for (let c = 65; c <= 90; c++) CHAR_TO_VAL[String.fromCharCode(c)] = c - 65 + 10;
CHAR_TO_VAL['<'] = 0;

export function calculateCheckDigit(str) {
  let total = 0;
  const clean = (str || '').toUpperCase();
  for (let i = 0; i < clean.length; i++) {
    const val = CHAR_TO_VAL[clean[i]] ?? 0;
    const weight = ICAO_WEIGHTS[i % 3];
    total += val * weight;
  }
  return total % 10;
}

export function generateTD3MRZ({
  country = 'JPN',
  surname = 'TRAVELER',
  givenNames = 'UNKNOWN',
  docNumber = 'P74209188',
  nationality = 'JPN',
  dob = '901010', // YYMMDD
  sex = 'M',
  expiry = '301231' // YYMMDD
}) {
  const cleanCountry = (country || 'JPN').toUpperCase().padEnd(3, '<').slice(0, 3);
  const cleanSurname = (surname || 'TRAVELER').toUpperCase().replace(/[^A-Z]/g, '<');
  const cleanGiven = (givenNames || 'UNKNOWN').toUpperCase().replace(/[^A-Z]/g, '<');
  const namesStr = `${cleanSurname}<<${cleanGiven}`.padEnd(39, '<').slice(0, 39);
  const line1 = `P<${cleanCountry}${namesStr}`.slice(0, 44);

  const cleanDocNum = (docNumber || 'P74209188').toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(9, '<').slice(0, 9);
  const docNumCheck = calculateCheckDigit(cleanDocNum);

  const cleanNat = (nationality || 'JPN').toUpperCase().padEnd(3, '<').slice(0, 3);
  const cleanDob = (dob || '901010').replace(/[^0-9]/g, '').padEnd(6, '0').slice(0, 6);
  const dobCheck = calculateCheckDigit(cleanDob);

  const cleanSex = ['M', 'F', 'X'].includes((sex || 'M').toUpperCase()) ? sex.toUpperCase() : '<';
  const cleanExp = (expiry || '301231').replace(/[^0-9]/g, '').padEnd(6, '0').slice(0, 6);
  const expCheck = calculateCheckDigit(cleanExp);

  const optional = '<<<<<<<<<<<<<<'; // 14 chars
  const compositeData = `${cleanDocNum}${docNumCheck}${cleanDob}${dobCheck}${cleanExp}${expCheck}${optional}`;
  const compositeCheck = calculateCheckDigit(compositeData);

  const line2 = `${cleanDocNum}${docNumCheck}${cleanNat}${cleanDob}${dobCheck}${cleanSex}${cleanExp}${expCheck}${optional}${compositeCheck}`;
  return [line1, line2];
}
