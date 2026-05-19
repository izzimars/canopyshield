allowed_roles = ('web', 'db', 'cache')
tag_list = []
ip_set = set()

while True:
    print('--- Server Tool Menu---')
    print("""
        1. Show allowed roles (tuple)
        2. Add a tag to the list
        3. Show all tags
        4. Add an IP to the set
        5. Show all IPs
        6. Check if a role is allowed
        7. Exit
    """)
    response = input("Enter a number to select an option: ")

    if response == '1':
        print(f"Allowed roles: {allowed_roles}")
    elif response == '2':
        tag = input("Enter a tag to add: ")
        tag_list = tag_list + [tag]
        print(f"Tag '{tag}' added to the list.")
    elif response == '3':
        print(f"Current tags: {tag_list}")
    elif response == '4':
        ip = input("Enter an IP address to add: ")
        ip_set = ip_set | {ip}
        print(f"IP '{ip}' added to the set.")
    elif response == '5':
        print(f"Current IPs: {ip_set}")
    elif response == '6':
        role = input("Enter a role to check: ")
        if role in allowed_roles:
            print(f"Role '{role}' is allowed.")
        else:
            print(f"Role '{role}' is not allowed.")
    if response == '7':
        break
    print('----------end of looop----------')
    print('\n')

























































