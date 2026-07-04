import * as LocalAuthentication from "expo-local-authentication";

export async function canUseBiometricUnlock() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && enrolled;
}

export async function authenticateSensitiveAccess() {
  if (!(await canUseBiometricUnlock())) {
    return { success: false, warning: "Biometric unlock is not available on this device." };
  }
  return LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock your Rober fit profile",
    fallbackLabel: "Use passcode"
  });
}
