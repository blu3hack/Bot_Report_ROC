import pyotp
totp = pyotp.TOTP("4SIQ2PHT77VKLPWY")
print(totp.now())