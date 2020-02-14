"""
This module is used to filter and reload PATH.
"""

import os
import sys
import re

ta_name = 'splunk_app_addon-builder'
ta_lib_name = 'splunk_app_add_on_builder'
pattern = re.compile(r"[\\/]etc[\\/]apps[\\/][^\\/]+[\\/]bin[\\/]?$")
new_paths = [path for path in sys.path if not pattern.search(path) or ta_name in path]
new_paths.insert(0, os.path.sep.join([os.path.dirname(__file__), ta_lib_name]))
sys.path = new_paths
