import re

def verify_valid_username(username: str):
    if not username:
        raise ValueError("Username must be provided.")
    if len(username) < 3 or len(username) > 30:
        raise ValueError("Username must be between 3 and 30 characters long.")
    if not username.isalnum():
        raise ValueError("Username must be alphanumeric.")
    if " " in username:
        raise ValueError("Username must not contain spaces.")

def verify_valid_email(email: str):
    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    if not re.match(email_regex, email):
        raise ValueError("Invalid email format.")

def verify_valid_password(password: str):
    if not password:
        raise ValueError("Password must be provided.")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not any(c.isdigit() for c in password):
        raise ValueError("Password must contain at least one number.")
    if not any(c.isalpha() for c in password):
        raise ValueError("Password must contain at least one letter.")
    if not any(c.isupper() for c in password):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not any(not c.isalnum() for c in password):
        raise ValueError("Password must contain at least one special character.")