#!/bin/bash

# ============================================
# Wrapper Script for Backward Compatibility
# Forwards all commands to scripts/deploy/deploy.sh
# ============================================
#
# This wrapper script maintains backward compatibility after the
# deployment scripts were reorganized into scripts/deploy/ folder.
#
# User-facing command remains unchanged:
#   ./scripts/deploy.sh [tier] [options]
#
# This script forwards to the actual deployment script at:
#   ./scripts/deploy/deploy.sh
#
# ============================================

# Get the directory where this wrapper script is located
WRAPPER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Forward all arguments to the actual deployment script
exec "${WRAPPER_DIR}/deploy/deploy.sh" "$@"
