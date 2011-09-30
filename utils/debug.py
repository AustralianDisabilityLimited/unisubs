from traceback import print_stack as _print_stack
from StringIO import StringIO
from pygments import highlight
from pygments.lexers import PythonTracebackLexer
from pygments.formatters import TerminalFormatter

def print_stack():
    s = StringIO()
    _print_stack(file=s)
    print highlight(s.getvalue(), PythonTracebackLexer(), TerminalFormatter())
