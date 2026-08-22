import re

sample = ''' - Python programming
- Datenanalyse mit Pandas
- Maschinelles Lernen Grundlagen
- Öffentliches Sprechen'''

# Regex to match bullet points with optional leading whitespace and various bullet characters
pattern = r'^[\s]*[-*•]\s+(.+)'
suggestions = [match.strip() for match in re.findall(pattern, sample, flags=re.MULTILINE)]

print("Extracted suggestions:", suggestions)
