# Creating Your Android Signing Key

## Run this command in Terminal:

```bash
cd /Users/adamstack/StackMap/StackMap/StackMapNative/android/app
keytool -genkey -v -keystore stackmap-release.keystore -alias stackmap -keyalg RSA -keysize 2048 -validity 10000
```

## When prompted, enter:

1. **Keystore password**: Choose a secure password (6+ characters)
   - ⚠️ SAVE THIS PASSWORD! You'll need it forever
   - Example: StackMap2025Secure!

2. **Re-enter password**: Same password

3. **First and last name**: Your name or "StackMap Developer"

4. **Organizational unit**: Can be "Mobile Development" or your company

5. **Organization**: Your company name or your name

6. **City or Locality**: Your city

7. **State or Province**: Your state/province

8. **Country code**: US (or your 2-letter country code)

9. **Is CN=... correct?**: Type `yes`

10. **Key password**: Press ENTER to use same as keystore password

## Example:

```
Enter keystore password: StackMap2025Secure!
Re-enter new password: StackMap2025Secure!
What is your first and last name?
  [Unknown]:  Adam Stack
What is the name of your organizational unit?
  [Unknown]:  Mobile Development
What is the name of your organization?
  [Unknown]:  StackMap
What is the name of your City or Locality?
  [Unknown]:  San Francisco
What is the name of your State or Province?
  [Unknown]:  CA
What is the two-letter country code for this unit?
  [Unknown]:  US
Is CN=Adam Stack, OU=Mobile Development, O=StackMap, L=San Francisco, ST=CA, C=US correct?
  [no]:  yes

Enter key password for <stackmap>
        (RETURN if same as keystore password):  [Press ENTER]
```

## ⚠️ CRITICAL: Save Your Password!

Create a file `android/keystore-credentials.txt` (DO NOT COMMIT THIS!):
```
Keystore: stackmap-release.keystore
Alias: stackmap
Password: [Your password here]
```

Add to `.gitignore`:
```
android/keystore-credentials.txt
android/app/*.keystore
```