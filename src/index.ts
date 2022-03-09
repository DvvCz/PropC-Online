import { startConnecting } from './link/launcher';
import { setupTabs, addTab, setTab } from './site/tabhandler';
import { startIDE } from './ide/editor';
import { tryCompile } from './ide/source';

setupTabs();
startIDE();
//setTab("main.c");
startConnecting();

tryCompile();
