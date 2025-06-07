#!/usr/bin/env python3
"""
DORMANT-2025-01-06: Old deployment script, no documentation or usage
StackMap Improved Updater - More reliable partial file updates
Features improved error handling, flexible matching, and better feedback
"""

import json
import shutil
import re
import difflib
from datetime import datetime
from pathlib import Path

class ImprovedUpdater:
    def __init__(self, project_root=".", verbose=False):
        self.project_root = Path(project_root)
        self.backup_dir = self.project_root / "backups"
        self.backup_dir.mkdir(exist_ok=True)
        self.verbose = verbose
        self.dry_run = False
        
    def backup_file(self, filepath):
        """Create timestamped backup"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = self.backup_dir / f"{filepath.name}_{timestamp}"
        shutil.copy2(filepath, backup_path)
        print(f"✅ Backed up to: backups/{filepath.name}_{timestamp}")
        return backup_path
        
    def normalize_whitespace(self, text):
        """Normalize whitespace for more flexible matching"""
        # Replace multiple spaces with single space
        text = re.sub(r' +', ' ', text)
        # Normalize line endings
        text = text.replace('\r\n', '\n')
        # Remove trailing whitespace from lines
        lines = text.split('\n')
        lines = [line.rstrip() for line in lines]
        return '\n'.join(lines)
    
    def find_similar_text(self, content, search_text, threshold=0.8):
        """Find similar text if exact match fails"""
        # Try normalized matching first
        normalized_content = self.normalize_whitespace(content)
        normalized_search = self.normalize_whitespace(search_text)
        
        if normalized_search in normalized_content:
            # Find the original text that corresponds to normalized match
            start = normalized_content.index(normalized_search)
            end = start + len(normalized_search)
            
            # Map back to original content
            original_pos = 0
            normalized_pos = 0
            start_original = 0
            end_original = len(content)
            
            for i, char in enumerate(content):
                if normalized_pos == start and start_original == 0:
                    start_original = i
                if normalized_pos >= end:
                    end_original = i
                    break
                if char != ' ' or (i == 0 or content[i-1] != ' '):
                    normalized_pos += 1
                    
            return content[start_original:end_original]
        
        # If normalized match fails, try fuzzy matching
        search_lines = search_text.strip().split('\n')
        content_lines = content.split('\n')
        
        best_match = None
        best_ratio = 0
        
        for i in range(len(content_lines) - len(search_lines) + 1):
            chunk = '\n'.join(content_lines[i:i+len(search_lines)])
            ratio = difflib.SequenceMatcher(None, search_text, chunk).ratio()
            
            if ratio > best_ratio and ratio >= threshold:
                best_ratio = ratio
                best_match = chunk
                
        return best_match
    
    def show_context(self, content, position, context_lines=3):
        """Show context around a position in the file"""
        lines = content.split('\n')
        line_num = content[:position].count('\n')
        
        start = max(0, line_num - context_lines)
        end = min(len(lines), line_num + context_lines + 1)
        
        print("\n📍 Context:")
        for i in range(start, end):
            prefix = ">>>" if i == line_num else "   "
            print(f"{prefix} {i+1}: {lines[i][:80]}{'...' if len(lines[i]) > 80 else ''}")
        print()
        
    def apply_update(self, update):
        """Apply a single update with improved error handling"""
        filepath = self.project_root / update['file']
        
        if not filepath.exists():
            print(f"❌ File not found: {filepath}")
            return False
            
        # Read file
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        success = False
        
        # Method 1: Replace exact or similar text
        if 'find' in update and 'replace' in update:
            find_text = update['find']
            replace_text = update['replace']
            
            # Try exact match first
            if find_text in content:
                content = content.replace(find_text, replace_text)
                print(f"✅ Replaced exact text in {update['file']}")
                success = True
            else:
                # Try flexible matching
                if update.get('flexible', True):  # Default to flexible matching
                    print(f"⚠️  Exact text not found, trying flexible match...")
                    similar = self.find_similar_text(content, find_text)
                    
                    if similar:
                        print(f"📝 Found similar text (showing first 100 chars):")
                        print(f"   {similar[:100]}...")
                        
                        if not self.dry_run:
                            response = input("   Apply replacement to this text? (y/n): ").lower()
                            if response == 'y':
                                content = content.replace(similar, replace_text)
                                print(f"✅ Replaced similar text in {update['file']}")
                                success = True
                            else:
                                print(f"⏭️  Skipped replacement")
                        else:
                            content = content.replace(similar, replace_text)
                            success = True
                    else:
                        print(f"❌ No similar text found in {update['file']}")
                        if self.verbose:
                            print(f"   Looking for: {find_text[:100]}...")
                
        # Method 2: Append to end of file
        elif 'append' in update:
            content += f"\n{update['append']}\n"
            print(f"✅ Appended to {update['file']}")
            success = True
            
        # Method 3: Insert after a specific line/pattern
        elif 'after' in update and 'insert' in update:
            after_text = update['after']
            insert_text = update['insert']
            
            if after_text in content:
                # Insert with proper indentation
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if after_text in line:
                        # Match indentation of the target line
                        indent = re.match(r'^(\s*)', line).group(1)
                        lines.insert(i + 1, indent + insert_text)
                        break
                content = '\n'.join(lines)
                print(f"✅ Inserted text in {update['file']}")
                success = True
            else:
                print(f"⚠️  Anchor text not found in {update['file']}")
                print(f"   Looking for: {after_text[:100]}...")
                
                # Try to find similar anchor
                if update.get('flexible', True):
                    similar = self.find_similar_text(content, after_text, threshold=0.7)
                    if similar:
                        print(f"📝 Found similar anchor: {similar[:100]}...")
                        if not self.dry_run:
                            response = input("   Insert after this text? (y/n): ").lower()
                            if response == 'y':
                                content = content.replace(similar, similar + '\n' + insert_text)
                                success = True
                
        # Method 4: Insert before a specific line/pattern
        elif 'before' in update and 'insert' in update:
            before_text = update['before']
            insert_text = update['insert']
            
            if before_text in content:
                # Insert with proper indentation
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if before_text in line:
                        # Match indentation of the target line
                        indent = re.match(r'^(\s*)', line).group(1)
                        lines.insert(i, indent + insert_text)
                        break
                content = '\n'.join(lines)
                print(f"✅ Inserted text before anchor in {update['file']}")
                success = True
            else:
                print(f"⚠️  Anchor text not found in {update['file']}")
                
        # Method 5: Replace regex pattern
        elif 'find_regex' in update and 'replace' in update:
            pattern = update['find_regex']
            replace_text = update['replace']
            
            matches = list(re.finditer(pattern, content, re.MULTILINE))
            if matches:
                if len(matches) > 1:
                    print(f"📝 Found {len(matches)} matches for pattern in {update['file']}")
                    if update.get('replace_all', False):
                        content = re.sub(pattern, replace_text, content, flags=re.MULTILINE)
                        print(f"✅ Replaced all {len(matches)} occurrences")
                        success = True
                    else:
                        # Show matches and ask which to replace
                        for i, match in enumerate(matches):
                            print(f"\n   Match {i+1}:")
                            self.show_context(content, match.start())
                        
                        if not self.dry_run:
                            response = input(f"   Replace which match? (1-{len(matches)}/all/none): ")
                            if response == 'all':
                                content = re.sub(pattern, replace_text, content, flags=re.MULTILINE)
                                success = True
                            elif response.isdigit() and 1 <= int(response) <= len(matches):
                                match = matches[int(response) - 1]
                                content = content[:match.start()] + replace_text + content[match.end():]
                                success = True
                else:
                    content = re.sub(pattern, replace_text, content, flags=re.MULTILINE)
                    print(f"✅ Replaced regex pattern in {update['file']}")
                    success = True
            else:
                print(f"❌ Pattern not found in {update['file']}: {pattern}")
        
        # Only write if changed and successful
        if content != original_content and success:
            if not self.dry_run:
                self.backup_file(filepath)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
            return True
        
        return False
    
    def validate_config(self, config):
        """Validate configuration before running"""
        if 'updates' not in config:
            print("❌ Error: 'updates' key not found in config")
            return False
            
        for i, update in enumerate(config['updates']):
            if 'file' not in update:
                print(f"❌ Error: Update {i+1} missing 'file' key")
                return False
                
            # Check that update has at least one action
            actions = ['find', 'find_regex', 'append', 'after', 'before']
            if not any(action in update for action in actions):
                print(f"❌ Error: Update {i+1} has no valid action")
                return False
                
        return True
    
    def run(self, config_file, dry_run=False, interactive=True):
        """Run updates from config file"""
        self.dry_run = dry_run
        
        if not Path(config_file).exists():
            print(f"❌ Config file not found: {config_file}")
            return
            
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
            
        if not self.validate_config(config):
            return
            
        updates = config.get('updates', [])
        mode = "DRY RUN" if dry_run else "LIVE"
        print(f"\n🚀 Running {len(updates)} updates in {mode} mode...\n")
        
        success = 0
        for i, update in enumerate(updates, 1):
            desc = update.get('description', update['file'])
            print(f"[{i}/{len(updates)}] {desc}")
            
            try:
                if self.apply_update(update):
                    success += 1
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                if self.verbose:
                    import traceback
                    traceback.print_exc()
            
            print()
            
        print(f"✨ Done! {success}/{len(updates)} updates {'would be' if dry_run else ''} applied")
        if success > 0 and not dry_run:
            print(f"📁 Backups in: {self.backup_dir}/")

def print_usage():
    """Print usage information with examples"""
    print("📝 Improved Updater for StackMap")
    print("\nUsage: python update.py <config.json> [options]")
    print("\nOptions:")
    print("  --dry-run    Preview changes without applying them")
    print("  --verbose    Show detailed output")
    print("  --force      Skip confirmation prompts")
    print("\n" + "="*50)
    print("\nExample config.json:")
    print(json.dumps({
        "updates": [
            {
                "description": "Fix card click handler",
                "file": "components.js",
                "find": "card.addEventListener('click', (e) => {",
                "replace": "card.addEventListener('click', (e) => {\n    e.stopPropagation();",
                "flexible": True
            },
            {
                "description": "Add new CSS rule using regex",
                "file": "styles/cards.css",
                "find_regex": r"@media \(max-width: 768px\) \{",
                "replace": "@media (max-width: 768px) {\n    /* New mobile styles */",
                "replace_all": False
            },
            {
                "description": "Append mobile fixes to CSS",
                "file": "styles/cards.css",
                "append": "/* Mobile fixes */\n.card { margin: 10px; }"
            },
            {
                "description": "Insert after specific line",
                "file": "index.html",
                "after": '<script src="state.js"></script>',
                "insert": '<script src="newfile.js"></script>'
            }
        ]
    }, indent=2))
    print("\n" + "="*50)
    print("\nFeatures:")
    print("- Flexible text matching (handles whitespace differences)")
    print("- Interactive mode for ambiguous matches")
    print("- Regex pattern support")
    print("- Automatic backups before changes")
    print("- Dry run mode for testing")
    print("- Better error messages and context")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2 or sys.argv[1] in ['-h', '--help']:
        print_usage()
        sys.exit(0)
    
    config_file = sys.argv[1]
    dry_run = '--dry-run' in sys.argv
    verbose = '--verbose' in sys.argv
    force = '--force' in sys.argv
    
    updater = ImprovedUpdater(verbose=verbose)
    updater.run(config_file, dry_run=dry_run, interactive=not force)