#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  c,
  log,
  step,
  ok,
  warn,
  err,
  toSlug,
  toScheme,
  toDisplayName,
  isValidDisplayName,
  defaultBundleId,
  isValidBundleId,
  isValidSlug,
  resolveTarget,
  currentYear,
} = require("../lib/utils");
const { createPrompter } = require("../lib/prompt");
const {
  copyDir,
  transformTree,
  applyFeatures,
  restoreDotfiles,
  prepareEnv,
  dropStaleLockfile,
  detectPackageManager,
  installDeps,
  gitInit,
  SUPPORTED_PMS,
} = require("../lib/scaffold");
const {
  FEATURES,
  PRESETS,
  DEFAULT_PRESET,
  featureNames,
  isPreset,
  resolveFeatures,
  matchingPreset,
} = require("../lib/features");
const { checkForUpdate } = require("../lib/version-check");

const TEMPLATE_DIR = path.join(__dirname, "..", "template");
const pkg = require("../package.json");

// ── arg parsing ──────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = {
    name: undefined,
    dir: undefined,
    bundleId: undefined,
    preset: undefined,
    packageManager: undefined,
    install: undefined, // undefined = ask
    git: undefined,
    yes: false,
    dryRun: false,
    features: {}, // explicit --feature / --no-feature overrides
    errors: [],
  };
  const positional = [];

  /** Read the value for a flag, supporting both `--flag v` and `--flag=v`. */
  const takeValue = (arg, index) => {
    if (arg.includes("=")) return [arg.slice(arg.indexOf("=") + 1), index];
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("-")) {
      opts.errors.push(`Missing value for ${arg.split("=")[0]}`);
      return [undefined, index];
    }
    return [next, index + 1];
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const flag = a.split("=")[0];

    if (a === "--help" || a === "-h") opts.help = true;
    else if (a === "--version" || a === "-v") opts.version = true;
    else if (a === "--yes" || a === "-y") opts.yes = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--no-install") opts.install = false;
    else if (a === "--install") opts.install = true;
    else if (a === "--no-git") opts.git = false;
    else if (a === "--git") opts.git = true;
    else if (flag === "--bundle-id") [opts.bundleId, i] = takeValue(a, i);
    else if (flag === "--preset") [opts.preset, i] = takeValue(a, i);
    else if (flag === "--dir") [opts.dir, i] = takeValue(a, i);
    else if (flag === "--pm" || flag === "--package-manager") {
      [opts.packageManager, i] = takeValue(a, i);
    } else if (a.startsWith("--no-") && featureNames().includes(a.slice(5))) {
      opts.features[a.slice(5)] = false;
    } else if (a.startsWith("--") && featureNames().includes(a.slice(2))) {
      opts.features[a.slice(2)] = true;
    } else if (a.startsWith("-")) {
      opts.errors.push(`Unknown option: ${a}`);
    } else {
      positional.push(a);
    }
  }

  if (positional.length) opts.name = positional[0];
  if (positional.length > 1) {
    opts.errors.push(
      `Unexpected extra arguments: ${positional.slice(1).join(", ")}`,
    );
  }

  return opts;
}

function printHelp() {
  const featureList = Object.entries(FEATURES)
    .map(([name, spec]) => `  --${name} / --no-${name}`.padEnd(28) + spec.label)
    .join("\n");

  const presetList = Object.entries(PRESETS)
    .map(([name, preset]) => {
      const on = featureNames().filter((f) => preset[f]);
      const summary = on.length ? on.join(", ") : "core only";
      const suffix = name === DEFAULT_PRESET ? c.dim(" (default)") : "";
      return `  ${name.padEnd(10)} ${c.dim(summary)}${suffix}`;
    })
    .join("\n");

  log(`
${c.bold(pkg.name)} ${c.dim(`v${pkg.version}`)} — scaffold a production-ready Expo app

${c.bold("Usage")}
  npx ${pkg.name} ${c.dim("[project-name] [options]")}

${c.bold("Options")}
  --bundle-id <id>     Reverse-DNS app identifier (e.g. com.acme.myapp)
  --preset <name>      Feature bundle to start from
  --dir <path>         Directory to create the project in (default: ./<slug>)
  --pm <manager>       npm | yarn | pnpm | bun (default: the one running this)
  --no-install         Skip dependency installation
  --no-git             Skip git repository initialisation
  --dry-run            Print what would be created without writing anything
  -y, --yes            Accept all defaults, no prompts
  -h, --help           Show this help
  -v, --version        Show version

${c.bold("Presets")}
${presetList}

${c.bold("Features")} ${c.dim("(override any preset)")}
${featureList}

${c.bold("Examples")}
  npx ${pkg.name} awesome-app --bundle-id com.acme.awesome
  npx ${pkg.name} awesome-app --preset full --pm pnpm
  npx ${pkg.name} awesome-app -y --preset minimal --no-install
`);
}

