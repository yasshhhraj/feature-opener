import path from 'path';
import * as vscode from 'vscode';
import { getWorkspaceDirectoriesRelativeToSrc } from '../utils/workspaceUtils';

export async function configureDirectories(): Promise<void> {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		vscode.window.showInformationMessage('Feature Opener: no workspace folder found.');
		return;
	}

	const workspaceRoot = workspaceFolders[0].uri.fsPath;
	const srcPath = path.join(workspaceRoot, 'src');

	try {
		await vscode.workspace.fs.stat(vscode.Uri.file(srcPath));
	} catch {
		vscode.window.showInformationMessage('Feature Opener: no src/ folder found in workspace root.');
		return;
	}

	const scanning = vscode.window.setStatusBarMessage('Feature Opener: scanning directories...');
	const dirs = await getWorkspaceDirectoriesRelativeToSrc(workspaceRoot);
	scanning.dispose();

	if (dirs.length === 0) {
		vscode.window.showInformationMessage('Feature Opener: no directories found under src/.');
		return;
	}

	const config = vscode.workspace.getConfiguration('featureOpener');
	const current: string[] = config.get('whitelistedDirectories') ?? [];

	const items = dirs.map(dir => ({
		label: dir,
		description: `src/${dir}`,
		picked: current.includes(dir)
	}));

	const selected = await vscode.window.showQuickPick(items, {
		canPickMany: true,
		title: 'Feature Opener: Select directories to whitelist (relative to src/)',
		placeHolder: 'Search directories...'
	});

	if (selected === undefined) { return; }

	await config.update(
		'whitelistedDirectories',
		selected.map(s => s.label),
		vscode.ConfigurationTarget.Workspace
	);

	vscode.window.setStatusBarMessage(
		`Feature Opener: saved ${selected.length} whitelisted director${selected.length === 1 ? 'y' : 'ies'}`,
		3000
	);
}
