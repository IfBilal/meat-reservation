import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces'
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans'

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {})
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FAF6F0' },
      }}
    />
  )
}
