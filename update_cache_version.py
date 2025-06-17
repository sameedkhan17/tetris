#!/usr/bin/env python3
"""
Cache Busting Utility for Tetris Game
Updates version numbers in HTML files to force browser cache refresh
"""

import re
import datetime

def update_cache_version():
    """Update cache version in index.html with current timestamp"""
    
    # Generate new version based on current timestamp
    new_version = datetime.datetime.now().strftime("%Y%m%d%H%M")
    
    # Read index.html
    with open('index.html', 'r') as f:
        content = f.read()
    
    # Update CSS version
    content = re.sub(
        r'href="styles/main\.css\?v=\d+"',
        f'href="styles/main.css?v={new_version}"',
        content
    )
    
    # Update JS versions
    js_files = ['utils.js', 'Tetromino.js', 'AudioManager.js', 'Renderer.js', 'InputHandler.js', 'GameEngine.js', 'main.js']
    
    for js_file in js_files:
        content = re.sub(
            rf'src="js/{js_file}\?v=\d+"',
            f'src="js/{js_file}?v={new_version}"',
            content
        )
    
    # Write updated content
    with open('index.html', 'w') as f:
        f.write(content)
    
    # Update service worker cache name
    with open('sw.js', 'r') as f:
        sw_content = f.read()
    
    sw_content = re.sub(
        r"const CACHE_NAME = 'tetris-v\d+';",
        f"const CACHE_NAME = 'tetris-v{new_version}';",
        sw_content
    )
    
    with open('sw.js', 'w') as f:
        f.write(sw_content)
    
    print(f"Cache version updated to: {new_version}")
    print("Files updated: index.html, sw.js")
    print("Browser cache will be bypassed on next load.")

if __name__ == "__main__":
    update_cache_version()
