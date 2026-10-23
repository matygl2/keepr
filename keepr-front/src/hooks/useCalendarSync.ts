import { useState } from 'react';
import { Alert } from 'react-native';
import { useProducts } from '../context/ProductsContext';
import { Product } from '../types';
import {
  removeWarrantyFromCalendar,
  requestCalendarPermission,
  syncWarrantyToCalendar,
} from '../utils/deviceCalendar';

export function useCalendarSync(product: Product) {
  const { updateProduct } = useProducts();
  const [loading, setLoading] = useState(false);
  const synced = !!product.calendarEventId;

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (synced && product.calendarEventId) {
        await updateProduct(product.id, { calendarEventId: undefined });
        await removeWarrantyFromCalendar(product.calendarEventId);
      } else {
        const granted = await requestCalendarPermission();
        if (!granted) {
          Alert.alert(
            'Calendar permission needed',
            'Keepr needs calendar access to add warranty reminders.'
          );
          return;
        }
        const eventId = await syncWarrantyToCalendar(product);
        try {
          await updateProduct(product.id, { calendarEventId: eventId });
        } catch (error) {
          // No se pudo guardar en el servidor: borramos el evento para no dejarlo huérfano.
          await removeWarrantyFromCalendar(eventId);
          throw error;
        }
        Alert.alert(
          'Added to Calendar',
          `A reminder for ${product.name}'s warranty was added to your device calendar, 1 day before it expires.`
        );
      }
    } catch (error) {
      Alert.alert(
        'Could not sync',
        'Something went wrong talking to your device calendar. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return { synced, loading, toggle };
}
