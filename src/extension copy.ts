// import path from 'path';
// import * as vscode from 'vscode';

// // tracks actually visible tabs — cleans up immediately when tab is closed
// const getOpenFilePaths = (): Set<string> => {
// 	return new Set(
// 		vscode.window.tabGroups.all
// 			.flatMap(group => group.tabs)
// 			.map(tab => (tab.input as vscode.TabInputText)?.uri?.fsPath)
// 			.filter(Boolean) as string[]
// 	);
// };

// // recursively collect imported relative file URIs up to maxDepth
// async function collectImports(
// 	filePath: string,
// 	sourceExt: string,
// 	depth: number,
// 	maxDepth: number,
// 	visited: Set<string>
// ): Promise<vscode.Uri[]> {
// 	if (depth > maxDepth) {return [];}
// 	if (visited.has(filePath)) {return [];}
// 	visited.add(filePath);

// 	let text: string;
// 	try {
// 		const bytes = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
// 		text = Buffer.from(bytes).toString('utf8');
// 	} catch {
// 		return [];
// 	}

// 	const importRegex = /import\s+.*?\s+from\s+['"](.+)['"]/g;
// 	const sourceDir = path.dirname(filePath);
// 	const results: vscode.Uri[] = [];
// 	let match: RegExpExecArray | null;

// 	while ((match = importRegex.exec(text)) !== null) {
// 		const importPath = match[1];

// 		// only relative imports
// 		if (!importPath.startsWith('./') && !importPath.startsWith('../')) {continue;}

// 		const absolutePath = path.resolve(sourceDir, importPath);
// 		const absoluteDir = path.dirname(absolutePath);
// 		const baseName = path.basename(absolutePath);

// 		// try exact extension first, then any extension
// 		let files = await vscode.workspace.findFiles(
// 			new vscode.RelativePattern(absoluteDir, `${baseName}${sourceExt}`)
// 		);
// 		if (files.length === 0) {
// 			files = await vscode.workspace.findFiles(
// 				new vscode.RelativePattern(absoluteDir, `${baseName}.*`)
// 			);
// 		}

// 		for (const file of files) {
// 			results.push(file);

// 			// recurse into this file's imports
// 			const nested = await collectImports(file.fsPath, sourceExt, depth + 1, maxDepth, visited);
// 			results.push(...nested);
// 		}
// 	}

// 	return results;
// }

// export function activate(context: vscode.ExtensionContext) {

// 	const openFeatureFiles = async () => {
// 		const document = vscode.window.activeTextEditor?.document;
// 		if (!document) {
// 			vscode.window.showInformationMessage('Open a file first, then run the command.');
// 			return;
// 		}

// 		const fileName = path.basename(document.fileName);
// 		const featureName = fileName.split('.')[0];
// 		const folder = path.dirname(document.uri.fsPath);
// 		const parentFolder = path.dirname(folder);

// 		const files = await vscode.workspace.findFiles(
// 			new vscode.RelativePattern(parentFolder, `**/${featureName}.*`)
// 		);

// 		const filtered = files.filter((file) => {
// 			const relative = path.relative(parentFolder, file.fsPath);
// 			return relative.split(path.sep).length <= 2;
// 		});

// 		const alreadyOpen = getOpenFilePaths();
// 		const toOpen = filtered.filter(f => !alreadyOpen.has(f.fsPath));

// 		if (toOpen.length === 0) {
// 			vscode.window.setStatusBarMessage('Feature Opener: all related files already open', 3000);
// 			return;
// 		}

// 		const statusMsg = vscode.window.setStatusBarMessage(`Feature Opener: opening ${toOpen.length} file(s)...`);

// 		for (let index = 0; index < toOpen.length; index++) {
// 			await vscode.window.showTextDocument(toOpen[index], {
// 				viewColumn: index + 1,
// 				preserveFocus: true
// 			});
// 		}

// 		statusMsg.dispose();
// 		vscode.window.setStatusBarMessage(`Feature Opener: opened ${toOpen.length} file(s)`, 3000);
// 	};

