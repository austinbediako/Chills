/**
 * Machine Moderation & Content Safety Scoring Engine
 * Analyzes text across: Sexist, Sexual, Explicit, 18+ (Adult), Racist / Hate Speech
 */

// Helper to sanitize HTML tags and decode basic leetspeak/obfuscation
function extractNormalizedText(htmlOrText = '') {
  const plain = htmlOrText
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .toLowerCase();

  // Normalized version with basic leetspeak deobfuscation
  const deobfuscated = plain
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/!/g, 'i')
    .replace(/3/g, 'e')
    .replace(/\+/g, 't');

  return { plain, deobfuscated };
}

// Category Dictionary & Pattern Matchers
const DICTIONARIES = {
  sexist: {
    label: 'SEXIST',
    severe: [
      /\b(misogynist|misogyny|bitch|cunt|slut|whore|femoid|incel|femi-nazi|feminazi)\b/gi,
      /\b(gold[\s-]?digger|thot|toxic[\s-]?masculinity|men[\s-]?are[\s-]?trash|kill[\s-]?all[\s-]?men)\b/gi,
      /\b(belong[s]?\s+in\s+the\s+kitchen|women\s+can['’]?t\s+lead|dumb\s+blonde)\b/gi,
    ],
    moderate: [
      /\b(patriarchy|chauvinist|chauvinism|mansplaining|manspreading|sexist|sexism)\b/gi,
      /\b(submissive\s+wife|nagging\s+wife|tradwife|alpha\s+male|beta\s+male)\b/gi,
      /\b(skank|hussy|bimbo|trollop)\b/gi,
    ],
  },
  sexual: {
    label: 'SEXUAL',
    severe: [
      /\b(porn|porno|pornography|hardcore\s+porn|gangbang|threesome|orgy|creampie|blowjob|handjob)\b/gi,
      /\b(dildo|vibrator|fleshlight|erotic\s+massage|camgirl|onlyfans\s+leak|deepthroat)\b/gi,
      /\b(penis|vagina|clitoris|erection|ejaculat(e|ion)|masturbat(e|ion)|orgasm|fellatio|cunnilingus)\b/gi,
    ],
    moderate: [
      /\b(erotica|erotic|sensual|nude|nudity|naked|stripper|strip\s+club|lingerie|cleavage)\b/gi,
      /\b(horny|aroused|lustful|seduction|fetish|kink|bdsm|dominatrix|voyeur)\b/gi,
      /\b(booty|tits|boobs|ass\s+cheeks|sexy|sex\s+toy)\b/gi,
    ],
  },
  explicit: {
    label: 'EXPLICIT',
    severe: [
      /\b(fuck|fucking|fucker|motherfucker|motherfucking|cunt|cocksucker|twat|wanker)\b/gi,
      /\b(gory|beheading|decapitat(e|ion)|mutilat(e|ion)|disembowel|massacre|bloodbath)\b/gi,
      /\b(snuff|torture\s+video|graphic\s+violence)\b/gi,
    ],
    moderate: [
      /\b(shit|bullshit|horseshit|asshole|bastard|dipshit|dumbass|jackass|dickhead)\b/gi,
      /\b(piss\s+off|goddamn|damn\s+it|bloody\s+hell|prick|bugger)\b/gi,
      /\b(violent|bloody|brutal|grotesque|murderous|slaughter)\b/gi,
    ],
  },
  eighteenPlus: {
    label: '18+',
    severe: [
      /\b(cocaine|heroin|methamphetamine|crystal\s+meth|fentanyl|crack\s+cocaine|lsd|mdma|ecstasy)\b/gi,
      /\b(buy\s+drugs|sell\s+drugs|drug\s+cartel|drug\s+trafficking|darknet\s+market)\b/gi,
      /\b(prostitut(e|ion)|escort\s+service|happy\s+ending\s+massage|brothel|sex\s+trafficking)\b/gi,
      /\b(unregistered\s+firearms|ghost\s+gun|silencer\s+sale|bomb\s+making|pipe\s+bomb)\b/gi,
    ],
    moderate: [
      /\b(casino|slot\s+machines|roulette|blackjack|sports\s+betting|online\s+gambling|crypto\s+casino)\b/gi,
      /\b(weed|cannabis|marijuana|thc|vape|tobacco|hookah|liquor|whiskey|vodka|get\s+drunk)\b/gi,
      /\b(over\s+18|adults\s+only|mature\s+audiences|not\s+safe\s+for\s+work|nsfw|xxx)\b/gi,
    ],
  },
  racist: {
    label: 'RACIST',
    severe: [
      /\b(nigger|nigga|kike|chink|gook|spic|wetback|towelhead|raghead|camel\s+jockey)\b/gi,
      /\b(white\s+supremacy|white\s+power|aryan\s+nation|neo-nazi|ku\s+klux\s+klan|kkk|swastika)\b/gi,
      /\b(racial\s+purity|ethnic\s+cleansing|sub-human\s+race|inferior\s+race|race\s+traitor)\b/gi,
      /\b(heil\s+hitler|gas\s+the\s+jews|anti-semit(e|ic|ism)|deport\s+all\s+(blacks|muslims|jews|mexicans))\b/gi,
    ],
    moderate: [
      /\b(xenophob(e|ia|ic)|racist|racism|racial\s+slur|hate\s+speech|bigot|bigotry)\b/gi,
      /\b(gipsy|gypsy|colored\s+people|oriental|redskin|half-breed)\b/gi,
      /\b(supremacist|segregationist|ethno-state)\b/gi,
    ],
  },
};

/**
 * Scan target text against dictionary patterns and calculate category score (0-100)
 */
function evaluateCategory(categoryKey, titleText, bodyText, tagsText) {
  const dict = DICTIONARIES[categoryKey];
  if (!dict) return { score: 0, flagged: false, matches: [] };

  const matchesFound = new Set();
  let rawScore = 0;

  // 1. Scan Severe Patterns (High Weight)
  dict.severe.forEach((pattern) => {
    // Title/Tag matches carry higher penalty
    const titleMatches = (titleText.match(pattern) || []).concat(tagsText.match(pattern) || []);
    if (titleMatches.length > 0) {
      rawScore += titleMatches.length * 45;
      titleMatches.forEach((m) => matchesFound.add(m.toLowerCase()));
    }

    const bodyMatches = bodyText.match(pattern) || [];
    if (bodyMatches.length > 0) {
      rawScore += bodyMatches.length * 30;
      bodyMatches.slice(0, 5).forEach((m) => matchesFound.add(m.toLowerCase()));
    }
  });

  // 2. Scan Moderate Patterns (Medium Weight)
  dict.moderate.forEach((pattern) => {
    const titleMatches = (titleText.match(pattern) || []).concat(tagsText.match(pattern) || []);
    if (titleMatches.length > 0) {
      rawScore += titleMatches.length * 20;
      titleMatches.forEach((m) => matchesFound.add(m.toLowerCase()));
    }

    const bodyMatches = bodyText.match(pattern) || [];
    if (bodyMatches.length > 0) {
      rawScore += bodyMatches.length * 10;
      bodyMatches.slice(0, 5).forEach((m) => matchesFound.add(m.toLowerCase()));
    }
  });

  // Normalize to 0-100 range
  const score = Math.min(100, Math.round(rawScore));
  const flagged = score >= 30;

  return {
    score,
    flagged,
    matches: Array.from(matchesFound),
  };
}

/**
 * Main moderation grading function
 * Evaluates a submission document and returns scores, grades, flags, and labels
 */
export function analyzeSubmission(submissionData) {
  const { title = '', abstract = '', content = '', tags = [] } = submissionData;

  const normalizedTitle = extractNormalizedText(title);
  const normalizedAbstract = extractNormalizedText(abstract);
  const normalizedContent = extractNormalizedText(content);
  const normalizedTags = extractNormalizedText(Array.isArray(tags) ? tags.join(' ') : String(tags));

  const titleText = `${normalizedTitle.plain} ${normalizedTitle.deobfuscated}`;
  const bodyText = `${normalizedAbstract.plain} ${normalizedAbstract.deobfuscated} ${normalizedContent.plain} ${normalizedContent.deobfuscated}`;
  const tagsText = `${normalizedTags.plain} ${normalizedTags.deobfuscated}`;

  const categories = {
    sexist: evaluateCategory('sexist', titleText, bodyText, tagsText),
    sexual: evaluateCategory('sexual', titleText, bodyText, tagsText),
    explicit: evaluateCategory('explicit', titleText, bodyText, tagsText),
    eighteenPlus: evaluateCategory('eighteenPlus', titleText, bodyText, tagsText),
    racist: evaluateCategory('racist', titleText, bodyText, tagsText),
  };

  // Compute Overall Score (0-100)
  const categoryScores = [
    categories.sexist.score,
    categories.sexual.score,
    categories.explicit.score,
    categories.eighteenPlus.score,
    categories.racist.score,
  ];

  const maxCategoryScore = Math.max(...categoryScores);
  const averageOtherScores =
    categoryScores.reduce((acc, curr) => acc + curr, 0) - maxCategoryScore;

  // Composite overall score: heavily weighted by max violation + residual violations
  const overallScore = Math.min(
    100,
    Math.round(maxCategoryScore * 0.85 + (averageOtherScores / 4) * 0.15)
  );

  // Collect flagged labels
  const labels = [];
  if (categories.sexist.flagged) labels.push('SEXIST');
  if (categories.sexual.flagged) labels.push('SEXUAL');
  if (categories.explicit.flagged) labels.push('EXPLICIT');
  if (categories.eighteenPlus.flagged) labels.push('18+');
  if (categories.racist.flagged) labels.push('RACIST');

  // Overall grade
  let grade = 'CLEAN';
  if (overallScore >= 70) {
    grade = 'CRITICAL';
  } else if (overallScore >= 40 || labels.length > 0) {
    grade = 'FLAGGED';
  } else if (overallScore >= 20) {
    grade = 'MILD';
  }

  const flagged = grade === 'FLAGGED' || grade === 'CRITICAL' || labels.length > 0;

  // Human-readable summary
  let summary = 'Clean and safe content';
  if (flagged) {
    summary = `Flagged for ${labels.join(', ')} content (Score: ${overallScore}/100)`;
  } else if (grade === 'MILD') {
    summary = `Mild mature/borderline indicators detected (Score: ${overallScore}/100)`;
  }

  return {
    overallScore,
    grade,
    flagged,
    labels,
    summary,
    categories,
    analyzedAt: new Date(),
  };
}

/**
 * Machine Callback Function
 * Emits prominent, formatted diagnostic logs to the machine console (terminal output)
 */
export function executeMachineCallback(submission, moderationResult, authorInfo = null) {
  const timestamp = new Date().toISOString();
  const title = submission.title || 'Untitled';
  const id = submission._id || submission.id || 'N/A';
  const authorName =
    authorInfo?.name || authorInfo?.username || authorInfo?.email || 'Registered User';
  const authorEmail = authorInfo?.email ? ` (${authorInfo.email})` : '';

  const isFlagged = moderationResult.flagged;
  const gradeBadge =
    moderationResult.grade === 'CRITICAL'
      ? '\x1b[41m\x1b[37m CRITICAL RISK \x1b[0m'
      : moderationResult.grade === 'FLAGGED'
      ? '\x1b[43m\x1b[30m FLAGGED \x1b[0m'
      : moderationResult.grade === 'MILD'
      ? '\x1b[33mMILD RISK\x1b[0m'
      : '\x1b[32mCLEAN / SAFE\x1b[0m';

  console.log('\n' + '─'.repeat(78));
  console.log(
    `🤖 \x1b[1m\x1b[36m[MACHINE MODERATION CALLBACK]\x1b[0m ${
      isFlagged
        ? '⚠️  \x1b[31mFLAGGED CONTENT DETECTED\x1b[0m'
        : '✅ \x1b[32mAUTO-PUBLISHED & APPROVED\x1b[0m'
    }`
  );
  console.log('─'.repeat(78));
  console.log(`  📝 Story:         "${title}"`);
  console.log(`  🆔 Story ID:      ${id}`);
  console.log(`  👤 Author:        ${authorName}${authorEmail}`);
  console.log(`  🚀 Status:        PUBLISHED (Instant auto-publish active)`);
  console.log(`  🎯 Overall Score: ${moderationResult.overallScore}/100  Grade: ${gradeBadge}`);
  console.log(
    `  🏷️  Labels:        ${
      moderationResult.labels.length > 0 ? moderationResult.labels.join(' | ') : 'NONE (Clean Content)'
    }`
  );
  console.log(`  📊 Category Breakdown:`);
  console.log(
    `     • Sexist:      ${String(moderationResult.categories.sexist.score).padStart(3)}/100 ${
      moderationResult.categories.sexist.flagged ? '⚠️ [FLAGGED]' : '✓ [CLEAN]'
    }`
  );
  console.log(
    `     • Sexual:      ${String(moderationResult.categories.sexual.score).padStart(3)}/100 ${
      moderationResult.categories.sexual.flagged ? '⚠️ [FLAGGED]' : '✓ [CLEAN]'
    }`
  );
  console.log(
    `     • Explicit:    ${String(moderationResult.categories.explicit.score).padStart(3)}/100 ${
      moderationResult.categories.explicit.flagged ? '⚠️ [FLAGGED]' : '✓ [CLEAN]'
    }`
  );
  console.log(
    `     • 18+ (Adult): ${String(moderationResult.categories.eighteenPlus.score).padStart(3)}/100 ${
      moderationResult.categories.eighteenPlus.flagged ? '⚠️ [FLAGGED]' : '✓ [CLEAN]'
    }`
  );
  console.log(
    `     • Racist:      ${String(moderationResult.categories.racist.score).padStart(3)}/100 ${
      moderationResult.categories.racist.flagged ? '⚠️ [FLAGGED]' : '✓ [CLEAN]'
    }`
  );

  if (isFlagged) {
    const triggers = [];
    Object.entries(moderationResult.categories).forEach(([catKey, catData]) => {
      if (catData.matches && catData.matches.length > 0) {
        triggers.push(`${catKey}: [${catData.matches.slice(0, 4).join(', ')}]`);
      }
    });
    if (triggers.length > 0) {
      console.log(`  🔍 Detected Indicators: ${triggers.join(' | ')}`);
    }
  }

  console.log(`  ⏱️  Machine Time:  ${timestamp}`);
  console.log('─'.repeat(78) + '\n');
}
