import pyotp
totp = pyotp.TOTP("FBQAZSNNWL5WNPU6")
print(totp.now())