import path from 'path';
import * as vscode from 'vscode';

export async function getWorkspaceDirectoriesRelativeToSrc(workspaceRoot: string): Promise<string[]> {
	const srcPath = path.join(workspaceRoot, 'src');

	const files = await vscode.workspace.findFiles(
		new vscode.RelativePattern(srcPath, '**/*'),
		'**/node_modules/**'
	);

	const dirSet = new Set<string>();
	for (const file of files) {
		const dir = path.dirname(file.fsPath);
		const relative = path.relative(srcPath, dir);
		if (relative && !relative.startsWith('..')) {
			dirSet.add(relative);
		}
	}

	return Array.from(dirSet).sort();
}

export function isPathWhitelisted(filePath: string, srcPath: string, whitelist: string[]): boolean {
	const relativeDir = path.relative(srcPath, path.dirname(filePath));
	if (relativeDir.startsWith('..') || path.isAbsolute(relativeDir) || !relativeDir) {
		return false;
	}

	return whitelist.some((w) =>
		relativeDir === w || relativeDir.startsWith(w + path.sep)
	);
}
