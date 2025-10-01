import pyotp
totp = pyotp.TOTP("RKFUOOWIZP674M2W")
print(totp.now())