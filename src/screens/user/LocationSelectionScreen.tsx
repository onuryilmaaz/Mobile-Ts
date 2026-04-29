import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getStates,
  getDistrictsByStateId,
  getStateById,
  getDistrictById,
  isDistrictsDataLoaded,
} from '@/constants/locations';
import { useAppTheme } from '@/constants/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'LocationSelection'>;

const STORAGE_STATE_ID_KEY = 'SELECTED_STATE_ID';
const STORAGE_DISTRICT_ID_KEY = 'SELECTED_DISTRICT_ID';

export default function LocationSelectionScreen({ navigation }: Props) {
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'state' | 'district'>('state');
  const { colors, isDark } = useAppTheme();

  const states = getStates();
  const districts = selectedStateId ? getDistrictsByStateId(selectedStateId) : [];
  const selectedState = selectedStateId ? getStateById(selectedStateId) : null;
  const selectedDistrict = selectedDistrictId ? getDistrictById(selectedDistrictId) : null;

  useEffect(() => {
    loadSavedLocation();
  }, []);

  const loadSavedLocation = async () => {
    try {
      const savedStateId = await AsyncStorage.getItem(STORAGE_STATE_ID_KEY);
      const savedDistrictId = await AsyncStorage.getItem(STORAGE_DISTRICT_ID_KEY);

      if (savedStateId) {
        setSelectedStateId(savedStateId);
        if (savedDistrictId) {
          setSelectedDistrictId(savedDistrictId);
          setStep('district');
        } else {
          setStep('district');
        }
      }
    } catch (error) {
      console.error('Error loading saved location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStateSelect = (stateId: string) => {
    setSelectedStateId(stateId);
    setSelectedDistrictId(null);
    setStep('district');
  };

  const handleDistrictSelect = async (districtId: string) => {
    try {
      setSelectedDistrictId(districtId);
      await AsyncStorage.setItem(STORAGE_STATE_ID_KEY, selectedStateId!);
      await AsyncStorage.setItem(STORAGE_DISTRICT_ID_KEY, districtId);

      navigation.goBack();
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleBack = () => {
    if (step === 'district') {
      setStep('state');
      setSelectedDistrictId(null);
    } else {
      navigation.goBack();
    }
  };

  if (loading || !isDistrictsDataLoaded()) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.teal} />
        <Text style={{ color: colors.textSecondary, marginTop: 16 }}>
          {!isDistrictsDataLoaded() ? 'İlçe verileri yükleniyor...' : 'Yükleniyor...'}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen  safeAreaEdges={['right', 'left']}>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View style={{ marginHorizontal: 16, marginVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: colors.cardBorder }}>
          <TouchableOpacity onPress={handleBack} className="flex-row items-center">
            <Ionicons name="chevron-back" size={24} color={colors.teal} />
            <Text style={{ marginLeft: 4, fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
              {step === 'district' ? selectedState?.name : 'İl Seçin'}
            </Text>
          </TouchableOpacity>
          {step === 'district' && selectedDistrict && (
            <View style={{ borderRadius: 99, backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : colors.tealDim, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.teal }}>{selectedDistrict.name}</Text>
            </View>
          )}
        </View>
        {step === 'state' ? (
          <View className="gap-2 mx-4">
            {states.map((state) => {
              const isSelected = selectedStateId === state._id;
              return (
                <TouchableOpacity
                  key={state._id}
                  onPress={() => handleStateSelect(state._id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    borderRadius: 12, borderWidth: 1, padding: 16,
                    backgroundColor: isSelected ? (isDark ? 'rgba(20,184,166,0.1)' : colors.tealDim) : colors.card,
                    borderColor: isSelected ? colors.teal : colors.cardBorder,
                  }}>
                  <View className="flex-1">
                    <Text
                      style={{ fontSize: 16, fontWeight: '600', color: isSelected ? colors.teal : colors.textPrimary }}>
                      {state.name}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                    size={24}
                    color={isSelected ? colors.teal : colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View className="gap-2 mx-4">
            {districts.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, padding: 32 }}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
                <Text style={{ marginTop: 16, textAlign: 'center', color: colors.textSecondary }}>Bu il için ilçe bulunamadı</Text>
              </View>
            ) : (
              districts.map((district) => {
                const isSelected = selectedDistrictId === district._id;
                return (
                  <TouchableOpacity
                    key={district._id}
                    onPress={() => handleDistrictSelect(district._id)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      borderRadius: 12, borderWidth: 1, padding: 16,
                      backgroundColor: isSelected ? (isDark ? 'rgba(20,184,166,0.1)' : colors.tealDim) : colors.card,
                      borderColor: isSelected ? colors.teal : colors.cardBorder,
                    }}>
                    <View className="flex-1">
                      <Text
                        style={{ fontSize: 16, fontWeight: '600', color: isSelected ? colors.teal : colors.textPrimary }}>
                        {district.name}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.teal} />}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
