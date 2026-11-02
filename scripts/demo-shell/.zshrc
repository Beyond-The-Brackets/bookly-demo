# Shell for recording the demo: your usual PATH, a prompt that shows only the folder.
[[ -f "$HOME/.zprofile" ]] && source "$HOME/.zprofile"
[[ -d "$HOME/.local/bin" ]] && path=("$HOME/.local/bin" $path)
unsetopt BEEP
PROMPT='%F{#686760}%1~%f %F{#8c1b11}›%f '
RPROMPT=''
export CLICOLOR=1
