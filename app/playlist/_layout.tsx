import { Stack } from 'expo-router';

export default function PlaylistLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f0f0f' },
      }}
    />
  );
}