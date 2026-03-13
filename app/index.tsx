import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { clearTokens, getStoredAuthTokens, hasCompleteAuthTokens } from '../utils/token';

export default function Index() {
  const [target, setTarget] = useState<null | string>(null);

  useEffect(() => {
    const bootstrap = async () => {
      const tokens = await getStoredAuthTokens();

      if (hasCompleteAuthTokens(tokens)) {
        setTarget('/(drawer)/home');
      } else {
        if (tokens.accessToken || tokens.refreshToken || tokens.sessionToken) {
          await clearTokens();
        }
        setTarget('/login');
      }
    };

    bootstrap();
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={target as any} />;
}
