import statesData from './states.json';
import type { State, District, AllDistrictsData } from '@/types/location';

let districtsData: AllDistrictsData | null = null;

try {
  districtsData = require('../constants/all-districts.json') as AllDistrictsData;
} catch {
  console.warn('all-districts.json not found. Run scripts/fetch-districts.js to generate it.');
}

export const STATES: State[] = statesData.data;

export function getStates(): State[] {
  return STATES;
}

export function getStateById(stateId: string): State | undefined {
  return STATES.find((state) => state._id === stateId);
}

export function getStateByName(name: string): State | undefined {
  const normalizedName = name.toUpperCase().trim();
  return STATES.find((state) => state.name.toUpperCase() === normalizedName);
}

export function getAllDistricts(): District[] {
  return districtsData?.districts || [];
}

export function getDistrictsByStateId(stateId: string): District[] {
  if (!districtsData) return [];
  return districtsData.data[stateId]?.districts || [];
}

export function getDistrictById(districtId: string): District | undefined {
  if (!districtsData) return undefined;
  return districtsData.districts.find((district) => district._id === districtId);
}

export function getDistrictByName(districtName: string, stateId: string): District | undefined {
  const districts = getDistrictsByStateId(stateId);
  const normalizedName = districtName.toUpperCase().trim();
  return districts.find(
    (district) =>
      district.name.toUpperCase() === normalizedName ||
      district.name_en.toUpperCase() === normalizedName
  );
}

export function getDefaultDistrictForState(stateId: string): District | undefined {
  const districts = getDistrictsByStateId(stateId);
  if (districts.length === 0) return undefined;

  const state = getStateById(stateId);
  if (state) {
    const stateNameDistrict = districts.find(
      (d) =>
        d.name.toUpperCase() === state.name.toUpperCase() ||
        d.name_en.toUpperCase() === state.name_en.toUpperCase()
    );
    if (stateNameDistrict) return stateNameDistrict;
  }

  return districts[0];
}

export function isDistrictsDataLoaded(): boolean {
  return districtsData !== null;
}
