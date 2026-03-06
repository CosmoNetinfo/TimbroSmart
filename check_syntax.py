
import re

def check_balance(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    braces = 0
    parens = 0
    divs = 0
    mains = 0
    
    for i, line in enumerate(lines):
        ln = i + 1
        # Count braces
        braces += line.count('{')
        braces -= line.count('}')
        
        parens += line.count('(')
        parens -= line.count(')')
        
        # Simple tag count
        divs += len(re.findall(r'<div', line))
        divs -= len(re.findall(r'</div', line))
        
        mains += len(re.findall(r'<main', line))
        mains -= len(re.findall(r'</main', line))
        
        if braces < 0 or parens < 0 or divs < 0 or mains < 0:
            print(f"ERROR below 0 at line {ln}: Braces={braces}, Parens={parens}, Divs={divs}, Mains={mains}")
            # Reset would mask errors, but let's see where it first goes wrong
    
    print(f"Final balance for {filename}: Braces={braces}, Parens={parens}, Divs={divs}, Mains={mains}")

check_balance('src/app/admin/page.tsx')
