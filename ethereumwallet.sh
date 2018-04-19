#!/bin/bash
echo "connecting to $ETHRPCURL"
./ethereumwallet --datadir=$HOME/.ethereum/$ETHRPCURL --rpc https://$ETHRPCURL