import { Console } from './ide/console';
import { IDE } from './ide/ide';

export const ide = new IDE();
ide.setupTabs();
ide.startConnecting();
ide.tryCompile();