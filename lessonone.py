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





# Assignment: Simple Server Roles & Tags Organizer
# Scenario
# You have three pre‑defined categories for servers:

# 1] Allowed roles – stored in a tuple (cannot be changed)
# 2] Tag list – stored in a list (can be changed/added)
# 3]Unique IP set – stored in a set (no duplicates)

# The user will interact with these collections through simple menu choices.

# What the script must do
# 1] Create a tuple called allowed_roles with these three strings: "web", "db", "cache".
# 2] Create an empty list called tag_list.
# 3] Create an empty set called ip_set.
# 4]Use a while loop to show a menu repeatedly until the user chooses "exit":

# --- Server Tool Menu ---
# 1. Show allowed roles (tuple)
# 2. Add a tag to the list
# 3. Show all tags
# 4. Add an IP to the set
# 5. Show all IPs
# 6. Check if a role is allowed
# 7. Exit

# For each menu option:
# Option 1 – Print the entire tuple. === Show allowed roles
# Option 2 – Ask the user for a tag string (e.g., "production") and append it to the list tag_list. === Add a tag to the list
# Eg: a = [ ]
#        b = [‘B’]
#        a = a + b
#        a = [ “B” ]
# Option 3 – Loop through tag_list with for and print each tag. === Show all tags Option 4 – Ask for an IP string (e.g., "192.168.1.1") and add it to the set ip_set. Option 5 – Loop through ip_set (or the list) and print each IP.
# Option 6 – Ask for a role, then check if it exists in the tuple using if role in allowed_roles: (this is fine, in is an operator, not a method).
# Option 7 – break the while loop.




# -------------------------------------------------------------------------------- 
# Example 1
# Welcome to the 'Server Tool' – let's organize!

# --- Server Tool Menu ---
# 1. Show allowed roles (tuple)
# 2. Add a tag to the list
# 3. Show all tags
# 4. Add an IP to the set
# 5. Show all IPs
# 6. Check if a role is allowed
# 7. Exit

# Choose: 1
# Allowed roles: ('web', 'db', 'cache')

# Choose: 2
# Enter tag: production
# Tag added.

# Choose: 2
# Enter tag: eu-west
# Tag added.

# Choose: 3
# Tags:
# - production
# - eu-west

# Choose: 4
# Enter IP: 10.0.0.1
# IP added.

# Choose: 4
# Enter IP: 10.0.0.1
# IP already exists (set prevents duplicates).

# Choose: 5
# IPs:
# - 10.0.0.1

# Choose: 6
# Enter role: web
# 'web' is allowed.

# Choose: 7
# Goodbye!
#  Hints No methods or function List: tag_list = tag_list + [new_tag]
# Set: ip_set = set(list(ip_set) + [new_ip]) – but that's more confusing.



Assignment: Movie Watchlist Manager
Scenario
You are keeping track of movies you want to watch.

Genres are fixed – stored in a tuple.

Watchlist – a list of movie titles (can have duplicates if you add same movie twice, but you will prevent that manually).

Watched movies – a list that simulates a set (no duplicates, manual check).

The script will let users add movies to watchlist, mark movies as watched, and view everything.

Requirements
Create a tuple genres = ("action", "comedy", "drama", "horror", "sci-fi")

Create an empty list watchlist = [] – stores movie titles (strings)

Create an empty list watched = [] – stores movie titles, but no duplicates (you will check manually)

Use a while loop to show this menu:

text
--- Movie Watchlist Manager ---
1. Show available genres (tuple)
2. Add a movie to watchlist
3. Show watchlist
4. Mark a movie as watched
5. Show watched movies
6. Exit
Option 1 – Print the tuple.

Option 2 – Ask for movie title.

Ask for genre, validate against tuple (keep asking until valid).

Store movie as "title (genre)" (e.g., "Inception (sci-fi)").

Check if movie already exists in watchlist (manual loop). If not, add it. If yes, print "Movie already in watchlist".

Option 3 – Loop through watchlist and print each movie with a number (use a counter variable).

Option 4 – Ask for movie title.

First, check if it exists in watchlist (manual loop). If not, print "Movie not in watchlist".

If it exists, then check if it's already in watched (manual duplicate check).

If not in watched, add it to watched and remove it from watchlist (you need to find its position and delete – use a loop to create a new list without that movie, or use .remove() if you allow that one method).
Simpler: allow .remove() as the only list method for this step, or show them how to rebuild the list without the item using a loop.

Option 5 – Loop through watched and print each movie.

Option 6 – break and print a goodbye message with mixed quotes.

Mixed quotes requirement:
Print a message somewhere (welcome or goodbye) that contains both single and double quotes.
Example: print("Your 'watchlist' is ready – let's find some movies!")

Example Run
text
Your 'watchlist' is ready – let's find some movies!

--- Movie Watchlist Manager ---
1. Show available genres
2. Add a movie to watchlist
3. Show watchlist
4. Mark a movie as watched
5. Show watched movies
6. Exit

Choose: 1
Genres: ('action', 'comedy', 'drama', 'horror', 'sci-fi')

Choose: 2
Enter movie title: Inception
Enter genre: sci-fi
Added: Inception (sci-fi)

Choose: 2
Enter movie title: The Hangover
Enter genre: comedy
Added: The Hangover (comedy)

