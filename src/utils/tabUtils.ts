import * as vscode from 'vscode';

export const getOpenFilePaths = (): Set<string> => {
	return new Set(
		vscode.window.tabGroups.all
			.flatMap(group => group.tabs)
			.map(tab => (tab.input as vscode.TabInputText)?.uri?.fsPath)
			.filter(Boolean) as string[]
	);
};
