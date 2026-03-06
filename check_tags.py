
import re

def check_all_tags(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove JSX expressions like { ... } to avoid confusion
    # But wait, nested braces are hard with regex. 
    # Let's just find all tags.
    
    tags = re.findall(r'</?([a-zA-Z0-9]+)', content)
    stack = []
    
    # List of self-closing tags in this file
    self_closing = {'path', 'circle', 'stop', 'input', 'img', 'br', 'hr', 'Cell', 'PaymentsManagement', 'AdminCalendar', 'LicenseManagement', 'ResponsiveContainer', 'BarChart', 'Bar', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip'}
    
    # Wait, some components might be self-closing or not.
    # Let's check the content for "/>"
    
    all_raw_tags = re.findall(r'<[^>]+>', content)
    
    for tag in all_raw_tags:
        if tag.startswith('<!--'): continue
        if tag.endswith('/>'): continue # Self-closing
        
        match = re.match(r'<(/?)([a-zA-Z0-9]+)', tag)
        if not match: continue
        
        is_closing = match.group(1) == '/'
        tag_name = match.group(2)
        
        if is_closing:
            if not stack:
                print(f"ERROR: Closing tag </{tag_name}> with empty stack")
                continue
            last = stack.pop()
            if last != tag_name:
                print(f"ERROR: Mismatched tag! Expected </{last}>, found </{tag_name}>")
        else:
            # Check if it's a known self-closer that didn't use />
            if tag_name in {'input', 'img', 'br', 'hr'}:
                continue
            stack.append(tag_name)
    
    if stack:
        print(f"ERROR: Unclosed tags in stack: {stack}")
    else:
        print("All tags are balanced (excluding self-closers ending with />)")

check_all_tags('src/app/admin/page.tsx')
