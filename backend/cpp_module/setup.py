"""
Setup script for compiling the C++ Kahn's Algorithm module.

Usage:
    pip install -e .                    # Install in development mode
    python setup.py build_ext --inplace # Build in-place for testing
"""

from setuptools import setup, Extension
from setuptools.command.build_ext import build_ext
import sys
import os

# Get pybind11 include path
try:
    import pybind11
    PYBIND11_INCLUDE = pybind11.get_include()
except ImportError:
    PYBIND11_INCLUDE = ""

# Determine extension suffix
if sys.platform == "win32":
    EXT_SUFFIX = ".pyd"
else:
    EXT_SUFFIX = ".so"

class BuildExt(build_ext):
    """Custom build_ext to handle pybind11."""

    def build_extensions(self):
        # Ensure pybind11 is available
        if not PYBIND11_INCLUDE:
            try:
                import pybind11
                self.include_dirs.append(pybind11.get_include())
            except ImportError:
                raise RuntimeError("pybind11 not found. Install with: pip install pybind11")
        else:
            self.include_dirs.append(PYBIND11_INCLUDE)

        # Add compiler flags
        for ext in self.extensions:
            ext.extra_compile_args = [
                "-O3",
                "-std=c++17",
                "-fPIC",
                "-Wall",
                "-Wextra",
            ]
            if sys.platform == "darwin":
                ext.extra_compile_args.extend(["-mmacosx-version-min=10.14"])
            ext.extra_link_args = []

        super().build_extensions()

# Define the extension module
kahn_module = Extension(
    "kahn_module",
    sources=[
        "kahn_algorithm.cpp",
        "kahn_binding.cpp",
    ],
    include_dirs=[PYBIND11_INCLUDE] if PYBIND11_INCLUDE else [],
    language="c++",
)

setup(
    name="kahn_module",
    version="0.1.0",
    author="ClearanceFlow Team",
    description="Kahn's Algorithm C++ Module for ClearanceFlow",
    ext_modules=[kahn_module],
    cmdclass={"build_ext": BuildExt},
    zip_safe=False,
    python_requires=">=3.11",
    install_requires=[
        "pybind11>=2.10.0",
    ],
)