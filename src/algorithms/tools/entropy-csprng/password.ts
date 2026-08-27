/**
 * Password Entropy & Brute-Force Strength Estimator
 * Theoretical Upper-Bound Information Model: H = L * log2(|R|)
 *
 * Note: Attributed to classical information theory / security literature.
 * Per modern NIST SP 800-63B guidelines, passphrases prioritizing LENGTH
 * over mandatory composition rules provide greater real-world resistance
 * against dictionary and pattern attacks.
 */

export interface PasswordEntropyResult {
  passwordLength: number;
  poolSize: number;
  shannonEntropyBits: number;
  poolComposition: {
    hasLower: boolean;
    hasUpper: boolean;
    hasDigits: boolean;
    hasSymbols: boolean;
    hasUnicode: boolean;
    breakdown: string[];
  };
  searchSpaceSize: string; // e.g. "2^78.8" or scientific notation
  crackTimes: {
    onlineThrottled: string;      // 1,000 / sec
    offlineSingleGpu: string;     // 10^8 / sec
    offlineCluster: string;       // 10^10 / sec
  };
  strengthCategory: 'very-weak' | 'weak' | 'moderate' | 'strong' | 'very-strong' | 'cryptographic';
  strengthScore: number; // 0 to 100
  summary: string;
  nistGuidanceNotes: string;
}

export function formatCrackDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds > 1e25) return '> 100 quintillion years';
  if (seconds < 0.001) return '< 1 millisecond (Instant)';
  if (seconds < 1) return '< 1 second (Instant)';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} minutes`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hours`;
  if (seconds < 31536000) return `${(seconds / 86400).toFixed(1)} days`;

  const years = seconds / 31536000;
  if (years < 100) return `${years.toFixed(1)} years`;
  if (years < 1000) return `${Math.round(years)} years`;
  if (years < 1e6) return `${(years / 1e3).toFixed(1)} thousand years`;
  if (years < 1e9) return `${(years / 1e6).toFixed(1)} million years`;
  if (years < 1e12) return `${(years / 1e9).toFixed(1)} billion years`;
  return `${(years / 1e12).toFixed(1)} trillion years`;
}

export function computePasswordEntropy(password: string): PasswordEntropyResult {
  const L = password.length;

  if (L === 0) {
    return {
      passwordLength: 0,
      poolSize: 0,
      shannonEntropyBits: 0,
      poolComposition: {
        hasLower: false,
        hasUpper: false,
        hasDigits: false,
        hasSymbols: false,
        hasUnicode: false,
        breakdown: [],
      },
      searchSpaceSize: '0',
      crackTimes: {
        onlineThrottled: 'Instant',
        offlineSingleGpu: 'Instant',
        offlineCluster: 'Instant',
      },
      strengthCategory: 'very-weak',
      strengthScore: 0,
      summary: 'Empty password — 0 bits of entropy.',
      nistGuidanceNotes: 'Please enter a password or passphrase to analyze.',
    };
  }

  let pool = 0;
  const breakdown: string[] = [];

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigits = /[0-9]/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;':",.<>?/`~\\ ]/.test(password);
  const hasUnicode = /[^\x00-\x7F]/.test(password);

  if (hasLower) { pool += 26; breakdown.push('Lowercase (26)'); }
  if (hasUpper) { pool += 26; breakdown.push('Uppercase (26)'); }
  if (hasDigits) { pool += 10; breakdown.push('Digits (10)'); }
  if (hasSymbols) { pool += 33; breakdown.push('Symbols & Punctuation (33)'); }
  if (hasUnicode) { pool += 50; breakdown.push('Unicode / Extended Characters (50+)'); }

  const bitsPerChar = pool > 0 ? Math.log2(pool) : 0;
  const totalBits = Number((L * bitsPerChar).toFixed(2));

  // Combinations N = pool^L = 2^totalBits
  // Average attempts to crack = N / 2
  // We use BigInt or Number for seconds = (2^totalBits) / (2 * rate)
  const computeSeconds = (rate: number): number => {
    if (totalBits <= 0) return 0;
    if (totalBits > 100) return Infinity; // astronomical
    const combinations = Math.pow(2, totalBits);
    return (combinations / 2) / rate;
  };

  const tOnline = formatCrackDuration(computeSeconds(1000));
  const tSingleGpu = formatCrackDuration(computeSeconds(1e8));
  const tCluster = formatCrackDuration(computeSeconds(1e10));

  let category: PasswordEntropyResult['strengthCategory'];
  let score: number;
  let summary: string;

  if (totalBits < 28) {
    category = 'very-weak';
    score = Math.min(25, Math.round((totalBits / 28) * 25));
    summary = 'Very Weak — Trivially compromised by automated tools in seconds.';
  } else if (totalBits < 36) {
    category = 'weak';
    score = 25 + Math.round(((totalBits - 28) / 8) * 20);
    summary = 'Weak — Vulnerable to basic offline cracking rigs in minutes to hours.';
  } else if (totalBits < 60) {
    category = 'moderate';
    score = 45 + Math.round(((totalBits - 36) / 24) * 25);
    summary = 'Moderate — Resistant to online guessing; vulnerable to targeted offline clusters.';
  } else if (totalBits < 80) {
    category = 'strong';
    score = 70 + Math.round(((totalBits - 60) / 20) * 15);
    summary = 'Strong — Robust against offline dictionary & brute-force attacks.';
  } else if (totalBits < 128) {
    category = 'very-strong';
    score = 85 + Math.round(((totalBits - 80) / 48) * 15);
    summary = 'Very Strong — Exceptional brute-force resistance (astronomical crack time).';
  } else {
    category = 'cryptographic';
    score = 100;
    summary = 'Cryptographic Grade — Computationally intractable to brute-force.';
  }

  const nistGuidanceNotes = 
    'Theoretical Model Note: This score assumes uniform random selection across the detected character pool. ' +
    'NIST SP 800-63B emphasizes that LENGTH is the primary security factor. Composition rules often incentivize ' +
    'predictable substitutions (e.g. "P@ssw0rd1!") that receive high theoretical scores but are weak against dictionary attacks, ' +
    'whereas long multi-word passphrases (e.g. "correct horse battery staple") offer vastly superior practical defense.';

  return {
    passwordLength: L,
    poolSize: pool,
    shannonEntropyBits: totalBits,
    poolComposition: {
      hasLower,
      hasUpper,
      hasDigits,
      hasSymbols,
      hasUnicode,
      breakdown,
    },
    searchSpaceSize: totalBits > 0 ? `2^${totalBits.toFixed(1)} (~10^${(totalBits * 0.30103).toFixed(1)})` : '0',
    crackTimes: {
      onlineThrottled: tOnline,
      offlineSingleGpu: tSingleGpu,
      offlineCluster: tCluster,
    },
    strengthCategory: category,
    strengthScore: score,
    summary,
    nistGuidanceNotes,
  };
}
