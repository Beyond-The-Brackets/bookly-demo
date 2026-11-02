// Regenerates Bookly-demo.terminal (Terminal.app profile in the Grace colours).
// Run from the repo root, after installing IBM Plex Mono if you want it:
//   osascript -l JavaScript scripts/demo-shell/make-profile.js "$PWD/scripts/demo-shell/Bookly-demo.terminal" "$PWD"
ObjC.import('AppKit');
function run(argv) {
  const out = argv[0], repo = argv[1];
  const rgb = (h) => $.NSColor.colorWithSRGBRedGreenBlueAlpha(parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255, 1);
  const arch = (o) => $.NSKeyedArchiver.archivedDataWithRootObjectRequiringSecureCodingError(o, false, null);
  let font = $.NSFont.fontWithNameSize('IBMPlexMono', 18);
  if (font.isNil()) font = $.NSFont.fontWithNameSize('SFMono-Regular', 18);
  if (font.isNil()) font = $.NSFont.fontWithNameSize('Menlo-Regular', 18);
  const d = $.NSMutableDictionary.alloc.init;
  const set = (k, v) => d.setObjectForKey(v, k);
  set('name', 'Bookly demo');
  set('type', 'Window Settings');
  set('ProfileCurrentVersion', 2.07);
  set('BackgroundColor', arch(rgb('fbf7f0')));
  set('TextColor', arch(rgb('11110f')));
  set('TextBoldColor', arch(rgb('11110f')));
  set('CursorColor', arch(rgb('8c1b11')));
  set('SelectionColor', arch(rgb('e9e6de')));
  set('Font', arch(font));
  set('FontAntialias', true);
  set('UseBrightBold', false);
  set('columnCount', 100);
  set('rowCount', 30);
  set('Bell', false);
  set('VisualBell', false);
  set('shellExitAction', 1);
  set('ShowActiveProcessInTitle', false);
  set('ShowCommandKeyInTitle', false);
  set('ShowDimensionsInTitle', false);
  set('ShowShellCommandInTitle', false);
  set('ShowTTYNameInTitle', false);
  set('ShowWindowSettingsNameInTitle', false);
  set('ShowRepresentedURLInTitle', false);
  set('ShowRepresentedURLPathInTitle', false);
  set('WindowTitle', 'bookly-demo');
  set('CommandString', 'cd "' + repo + '" && ZDOTDIR="' + repo + '/scripts/demo-shell" exec /bin/zsh -i');
  set('RunCommandAsShell', false);
  d.writeToFileAtomically(out, true);
  return ObjC.unwrap(font.fontName);
}
