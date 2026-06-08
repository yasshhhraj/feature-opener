import path from 'path';
import * as vscode from 'vscode';
import { getOpenFilePaths } from '../utils/tabUtils';
import { collectFilteredImports } from '../utils/importCollector';

export async function openImportedFiles(): Promise<void> {
	const document = vscode.window.activeTextEditor?.document;
	if (!document) {
		vscode.window.showInformationMessage('Open a file first, then run the command.');
		return;
	}

	const fileName = path.basename(document.uri.fsPath);
	const prefix = fileName.split('.')[0];

	const config = vscode.workspace.getConfiguration('featureOpener');
	const whitelist: string[] = config.get('whitelistedDirectories') ?? [];

	if (whitelist.length === 0) {
		vscode.window.showInformationMessage(
			'Feature Opener: no directories whitelisted. Run "Feature Opener: Configure Directories" first.'
		);
		return;
	}

	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		vscode.window.showInformationMessage('Feature Opener: no workspace folder found.');
		return;
	}

	const srcPath = path.join(workspaceFolders[0].uri.fsPath, 'src');
	const visited = new Set<string>();

	const collecting = vscode.window.setStatusBarMessage('Feature Opener: scanning imports...');
	const allImports = await collectFilteredImports(
		document.uri.fsPath,
		prefix,
		whitelist,
		srcPath,
		visited,
		0,
		10
	);
	collecting.dispose();

	const uniqueImports = Array.from(
		new Map(allImports.map((file) => [file.fsPath, file])).values()
	);

	if (uniqueImports.length === 0) {
		vscode.window.setStatusBarMessage('Feature Opener: no matching imports found', 3000);
		return;
	}

	const alreadyOpen = getOpenFilePaths();
	const toOpen = uniqueImports.filter(
		f => f.fsPath !== document.uri.fsPath && !alreadyOpen.has(f.fsPath)
	);

	if (toOpen.length === 0) {
		vscode.window.setStatusBarMessage('Feature Opener: all matching files already open', 3000);
		return;
	}

	const MAX_COLUMNS = 9;
	const openable = toOpen.slice(0, MAX_COLUMNS - 1);
	const skipped = toOpen.length - openable.length;

	const statusMsg = vscode.window.setStatusBarMessage(`Feature Opener: opening ${openable.length} file(s)...`);

	await vscode.window.showTextDocument(document, {
		viewColumn: vscode.ViewColumn.One,
		preserveFocus: false
	});

	let opened = 0;
	for (let index = 0; index < openable.length; index++) {
		try {
			await vscode.window.showTextDocument(openable[index], {
				viewColumn: (index + 2) as vscode.ViewColumn,
				preserveFocus: true
			});
			opened++;
		} catch (err) {
			console.warn(`Feature Opener: could not open ${openable[index].fsPath}`, err);
		}
	}

	statusMsg.dispose();
	const suffix = skipped > 0 ? ` (${skipped} skipped — column limit reached)` : '';
	vscode.window.setStatusBarMessage(`Feature Opener: opened ${opened} file(s)${suffix}`, 3000);
}