// 	const openImportedFiles = async () => {
// 		const document = vscode.window.activeTextEditor?.document;
// 		if (!document) {
// 			vscode.window.showInformationMessage('Open a file first, then run the command.');
// 			return;
// 		}

// 		const sourceExt = path.extname(document.uri.fsPath);
// 		const visited = new Set<string>();

// 		const collecting = vscode.window.setStatusBarMessage('Feature Opener: scanning imports...');
// 		const allImports = await collectImports(document.uri.fsPath, sourceExt, 0, 2, visited);
// 		collecting.dispose();

// 		if (allImports.length === 0) {
// 			vscode.window.setStatusBarMessage('Feature Opener: no relative imports found', 3000);
// 			return;
// 		}

// 		const alreadyOpen = getOpenFilePaths();
// 		const toOpen = allImports.filter(f => f.fsPath !== document.uri.fsPath && !alreadyOpen.has(f.fsPath));

// 		const statusMsg = vscode.window.setStatusBarMessage(`Feature Opener: opening ${toOpen.length} file(s)...`);

// 		// put the source file itself in column 1
// 		await vscode.window.showTextDocument(document, {
// 			viewColumn: 1,
// 			preserveFocus: false
// 		});

// 		for (let index = 0; index < toOpen.length; index++) {
// 			await vscode.window.showTextDocument(toOpen[index], {
// 				viewColumn: index + 2,
// 				preserveFocus: true
// 			});
// 		}

// 		statusMsg.dispose();
// 		vscode.window.setStatusBarMessage(`Feature Opener: opened ${toOpen.length} file(s)`, 3000);
// 	};

// 	const closeRelatedFiles = async () => {
// 		const activeEditor = vscode.window.activeTextEditor;
// 		const activeUri = activeEditor?.document.uri.fsPath;

// 		const tabsToClose = vscode.window.tabGroups.all
// 			.flatMap(group => group.tabs)
// 			.filter(tab => {
// 				const uri = (tab.input as vscode.TabInputText)?.uri?.fsPath;
// 				return uri && uri !== activeUri;
// 			});

// 		if (tabsToClose.length === 0) {
// 			vscode.window.setStatusBarMessage('Feature Opener: nothing to close', 3000);
// 			return;
// 		}

// 		// close all at once — avoids stale tab references from closing one by one
// 		await vscode.window.tabGroups.close(tabsToClose);
// 		vscode.window.setStatusBarMessage(`Feature Opener: closed ${tabsToClose.length} tab(s)`, 3000);
// 	};

// 	const copyFeatureChain = async () => {
// 		const document = vscode.window.activeTextEditor?.document;
// 		if (!document) {
// 			vscode.window.showInformationMessage('Open a feature file first, then run the command.');
// 			return;
// 		}

// 		// get the current feature name from the active file e.g. "user" from "user.controller.ts"
// 		const sourceFileName = path.basename(document.uri.fsPath);
// 		const sourceFeatureName = sourceFileName.split('.')[0];

// 		// ask for the new feature name
// 		const newFeatureName = await vscode.window.showInputBox({
// 			prompt: `Copy "${sourceFeatureName}" chain as new feature name`,
// 			placeHolder: 'e.g. lobby, post, comment',
// 			validateInput: (value) => {
// 				if (!value || value.trim().length === 0) {return 'Feature name cannot be empty';}
// 				if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value.trim())) {return 'Use only letters, numbers, hyphens, underscores';}
// 				if (value.trim() === sourceFeatureName) {return 'New name must be different from the source';}
// 				return null;
// 			}
// 		});

// 		if (!newFeatureName) {return;} // user cancelled

// 		const trimmedName = newFeatureName.trim();

// 		const sourceExt = path.extname(document.uri.fsPath);
// 		const visited = new Set<string>();

// 		const collecting = vscode.window.setStatusBarMessage('Feature Opener: scanning import chain...');

