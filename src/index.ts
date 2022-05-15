import { IDE } from './ide/editor';

export const ide = new IDE();
ide.setupTabs();
ide.startConnecting();
ide.tryCompile();