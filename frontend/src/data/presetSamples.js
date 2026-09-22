// Helper to generate synthetic passport image base64 on client canvas
export const createSyntheticPassport = (options = {}) => {
  const {
    name = "ERIKSSON ANNA MARIA",
    docNumber = "L898902C3",
    nationality = "UTO",
    dob = "12 AUG 1974",
    expiry = "15 APR 2030",
    sex = "F",
    tamperedField = null,
    moirePattern = false,
    faceVariant = "female_authentic"
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");

  // 1. Background Guilloche / Security Pattern
  const bgGrad = ctx.createLinearGradient(0, 0, 600, 400);
  bgGrad.addColorStop(0, "#0e2238");
  bgGrad.addColorStop(0.5, "#183b56");
  bgGrad.addColorStop(1, "#102a42");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 600, 400);

  // Security wave lines
  ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
  ctx.lineWidth = 1;
  for (let y = 10; y < 400; y += 12) {
    ctx.beginPath();
    for (let x = 0; x < 600; x += 10) {
      const cy = y + Math.sin(x * 0.04) * 6;
      if (x === 0) ctx.moveTo(x, cy);
      else ctx.lineTo(x, cy);
    }
    ctx.stroke();
  }

  // Border header
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "bold 16px Outfit, sans-serif";
  ctx.fillText("UTOPIA PASSPORT / PASSEPORT", 190, 40);
  ctx.font = "11px Outfit, sans-serif";
  ctx.fillStyle = "rgba(6, 182, 212, 0.9)";
  ctx.fillText("TYPE / TYPE: P   |   CODE / CODE: UTO", 190, 60);

  // 2. Photo Area
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(25, 45, 140, 180);
  ctx.strokeStyle = "#06b6d4";
  ctx.lineWidth = 2;
  ctx.strokeRect(25, 45, 140, 180);

  // Draw face avatar
  ctx.fillStyle = faceVariant === "impersonator" ? "#e2e8f0" : "#cbd5e1";
  ctx.beginPath();
  ctx.arc(95, 110, 38, 0, Math.PI * 2); // Head
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(95, 185, 55, 40, 0, 0, Math.PI, true); // Shoulders
  ctx.fill();

  // Draw eyes & glasses
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(82, 105, 4, 0, Math.PI * 2);
  ctx.arc(108, 105, 4, 0, Math.PI * 2);
  ctx.fill();

  // 3. Document Printed Fields
  const drawField = (label, value, x, y, isTampered = false) => {
    ctx.font = "10px Outfit, sans-serif";
    ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
    ctx.fillText(label, x, y);

    ctx.font = "bold 14px 'JetBrains Mono', monospace";
    if (isTampered) {
      // Spliced artifact style
      ctx.fillStyle = "#ff0055";
      ctx.fillRect(x - 2, y + 2, ctx.measureText(value).width + 4, 18);
      ctx.fillStyle = "#ffffff";
    } else {
      ctx.fillStyle = "#f8fafc";
    }
    ctx.fillText(value, x, y + 16);
  };

  drawField("SURNAME / NOM", name.split(" ")[0] || "ERIKSSON", 190, 90, tamperedField === "name");
  drawField("GIVEN NAMES / PRENOMS", name.split(" ").slice(1).join(" ") || "ANNA MARIA", 190, 130);
  drawField("NATIONALITY / NATIONALITE", nationality, 190, 170);
  drawField("DATE OF BIRTH / DATE DE NAISSANCE", dob, 350, 170, tamperedField === "dob");
  drawField("SEX / SEXE", sex, 190, 210);
  drawField("DOCUMENT NO / NO DU PASSEPORT", docNumber, 350, 90, tamperedField === "docNumber");
  drawField("DATE OF EXPIRY / DATE D'EXPIRATION", expiry, 350, 210, tamperedField === "expiry");

  // 4. MRZ Zone at bottom
  ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillRect(0, 290, 600, 110);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.beginPath();
  ctx.moveTo(0, 290);
  ctx.lineTo(600, 290);
  ctx.stroke();

  ctx.font = "bold 17px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#38bdf8";

  // Generate MRZ line 1 & 2
  const mrz1 = `P<UTO${name.replace(/\s+/g, "<").padEnd(39, "<")}`.slice(0, 44);
  const mrz2 = `${docNumber.padEnd(9, "<")}6UTO7408122F3004159ZE184226B<<<<<10`.slice(0, 44);

  ctx.fillText(mrz1, 25, 335);
  ctx.fillText(mrz2, 25, 375);

  // 5. If Screen Recapture, add periodic Moire grid
  if (moirePattern) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    for (let x = 0; x < 600; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 400);
      ctx.stroke();
    }
  }

  return canvas.toDataURL("image/jpeg", 0.95);
};

