import random
import string
import os
import time

def simulate_bruteforce_three_columns(target_password):
    charset = string.digits
    attempts = 0
    found = False
    guesses_per_row = 4
    row = []

    print("Starting...\n")
    time.sleep(1)

    while not found:
        guess = ''.join(random.choices(charset, k=len(target_password)))
        attempts += 1

        entry = f"[{attempts:06}] {guess}"
        row.append(entry)

        if guess == target_password:
            found = True

        # Jika sudah 3 kolom, cetak baris dan kosongkan
        if len(row) == guesses_per_row or found:
            print('   '.join(row))
            row = []

        time.sleep(0.01)

    print("\n✅ PASSWORD DITEMUKAN!")
    print(f"🔑 Password: {guess}")
    print(f"📊 Total percobaan: {attempts}")

# Ganti target password di sini
target = "0000"

# Jalankan
simulate_bruteforce_three_columns(target)
