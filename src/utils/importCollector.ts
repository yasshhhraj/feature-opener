import path from 'path';
import * as vscode from 'vscode';
import { isPathWhitelisted } from './workspaceUtils';

export async function collectFilteredImports(
	filePath: string,
	prefix: string,
	whitelist: string[],
	srcPath: string,
	visited: Set<string>,
	depth: number,
	maxDepth: number
): Promise<vscode.Uri[]> {
	if (depth > maxDepth || visited.has(filePath)) { return []; }
	visited.add(filePath);

	let text: string;
	try {
		const bytes = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
		text = Buffer.from(bytes).toString('utf8');
	} catch {
		return [];
	}

	const importRegex = /import\s+.*?\s+from\s+['"](.+)['"]/g;
	const sourceDir = path.dirname(filePath);
	const results: vscode.Uri[] = [];
	let match: RegExpExecArray | null;

	while ((match = importRegex.exec(text)) !== null) {
		const importPath = match[1];

		if (!importPath.startsWith('./') && !importPath.startsWith('../')) { continue; }

		const absolutePath = path.resolve(sourceDir, importPath);
		const absoluteDir = path.dirname(absolutePath);
		const baseName = path.basename(absolutePath);

		let files = await vscode.workspace.findFiles(
			new vscode.RelativePattern(absoluteDir, `${baseName}.ts`)
		);
		if (files.length === 0) {
			files = await vscode.workspace.findFiles(
				new vscode.RelativePattern(absoluteDir, `${baseName}.*`)
			);
		}

		for (const file of files) {
			const resolvedPath = file.fsPath;
			if (!resolvedPath.endsWith('.ts')) { continue; }

			const importedFileName = path.basename(resolvedPath);
			if (!importedFileName.startsWith(prefix)) { continue; }

			const importedDir = path.dirname(resolvedPath);
			const dirRelativeToSrc = path.relative(srcPath, importedDir);
			const inWhitelist = whitelist.some(w =>
				dirRelativeToSrc === w || dirRelativeToSrc.startsWith(w + path.sep)
			);
			if (!inWhitelist) { continue; }

			results.push(file);

			const nested = await collectFilteredImports(
				resolvedPath,
				prefix,
				whitelist,
				srcPath,
				visited,
				depth + 1,
				maxDepth
			);
			results.push(...nested);
		}
	}

	return results;
}

export async function collectImports(
	filePath: string,
	sourceExt: string,
	depth: number,
	maxDepth: number,
	visited: Set<string>,
	srcPath: string,
	whitelist: string[]
): Promise<vscode.Uri[]> {
	if (depth > maxDepth || visited.has(filePath)) { return []; }
	visited.add(filePath);

	let text: string;
	try {
		const bytes = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
		text = Buffer.from(bytes).toString('utf8');
	} catch {
		return [];
	}

	const importRegex = /import\s+.*?\s+from\s+['"](.+)['"]/g;
	const sourceDir = path.dirname(filePath);
	const results: vscode.Uri[] = [];
	let match: RegExpExecArray | null;

	while ((match = importRegex.exec(text)) !== null) {
		const importPath = match[1];

		if (!importPath.startsWith('./') && !importPath.startsWith('../')) { continue; }

		const absolutePath = path.resolve(sourceDir, importPath);
		const absoluteDir = path.dirname(absolutePath);
		const baseName = path.basename(absolutePath);

		let files = await vscode.workspace.findFiles(
			new vscode.RelativePattern(absoluteDir, `${baseName}${sourceExt}`)
		);
		if (files.length === 0) {
			files = await vscode.workspace.findFiles(
				new vscode.RelativePattern(absoluteDir, `${baseName}.*`)
			);
		}

		for (const file of files) {
			const resolvedPath = file.fsPath;
			if (!isPathWhitelisted(resolvedPath, srcPath, whitelist)) {
				continue;
			}

			results.push(file);
			const nested = await collectImports(
				file.fsPath,
				sourceExt,
				depth + 1,
				maxDepth,
				visited,
				srcPath,
				whitelist
			);
			results.push(...nested);
		}
	}

	return results;
}
