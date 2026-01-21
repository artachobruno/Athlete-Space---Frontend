#!/usr/bin/env python3
"""Fix deprecated syntax in GoogleSignIn-iOS Package.swift file.

This script automatically fixes deprecated Swift Package Manager syntax
in the GoogleSignIn-iOS Package.swift file after Xcode resolves packages.
"""

import os
import re
import glob
from pathlib import Path


def find_package_file() -> str | None:
    """Find the GoogleSignIn-iOS Package.swift file in DerivedData."""
    derived_data = Path.home() / "Library/Developer/Xcode/DerivedData"
    if not derived_data.exists():
        return None
    
    pattern = str(derived_data / "*/SourcePackages/checkouts/GoogleSignIn-iOS/Package.swift")
    matches = glob.glob(pattern)
    return matches[0] if matches else None


def fix_package_swift(file_path: str) -> bool:
    """Fix deprecated syntax in Package.swift file.
    
    Returns:
        True if file was modified, False otherwise
    """
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    original_content = content
    
    # Fix package declarations: remove name parameter
    content = re.sub(
        r'\.package\(\s*name: "AppAuth",\s*url:',
        '.package(url:',
        content
    )
    content = re.sub(
        r'\.package\(\s*name: "AppCheck",\s*url:',
        '.package(url:',
        content
    )
    content = re.sub(
        r'\.package\(\s*name: "GTMAppAuth",\s*url:',
        '.package(url:',
        content
    )
    content = re.sub(
        r'\.package\(\s*name: "GTMSessionFetcher",\s*url:',
        '.package(url:',
        content
    )
    content = re.sub(
        r'\.package\(\s*name: "GoogleUtilities",\s*url:',
        '.package(url:',
        content
    )
    content = re.sub(
        r'\.package\(\s*name: "OCMock",\s*url:',
        '.package(url:',
        content
    )
    
    # Fix revision syntax: .revision(...) -> revision: ...
    content = re.sub(
        r'\.revision\("([^"]+)"\)',
        r'revision: "\1"',
        content
    )
    
    # Fix package references in targets
    content = content.replace('package: "AppAuth"', 'package: "appauth-ios"')
    content = content.replace('package: "AppCheck"', 'package: "app-check"')
    content = content.replace('package: "GTMAppAuth"', 'package: "gtmappauth"')
    content = content.replace('package: "GTMSessionFetcher"', 'package: "gtm-session-fetcher"')
    content = content.replace('package: "GoogleUtilities"', 'package: "googleutilities"')
    
    if content != original_content:
        # Make file writable
        os.chmod(file_path, 0o644)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    
    return False


def main() -> None:
    """Main entry point."""
    package_file = find_package_file()
    
    if not package_file:
        print("GoogleSignIn-iOS Package.swift not found.")
        print("Make sure Xcode has resolved packages first.")
        return
    
    print(f"Found Package.swift at: {package_file}")
    
    if fix_package_swift(package_file):
        print("✓ Fixed deprecated syntax in GoogleSignIn-iOS Package.swift")
    else:
        print("Package.swift already fixed or doesn't need fixing")


if __name__ == "__main__":
    main()
