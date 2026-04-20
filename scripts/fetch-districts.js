const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://ezanvakti.imsakiyem.com/api';
const STATES_FILE = path.join(__dirname, '../states.json');
const OUTPUT_FILE = path.join(__dirname, '../src/constants/all-districts.json');

async function fetchDistrictsForAllStates() {
  try {
    const statesData = JSON.parse(fs.readFileSync(STATES_FILE, 'utf8'));
    const states = statesData.data;

    console.log(`Found ${states.length} states. Starting to fetch districts...`);

    const allDistricts = [];
    let processed = 0;

    for (const state of states) {
      try {
        console.log(`Fetching districts for ${state.name} (${state._id})...`);
        const response = await axios.get(`${BASE_URL}/locations/districts`, {
          params: { stateId: state._id },
          timeout: 30000,
        });

        if (response.data.success && response.data.data) {
          const districts = response.data.data.map((district) => ({
            ...district,
            state: {
              _id: state._id,
              name: state.name,
              name_en: state.name_en,
            },
          }));

          allDistricts.push(...districts);
          console.log(`  ✓ Found ${districts.length} districts for ${state.name}`);
        } else {
          console.log(`  ⚠ No districts found for ${state.name}`);
        }

        processed++;
        console.log(`Progress: ${processed}/${states.length}`);

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`  ✗ Error fetching districts for ${state.name}:`, error.message);
        processed++;
      }
    }

    const districtsByState = {};
    allDistricts.forEach((district) => {
      const stateId = district.state._id;
      if (!districtsByState[stateId]) {
        districtsByState[stateId] = {
          state: district.state,
          districts: [],
        };
      }
      districtsByState[stateId].districts.push(district);
    });

    const output = {
      success: true,
      totalStates: Object.keys(districtsByState).length,
      totalDistricts: allDistricts.length,
      data: districtsByState,
      districts: allDistricts,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
    console.log(
      `\n✓ Successfully saved ${allDistricts.length} districts from ${Object.keys(districtsByState).length} states to ${OUTPUT_FILE}`
    );
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fetchDistrictsForAllStates();
