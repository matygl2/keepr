import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Callout, Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  DEFAULT_REGION,
  ServiceCategory,
  ServiceLocation,
  serviceLocations,
} from '../../data/serviceLocations';

const FILTERS: { key: ServiceCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'retailer', label: 'Stores' },
  { key: 'repair', label: 'Repair' },
  { key: 'carrier', label: 'Carriers' },
];

function openDirections(location: ServiceLocation) {
  const { latitude, longitude, name } = location;
  const url = Platform.select({
    ios: `maps:0,0?q=${encodeURIComponent(name)}@${latitude},${longitude}`,
    android: `geo:0,0?q=${latitude},${longitude}(${encodeURIComponent(name)})`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
  });
  Linking.openURL(url as string).catch(() => {
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    );
  });
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [filter, setFilter] = useState<ServiceCategory | 'all'>('all');
  const [selected, setSelected] = useState<ServiceLocation | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        return;
      }
      try {
        const position = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserCoords(coords);
        const newRegion = {
          ...coords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);
      } catch {
        setPermissionDenied(true);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return serviceLocations;
    return serviceLocations.filter((loc) => loc.category === filter);
  }, [filter]);

  const focusLocation = (location: ServiceLocation) => {
    setSelected(location);
    mapRef.current?.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Service & Warranty Map</Text>
        {permissionDenied && (
          <Text style={styles.permissionNote}>
            Location permission not granted — showing Buenos Aires by default.
          </Text>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_DEFAULT}
          initialRegion={region}
          showsUserLocation={!!userCoords}
          showsMyLocationButton
        >
          {filtered.map((location) => (
            <Marker
              key={location.id}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              pinColor={CATEGORY_COLOR[location.category]}
              onPress={() => setSelected(location)}
            >
              <Callout onPress={() => openDirections(location)}>
                <View style={styles.calloutBox}>
                  <Text style={styles.calloutTitle}>{location.name}</Text>
                  <Text style={styles.calloutSubtitle}>
                    {CATEGORY_LABEL[location.category]}
                  </Text>
                  <Text style={styles.calloutAddress}>{location.address}</Text>
                  <Text style={styles.calloutLink}>Tap for directions →</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
      >
        {filtered.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={[
              styles.locationCard,
              selected?.id === location.id && styles.locationCardActive,
            ]}
            onPress={() => focusLocation(location)}
          >
            <View
              style={[
                styles.categoryDot,
                { backgroundColor: CATEGORY_COLOR[location.category] },
              ]}
            />
            <Text style={styles.locationName} numberOfLines={1}>
              {location.name}
            </Text>
            <Text style={styles.locationCategory}>
              {CATEGORY_LABEL[location.category]}
            </Text>
            <Text style={styles.locationAddress} numberOfLines={2}>
              {location.address}
            </Text>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() => openDirections(location)}
            >
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.primary,
  },
  permissionNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  filterPill: {
    minWidth: 105,
    height: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.secondary,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  filterLabelActive: {
    color: colors.white,
  },
  mapWrap: {
    height: 300,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  calloutBox: {
    minWidth: 180,
    padding: 4,
  },
  calloutTitle: {
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  calloutSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  calloutLink: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '600',
  },
  cardsRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  locationCard: {
    width: 190,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  locationCardActive: {
    borderColor: colors.primary,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  locationName: {
    fontFamily: fonts.serif,
    fontSize: 15,
    color: colors.primary,
    marginBottom: 2,
  },
  locationCategory: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  locationAddress: {
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    minHeight: 32,
  },
  directionsButton: {
    backgroundColor: colors.secondary,
    borderRadius: radius.pill,
    paddingVertical: 8,
    alignItems: 'center',
  },
  directionsButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
});