// 		// collect the full import chain starting from the active file
// 		const chainImports = await collectImports(document.uri.fsPath, sourceExt, 0, 10, visited);
// 		collecting.dispose();

// 		// include the source file itself at the front
// 		const allChainFiles = [document.uri, ...chainImports];

// 		if (allChainFiles.length === 0) {
// 			vscode.window.showInformationMessage('Feature Opener: no files found in import chain.');
// 			return;
// 		}

// 		const skipped: string[] = [];
// 		const created: vscode.Uri[] = [];

// 		const copying = vscode.window.setStatusBarMessage(`Feature Opener: copying ${allChainFiles.length} file(s)...`);

// 		for (const sourceUri of allChainFiles) {
// 			const sourceBase = path.basename(sourceUri.fsPath);           // e.g. "user.controller.ts"
// 			const sourceDir  = path.dirname(sourceUri.fsPath);

// 			// replace only the feature name part of the filename
// 			// "user.controller.ts" → "lobby.controller.ts"
// 			const newBase = sourceBase.replace(sourceFeatureName, trimmedName);

// 			if (newBase === sourceBase) {
// 				// filename didn't contain the feature name — skip it
// 				console.log(`Feature Opener: skipping ${sourceBase} — feature name not in filename`);
// 				continue;
// 			}

// 			const destPath = path.join(sourceDir, newBase);
// 			const destUri  = vscode.Uri.file(destPath);

// 			// check if destination already exists
// 			try {
// 				await vscode.workspace.fs.stat(destUri);

// 				// file exists — ask the user what to do
// 				const choice = await vscode.window.showWarningMessage(
// 					`"${newBase}" already exists. Overwrite it?`,
// 					{ modal: true },
// 					'Overwrite',
// 					'Skip'
// 				);

// 				if (!choice || choice === 'Skip') {
// 					skipped.push(newBase);
// 					continue;
// 				}

// 				// choice === 'Overwrite' — fall through to write below

// 			} catch {
// 				// file doesn't exist — safe to create, fall through
// 			}

// 			// read source content
// 			const contentBytes = await vscode.workspace.fs.readFile(sourceUri);
// 			const contentText = Buffer.from(contentBytes).toString('utf8');

// 			// replace feature name only inside relative import paths
// 			const importReplaceRegex = new RegExp(
// 				`(from\\s+['"][^'"]*)(${sourceFeatureName})([^'"]*['"])`,
// 				'g'
// 			);
// 			const updatedContent = contentText.replace(importReplaceRegex, `$1${trimmedName}$3`);

// 			// write updated content
// 			const encoder = new TextEncoder();
// 			await vscode.workspace.fs.writeFile(destUri, encoder.encode(updatedContent));
// 			created.push(destUri);

// 		}

// 		copying.dispose();

// 		if (skipped.length > 0) {
// 			vscode.window.showWarningMessage(
// 				`Feature Opener: skipped ${skipped.length} already existing file(s): ${skipped.join(', ')}`
// 			);
// 		}

// 		if (created.length === 0) {
// 			vscode.window.setStatusBarMessage('Feature Opener: no new files created', 3000);
// 			return;
// 		}

// 		vscode.window.setStatusBarMessage(`Feature Opener: created ${created.length} file(s)`, 3000);

// 		// open all newly created files side by side
// 		for (let index = 0; index < created.length; index++) {
// 			await vscode.window.showTextDocument(created[index], {
// 				viewColumn: index + 1,
// 				preserveFocus: index !== 0
// 			});
// 		}
// 	};

// 	context.subscriptions.push(
// 		vscode.commands.registerCommand('feature-opener.openFeatureFiles', openFeatureFiles),
// 		vscode.commands.registerCommand('feature-opener.openImportedFiles', openImportedFiles),
// 		vscode.commands.registerCommand('feature-opener.closeRelatedFiles', closeRelatedFiles),
// 		vscode.commands.registerCommand('feature-opener.copyFeatureChain', copyFeatureChain),
// 	);
// }

// export function deactivate() {}