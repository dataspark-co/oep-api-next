#!/usr/bin/env bash

echo "Stopping new API..."
screen -S new-api -X quit
echo "Done."

exit 0