export const createLiveSelfie = (variant = "authentic") => {
  const canvas = document.createElement("canvas");
  canvas.width = 240;
  canvas.height = 240;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, 240, 240);

  // Head
  ctx.fillStyle = variant === "impersonator" ? "#fbbf24" : "#cbd5e1";
  ctx.beginPath();
  ctx.arc(120, 100, 50, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders
  ctx.beginPath();
  ctx.ellipse(120, 200, 70, 50, 0, 0, Math.PI, true);
  ctx.fill();

  // Eyes
  ctx.fillStyle = "#020617";
  ctx.beginPath();
  ctx.arc(102, 95, 5, 0, Math.PI * 2);
  ctx.arc(138, 95, 5, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL("image/jpeg", 0.95);
};

export const PRESET_SCENARIOS = [
  {
    id: "genuine_passport",
    title: "Genuine Passport",
    subtitle: "Valid security codes, clean document photo, matching live face",
    expectedVerdict: "VERIFIED",
    badgeColor: "emerald",
    documentImage: createSyntheticPassport({
      name: "ERIKSSON ANNA MARIA",
      docNumber: "L898902C3",
      expiry: "15 APR 2030"
    }),
    liveFace: createLiveSelfie("authentic"),
    mrzLines: [
      "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
      "L898902C36UTO7408122F3004159ZE184226B<<<<<10"
    ]
  },
  {
    id: "tampered_expiry_ela",
    title: "Altered Expiry Date",
    subtitle: "Expiry date was digitally modified with photo editing software",
    expectedVerdict: "MANUAL_REVIEW / REJECTED",
    badgeColor: "rose",
    documentImage: createSyntheticPassport({
      name: "ERIKSSON ANNA MARIA",
      docNumber: "L898902C3",
      expiry: "31 DEC 2038",
      tamperedField: "expiry"
    }),
    liveFace: createLiveSelfie("authentic"),
    mrzLines: [
      "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
      "L898902C36UTO7408122F3004159ZE184226B<<<<<10"
    ]
  },
  {
    id: "fake_mrz_checksum",
    title: "Fake Security Codes",
    subtitle: "Bottom line code numbers do not calculate or add up correctly",
    expectedVerdict: "REJECTED",
    badgeColor: "rose",
    documentImage: createSyntheticPassport({
      name: "DAVIS JONATHAN",
      docNumber: "P99441100"
    }),
    liveFace: createLiveSelfie("authentic"),
    mrzLines: [
      "P<UTODAVIS<<JONATHAN<<<<<<<<<<<<<<<<<<<<<<<<",
      "P994411009UTO8001011M2501019ZE184226B<<<<<99"
    ]
  },
  {
    id: "screen_recapture_moire",
    title: "Phone Screen Photo",
    subtitle: "Photo taken off a phone screen instead of physical paper passport",
    expectedVerdict: "REJECTED",
    badgeColor: "amber",
    documentImage: createSyntheticPassport({
      name: "MILLER SARAH",
      docNumber: "L55221199",
      moirePattern: true
    }),
    liveFace: createLiveSelfie("authentic"),
    mrzLines: [
      "P<UTOMILLER<<SARAH<<<<<<<<<<<<<<<<<<<<<<<<<<",
      "L552211994UTO8505055F2805059ZE184226B<<<<<10"
    ]
  },
  {
    id: "biometric_impersonator",
    title: "Face Mismatch",
    subtitle: "Person standing at checkpoint does not match passport portrait",
    expectedVerdict: "REJECTED",
    badgeColor: "rose",
    documentImage: createSyntheticPassport({
      name: "ZHAO WEI",
      docNumber: "E44332211"
    }),
    liveFace: createLiveSelfie("impersonator"),
    mrzLines: [
      "P<UTOZHAO<<WEI<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",
      "E443322118UTO9002022M2902029ZE184226B<<<<<10"
    ]
  },
  {
    id: "blacklisted_identity",
    title: "Stolen ID Watchlist",
    subtitle: "Passport number matches Interpol lost and stolen database alert",
    expectedVerdict: "REJECTED (CRITICAL)",
    badgeColor: "purple",
    documentImage: createSyntheticPassport({
      name: "REZNIKOV VIKTOR",
      docNumber: "X99887766"
    }),
    liveFace: createLiveSelfie("authentic"),
    mrzLines: [
      "P<UTOREZNIKOV<<VIKTOR<<<<<<<<<<<<<<<<<<<<<<<",
      "X998877661UTO7503033M2603039ZE184226B<<<<<10"
    ]
  }
];
