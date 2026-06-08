import path from 'path';
import * as vscode from 'vscode';
import { getOpenFilePaths } from '../utils/tabUtils';
import { isPathWhitelisted } from '../utils/workspaceUtils';

export async function openFeatureFiles(): Promise<void> {
	const document = vscode.window.activeTextEditor?.document;
	if (!document) {
		vscode.window.showInformationMessage('Open a file first, then run the command.');
		return;
	}

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
	if (!isPathWhitelisted(document.uri.fsPath, srcPath, whitelist)) {
		vscode.window.showInformationMessage('Feature Opener: active file is not in a configured directory.');
		return;
	}

	const fileName = path.basename(document.fileName);
	const featureName = fileName.split('.')[0];
	const folder = path.dirname(document.uri.fsPath);
	const parentFolder = path.dirname(folder);

	const files = await vscode.workspace.findFiles(
		new vscode.RelativePattern(parentFolder, `**/${featureName}.*`)
	);

	const filtered = files.filter((file) => {
		const relative = path.relative(parentFolder, file.fsPath);
		return relative.split(path.sep).length <= 2;
	});

	const uniqueFiles = Array.from(
		new Map(filtered.map((file) => [file.fsPath, file])).values()
	);

	const whitelistedFiles = uniqueFiles.filter((file) =>
		isPathWhitelisted(file.fsPath, srcPath, whitelist)
	);

	if (whitelistedFiles.length === 0) {
		vscode.window.setStatusBarMessage('Feature Opener: no related files found in configured directories', 3000);
		return;
	}

	const alreadyOpen = getOpenFilePaths();
	const toOpen = whitelistedFiles.filter(
		f => f.fsPath !== document.uri.fsPath && !alreadyOpen.has(f.fsPath)
	);

	if (toOpen.length === 0) {
		vscode.window.setStatusBarMessage('Feature Opener: all related files already open', 3000);
		return;
	}

	const statusMsg = vscode.window.setStatusBarMessage(`Feature Opener: opening ${toOpen.length} file(s)...`);

	await vscode.window.showTextDocument(document, {
		viewColumn: 1,
		preserveFocus: false
	});

	for (let index = 0; index < toOpen.length; index++) {
		await vscode.window.showTextDocument(toOpen[index], {
			viewColumn: index + 2,
			preserveFocus: true
		});
	}

	statusMsg.dispose();
	vscode.window.setStatusBarMessage(`Feature Opener: opened ${toOpen.length} file(s)`, 3000);
}
