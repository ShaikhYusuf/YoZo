export function getEnvVariable(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export function validateEnvVariables(requiredKeys: string[]): void {
  const missingKeys = requiredKeys.filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingKeys.join(", ")}`
    );
  }
}
