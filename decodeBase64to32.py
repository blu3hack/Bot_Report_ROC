import base64
from google.protobuf import descriptor_pb2, message_factory

# ----- bikin definisi MigrationPayload secara dinamis -----
file_desc = descriptor_pb2.FileDescriptorProto()
file_desc.name = "migration.proto"
file_desc.package = "googleauth"

# Enum Algorithm
enum_algo = file_desc.enum_type.add()
enum_algo.name = "Algorithm"
for i, n in enumerate(["ALGO_INVALID", "ALGO_SHA1", "ALGO_SHA256", "ALGO_SHA512", "ALGO_MD5"]):
    val = enum_algo.value.add()
    val.name = n
    val.number = i

# Enum DigitCount
enum_digits = file_desc.enum_type.add()
enum_digits.name = "DigitCount"
for i, n in enumerate(["DIGIT_COUNT_INVALID", "DIGIT_COUNT_SIX", "DIGIT_COUNT_EIGHT"]):
    val = enum_digits.value.add()
    val.name = n
    val.number = i

# Enum OtpType
enum_type = file_desc.enum_type.add()
enum_type.name = "OtpType"
for i, n in enumerate(["OTP_TYPE_INVALID", "OTP_TYPE_HOTP", "OTP_TYPE_TOTP"]):
    val = enum_type.value.add()
    val.name = n
    val.number = i

# Message OtpParameters
otp_msg = file_desc.message_type.add()
otp_msg.name = "OtpParameters"

field = otp_msg.field.add(); field.name="secret"; field.number=1; field.label=1; field.type=12
field = otp_msg.field.add(); field.name="name"; field.number=2; field.label=1; field.type=9
field = otp_msg.field.add(); field.name="issuer"; field.number=3; field.label=1; field.type=9
field = otp_msg.field.add(); field.name="algorithm"; field.number=4; field.label=1; field.type=14; field.type_name=".googleauth.Algorithm"
field = otp_msg.field.add(); field.name="digits"; field.number=5; field.label=1; field.type=14; field.type_name=".googleauth.DigitCount"
field = otp_msg.field.add(); field.name="type"; field.number=6; field.label=1; field.type=14; field.type_name=".googleauth.OtpType"
field = otp_msg.field.add(); field.name="counter"; field.number=7; field.label=1; field.type=3

# Message MigrationPayload
payload_msg = file_desc.message_type.add()
payload_msg.name = "MigrationPayload"

field = payload_msg.field.add(); field.name="otp_parameters"; field.number=1; field.label=3; field.type=11; field.type_name=".googleauth.OtpParameters"
field = payload_msg.field.add(); field.name="version"; field.number=2; field.label=1; field.type=5
field = payload_msg.field.add(); field.name="batch_size"; field.number=3; field.label=1; field.type=5
field = payload_msg.field.add(); field.name="batch_index"; field.number=4; field.label=1; field.type=5
field = payload_msg.field.add(); field.name="batch_id"; field.number=5; field.label=1; field.type=5

# Build
file_desc_set = descriptor_pb2.FileDescriptorSet()
file_desc_set.file.append(file_desc)
pool = message_factory.GetMessages([file_desc])
MigrationPayload = pool["googleauth.MigrationPayload"]

# ----- decode payload -----
data = "CkoKCnYHGQNp3b/oHg4SBjkyMDI2NBoZbm9uYXRlcm8udGVsa29tLmNvLmlkL3dzYSABKAEwAkITMzU5MDEwMTczNjczODcxMzQwORACGAEgAA=="
payload = base64.b64decode(data)

mp = MigrationPayload()
mp.ParseFromString(payload)

import base64 as b32

for otp in mp.otp_parameters:
    print("Name     :", otp.name)
    print("Issuer   :", otp.issuer)
    print("Algorithm:", otp.algorithm)  # 1 = SHA1, 2 = SHA256, 3 = SHA512
    print("Digits   :", otp.digits)     # 1 = 6 digit, 2 = 8 digit
    print("Type     :", otp.type)       # 2 = TOTP, 1 = HOTP
    print("Secret   :", b32.b32encode(otp.secret).decode("utf-8"))
