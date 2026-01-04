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
import { useNavigation } from '@react-navigation/native';

type Props = NativeStackScreenProps<HomeStackParamList, 'LocationSelection'>;

const STORAGE_STATE_ID_KEY = 'SELECTED_STATE_ID';
const STORAGE_DISTRICT_ID_KEY = 'SELECTED_DISTRICT_ID';

export default function LocationSelectionScreen({ navigation }: Props) {
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'state' | 'district'>('state');

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
      
      // Navigate back
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
      <Screen className="items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#0f766e" />
        <Text className="mt-4 text-slate-600">
          {!isDistrictsDataLoaded() ? 'İlçe verileri yükleniyor...' : 'Yükleniyor...'}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen className="bg-slate-50">
      {/* Header */}
      <View className="mb-4 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
        <TouchableOpacity onPress={handleBack} className="flex-row items-center">
          <Ionicons name="chevron-back" size={24} color="#0f766e" />
          <Text className="ml-1 text-base font-semibold text-slate-900">
            {step === 'district' ? selectedState?.name : 'İl Seçin'}
          </Text>
        </TouchableOpacity>
        {step === 'district' && selectedDistrict && (
          <View className="rounded-full bg-teal-50 px-3 py-1">
            <Text className="text-xs font-semibold text-teal-700">{selectedDistrict.name}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {step === 'state' ? (
          <View className="gap-2">
            {states.map((state) => {
              const isSelected = selectedStateId === state._id;
              return (
                <TouchableOpacity
                  key={state._id}
                  onPress={() => handleStateSelect(state._id)}
                  className={`flex-row items-center justify-between rounded-xl border bg-white p-4 ${
                    isSelected ? 'border-teal-500 bg-teal-50' : 'border-slate-200'
                  }`}>
                  <View className="flex-1">
                    <Text className={`text-base font-semibold ${isSelected ? 'text-teal-700' : 'text-slate-900'}`}>
                      {state.name}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                    size={24}
                    color={isSelected ? '#0f766e' : '#94a3b8'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View className="gap-2">
            {districts.length === 0 ? (
              <View className="items-center justify-center rounded-xl border border-slate-200 bg-white p-8">
                <Ionicons name="alert-circle-outline" size={48} color="#94a3b8" />
                <Text className="mt-4 text-center text-slate-600">Bu il için ilçe bulunamadı</Text>
              </View>
            ) : (
              districts.map((district) => {
                const isSelected = selectedDistrictId === district._id;
                return (
                  <TouchableOpacity
                    key={district._id}
                    onPress={() => handleDistrictSelect(district._id)}
                    className={`flex-row items-center justify-between rounded-xl border bg-white p-4 ${
                      isSelected ? 'border-teal-500 bg-teal-50' : 'border-slate-200'
                    }`}>
                    <View className="flex-1">
                      <Text className={`text-base font-semibold ${isSelected ? 'text-teal-700' : 'text-slate-900'}`}>
                        {district.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#0f766e" />
                    )}
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

