export interface State {
  _id: string;
  name: string;
  name_en: string;
  country_id: string;
  createdAt?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface District {
  _id: string;
  name: string;
  name_en: string;
  url: string;
  state_id: string;
  country_id: string;
  createdAt?: string;
  updatedAt?: string;
  updated_at?: string;
  state?: {
    _id: string;
    name: string;
    name_en: string;
  };
}

export interface StatesResponse {
  success: boolean;
  code: number;
  message: string;
  data: State[];
  meta?: any;
}

export interface DistrictsResponse {
  success: boolean;
  code: number;
  message: string;
  data: District[];
  meta?: any;
}

export interface AllDistrictsData {
  success: boolean;
  totalStates: number;
  totalDistricts: number;
  data: Record<string, { state: State; districts: District[] }>;
  districts: District[];
  updatedAt: string;
}

