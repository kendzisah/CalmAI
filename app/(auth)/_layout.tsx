import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="mood-check" />
      <Stack.Screen name="context" />
      <Stack.Screen name="relief" />
      <Stack.Screen name="post-relief" />
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}
