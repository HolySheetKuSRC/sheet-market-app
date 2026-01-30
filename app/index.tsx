import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getAccessToken } from './utils/token';

export default function Index() {
  const [target, setTarget] = useState<null | string>(null);

  useEffect(() => {
    const bootstrap = async () => {
      const token = await getAccessToken();

      if (token) {
        setTarget('/(drawer)/home');
      } else {
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