/** One-line summary of the enabled features. */
function describeFeatures(features) {
  const enabled = featureNames().filter((f) => features[f]);
  return enabled.length ? enabled.join(", ") : "core only";
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) return printHelp();
  if (opts.version) return log(pkg.version);

  if (opts.errors.length) {
    opts.errors.forEach(err);
    log(c.dim(`\nRun \`npx ${pkg.name} --help\` for usage.`));
    process.exit(1);
  }

  if (opts.preset && !isPreset(opts.preset)) {
    err(
      `Unknown preset "${opts.preset}". Choose one of: ${Object.keys(PRESETS).join(", ")}.`,
    );
    process.exit(1);
  }

  if (opts.packageManager && !SUPPORTED_PMS.has(opts.packageManager)) {
    err(
      `Unknown package manager "${opts.packageManager}". Choose one of: ${[...SUPPORTED_PMS].join(", ")}.`,
    );
    process.exit(1);
  }

  log("");
  log(`${c.magenta(c.bold("◆ create-expo-starter"))}`);
  log(c.dim("  Expo SDK 58 · expo-router · Redux Toolkit · TypeScript\n"));

  if (!fs.existsSync(TEMPLATE_DIR)) {
    err("Bundled template/ directory is missing — the package is corrupt.");
    process.exit(1);
  }

  // Kick the registry lookup off now so the network round-trip overlaps with
  // the prompts instead of adding to the total runtime.
  const updatePromise = checkForUpdate(pkg.name, pkg.version);

  /**
   * Only prompt when there is a human to answer.
   *
   * Without the TTY check, running this from a script, a Dockerfile or CI
   * blocks on a question nobody can see — or worse, reads EOF and silently
   * accepts whatever the empty answer maps to. Non-interactive runs take the
   * documented defaults, which is what `--yes` does explicitly.
   */
  const interactive = Boolean(process.stdin.isTTY) && !opts.yes;

  if (!interactive && !opts.yes && !process.stdin.isTTY) {
    log(c.dim("  Non-interactive terminal detected — using defaults.\n"));
  }

  const prompter = interactive ? createPrompter() : null;

  try {
    // ── project name ──────────────────────────────────────────────────────
    const projectName =
      opts.name ||
      (!interactive
        ? "my-expo-app"
        : await prompter.ask("Project name", {
            defaultValue: "my-expo-app",
            validate: (v) => {
              if (!isValidDisplayName(v)) {
                return "Avoid quotes, backslashes and angle brackets.";
              }
              return isValidSlug(toSlug(v))
                ? true
                : "Use letters, numbers, spaces or hyphens.";
            },
          }));

    if (!isValidDisplayName(projectName)) {
      err(`Invalid project name: ${projectName}`);
      process.exit(1);
    }

    const slug = toSlug(projectName);
    if (!isValidSlug(slug)) {
      err(`Could not derive a valid project slug from "${projectName}".`);
      process.exit(1);
    }

    const target = opts.dir
      ? path.resolve(process.cwd(), opts.dir)
      : resolveTarget(process.cwd(), slug);

    if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
      err(
        `Directory "${path.relative(process.cwd(), target) || "."}" already exists and is not empty.`,
      );
      process.exit(1);
    }

    // ── bundle id ─────────────────────────────────────────────────────────
    const bundleDefault = defaultBundleId(slug);
    const bundleId =
      opts.bundleId ||
      (!interactive
        ? bundleDefault
        : await prompter.ask("Bundle / package identifier", {
            defaultValue: bundleDefault,
            validate: (v) =>
              isValidBundleId(v)
                ? true
                : "Must be reverse-DNS, e.g. com.acme.myapp",
          }));

    if (!isValidBundleId(bundleId)) {
      err(`Invalid bundle identifier: ${bundleId}`);
      process.exit(1);
    }

    // ── features ──────────────────────────────────────────────────────────
    let presetName = opts.preset;
    const hasExplicitFeatures = Object.keys(opts.features).length > 0;

    if (!presetName && interactive && !hasExplicitFeatures) {
      presetName = await prompter.select(
        "Which features do you want?",
        Object.entries(PRESETS).map(([name, preset]) => ({
          value: name,
          label: name,
          hint: featureNames().filter((f) => preset[f]).join(", ") || "core only",
        })),
        DEFAULT_PRESET,
      );
    }

    const features = resolveFeatures(presetName ?? DEFAULT_PRESET, opts.features);

    // ── install / git decisions ───────────────────────────────────────────
    const wantInstall =
      opts.install !== undefined
        ? opts.install
        : !interactive
          ? true
          : await prompter.confirm("Install dependencies now?", true);

    const wantGit =
      opts.git !== undefined
        ? opts.git
        : !interactive
          ? true
          : await prompter.confirm("Initialise a git repository?", true);

    prompter?.close();

    const displayName = toDisplayName(projectName);
    const scheme = toScheme(slug);
    const pm = opts.packageManager || detectPackageManager();
    const relativeTarget = path.relative(process.cwd(), target) || ".";

    // ── summary ───────────────────────────────────────────────────────────
    log("");
    log(c.bold("  Creating project with:"));
    log(`    ${c.dim("name        ")} ${displayName}`);
    log(`    ${c.dim("slug        ")} ${slug}`);
    log(`    ${c.dim("scheme      ")} ${scheme}`);
    log(`    ${c.dim("bundle id   ")} ${bundleId}`);
    log(`    ${c.dim("location    ")} ${relativeTarget}`);
    log(
      `    ${c.dim("features    ")} ${describeFeatures(features)}` +
        c.dim(
          matchingPreset(features) ? ` (${matchingPreset(features)})` : " (custom)",
        ),
    );
    log(`    ${c.dim("package mgr ")} ${pm}`);
    log("");

    if (opts.dryRun) {
      const disabled = featureNames().filter((f) => !features[f]);
      log(c.yellow("  Dry run — nothing was written."));
      if (disabled.length) {
        log(c.dim(`  Would omit: ${disabled.join(", ")}`));
      }
      log("");
      return;
    }

    // ── scaffold ──────────────────────────────────────────────────────────
    step("Copying template files…");
    copyDir(TEMPLATE_DIR, target);

    step("Applying your project details…");
    const tokens = {
      __APP_DISPLAY_NAME__: displayName,
      __APP_SLUG__: slug,
      __APP_SCHEME__: scheme,
      __APP_BUNDLE_ID__: bundleId,
      __APP_YEAR__: currentYear(),
    };
    const changed = transformTree(target, tokens, features);
    restoreDotfiles(target);
    ok(`Updated ${changed} file${changed === 1 ? "" : "s"}.`);

    const disabledFeatures = featureNames().filter((f) => !features[f]);
    if (disabledFeatures.length) {
      step("Removing features you didn't select…");
      const removed = applyFeatures(target, features);
      ok(
        `Omitted ${disabledFeatures.join(", ")}` +
          (removed.length ? ` (${removed.length} files).` : "."),
      );
      if (dropStaleLockfile(target, true)) {
        log(
          c.dim(
            "    Dropped the bundled lockfile — it no longer matches the pruned dependency list.",
          ),
        );
      }
    } else {
      applyFeatures(target, features);
    }

    step("Setting up environment files…");
    prepareEnv(target);
    ok("Created .env from .env.example.");

    // ── deps ──────────────────────────────────────────────────────────────
    if (wantInstall) {
      step(`Installing dependencies with ${pm}… (this can take a minute)`);
      if (installDeps(target, pm)) ok("Dependencies installed.");
      else warn(`"${pm} install" failed — run it manually after.`);
    } else {
      warn("Skipped dependency installation.");
    }

    // ── git ───────────────────────────────────────────────────────────────
    if (wantGit) {
      step("Initialising git repository…");
      const result = gitInit(target);
      if (result === true) ok("Git repository initialised.");
      else if (result === "no-commit") {
        warn("Git repository initialised, but the first commit failed.");
        log(c.dim("    Set user.name / user.email, then commit manually."));
      } else {
        warn("git init failed or git is not installed — skipped.");
      }
    }

    // ── next steps ────────────────────────────────────────────────────────
    log("");
    log(c.green(c.bold("  ✔ Done! Your Expo app is ready.\n")));
    log(c.bold("  Next steps:"));
    log(`    ${c.cyan("cd")} ${relativeTarget}`);
    if (!wantInstall) log(`    ${c.cyan(pm)} install`);
    log(`    ${c.dim("# edit .env with your API URL / keys")}`);
    log(`    ${c.cyan(pm === "npm" ? "npm run" : pm)} start`);
    log("");
    log(c.dim("  Then press i (iOS), a (Android) or w (web) in the Expo CLI."));
    log(c.dim("  Verify anytime with: npm run verify  (typecheck + lint + tests)"));
    log(c.dim("  Native builds: npx eas-cli init && eas build --profile development\n"));

    const newer = await updatePromise;
    if (newer) {
      log(
        c.yellow(
          `  A newer ${pkg.name} is available: ${pkg.version} → ${newer}\n`,
        ),
      );
    }
  } catch (e) {
    try {
      prompter?.close();
    } catch {
      /* already closed */
    }
    err(e && e.message ? e.message : String(e));
    process.exit(1);
  }
}

main();
