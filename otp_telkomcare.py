import pyotp
totp = pyotp.TOTP("VLF4RUHWR45DDBEW")
print(totp.now())