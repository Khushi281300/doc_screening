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

  if (typeof document === 'undefined') return '';

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
  ctx.fillStyle = "#e8e8e8"; // Light neutral background for photo
  ctx.fillRect(25, 45, 140, 180);
  ctx.strokeStyle = "#06b6d4";
  ctx.lineWidth = 2;
  ctx.strokeRect(25, 45, 140, 180);

  // Draw female face avatar (Anna Eriksson - light skin, oval face)
  const faceColor = faceVariant === "impersonator" ? "#8B4513" : "#f5cba7";
  const hairColor = faceVariant === "impersonator" ? "#1a0a00" : "#92400e";
  
  // Neck
  ctx.fillStyle = faceColor;
  ctx.fillRect(80, 185, 30, 40);
  
  // Shoulders
  ctx.fillStyle = faceVariant === "impersonator" ? "#374151" : "#1e40af";
  ctx.beginPath();
  ctx.ellipse(95, 225, 65, 35, 0, 0, Math.PI, true);
  ctx.fill();
  
  if (faceVariant === "impersonator") {
    // Square-jawed male face
    ctx.fillStyle = faceColor;
    ctx.beginPath();
    ctx.moveTo(45, 110);
    ctx.quadraticCurveTo(45, 75, 95, 70);
    ctx.quadraticCurveTo(145, 75, 145, 110);
    ctx.lineTo(140, 170);
    ctx.quadraticCurveTo(120, 190, 95, 190);
    ctx.quadraticCurveTo(70, 190, 50, 170);
    ctx.closePath();
    ctx.fill();
    // Short dark hair
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.ellipse(95, 78, 52, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = faceColor;
    ctx.beginPath();
    ctx.ellipse(95, 95, 47, 22, 0, 0, Math.PI);
    ctx.fill();
    // Thick brows
    ctx.fillStyle = "#1a0a00";
    ctx.fillRect(63, 110, 22, 5);
    ctx.fillRect(110, 110, 22, 5);
    // Brown eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(75, 122, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(115, 122, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#5c3317";
    ctx.beginPath(); ctx.arc(75, 122, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(115, 122, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(75, 122, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(115, 122, 2.5, 0, Math.PI * 2); ctx.fill();
  } else {
    // Oval feminine face
    ctx.fillStyle = faceColor;
    ctx.beginPath();
    ctx.ellipse(95, 135, 50, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    // Long brown hair
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.ellipse(95, 95, 56, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath(); ctx.ellipse(55, 140, 15, 40, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(135, 140, 15, 40, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = faceColor;
    ctx.beginPath();
    ctx.ellipse(95, 140, 43, 55, 0, 0, Math.PI * 2);
    ctx.fill();
    // Arched brows
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(75, 112, 11, Math.PI + 0.3, Math.PI * 2 - 0.3); ctx.stroke();
    ctx.beginPath(); ctx.arc(115, 112, 11, Math.PI + 0.3, Math.PI * 2 - 0.3); ctx.stroke();
    // Blue eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(75, 120, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(115, 120, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1e40af";
    ctx.beginPath(); ctx.arc(75, 120, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(115, 120, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(75, 120, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(115, 120, 2, 0, Math.PI * 2); ctx.fill();
    // Smile
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(95, 163, 13, 0.1, Math.PI - 0.1); ctx.stroke();
  }

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
  const mrz2 = `${docNumber.padEnd(9, "<")}6UTO7408122F3004157ZE184226B<<<<<<5`.slice(0, 44);

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
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");

  if (variant === "authentic") {
    // Female face matching the passport (Anna Eriksson) - oval face, lighter skin, similar to passport photo
    // Background - neutral light gray studio backdrop
    ctx.fillStyle = "#d1d5db";
    ctx.fillRect(0, 0, 320, 320);

    // Neck
    ctx.fillStyle = "#f5cba7";
    ctx.fillRect(135, 200, 50, 80);

    // Shoulders - feminine cut
    ctx.fillStyle = "#1e40af"; // blue top
    ctx.beginPath();
    ctx.ellipse(160, 310, 110, 55, 0, 0, Math.PI, true);
    ctx.fill();

    // Face - oval/feminine shape
    ctx.fillStyle = "#f5cba7";
    ctx.beginPath();
    ctx.ellipse(160, 145, 72, 88, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair - light brown, longer
    ctx.fillStyle = "#92400e";
    ctx.beginPath();
    ctx.ellipse(160, 100, 78, 65, 0, 0, Math.PI * 2);
    ctx.fill();
    // Side hair
    ctx.beginPath();
    ctx.ellipse(105, 155, 22, 55, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(215, 155, 22, 55, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Face skin on top of hair
    ctx.fillStyle = "#f5cba7";
    ctx.beginPath();
    ctx.ellipse(160, 155, 62, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrows - thin arched
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(133, 127, 14, Math.PI + 0.3, Math.PI * 2 - 0.3); ctx.stroke();
    ctx.beginPath(); ctx.arc(187, 127, 14, Math.PI + 0.3, Math.PI * 2 - 0.3); ctx.stroke();

    // Eyes - almond shaped, blue
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(133, 135, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(187, 135, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1e40af"; // Blue iris
    ctx.beginPath(); ctx.arc(133, 135, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(187, 135, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath(); ctx.arc(133, 135, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(187, 135, 3, 0, Math.PI * 2); ctx.fill();
    // Eye shine
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath(); ctx.arc(136, 132, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(190, 132, 2, 0, Math.PI * 2); ctx.fill();

    // Nose - small, feminine
    ctx.strokeStyle = "#d49b77";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(155, 148); ctx.quadraticCurveTo(148, 168, 152, 172); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(152, 172); ctx.quadraticCurveTo(160, 176, 168, 172); ctx.stroke();

    // Smile - warm smile
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(160, 185, 18, 0.1, Math.PI - 0.1);
    ctx.stroke();
    // Lips
    ctx.fillStyle = "#e07b8a";
    ctx.beginPath();
    ctx.ellipse(160, 186, 16, 7, 0, 0, Math.PI);
    ctx.fill();

    // Subtle blush
    ctx.fillStyle = "rgba(255, 150, 150, 0.15)";
    ctx.beginPath(); ctx.ellipse(108, 158, 20, 12, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(212, 158, 20, 12, 0.3, 0, Math.PI * 2); ctx.fill();

  } else {
    // IMPERSONATOR - Completely different person: male, darker skin, square jaw, different features
    // Background - different color
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(0, 0, 320, 320);

    // Neck
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(130, 215, 60, 70);

    // Shoulders - masculine
    ctx.fillStyle = "#374151"; // dark gray suit
    ctx.beginPath();
    ctx.ellipse(160, 315, 130, 65, 0, 0, Math.PI, true);
    ctx.fill();

    // Face - square-ish jaw, masculine
    ctx.fillStyle = "#8B4513"; // Much darker skin tone
    ctx.beginPath();
    ctx.moveTo(90, 140);
    ctx.quadraticCurveTo(90, 105, 160, 100);
    ctx.quadraticCurveTo(230, 105, 230, 140);
    ctx.lineTo(225, 210);
    ctx.quadraticCurveTo(195, 235, 160, 237);
    ctx.quadraticCurveTo(125, 235, 95, 210);
    ctx.closePath();
    ctx.fill();

    // Hair - very short, dark, receding
    ctx.fillStyle = "#1a0a00";
    ctx.beginPath();
    ctx.ellipse(160, 105, 70, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    // Receding hairline - leave forehead exposed
    ctx.fillStyle = "#8B4513";
    ctx.beginPath();
    ctx.ellipse(160, 130, 62, 35, 0, 0, Math.PI);
    ctx.fill();

    // Heavy eyebrows - thick and straight
    ctx.fillStyle = "#1a0a00";
    ctx.beginPath();
    ctx.rect(103, 138, 35, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(182, 138, 35, 7);
    ctx.fill();

    // Eyes - brown, narrower, hooded
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(125, 155, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(195, 155, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#5c3317"; // Brown iris
    ctx.beginPath(); ctx.arc(125, 155, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(195, 155, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath(); ctx.arc(125, 155, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(195, 155, 4, 0, Math.PI * 2); ctx.fill();

    // Nose - wider, larger
    ctx.fillStyle = "#7a3b10";
    ctx.beginPath();
    ctx.ellipse(160, 182, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6b3010";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(150, 160); ctx.lineTo(148, 182); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(170, 160); ctx.lineTo(172, 182); ctx.stroke();

    // Mouth - stern expression, thin lips
    ctx.fillStyle = "#6b2c17";
    ctx.beginPath();
    ctx.rect(138, 200, 44, 5);
    ctx.fill();
    ctx.strokeStyle = "#6b2c17";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(138, 202);
    ctx.lineTo(182, 202);
    ctx.stroke();

    // Beard/stubble
    ctx.fillStyle = "rgba(26, 10, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(160, 215, 55, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Label for clarity
    ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
    ctx.fillRect(0, 290, 320, 30);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("IMPERSONATOR — DIFFERENT PERSON", 160, 310);
  }

  return canvas.toDataURL("image/jpeg", 0.95);
};


// Generates high-impact Error Level Analysis (ELA) heatmap canvas
export const createSyntheticELAHeatmap = (options = {}) => {
  if (typeof document === 'undefined') return '';
  const { tamperedField = null } = options;
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");

  // Baseline ELA noise background (deep dark violet / indigo)
  ctx.fillStyle = "#0a071b";
  ctx.fillRect(0, 0, 600, 400);

  // Low amplitude baseline JPEG compression residuals
  for (let i = 0; i < 600; i += 8) {
    for (let j = 0; j < 400; j += 8) {
      const alpha = Math.random() * 0.12;
      ctx.fillStyle = `rgba(80, 20, 140, ${alpha})`;
      ctx.fillRect(i, j, 8, 8);
    }
  }

  // Draw faint outline of the passport elements in dark magenta
  ctx.strokeStyle = "rgba(147, 51, 234, 0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(25, 45, 140, 180); // photo box
  ctx.strokeRect(0, 290, 600, 110); // MRZ box

  // If a field is tampered, render high-intensity Inferno gradient hot-spot
  if (tamperedField === 'expiry') {
    // Expiry date location: x: 345, y: 210
    const grad = ctx.createRadialGradient(420, 225, 5, 420, 225, 75);
    grad.addColorStop(0, '#FFFFFF'); // Bright white center
    grad.addColorStop(0.2, '#FBBF24'); // Yellow ring
    grad.addColorStop(0.5, '#EF4444'); // Crimson / Red hot zone
    grad.addColorStop(0.85, '#7C3AED'); // Violet boundary
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(330, 180, 180, 90);

    // Overlay bright ELA text highlight
    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("HIGH DELTA RESIDUAL [31 DEC 2038]", 325, 175);
  } else if (tamperedField === 'photo') {
    const grad = ctx.createRadialGradient(95, 135, 10, 95, 135, 90);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, '#F59E0B');
    grad.addColorStop(0.6, '#DC2626');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(20, 40, 150, 190);
  }

  return canvas.toDataURL("image/jpeg", 0.95);
};

// Generates 2D FFT Moiré Spectrum canvas
export const createSyntheticFFTMoire = (options = {}) => {
  if (typeof document === 'undefined') return '';
  const { hasMoire = false } = options;
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");

  // Dark background
  ctx.fillStyle = "#030712";
  ctx.fillRect(0, 0, 600, 400);

  // Central DC peak
  const dcGrad = ctx.createRadialGradient(300, 200, 2, 300, 200, 60);
  dcGrad.addColorStop(0, '#FFFFFF');
  dcGrad.addColorStop(0.2, '#38BDF8');
  dcGrad.addColorStop(0.6, '#0F172A');
  dcGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = dcGrad;
  ctx.fillRect(200, 100, 200, 200);

  if (hasMoire) {
    // Distinct periodic spikes indicating pixel grid recapture
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 1.5;
    for (let r = 80; r <= 160; r += 40) {
      ctx.beginPath();
      ctx.arc(300, 200, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // High frequency harmonic peaks
    const spots = [
      [220, 200], [380, 200], [300, 120], [300, 280],
      [240, 140], [360, 140], [240, 260], [360, 260]
    ];
    spots.forEach(([x, y]) => {
      const spGrad = ctx.createRadialGradient(x, y, 1, x, y, 14);
      spGrad.addColorStop(0, '#FFFFFF');
      spGrad.addColorStop(0.4, '#4ADE80');
      spGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = spGrad;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#4ADE80";
    ctx.fillText("PEAK HARMONIC RASTER DETECTED (Moiré Grid)", 160, 360);
  }

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
    ],
    forensicLayers: {
      ela_heatmap_base64: createSyntheticELAHeatmap({ tamperedField: null }),
      fft_moire_base64: createSyntheticFFTMoire({ hasMoire: false })
    }
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
    ],
    forensicLayers: {
      ela_heatmap_base64: createSyntheticELAHeatmap({ tamperedField: 'expiry' }),
      fft_moire_base64: createSyntheticFFTMoire({ hasMoire: false })
    }
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
    ],
    forensicLayers: {
      ela_heatmap_base64: createSyntheticELAHeatmap({ tamperedField: null }),
      fft_moire_base64: createSyntheticFFTMoire({ hasMoire: false })
    }
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
    ],
    forensicLayers: {
      ela_heatmap_base64: createSyntheticELAHeatmap({ tamperedField: null }),
      fft_moire_base64: createSyntheticFFTMoire({ hasMoire: true })
    }
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
    ],
    forensicLayers: {
      ela_heatmap_base64: createSyntheticELAHeatmap({ tamperedField: null }),
      fft_moire_base64: createSyntheticFFTMoire({ hasMoire: false })
    }
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
    ],
    forensicLayers: {
      ela_heatmap_base64: createSyntheticELAHeatmap({ tamperedField: null }),
      fft_moire_base64: createSyntheticFFTMoire({ hasMoire: false })
    }
  }
];
