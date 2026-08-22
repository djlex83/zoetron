try:
    from typing import Protocol
except ImportError:  # Python <3.8
    from typing_extensions import Protocol

from typing import List, Dict
import re

class DreamErrorProtocol(Protocol):
    def analyze(self, log: str) -> List[Dict[str, str]]: ...

class SimpleDreamPlugin:
    # Regex to capture timestamp, log level, and message
    _line_re = re.compile(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+(\w+)\s+(.*)$')

    def analyze(self, log: str) -> List[Dict[str, str]]:
        patterns: List[Dict[str, str]] = []
        for line in log.splitlines():
            line = line.rstrip()
            if not line:
                continue
            match = self._line_re.match(line)
            if match:
                timestamp, level, message = match.groups()
                if level == 'ERROR':
                    patterns.append({
                        'timestamp': timestamp,
                        'message': message.strip(),
                        'type': 'error'
                    })
            else:
                # Fallback for lines without a proper timestamp
                if 'ERROR' in line:
                    patterns.append({
                        'timestamp': '',
                        'message': line.strip(),
                        'type': 'error'
                    })
        return patterns

if __name__ == '__main__':
    mock_log = '''
2026-08-22 10:00:00 INFO Dream started
2026-08-22 10:00:01 ERROR Something went wrong
2026-08-22 10:00:02 INFO Continuing
'''
    plugin = SimpleDreamPlugin()
    result = plugin.analyze(mock_log)
    print('Found error patterns:', result)
