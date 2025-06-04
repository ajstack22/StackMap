#!/usr/bin/env python3
"""
StackMap Simple Updater - For partial file updates only
Focused on what we actually need: quick, reliable partial updates
"""

import json
import shutil
from datetime import datetime
from pathlib import Path

class SimpleUpdater:
    def __init__(self, project_root="."):
        self.project_root = Path(project_root)
        self.backup_dir = self.project_root / "backups"
        self.backup_dir.mkdir(exist_ok=True)
        
    def backup_file(self, filepath):
        """Create timestamped backup"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = self.backup_dir / f"{filepath.name}_{timestamp}"
        shutil.copy2(filepath, backup_path)
        print(f"✅ Backed up to: backups/{filepath.name}_{timestamp}")
        
    def apply_update(self, update):
        """Apply a single update"""
        filepath = self.project_root / update['file']
        
        if not filepath.exists():
            print(f"❌ File not found: {filepath}")
            return False
            
        # Read file
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Method 1: Replace exact text
        if 'find' in update and 'replace' in update:
            if update['find'] in content:
                content = content.replace(update['find'], update['replace'])
                print(f"✅ Replaced in {update['file']}")
            else:
                print(f"⚠️  Text not found in {update['file']}")
                print(f"   Looking for: {update['find'][:100]}...")
                return False
                
        # Method 2: Append to end of file
        elif 'append' in update:
            content += f"\n{update['append']}\n"
            print(f"✅ Appended to {update['file']}")
            
        # Method 3: Insert after a specific line
        elif 'after' in update and 'insert' in update:
            if update['after'] in content:
                content = content.replace(
                    update['after'], 
                    update['after'] + '\n' + update['insert']
                )
                print(f"✅ Inserted in {update['file']}")
            else:
                print(f"⚠️  Anchor text not found in {update['file']}")
                return False
        
        # Only write if changed
        if content != original_content:
            self.backup_file(filepath)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    
    def run(self, config_file):
        """Run updates from config file"""
        if not Path(config_file).exists():
            print(f"❌ Config file not found: {config_file}")
            return
            
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
            
        updates = config.get('updates', [])
        print(f"\n🚀 Running {len(updates)} updates...\n")
        
        success = 0
        for i, update in enumerate(updates, 1):
            print(f"[{i}/{len(updates)}] {update.get('description', update['file'])}")
            if self.apply_update(update):
                success += 1
            print()
            
        print(f"✨ Done! {success}/{len(updates)} updates applied")
        if success > 0:
            print(f"📁 Backups in: {self.backup_dir}/")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        updater = SimpleUpdater()
        updater.run(sys.argv[1])
    else:
        print("📝 Simple Updater for StackMap")
        print("\nUsage: python update.py <config.json>")
        print("\n" + "="*50)
        print("\nExample config.json:")
        print(json.dumps({
            "updates": [
                {
                    "description": "Fix card click handler",
                    "file": "components.js",
                    "find": "card.addEventListener('click', (e) => {\n    if (e.target.closest('.card__edit-btn')) {",
                    "replace": "card.addEventListener('click', (e) => {\n    e.stopPropagation();\n    if (!e.target.closest('.card__actions')) {"
                },
                {
                    "description": "Add rectangle fix to cards.css",
                    "file": "styles/cards.css",
                    "append": "/* Fix: Rectangle artifacts */\n.card__type-indicator,\n.btn--round {\n    border-radius: 50% !important;\n}"
                },
                {
                    "description": "Add import after existing imports",
                    "file": "index.html",
                    "after": '<script src="state.js"></script>',
                    "insert": '<script src="newfile.js"></script>'
                }
            ]
        }, indent=2))