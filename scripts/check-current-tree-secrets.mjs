#!/usr/bin/env node

import { createReadStream, existsSync, lstatSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const TEXT_EXTENSIONS = new Set([
  '.bat', '.cjs', '.cmd', '.conf', '.config', '.css', '.csv', '.env',
  '.gql', '.gradle', '.graphql', '.har', '.htm', '.html', '.ini', '.java',
  '.js', '.json', '.jsonl', '.jsx', '.key', '.kt', '.md', '.mjs', '.pem',
  '.properties', '.ps1', '.py', '.rb', '.rs', '.scss', '.sh', '.sql', '.svg',
  '.toml', '.ts', '.tsv', '.tsx', '.txt', '.webmanifest', '.xml', '.yaml',
  '.yml',
]);

const TEXT_FILENAMES = new Set([
  '.gitignore', '.npmrc', 'dockerfile', 'license', 'makefile', 'procfile',
]);

const FALLBACK_EXCLUDED_DIRECTORIES = new Set([
  '.git', '.npm', 'coverage', 'node_modules', 'playwright-report', 'public',
  'test-results', 'test-results-smoke',
]);

const TOKEN_DETECTORS = [
  {
    name: 'AWS access-key identifier',
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    name: 'GitHub token',
    pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{20,})\b/,
  },
  {
    name: 'GitLab personal access token',
    pattern: /\bglpat-[A-Za-z0-9_-]{20,}\b/,
  },
  {
    name: 'Google API key',
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/,
  },
  {
    name: 'OpenAI, Anthropic, or live secret key',
    pattern: /\bsk-(?:proj|ant|live)-[A-Za-z0-9_-]{20,}\b/,
  },
  {
    name: 'Slack token',
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  },
  {
    name: 'Supabase personal access token',
    pattern: /\bsbp_[A-Za-z0-9_-]{20,}\b/,
  },
  {
    name: 'Cloudflare R2 access-key identifier',
    pattern: /["']?\b(?:(?:[A-Z0-9]+_)*R2_(?:ACCESS_KEY|ACCESS_KEY_ID)|ACCESS_KEY|ACCESS_KEY_ID|aws_access_key_id)\b["']?\s*[:=]\s*["'][0-9a-f]{32}["']/i,
  },
  {
    name: 'Cloudflare R2 secret access key',
    pattern: /["']?\b(?:(?:[A-Z0-9]+_)*R2_(?:SECRET_KEY|SECRET_ACCESS_KEY)|SECRET_KEY|SECRET_ACCESS_KEY|aws_secret_access_key)\b["']?\s*[:=]\s*["'][0-9a-f]{64}["']/i,
  },
  {
    name: 'PEM private key block',
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]{32,}?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    name: 'Assigned high-entropy secret',
    pattern: /(?:client_secret|api_secret|service_role_key)\s*["']?\s*[:=]\s*["'][A-Za-z0-9_+\/=.-]{24,}["']/i,
  },
];

function parseArguments(argv) {
  const result = {
    root: '.',
    selfTest: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--root') {
      if (!argv[index + 1]) {
        throw new Error('--root requires a directory argument.');
      }
      result.root = argv[index + 1];
      index += 1;
    } else if (argument === '--self-test') {
      result.selfTest = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return result;
}

function normalizeRelativePath(value) {
  return value.split(sep).join('/').replace(/^\.\//, '');
}

function isForbiddenCredentialPath(relativePath) {
  const normalized = normalizeRelativePath(relativePath).toLowerCase();
  const name = normalized.split('/').at(-1) || normalized;
  const isEnvironmentFile = name === '.env'
    || (name.startsWith('.env.') && !name.endsWith('.example'));

  return isEnvironmentFile || normalized === 'backend/stellar-ai-key.json';
}

function isTextCandidate(relativePath) {
  const normalized = normalizeRelativePath(relativePath).toLowerCase();
  const name = normalized.split('/').at(-1) || normalized;
  return isForbiddenCredentialPath(normalized)
    || TEXT_EXTENSIONS.has(extname(name))
    || TEXT_FILENAMES.has(name);
}

function listGitWorkingTreeFiles(root) {
  const result = spawnSync(
    'git',
    ['-C', root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    {
      encoding: 'buffer',
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true,
    },
  );

  if (result.status !== 0) {
    return null;
  }

  return result.stdout
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .map(normalizeRelativePath);
}

function listFilesRecursively(root) {
  const files = [];
  const pending = [root];

  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) {
        continue;
      }
      if (entry.isDirectory()) {
        if (!FALLBACK_EXCLUDED_DIRECTORIES.has(entry.name.toLowerCase())) {
          pending.push(join(current, entry.name));
        }
        continue;
      }
      if (entry.isFile()) {
        files.push(normalizeRelativePath(relative(root, join(current, entry.name))));
      }
    }
  }

  return files;
}

function detectSecrets(text, state) {
  for (const detector of TOKEN_DETECTORS) {
    if (detector.pattern.test(text)) {
      state.matches.add(detector.name);
    }
  }

  if (/"type"\s*:\s*"service_account"/.test(text)) {
    state.googleServiceAccountType = true;
  }
  if (/"private_key"\s*:\s*"-----BEGIN PRIVATE KEY-----/.test(text)) {
    state.googlePrivateKeyField = true;
  }
  if (state.googleServiceAccountType && state.googlePrivateKeyField) {
    state.matches.add('Google Cloud service-account credential');
  }
}

async function scanFile(absolutePath) {
  const state = {
    googlePrivateKeyField: false,
    googleServiceAccountType: false,
    matches: new Set(),
  };
  let carry = '';

  for await (const chunk of createReadStream(absolutePath, { encoding: 'utf8' })) {
    const window = carry + chunk;
    detectSecrets(window, state);
    carry = window.slice(-65536);
  }

  return state.matches;
}

function runSelfTest() {
  if (!isForbiddenCredentialPath('.env')
    || !isForbiddenCredentialPath('backend/stellar-ai-key.json')
    || isForbiddenCredentialPath('.env.example')) {
    throw new Error('Forbidden credential filename self-test failed.');
  }

  const safeExample = '-----BEGIN OPENSSH PRIVATE KEY-----\n...';
  const safeState = {
    googlePrivateKeyField: false,
    googleServiceAccountType: false,
    matches: new Set(),
  };
  detectSecrets(safeExample, safeState);
  if (safeState.matches.size !== 0) {
    throw new Error('Documentation placeholders must not be reported as credentials.');
  }

  const syntheticToken = 'sbp_' + 'A'.repeat(32);
  const tokenState = {
    googlePrivateKeyField: false,
    googleServiceAccountType: false,
    matches: new Set(),
  };
  detectSecrets(syntheticToken, tokenState);
  if (!tokenState.matches.has('Supabase personal access token')) {
    throw new Error('Supabase token detector self-test failed.');
  }

  const syntheticR2Credentials = [
    'STARSECTOR_R2_' + 'ACCESS_KEY_ID = "' + 'a'.repeat(32) + '"',
    'T5_R2_' + 'SECRET_ACCESS_KEY = "' + 'b'.repeat(64) + '"',
  ].join('\n');
  const r2State = {
    googlePrivateKeyField: false,
    googleServiceAccountType: false,
    matches: new Set(),
  };
  detectSecrets(syntheticR2Credentials, r2State);
  if (!r2State.matches.has('Cloudflare R2 access-key identifier')
    || !r2State.matches.has('Cloudflare R2 secret access key')) {
    throw new Error('Cloudflare R2 credential detector self-test failed.');
  }

  const safeR2EnvironmentLookup = [
    'R2_' + 'ACCESS_KEY = require_env("R2_ACCESS_KEY_ID")',
    'R2_' + 'SECRET_KEY = require_env("R2_SECRET_ACCESS_KEY")',
  ].join('\n');
  const safeR2State = {
    googlePrivateKeyField: false,
    googleServiceAccountType: false,
    matches: new Set(),
  };
  detectSecrets(safeR2EnvironmentLookup, safeR2State);
  if (safeR2State.matches.size !== 0) {
    throw new Error('Environment-only R2 configuration must not be reported as a credential.');
  }

  const syntheticPrivateKey = [
    '-----' + 'BEGIN PRIVATE KEY' + '-----',
    'A'.repeat(64),
    '-----' + 'END PRIVATE KEY' + '-----',
  ].join('\n');
  const keyState = {
    googlePrivateKeyField: false,
    googleServiceAccountType: false,
    matches: new Set(),
  };
  detectSecrets(syntheticPrivateKey, keyState);
  if (!keyState.matches.has('PEM private key block')) {
    throw new Error('Private-key detector self-test failed.');
  }

  const syntheticServiceAccount = JSON.stringify({
    private_key: '-----' + 'BEGIN PRIVATE KEY' + '-----\\n' + 'A'.repeat(64),
    type: 'service_' + 'account',
  });
  const serviceAccountState = {
    googlePrivateKeyField: false,
    googleServiceAccountType: false,
    matches: new Set(),
  };
  detectSecrets(syntheticServiceAccount, serviceAccountState);
  if (!serviceAccountState.matches.has('Google Cloud service-account credential')) {
    throw new Error('Google Cloud service-account detector self-test failed.');
  }

  console.log('Credential detector self-test passed.');
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.selfTest) {
    runSelfTest();
    return;
  }

  const root = resolve(options.root);
  if (!existsSync(root) || !lstatSync(root).isDirectory()) {
    throw new Error(`Scan root is not a directory: ${root}`);
  }

  const gitFiles = listGitWorkingTreeFiles(root);
  const files = (gitFiles || listFilesRecursively(root))
    .filter(isTextCandidate)
    .sort((left, right) => left.localeCompare(right));

  const findings = [];
  const readErrors = [];
  let scannedFiles = 0;

  for (const relativePath of files) {
    const absolutePath = join(root, ...relativePath.split('/'));
    if (!existsSync(absolutePath)) {
      continue;
    }

    if (isForbiddenCredentialPath(relativePath)) {
      findings.push({
        detectors: ['forbidden credential filename'],
        path: relativePath,
      });
      continue;
    }

    try {
      const matches = await scanFile(absolutePath);
      scannedFiles += 1;
      if (matches.size > 0) {
        findings.push({
          detectors: [...matches].sort(),
          path: relativePath,
        });
      }
    } catch (error) {
      readErrors.push({
        error: error instanceof Error ? error.message : String(error),
        path: relativePath,
      });
    }
  }

  if (readErrors.length > 0) {
    console.error(`Credential scan could not read ${readErrors.length} candidate file(s).`);
    for (const item of readErrors) {
      console.error(`- ${item.path}: ${item.error}`);
    }
    process.exitCode = 2;
    return;
  }

  if (findings.length > 0) {
    console.error(`Credential scan failed: ${findings.length} file(s) matched.`);
    for (const finding of findings) {
      console.error(`- ${finding.path} [${finding.detectors.join(', ')}]`);
    }
    console.error('Matched credential contents are intentionally omitted.');
    process.exitCode = 1;
    return;
  }

  const source = gitFiles ? 'Git working tree' : 'filesystem fallback';
  console.log(`Credential scan passed: ${scannedFiles} text files checked from the ${source}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