Choose: 2
Enter movie title: Inception
Enter genre: sci-fi
Movie already in watchlist.

Choose: 3
Your watchlist:
1. Inception (sci-fi)
2. The Hangover (comedy)

Choose: 4
Enter movie title to mark as watched: Inception
Marked as watched. Removed from watchlist.

Choose: 4
Enter movie title to mark as watched: Inception
Movie already in watched list.

Choose: 5
Watched movies:
- Inception (sci-fi)

Choose: 3
Your watchlist:
1. The Hangover (comedy)

Choose: 6
Goodbye! "Enjoy your movies!" – said the manager.




Assignment: Task Priority Manager
Scenario
You are managing a small team’s tasks. Each task has:

A priority level – fixed set of allowed priorities stored in a tuple

A list of task names (can grow)

A set of unique project codes (simulate with a list and manual duplicate check)

The script will let the user add tasks, add project codes, and view everything.

Requirements
Create a tuple allowed_priorities = ("high", "medium", "low")

Create an empty list tasks = [] – each task will be stored as a string like "high: Fix login bug"

Create an empty list project_codes = [] – but with no duplicates (you will check manually)

Use a while loop to show this menu:

text
--- Task Priority Manager ---
1. Show allowed priorities (tuple)
2. Add a new task
3. Show all tasks
4. Add a project code (no duplicates)
5. Show all project codes
6. Exit
Option 1 – Print the tuple.

Option 2 – Ask for task description, then ask for priority.

Validate that priority is in the tuple. If not, keep asking until valid (use a small inner loop).

Store task as "priority: description" (e.g., "high: Fix database connection").

Option 3 – Loop through tasks and print each task (e.g., - high: Fix login bug).

Option 4 – Ask for a project code (e.g., "PROJ-01").

Manually loop through project_codes to check if it already exists.

If not, add it. If yes, print "Project code already exists".

Option 5 – Loop through project_codes and print each.

Option 6 – break and print a goodbye message.

Mixed quotes requirement:
Print a welcome message that contains both single and double quotes inside.
Example: print("Welcome to the 'Task Priority Manager' – let's get organized!")

Example Run
text
Welcome to the 'Task Priority Manager' – let's get organized!

--- Task Priority Manager ---
1. Show allowed priorities
2. Add a new task
3. Show all tasks
4. Add a project code
5. Show all project codes
6. Exit

Choose: 1
Allowed priorities: ('high', 'medium', 'low')

Choose: 2
Enter task description: Fix login bug
Enter priority (high/medium/low): high
Task added.

Choose: 2
Enter task description: Write documentation
Enter priority: urgent
Invalid priority. Try again: high
Task added.

Choose: 3
Your tasks:
- high: Fix login bug
- high: Write documentation

Choose: 4
Enter project code: AUTH-01
Project code added.

Choose: 4
Enter project code: AUTH-01
Project code already exists.

Choose: 4
Enter project code: DOCS-02
Project code added.

Choose: 5
Project codes:
- AUTH-01
- DOCS-02

Choose: 6
Goodbye! Stay productive.




Assignment: DevOps Tag & IP Manager
Scenario
You are building a small tool to manage server tags and IP addresses for a deployment.

Allowed roles are fixed – stored in a tuple.

Tags are stored in a list (e.g., "production", "eu-west").

IP addresses must be unique – you will store them in a list, but you will manually check for duplicates (no sets, no fancy methods).

Requirements
Create a tuple allowed_roles = ("web", "db", "cache")

Create an empty list tags = []

Create an empty list ips = []

Use a while loop to show this menu repeatedly until the user chooses 5:

text
--- DevOps Manager ---
1. Show allowed roles (tuple)
2. Add a tag
3. Show all tags
4. Add an IP (no duplicates allowed)
5. Exit
For each option:

Option 1 – Print the entire tuple.

Option 2 – Ask for a tag (e.g., "production") and add it to the tags list.
(Use tags.append(new_tag) or tags = tags + [new_tag] – your choice.)

Option 3 – Use a for loop to print each tag.

Option 4 – Ask for an IP (e.g., "192.168.1.1").
Before adding, loop through the existing ips list to see if it already exists.

If it exists → print "IP already in list"

If not → add it to ips list.

Option 5 – break the loop and print a goodbye message.

Mixed quotes requirement:
At the start of the script, print a welcome message that contains both single and double quotes inside the same string.
Example: print('Welcome to the "DevOps Manager" – let\'s secure your servers!')
(Note the escaped single quote or use double quotes outside.)

Example Run
text
Welcome to the "DevOps Manager" – let's secure your servers!

--- DevOps Manager ---
1. Show allowed roles
2. Add a tag
3. Show all tags
4. Add an IP (no duplicates)
5. Exit

Choose: 1
Allowed roles: ('web', 'db', 'cache')

Choose: 2
Enter tag: production
Tag added.

Choose: 2
Enter tag: eu-west
Tag added.

Choose: 3
Your tags:
- production
- eu-west

Choose: 4
Enter IP: 10.0.0.1
IP added.

Choose: 4
Enter IP: 10.0.0.1
IP already in list.

Choose: 4
Enter IP: 10.0.0.2
IP added.

Choose: 5
Goodbye! Have a great day.