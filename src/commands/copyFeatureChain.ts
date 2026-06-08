import path from 'path';
import * as vscode from 'vscode';
import { collectImports } from '../utils/importCollector';
import { isPathWhitelisted } from '../utils/workspaceUtils';

export async function copyFeatureChain(): Promise<void> {
	const document = vscode.window.activeTextEditor?.document;
	if (!document) {
		vscode.window.showInformationMessage('Open a feature file first, then run the command.');
		return;
	}

	const sourceFileName = path.basename(document.uri.fsPath);
	const sourceFeatureName = sourceFileName.split('.')[0];

	const newFeatureName = await vscode.window.showInputBox({
		prompt: `Copy "${sourceFeatureName}" chain as new feature name`,
		placeHolder: 'e.g. lobby, post, comment',
		validateInput: (value) => {
			if (!value || value.trim().length === 0) { return 'Feature name cannot be empty'; }
			if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value.trim())) { return 'Use only letters, numbers, hyphens, underscores'; }
			if (value.trim() === sourceFeatureName) { return 'New name must be different from the source'; }
			return null;
		}
	});

	if (!newFeatureName) { return; }

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

	const trimmedName = newFeatureName.trim();
	const sourceExt = path.extname(document.uri.fsPath);
	const visited = new Set<string>();

	const collecting = vscode.window.setStatusBarMessage('Feature Opener: scanning import chain...');
	const chainImports = await collectImports(document.uri.fsPath, sourceExt, 0, 10, visited, srcPath, whitelist);
	collecting.dispose();

	const allChainFiles = [document.uri, ...chainImports];

	if (chainImports.length === 0) {
		vscode.window.showInformationMessage('Feature Opener: no files found in import chain.');
		return;
	}

	const chainFiles = allChainFiles.filter((file) =>
		isPathWhitelisted(file.fsPath, srcPath, whitelist)
	);

	if (chainFiles.length === 0) {
		vscode.window.showInformationMessage('Feature Opener: no chain files found in configured directories.');
		return;
	}

	const skipped: string[] = [];
	const created: vscode.Uri[] = [];
	const copying = vscode.window.setStatusBarMessage(`Feature Opener: copying ${chainFiles.length} file(s)...`);

	for (const sourceUri of chainFiles) {
		const sourceBase = path.basename(sourceUri.fsPath);
		const sourceDir = path.dirname(sourceUri.fsPath);
		const newBase = sourceBase.replace(sourceFeatureName, trimmedName);

		if (newBase === sourceBase) {
			console.log(`Feature Opener: skipping ${sourceBase} — feature name not in filename`);
			continue;
		}

		const destPath = path.join(sourceDir, newBase);
		const destUri = vscode.Uri.file(destPath);

		try {
			await vscode.workspace.fs.stat(destUri);
			const choice = await vscode.window.showWarningMessage(
				`"${newBase}" already exists. Overwrite it?`,
				{ modal: true },
				'Overwrite',
				'Skip'
			);

			if (!choice || choice === 'Skip') {
				skipped.push(newBase);
				continue;
			}
		} catch {
			// file doesn't exist — safe to create
		}

		const contentBytes = await vscode.workspace.fs.readFile(sourceUri);
		const contentText = Buffer.from(contentBytes).toString('utf8');

		const escapedName = sourceFeatureName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const importReplaceRegex = new RegExp(
			`(from\\s+['"][^'"]*)(${escapedName})([^'"]*['"])`,
			'g'
		);
		const updatedContent = contentText.replace(importReplaceRegex, `$1${trimmedName}$3`);

		const encoder = new TextEncoder();
		await vscode.workspace.fs.writeFile(destUri, encoder.encode(updatedContent));
		created.push(destUri);
	}

	copying.dispose();

	if (skipped.length > 0) {
		vscode.window.showWarningMessage(
			`Feature Opener: skipped ${skipped.length} already existing file(s): ${skipped.join(', ')}`
		);
	}

	if (created.length === 0) {
		vscode.window.setStatusBarMessage('Feature Opener: no new files created', 3000);
		return;
	}

	vscode.window.setStatusBarMessage(`Feature Opener: created ${created.length} file(s)`, 3000);

	for (let index = 0; index < created.length; index++) {
		await vscode.window.showTextDocument(created[index], {
			viewColumn: index + 1,
			preserveFocus: index !== 0
		});
	}
}
