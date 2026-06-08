import * as vscode from 'vscode';

export async function closeRelatedFiles(): Promise<void> {
	const activeEditor = vscode.window.activeTextEditor;
	const activeUri = activeEditor?.document.uri.fsPath;

	const tabsToClose = vscode.window.tabGroups.all
		.flatMap(group => group.tabs)
		.filter(tab => {
			const uri = (tab.input as vscode.TabInputText)?.uri?.fsPath;
			return uri && uri !== activeUri;
		});

	if (tabsToClose.length === 0) {
		vscode.window.setStatusBarMessage('Feature Opener: nothing to close', 3000);
		return;
	}

	await vscode.window.tabGroups.close(tabsToClose);
	vscode.window.setStatusBarMessage(`Feature Opener: closed ${tabsToClose.length} tab(s)`, 3000);
}
