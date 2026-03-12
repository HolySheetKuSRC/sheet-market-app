import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../context/CartContext';

interface Props {
  iconSize?: number;
  iconColor?: string;
  containerStyle?: object;
}

export default function CartIconWithBadge({
  iconSize = 22,
  iconColor = '#6366F1',
  containerStyle,
}: Props) {
  const router = useRouter();
  const { cartCount } = useCart();

  return (
    <TouchableOpacity
      style={[styles.wrapper, containerStyle]}
      onPress={() => router.push('/cart' as any)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="cart-outline" size={iconSize} color={iconColor} />
      {cartCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {cartCount > 99 ? '99+' : cartCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Mitr_500Medium',
    lineHeight: 14,
  },
});
