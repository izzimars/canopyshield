#Python Basics for Engineers
# ============================================
# Variables & Data Types
# ============================================

# Concept                 JavaScript                          Python
# Variable declaration    let name = "Alex"; const PI = 3.14;  name = "Alex"
# Block scope             let/const are block-scoped          function-scoped (no block scope)
# Constants               const PI = 3.14                     PI = 3.14 (by convention uppercase)

# Data type comparison
# JS: number, string, boolean, null/undefined, object/array
# Python: int/float, str, bool, None, dict/list

count = 42          # int
float_number = 3.14 # float
name = "Alex"       # str
is_active = True    # bool   (note: True/False, not true/false)
nothing = None      # NoneType

# === POTENTIAL ERRORS ===
# Error 1: Using undefined variable
# print(undefined_var)  # NameError: name 'undefined_var' is not defined

# Error 2: Mixing types without conversion
# result = "The number is " + 42   # TypeError: can only concatenate str (not "int") to str
# Fix: result = "The number is " + str(42)

# Error 3: Forgetting that Python is case‑sensitive
# Is_active = True   # different variable from is_active
# print(is_active)   # still True, not affected

# Error 4: Using JS boolean literals
# is_ready = true    # NameError: name 'true' is not defined (should be True)


# ============================================
# Input & Output
# ============================================
username = input("Enter your username: ")
print("Hello, " + username)

# === POTENTIAL ERRORS ===
# Error 1: input() always returns a string – forgetting to convert numbers
# age = input("Enter age: ")
# if age > 18:                     # TypeError: '>' not supported between str and int
# Fix: age = int(input("Enter age: "))

# Error 2: Using print() with multiple arguments forgetting separator
# print("Hello" "World")   # prints "HelloWorld" (no space)
# print("Hello", "World")  # prints "Hello World" (correct)

# Error 3: Forgetting parentheses on print() – Python 2 style
# print "Hello"   # SyntaxError: Missing parentheses in call to 'print'


# ============================================
# Conditions
# ============================================
age = int(input("Enter your age: "))
if age >= 18:
    print("You are an adult.")
else:
    print("You are a minor.")

sex = input("Enter your sex (M/F/O): ")
if sex == "M":
    print("You are a male.")
elif sex == "F":
    print("You are a female.")
elif sex == "O":
    print("You are other.")
    specification = input("Please specify: ")
    print("You specified: " + specification)
else:
    print("Invalid input for sex.")

# === POTENTIAL ERRORS ===
# Error 1: Using assignment (=) instead of equality (==)
# if sex = "M":    # SyntaxError: invalid syntax (in Python, = can't be used in if)

# Error 2: Forgetting colon (:) after if/elif/else
# if age > 18      # SyntaxError: expected ':'
#     print("ok")

# Error 3: Incorrect indentation – Python relies on it
# if age > 18:
# print("You are an adult.")   # IndentationError: expected an indented block

# Error 4: Using JS logical operators (&&, ||, !)
# if age > 18 && sex == "M":   # SyntaxError: invalid syntax
# Fix: use and, or, not

# Error 5: Using 'else if' instead of 'elif'
# if age < 18:
#     print("minor")
# else if age < 65:            # SyntaxError: invalid syntax
#     print("adult")


# ============================================
# Loops
# ============================================
my_list = [1, 2, 3, 4, 5]
for item in my_list:
    print(item)

for x in my_list:
    if x % 2 == 0:
        print(x, "is even")
    else:
        print(x, "is odd")

n = 0
while n < 5:
    print(n)
    n += 1

for i in range(5):      # 0 to 4
    print(i)

for i in range(1, 6):   # 1 to 5
    print(i)

sweet = ["cake", "ice cream", "chocolate", "cookies", "pie"]
for i, j in enumerate(sweet):
    print(i, j)

# Break and Continue
for i in range(10):
    if i == 5:
        break
    print(i)

for i in range(10):
    if i % 2 == 0:
        continue
    print(i)

