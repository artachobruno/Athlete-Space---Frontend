#!/bin/bash
# Script to fix deprecated syntax in GoogleSignIn-iOS Package.swift
# Run this after Xcode resolves packages or when you see deprecation warnings

PACKAGE_PATH="$HOME/Library/Developer/Xcode/DerivedData/App-*/SourcePackages/checkouts/GoogleSignIn-iOS/Package.swift"

# Find the Package.swift file
FILE=$(find ~/Library/Developer/Xcode/DerivedData -name "Package.swift" -path "*/GoogleSignIn-iOS/*" 2>/dev/null | head -1)

if [ -z "$FILE" ]; then
    echo "GoogleSignIn-iOS Package.swift not found. Packages may not be resolved yet."
    exit 0
fi

# Make file writable
chmod +w "$FILE" 2>/dev/null || true

# Check if file needs fixing (contains deprecated syntax)
if grep -q 'name: "AppAuth"' "$FILE"; then
    echo "Fixing deprecated syntax in $FILE"
    
    # Create a temporary file with fixes
    TEMP_FILE=$(mktemp)
    
    # Remove name parameters and fix revision syntax
    sed -E '
        s/\.package\(\s*name: "AppAuth",\s*url:/\.package(url:/g
        s/\.package\(\s*name: "AppCheck",\s*url:/\.package(url:/g
        s/\.package\(\s*name: "GTMAppAuth",\s*url:/\.package(url:/g
        s/\.package\(\s*name: "GTMSessionFetcher",\s*url:/\.package(url:/g
        s/\.package\(\s*name: "GoogleUtilities",\s*url:/\.package(url:/g
        s/\.package\(\s*name: "OCMock",\s*url:/\.package(url:/g
        s/\.revision\(/revision: /g
        s/package: "AppAuth"/package: "appauth-ios"/g
        s/package: "AppCheck"/package: "app-check"/g
        s/package: "GTMAppAuth"/package: "gtmappauth"/g
        s/package: "GTMSessionFetcher"/package: "gtm-session-fetcher"/g
        s/package: "GoogleUtilities"/package: "googleutilities"/g
    ' "$FILE" > "$TEMP_FILE"
    
    mv "$TEMP_FILE" "$FILE"
    echo "Fixed deprecated syntax in GoogleSignIn-iOS Package.swift"
else
    echo "Package.swift already fixed or doesn't need fixing"
fi
