# Google sign-in redirect update

## Changes
- Keep the existing login panel.
- Send Google sign-in back to the public site origin.
- Preserve the requested in-app destination and navigate there only after authentication is confirmed.
- Verify the authentication page and landing-page dialog use the same flow.

## Technical details
- Continue using the standard browser authentication client.
- Do not add proxy wrappers or provider-specific browser workarounds.
- Validate the current preview and check build diagnostics.