# === POTENTIAL ERRORS ===
# Error 1: Modifying a list while iterating over it
# for item in my_list:
#     if item == 3:
#         my_list.remove(item)   # Runtime error or unexpected behaviour (skip elements)
# Fix: iterate over a copy – for item in my_list[:]:

# Error 2: Off‑by‑one in while loop (infinite loop)
# n = 0
# while n < 5:
#     print(n)      # forgot n += 1 → infinite loop

# Error 3: Using range() with wrong arguments
# for i in range(5, 1):   # empty range because start=5, stop=1 (step default +1)
#     print(i)            # prints nothing

# Error 4: Forgetting to convert enumerate() index – it's already int
# for i, j in enumerate(sweet):
#     print(i + j)   # TypeError if j is str (can't add int + str)


# ============================================
# Functions
# ============================================
def add(a, b):
    return a + b

def greet_user(name):
    greeting = "Hi " + name
    if len(name) > 5:
        greeting += " (long name)"
    return greeting

print(add(2, 3))
print(greet_user("Alexandra"))

# === POTENTIAL ERRORS ===
# Error 1: Forgetting the 'def' keyword or colon
# function add(a, b):   # SyntaxError
#     return a + b

# Error 2: Mutable default arguments – classic pitfall
# def append_to_list(item, my_list=[]):   # same default list reused across calls
#     my_list.append(item)
#     return my_list
# print(append_to_list(1))  # [1]
# print(append_to_list(2))  # [1, 2]  -> not a fresh list!
# Fix: def append_to_list(item, my_list=None):
#          if my_list is None: my_list = []

# Error 3: Returning nothing (implicit None) and then trying to use result
# def no_return(x):
#     x + 1   # missing return
# result = no_return(5)   # result is None
# print(result + 1)       # TypeError: unsupported operand type(s) for +: 'NoneType' and 'int'

# Error 4: Passing wrong number of arguments
# add(2)            # TypeError: missing 1 required positional argument: 'b'
# add(2, 3, 4)      # TypeError: takes 2 positional arguments but 3 were given


# ============================================
# Imports / Modules
# ============================================
import math
print(math.sqrt(16))
print(math.pi)

from math import sqrt, pi
print(sqrt(16))
print(pi)

# === POTENTIAL ERRORS ===
# Error 1: Trying to import a module that is not installed
# import requests   # ModuleNotFoundError – unless you pip install requests first

# Error 2: Circular imports (module A imports B, B imports A)
# Leads to partial modules – avoid by restructuring

# Error 3: Using from module import * (pollutes namespace, hard to debug)
# from math import *
# sqrt(16)   # works, but you don't know where sqrt came from (bad practice)

# Error 4: Misspelling module or attribute name
# import math
# math.sqr(16)      # AttributeError: module 'math' has no attribute 'sqr'


# ============================================
# Virtual Environments (Python) vs node_modules (JS)
# ============================================

# Create:        python -m venv myenv
# Activate:      Windows: myenv\Scripts\activate
#                Mac/Linux: source myenv/bin/activate
# Install:       pip install requests
# Save deps:     pip freeze > requirements.txt
# Restore:       pip install -r requirements.txt

# === POTENTIAL ERRORS ===
# Error 1: Forgetting to activate the virtual environment
# Result: pip installs packages globally – conflicts between projects

# Error 2: Activating the wrong script on Windows
# .\myenv\Scripts\activate.bat   (correct)
# .\myenv\Scripts\activate       (works in PowerShell, not in cmd)

# Error 3: Committing the virtual environment folder to git
# Bad: git add myenv/   (huge, system‑specific)
# Fix: add myenv/ to .gitignore

# Error 4: Using pip freeze > requirements.txt while venv is not activated
# Captures global packages – causes unnecessary dependencies for others

# Error 5: Different Python versions between venv creation and runtime
# python -m venv myenv --python=3.8   but later run with python3.10 → may break
# Fix: specify python interpreter explicitly or use tools like pyenv