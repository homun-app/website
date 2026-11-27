#!/bin/sh
# The $EDITOR of the docs session: it appends one line to the note, as a person
# editing it would, without the final newline (the capture of 0.6.17 did the
# same: the diff shows one line, and `vault sync` then takes the note from
# its file).
printf 'A settembre hanno anche imbiancato la casa.' >> "$1"
