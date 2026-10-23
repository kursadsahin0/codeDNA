import ts from "typescript";
import path from "node:path";
import { isSafeRepositoryPath } from "../github/utils.mjs";

const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"]);
const MAX_FILE_BYTES = 1024 * 1024;

export function sourceLanguage(path) {
  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
  return [".ts", ".tsx", ".mts", ".cts"].includes(ext) ? "typescript" : [".js", ".jsx", ".mjs", ".cjs"].includes(ext) ? "javascript" : null;
}
export const parserVersion = ts.version;

function normalizedPath(path) {
  if (!isSafeRepositoryPath(path)) return null;
  return path.normalize("NFC");
}

function parseTsConfig(inputFiles) {
  const config = inputFiles.find((file) => file.path === "tsconfig.json");
  if (!config) return { options: {}, paths: {} };
  try {
    const parsed = ts.parseConfigFileTextToJson(config.path, config.content);
    if (parsed.error) return { options: {}, paths: {} };
    const options = parsed.config.compilerOptions ?? {};
    const baseUrl = options.baseUrl ?? ".";
    return { options: { ...options, baseUrl }, paths: options.paths ?? {} };
  } catch { return { options: {}, paths: {} }; }
}

function resolveSpecifier(specifier, fromPath, knownFiles, config) {
  const candidates = [];
  const addCandidates = (base) => {
    const clean = path.posix.normalize(base.replace(/^\.\//, ""));
    candidates.push(clean, ...[...extensions].map((ext) => clean + ext), ...[...extensions].map((ext) => `${clean}/index${ext}`));
  };
  if (specifier.startsWith(".")) {
    const dir = fromPath.includes("/") ? fromPath.slice(0, fromPath.lastIndexOf("/")) : "";
    addCandidates(`${dir ? `${dir}/` : ""}${specifier}`);
  } else {
    const aliases = Object.entries(config.paths).slice(0, 100);
    for (const [pattern, targets] of aliases) {
      const star = pattern.indexOf("*");
      const prefix = star < 0 ? pattern : pattern.slice(0, star);
      const suffix = star < 0 ? "" : pattern.slice(star + 1);
      if (!specifier.startsWith(prefix) || !specifier.endsWith(suffix)) continue;
      const capture = specifier.slice(prefix.length, specifier.length - suffix.length);
      for (const target of Array.isArray(targets) ? targets.slice(0, 10) : []) {
        const targetBase = String(target).replace("*", capture);
        addCandidates(`${config.options.baseUrl ? `${config.options.baseUrl}/` : ""}${targetBase}`);
      }
    }
  }
  return candidates.map((candidate) => candidate.replace(/^\.\//, "")).find((candidate) => knownFiles.has(candidate)) ?? null;
}

function makePosition(sourceFile, node) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  return { line: start.line + 1, column: start.character + 1, endLine: end.line + 1, endColumn: end.character + 1 };
}

export function analyzeRepository(inputFiles, options = {}) {
  const started = Date.now();
  const diagnostics = [];
  const nodes = [];
  const edges = [];
  const files = [];
  let skippedFileCount = 0;
  const maxFileBytes = Math.min(Math.max(options.maxFileBytes ?? MAX_FILE_BYTES, 1), MAX_FILE_BYTES);

  for (const input of inputFiles) {
    const path = normalizedPath(input.path);
    if (!path) { skippedFileCount++; diagnostics.push({ code: "unsafe_path", message: "Unsafe repository path was skipped.", path: String(input.path).slice(0, 100), severity: "warning" }); continue; }
    const language = sourceLanguage(path);
    if (!language) { skippedFileCount++; continue; }
    if (input.symlink || input.binary || typeof input.content !== "string") { skippedFileCount++; diagnostics.push({ code: "unsupported_file_content", message: "Binary, symlink, or unreadable content was skipped.", path, severity: "warning" }); continue; }
    if (Buffer.byteLength(input.content, "utf8") > maxFileBytes) { skippedFileCount++; diagnostics.push({ code: "file_too_large", message: `File exceeds the ${maxFileBytes} byte analysis limit.`, path, severity: "warning" }); continue; }
    files.push({ ...input, path, language });
  }

  const config = parseTsConfig(inputFiles);
  const knownFiles = new Set(files.map((file) => file.path));
  const perFile = new Map();
  const edgeKeys = new Set();
  const addEdge = (edge) => { const key = `${edge.kind}:${edge.source}->${edge.target}:${edge.specifier ?? ""}`; if (!edgeKeys.has(key)) { edgeKeys.add(key); edges.push({ id: key, ...edge }); } };

  for (const file of files) {
    const ext = file.path.slice(file.path.lastIndexOf(".")).toLowerCase();
    const scriptKind = ext.endsWith("x") ? ts.ScriptKind.TSX : [".js", ".mjs", ".cjs"].includes(ext) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true, scriptKind);
    const fileId = `file:${file.path}`;
    const moduleId = `module:${file.path}`;
    nodes.push({ id: fileId, kind: "file", name: file.path.split("/").at(-1), path: file.path, language: file.language, fileType: ext });
    nodes.push({ id: moduleId, kind: "module", name: file.path.replace(/\.[^.]+$/, ""), path: file.path, language: file.language });
    perFile.set(file.path, { sourceFile, declarations: new Map(), calls: [] });
    const parseDiagnostics = sourceFile.parseDiagnostics ?? [];
    for (const diagnostic of parseDiagnostics) {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ").slice(0, 500);
      diagnostics.push({ code: `syntax_${diagnostic.code}`, message, path: file.path, severity: "error" });
    }
    const visit = (node) => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) && node.moduleSpecifier) {
        const specifier = node.moduleSpecifier.text;
        const resolved = resolveSpecifier(specifier, file.path, knownFiles, config);
        const externalId = `module:external:${specifier}`;
        if (!resolved) nodes.push({ id: externalId, kind: "module", name: specifier, external: true });
        if (!resolved && specifier.startsWith(".")) diagnostics.push({ code: "unresolved_import", message: `Relative import could not be resolved: ${specifier}`, path: file.path, severity: "warning" });
        if (ts.isImportDeclaration(node)) addEdge({ kind: "import", source: fileId, target: resolved ? `file:${resolved}` : externalId, confidence: resolved ? "certain" : "unknown", specifier });
        else addEdge({ kind: "export", source: fileId, target: resolved ? `file:${resolved}` : externalId, confidence: resolved ? "certain" : "unknown", specifier });
      }
      if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression && ts.isStringLiteral(node.moduleReference.expression)) {
        const specifier = node.moduleReference.expression.text;
        const resolved = resolveSpecifier(specifier, file.path, knownFiles, config);
        const target = resolved ? `file:${resolved}` : `module:external:${specifier}`;
        if (!resolved) nodes.push({ id: target, kind: "module", name: specifier, external: true });
        if (!resolved && specifier.startsWith(".")) diagnostics.push({ code: "unresolved_import", message: `Relative import could not be resolved: ${specifier}`, path: file.path, severity: "warning" });
        addEdge({ kind: "import", source: fileId, target, confidence: resolved ? "certain" : "unknown", specifier });
      }
      if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.text; const id = `function:${file.path}#${name}`;
        const exported = !!node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword || modifier.kind === ts.SyntaxKind.DefaultKeyword);
        nodes.push({ id, kind: "function", name, path: file.path, position: makePosition(sourceFile, node), exported });
        perFile.get(file.path).declarations.set(name, id);
        if (exported) addEdge({ kind: "export", source: fileId, target: id, confidence: "certain" });
      } else if (ts.isClassDeclaration(node) && node.name) {
        const name = node.name.text; const id = `class:${file.path}#${name}`;
        const exported = !!node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword || modifier.kind === ts.SyntaxKind.DefaultKeyword);
        nodes.push({ id, kind: "class", name, path: file.path, position: makePosition(sourceFile, node), exported });
        if (exported) addEdge({ kind: "export", source: fileId, target: id, confidence: "certain" });
      } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
        const name = node.name.text; const id = `function:${file.path}#${name}`;
        const parent = node.parent.parent;
        const exported = !!parent.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
        nodes.push({ id, kind: "function", name, path: file.path, position: makePosition(sourceFile, node), exported });
        perFile.get(file.path).declarations.set(name, id);
        if (exported) addEdge({ kind: "export", source: fileId, target: id, confidence: "certain" });
      }
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) perFile.get(file.path).calls.push(node.expression.text);
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  for (const [path, state] of perFile) for (const name of state.calls) {
    const target = state.declarations.get(name);
    if (target) addEdge({ kind: "call", source: `file:${path}`, target, confidence: "certain" });
  }
  const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === "error").length;
  const analyzedFileCount = files.length;
  const status = analyzedFileCount === 0 ? "failed" : skippedFileCount || diagnostics.length ? "partial" : "success";
  return { status, graph: { version: 1, nodes, edges }, analyzedFileCount, skippedFileCount, errorCount, durationMs: Date.now() - started, diagnostics, parserVersion: ts.version };
}
