import pyotp
totp = pyotp.TOTP("OYDRSA3J3W76QHQO")
print(totp.now())